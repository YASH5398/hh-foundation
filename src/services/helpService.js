/**
 * HELP SERVICE - CENTRALIZED HELP FLOW LOGIC
 * This is the ONLY place where help flow logic should exist
 * NO DUPLICATES - NO HARDCODED VALUES - NO ASSUMPTIONS
 */

import {
  db,
  auth,
  functions,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp
} from '../config/firebase';

import { httpsCallable } from 'firebase/functions';
import { waitForAuthReady } from './authReady';

import { HELP_STATUS, canSubmitPayment, canConfirmPayment } from '../config/helpStatus';
import { getAmountByLevel, getHelpLimitByLevel, validateAmountForLevel } from '../utils/amountUtils';
import { checkReceiveHelpEligibility, checkSendHelpEligibility, normalizeLevel } from '../utils/eligibilityUtils';
import { isIncomeBlocked, LEVEL_CONFIG } from '../shared/mlmCore';
import { sendPaymentRequestNotification } from './notificationService';


/**
 * ERROR HANDLING UTILITIES
 * Maps Firebase errors to user-friendly messages
 */
const mapFirebaseError = (error) => {
  console.error('Firebase error:', error);

  // Firebase Functions errors
  if (error.code) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return 'Please log in to continue';
      case 'functions/permission-denied':
        return 'You do not have permission to perform this action';
      case 'functions/not-found':
        return 'The requested resource was not found';
      case 'functions/invalid-argument':
        return error.message || 'Invalid request parameters';
      case 'functions/failed-precondition':
        return error.message || 'Operation cannot be completed at this time';
      case 'functions/aborted':
        return 'Operation was cancelled';
      case 'functions/out-of-range':
        return 'Value is out of acceptable range';
      case 'functions/unimplemented':
        return 'This feature is not yet implemented';
      case 'functions/internal':
        console.error('Internal Firebase error:', error);
        return error?.details?.message || error.message || 'An internal error occurred. Please try again later.';
      case 'functions/unavailable':
        return 'Service is temporarily unavailable. Please try again.';
      case 'functions/deadline-exceeded':
        return 'Request timed out. Please check your connection and try again.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return 'Network connection error. Please check your internet connection.';
  }

  // Generic error fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

export async function getReceiveEligibility() {
  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const getReceiveEligibility = httpsCallable(functions, "getReceiveEligibility");
    const res = await getReceiveEligibility({});
    return res.data.data;
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

// System user IDs that should never be assigned as receivers
const SYSTEM_USER_IDS = ['HHF123456', 'HHF000001', 'HHF999999'];

/**
 * CHECK SENDER ELIGIBILITY
 * Sender must NOT have any active help
 */
export async function checkSenderEligibility(currentUser) {
  if (!currentUser?.uid) {
    return { eligible: false, reason: 'Not authenticated' };
  }

  try {
    await waitForAuthReady();
    // Get user data
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { eligible: false, reason: 'User not found' };
    }

    const userData = userSnap.data();

    // Use shared eligibility logic
    const eligibilityResult = checkSendHelpEligibility(userData);
    if (!eligibilityResult.eligible) {
      return eligibilityResult;
    }

    // Income blocking check using normalized level
    const userLevel = normalizeLevel(userData);
    if (isIncomeBlocked({ ...userData, level: userLevel })) {
      return { eligible: false, reason: 'Income is blocked - complete required payments' };
    }

    // CRITICAL: Check if sender already has ANY active help
    const activeStatuses = [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE];
    const existingHelpQuery = query(
      collection(db, 'sendHelp'),
      where('senderUid', '==', currentUser.uid),
      where('status', 'in', activeStatuses)
    );

    const existingHelpSnap = await getDocs(existingHelpQuery);
    if (!existingHelpSnap.empty) {
      return { eligible: false, reason: 'Already have an active send help' };
    }

    return { eligible: true, userData };

  } catch (error) {
    console.error('Error checking sender eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

/**
 * CHECK RECEIVER ELIGIBILITY
 * Receiver must satisfy ALL conditions
 */
export async function checkReceiverEligibility(userData) {
  try {
    await waitForAuthReady();
    
    // Use the shared eligibility function
    const { eligible, reason } = checkReceiveHelpEligibility(userData);
    
    if (!eligible) {
      return { eligible: false, reason };
    }

    // Additional business logic checks using normalized level
    const userLevel = normalizeLevel(userData);
    const helpLimit = getHelpLimitByLevel(userLevel);
    const currentHelpReceived = userData.helpReceived || 0;

    if (currentHelpReceived >= helpLimit) {
      return { eligible: false, reason: `Maximum helps reached (${helpLimit})` };
    }

    // System account check
    if (SYSTEM_USER_IDS.includes(userData.userId)) {
      return { eligible: false, reason: 'System account' };
    }

    // CRITICAL: Check if receiver already has ANY active help
    const activeStatuses = [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE];
    const existingReceiveQuery = query(
      collection(db, 'receiveHelp'),
      where('receiverUid', '==', userData.uid),
      where('status', 'in', activeStatuses)
    );

    const existingReceiveSnap = await getDocs(existingReceiveQuery);
    if (!existingReceiveSnap.empty) {
      return { eligible: false, reason: 'Already have an active receive help' };
    }

    return { eligible: true };

  } catch (error) {
    console.error('Error checking receiver eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

/**
 * FIND ELIGIBLE RECEIVER
 * Deprecated (server-only matching). Kept for backward compatibility.
 */
export async function findEligibleReceiver(senderUid, senderLevel) {
  return null;
}

/**
 * CREATE SEND HELP ASSIGNMENT
 * Atomic transaction that creates both documents
 */
export async function createSendHelpAssignment(senderUser) {
  // Validate sender eligibility
  if (!senderUser || !senderUser.uid) {
    throw new Error('Invalid sender data');
  }

  // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  // Verify UID consistency
  if (auth.currentUser.uid !== senderUser.uid) {
    throw new Error('Authentication mismatch. Please refresh and try again.');
  }

  // Verify user profile exists
  const userRef = doc(db, 'users', senderUser.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User profile not found');
  }

  const senderId = userSnap.data()?.userId;
  if (!senderId || typeof senderId !== 'string') {
    throw new Error('User ID missing from profile');
  }

  // Check sender eligibility before making the call
  const eligibilityCheck = await checkSenderEligibility(auth.currentUser);
  if (!eligibilityCheck.eligible) {
    throw new Error(eligibilityCheck.reason);
  }

  const idempotencyKey = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  try {
    console.log('[startHelpAssignment] Authentication check:', {
      authCurrentUserUid: auth.currentUser.uid,
      senderUid: senderUser.uid,
      hasAuth: !!auth.currentUser
    });
    
    console.log('[startHelpAssignment] request', {
      senderUid: senderUser.uid,
      senderId,
      idempotencyKey
    });
    
    // Required logging before callable function call
    console.log("Calling startHelpAssignment as callable with uid:", auth.currentUser.uid);
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const startHelpAssignment = httpsCallable(functions, "startHelpAssignment");
    const res = await startHelpAssignment({ senderUid: senderUser.uid, senderId, idempotencyKey });
    
    return { success: true, helpId: res.data.data.helpId, alreadyExists: res.data.data.alreadyExists };
  } catch (error) {
    // Handle specific "no eligible receiver" case - this is a BUSINESS CASE, not an error
    if (error?.code === 'functions/failed-precondition' && 
        (error?.message === 'NO_ELIGIBLE_RECEIVER' || error?.message?.includes('NO_ELIGIBLE_RECEIVER'))) {
      const err = new Error('No eligible receivers available right now.');
      err.code = error.code;
      err.isNoReceiver = true;
      err.isBusinessCase = true; // Mark as business case, not error
      throw err;
    }

    // Handle other "no receiver" cases for backward compatibility
    const isNoReceiver =
      error?.code === 'functions/failed-precondition' ||
      error?.message?.includes('No eligible receivers') ||
      error?.message?.includes('no eligible receivers');
    
    if (isNoReceiver) {
      const err = new Error('No eligible receivers available right now.');
      err.code = error.code;
      err.isNoReceiver = true;
      err.isBusinessCase = true; // Mark as business case, not error
      throw err;
    }

    // Log real errors only
    console.error('createSendHelpAssignment callable error:', {
      code: error?.code,
      message: error?.message,
      details: error?.details
    });

    const message = error?.details?.message || error?.message || mapFirebaseError(error);
    const err = new Error(message);
    err.code = error?.code;
    err.details = error?.details;
    err.isNoReceiver = false;
    err.isBusinessCase = false;
    
    console.error('createSendHelpAssignment failed:', {
      code: err.code,
      message: err.message,
      details: err.details
    });
    throw err;
  }
}

/**
 * REQUEST PAYMENT
 * Receiver requests payment from sender
 */
export async function requestPayment(helpId) {
  if (!helpId) {
    throw new Error('Help ID is required');
  }

  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const requestPayment = httpsCallable(functions, "requestPayment");
    const res = await requestPayment({ helpId });
    return { success: !!res.data.data?.ok };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

/**
 * SUBMIT PAYMENT PROOF
 * Sender marks payment as done and automatically resets paymentRequested flag
 */
export async function submitPaymentProof(helpId, paymentData) {
  if (!helpId || !paymentData?.utr) {
    throw new Error('Invalid help ID or payment data');
  }

  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const submitPayment = httpsCallable(functions, "submitPayment");
    const res = await submitPayment({
      helpId,
      utr: paymentData.utr,
      method: paymentData.method || null,
      screenshotUrl: paymentData.screenshotUrl || null,
      screenshotPath: paymentData.screenshotPath || null,
      screenshotContentType: paymentData.screenshotContentType || null,
      screenshotSize: paymentData.screenshotSize || null,
      resetPaymentRequested: true // Automatically reset payment request flag
    });
    return { success: !!res.data.data?.ok };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

/**
 * CONFIRM PAYMENT RECEIVED
 * Receiver confirms payment and triggers income calculation
 */
export async function confirmPaymentReceived(helpId) {
  if (!helpId) {
    throw new Error('Help ID is required');
  }

  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const receiverResolvePayment = httpsCallable(functions, "receiverResolvePayment");
    const res = await receiverResolvePayment({ helpId, action: 'confirm' });
    return { success: !!res.data.data?.ok, amount: 0 };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function disputePayment(helpId, disputeReason) {
  if (!helpId) throw new Error('Help ID is required');
  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const receiverResolvePayment = httpsCallable(functions, "receiverResolvePayment");
    const res = await receiverResolvePayment({
      helpId,
      action: 'dispute',
      disputeReason: disputeReason || null
    });
    return { success: !!res.data.data?.ok };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

/**
 * GET USER HELP STATUS
 * Check if user has active helps
 */
export async function getUserHelpStatus(userUid) {
  if (!userUid) return { hasActiveHelp: false };

  try {
    await waitForAuthReady();
    const activeStatuses = [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE];

    // Check send helps
    const sendHelpQuery = query(
      collection(db, 'sendHelp'),
      where('senderUid', '==', userUid),
      where('status', 'in', activeStatuses)
    );

    // Check receive helps
    const receiveHelpQuery = query(
      collection(db, 'receiveHelp'),
      where('receiverUid', '==', userUid),
      where('status', 'in', activeStatuses)
    );

    const [sendHelpSnap, receiveHelpSnap] = await Promise.all([
      getDocs(sendHelpQuery),
      getDocs(receiveHelpQuery)
    ]);

    const hasActiveSendHelp = !sendHelpSnap.empty;
    const hasActiveReceiveHelp = !receiveHelpSnap.empty;

    return {
      hasActiveHelp: hasActiveSendHelp || hasActiveReceiveHelp,
      activeSendHelp: hasActiveSendHelp ? ({ id: sendHelpSnap.docs[0].id, ...sendHelpSnap.docs[0].data() }) : null,
      activeReceiveHelp: hasActiveReceiveHelp ? ({ id: receiveHelpSnap.docs[0].id, ...receiveHelpSnap.docs[0].data() }) : null
    };

  } catch (error) {
    console.error('Error getting user help status:', error);
    return { hasActiveHelp: false, error: error.message };
  }
}

/**
 * LISTEN TO HELP STATUS CHANGES
 * Real-time listener with proper cleanup
 */
export function listenToHelpStatus(helpId, callback) {
  if (!helpId) return () => {};

  const helpRef = doc(db, 'sendHelp', helpId);

  return onSnapshot(helpRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        status: data.status || HELP_STATUS.ASSIGNED
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to help status:', error);
    callback(null);
  });
}

/**
 * GET RECEIVE HELPS FOR USER
 * Get all receive helps for a user with real-time updates
 * Shows helps that should appear in UI filters: pending, payment_requested, confirmed
 */
export function listenToReceiveHelps(userUid, callback) {
  if (!userUid) {
    callback([]);
    return () => {};
  }

  const receiveHelpQuery = query(
    collection(db, 'receiveHelp'),
    where('receiverUid', '==', userUid)
  );

  return onSnapshot(receiveHelpQuery, (snapshot) => {
    const allReceiveHelps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || HELP_STATUS.ASSIGNED
    }));

    // Filter to show helps that should appear in filters
    const activeStatuses = [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE, HELP_STATUS.CONFIRMED, HELP_STATUS.DISPUTED, HELP_STATUS.TIMEOUT];
    const receiveHelps = allReceiveHelps.filter(help => activeStatuses.includes(help.status));

    // Sort by creation time (newest first)
    receiveHelps.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    callback(receiveHelps);
  }, (error) => {
    console.error('Error listening to receive helps:', error);
    callback([]);
  });
}

/**
 * BLOCK SENDER FOR DEADLINE EXPIRY
 * Called by Firebase Cloud Function when 24-hour deadline expires
 */
export async function blockSenderForDeadlineExpiry(helpId) {
  return { success: false, deprecated: true };
}

/**
 * GET EXPIRED HELPS FOR PROCESSING
 * Used by Firebase Cloud Function to find helps that need blocking
 */
export async function getExpiredHelps() {
  return [];
}

/**
 * CHECK IF USER IS BLOCKED
 */
export async function checkUserBlockedStatus(userUid) {
  if (!userUid) return { isBlocked: false };

  try {
    const userRef = doc(db, 'users', userUid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists) {
      return { isBlocked: false };
    }

    const userData = userSnap.data();

    return {
      isBlocked: userData.isBlocked || false,
      blockReason: userData.blockReason,
      blockedAt: userData.blockedAt,
      blockedBySystem: userData.blockedBySystem || false
    };

  } catch (error) {
    console.error('Error checking user blocked status:', error);
    return { isBlocked: false, error: error.message };
  }
}

/**
 * UNBLOCK USER (ADMIN ONLY)
 */
export async function unblockUser(userUid, adminUid) {
  if (!userUid || !adminUid) {
    throw new Error('User UID and admin UID are required');
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userUid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      if (!userData.isBlocked) {
        throw new Error('User is not blocked');
      }

      // Unblock the user - FULL RESET
      transaction.update(userRef, {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedHelpId: null,
        blockedBySystem: false,
        unblockedAt: serverTimestamp(),
        unblockedBy: adminUid
      });

      return {
        success: true,
        userUid,
        previousBlockReason: userData.blockReason
      };
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
}

/**
 * CANCEL HELP
 * Cancel a help assignment (admin only or by participants)
 */
/**
 * REJECT PAYMENT - Receiver rejects payment proof, allows sender to re-submit
 * Updates both receiveHelp and sendHelp: payment_requested → pending
 * Adds rejection metadata for tracking
 */
export async function cancelHelp(helpId, reason = 'Cancelled by user') {
  if (!helpId) throw new Error('Help ID is required');
  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const cancelHelp = httpsCallable(functions, "cancelHelp");
    const res = await cancelHelp({ helpId, reason });
    return { success: !!res.data.data?.ok };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function rejectPayment(helpId, rejectReason = 'Payment proof rejected') {
  if (!helpId) throw new Error('Help ID is required');
  try {
    // ABSOLUTE REQUIREMENT: Auth guard (must be exact)
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    // MANDATORY: ONLY ALLOWED Firebase callable pattern
    const receiverResolvePayment = httpsCallable(functions, "receiverResolvePayment");
    const res = await receiverResolvePayment({ helpId, action: 'dispute', disputeReason: rejectReason });
    return { success: !!res.data.data?.ok };
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}
