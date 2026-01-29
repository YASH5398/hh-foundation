import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getDoc,
  runTransaction,
  addDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { createSendHelpAssignment } from './helpService';
import { checkSenderEligibility, findEligibleReceiver } from './helpService';

// --- User Management Functions ---

export const getAllUsers = async () => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, users };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, message: error.message };
  }
};

export const updateUserStatus = async (uid, field, value, currentUser) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      [field]: value,
      uid: uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, message: `User ${field} updated successfully` };
  } catch (error) {
    console.error(`Error updating user ${field} for ${uid}:`, error);
    return { success: false, message: error.message };
  }
};

export const forceReceiverAssignment = async (userId) => {
  try {
    // Find user by userId
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: `User with ID ${userId} not found` };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userDocRef = doc(db, 'users', userDoc.id);
    const userData = userDoc.data();
    
    // LAYER A: Basic eligibility flags (Admin controllable)
    const updateData = {
      isActivated: true,
      isBlocked: false, // Clear blocked status
      isOnHold: false,
      isReceivingHeld: false,
      helpVisibility: true,
      forceReceiveOverride: true, // NEW: Allow one-time MLM override
      updatedAt: serverTimestamp()
    };
    
    // Update kycDetails.levelStatus if kycDetails exists
    if (userData.kycDetails) {
      updateData['kycDetails.levelStatus'] = 'active';
    } else {
      updateData.kycDetails = {
        levelStatus: 'active'
      };
    }
    
    await updateDoc(userDocRef, updateData);
    
    console.log(`Force Receiver Assignment: User ${userId} made eligible for receiving help with MLM override`);
    
    return { 
      success: true, 
      message: `User ${userId} has been successfully made eligible for receiving help (with one-time MLM override)`,
      userData: { ...userData, ...updateData },
      note: 'forceReceiveOverride will auto-reset after one successful assignment'
    };
  } catch (error) {
    console.error('Error in forceReceiverAssignment:', error);
    return { success: false, message: error.message };
  }
};

export const checkUserEligibility = async (userId) => {
  try {
    // Find user by userId
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: `User with ID ${userId} not found` };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;
    
    // LAYER A: Basic eligibility checks
    const basicEligibility = {
      isActivated: userData.isActivated === true,
      isBlocked: userData.isBlocked !== true,
      isOnHold: userData.isOnHold !== true,
      isReceivingHeld: userData.isReceivingHeld !== true,
      helpVisibility: userData.helpVisibility !== false,
      kycLevelStatus: userData.kycDetails?.levelStatus === 'active'
    };
    
    const basicPassed = Object.values(basicEligibility).every(Boolean);
    
    // LAYER B: MLM enforcement checks - UNIFIED FLAGS ONLY
    const mlmStatus = {
      isOnHold: userData.isOnHold === true,
      isReceivingHeld: userData.isReceivingHeld === true,
      forceReceiveOverride: userData.forceReceiveOverride === true
    };
    
    // Check receive slot status
    const currentLevel = userData.levelStatus || userData.level || 'Star';
    const receiveLimit = getReceiveLimitForLevel(currentLevel);
    const currentReceiveCount = userData.activeReceiveCount || 0;
    
    const slotStatus = {
      currentLevel,
      receiveLimit,
      currentReceiveCount,
      slotsAvailable: currentReceiveCount < receiveLimit,
      utilizationPercent: Math.round((currentReceiveCount / receiveLimit) * 100)
    };
    
    // Check for active receive help
    const activeReceiveQuery = query(
      collection(db, 'receiveHelp'),
      where('receiverUid', '==', uid),
      where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])
    );
    
    const activeReceiveSnap = await getDocs(activeReceiveQuery);
    const hasActiveReceive = !activeReceiveSnap.empty;
    
    // Determine overall eligibility
    const mlmBlocked = mlmStatus.isOnHold || mlmStatus.isReceivingHeld;
    const canReceive = basicPassed && !mlmBlocked && slotStatus.slotsAvailable && !hasActiveReceive;
    const canReceiveWithOverride = basicPassed && slotStatus.slotsAvailable && !hasActiveReceive;
    
    // Generate recommendations
    const recommendations = [];
    if (!basicPassed) {
      recommendations.push('Use Force Receiver Assignment to fix basic eligibility flags');
    }
    if (mlmBlocked && !mlmStatus.forceReceiveOverride) {
      recommendations.push('Use Force Receiver Assignment to add one-time MLM override');
    }
    if (!slotStatus.slotsAvailable) {
      recommendations.push(`User has reached receive limit for ${currentLevel} level (${receiveLimit})`);
    }
    if (hasActiveReceive) {
      recommendations.push('User already has active receive help - wait for completion');
    }
    
    return {
      success: true,
      userId,
      uid,
      eligibility: {
        canReceive,
        canReceiveWithOverride,
        basicEligibility,
        basicPassed,
        mlmStatus,
        mlmBlocked,
        slotStatus,
        hasActiveReceive
      },
      recommendations,
      summary: canReceive ? 'User is eligible to receive help' : 
               canReceiveWithOverride ? 'User needs MLM override to receive help' :
               'User has blocking issues that prevent receiving help'
    };
  } catch (error) {
    console.error('Error in checkUserEligibility:', error);
    return { success: false, message: error.message };
  }
};

// Helper function to get receive limit by level
const getReceiveLimitForLevel = (level) => {
  const limits = {
    Star: 3,
    Silver: 9,
    Gold: 27,
    Platinum: 81,
    Diamond: 243
  };
  return limits[level] || limits.Star;
};

export const deleteUser = async (uid) => {
  try {
    // Before deleting, ensure user is not activated
    const userDocRefDelete = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRefDelete);
    if (userDoc.exists() && userDoc.data().isActivated) {
      return { success: false, message: 'Cannot delete activated user.' };
    }
    await deleteDoc(userDocRefDelete);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    return { success: false, message: error.message };
  }
};

export const resetUserPassword = async (email) => {
  // This function will typically send a password reset email via Firebase Auth
  // The actual implementation will be in AuthContext or a dedicated auth service
  // For now, this is a placeholder to indicate the action.
  console.log(`Sending password reset email to: ${email}`);
  return { success: true, message: 'Password reset email initiated.' };
};

export const setUserLevel = async (uid, level) => {
  try {
    const userDocRefLevel = doc(db, 'users', uid);
    await updateDoc(userDocRefLevel, { level: level });
    return { success: true };
  } catch (error) {
    console.error(`Error setting level for user ${uid}:`, error);
    return { success: false, message: error.message };
  }
};

// --- E-PIN Request Management Functions ---

export const getAllEpinRequests = async () => {
  try {
    const epinRequestsCollectionRef = collection(db, 'epinRequests');
    const querySnapshot = await getDocs(epinRequestsCollectionRef);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, requests };
  } catch (error) {
    console.error('Error getting all E-PIN requests:', error);
    return { success: false, message: error.message };
  }
};

// Real-time listener for E-PIN requests
export const subscribeToEpinRequests = (callback) => {
  try {
    const epinRequestsCollectionRef = collection(db, 'epinRequests');
    const q = query(epinRequestsCollectionRef, where('status', '!=', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback({ success: true, requests });
    }, (error) => {
      console.error('Error in E-PIN requests subscription:', error);
      callback({ success: false, message: error.message });
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up E-PIN requests subscription:', error);
    return () => {};
  }
};

export const updateEpinRequestStatus = async (requestId, status, userId, epinType) => {
  try {
    const requestDocRef = doc(db, 'epinRequests', requestId);

    await runTransaction(db, async (transaction) => {
      const requestDoc = await transaction.get(requestDocRef);
      if (!requestDoc.exists()) {
        throw new Error('E-PIN request not found!');
      }

      transaction.update(requestDocRef, { status: status });

      if (status === 'Approved') {
        // Add E-PIN to user's epins field
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User not found for E-PIN approval!');
        }
        const currentEpins = userDoc.data().epins || [];
        const newEpin = {
          id: requestDoc.id, // Use request ID as epin ID for simplicity, or generate new one
          type: epinType,
          status: 'available',
          generatedAt: serverTimestamp()
        };
        transaction.update(userDocRef, { epins: [...currentEpins, newEpin] });
      }
    });

    return { success: true };
  } catch (error) {
    console.error(`Error updating E-PIN request ${requestId}:`, error);
    return { success: false, message: error.message };
  }
};

// --- Dashboard Stats Functions ---

export const getDashboardStats = async () => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const epinRequestsCollectionRef = collection(db, 'epinRequests');

    const [usersSnapshot, epinRequestsSnapshot] = await Promise.all([
      getDocs(usersCollectionRef),
      getDocs(epinRequestsCollectionRef)
    ]);

    const totalUsers = usersSnapshot.size;
    const totalActivatedUsers = usersSnapshot.docs.filter(doc => doc.data().isActivated).length;
    const totalEpinRequests = epinRequestsSnapshot.size;

    // Placeholder for total referrals and total income distributed
    // These would require more complex queries or pre-calculated fields
    const totalReferrals = 0; // Implement logic to count referrals
    const totalIncomeDistributed = 0; // Implement logic to sum totalEarnings
    const totalHelpSentReceived = 0; // Placeholder

    return {
      success: true,
      stats: {
        totalUsers,
        totalActivatedUsers,
        totalEpinRequests,
        totalReferrals,
        totalIncomeDistributed,
        totalHelpSentReceived,
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { success: false, message: error.message };
  }
};

// --- E-PIN Generation and Management Functions ---

export const generateEpins = async (quantity, type) => {
  try {
    const epinsCollectionRef = collection(db, 'epins');
    const generated = [];

    for (let i = 0; i < quantity; i++) {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7-digit random number
      const epinCode = `HHF${randomNum}`;

      await addDoc(epinsCollectionRef, {
        epin: epinCode,
        type: type,
        usedBy: null,
        isUsed: false,
        createdAt: serverTimestamp()
      });
      generated.push(epinCode);
    }
    return { success: true, generated };
  } catch (error) {
    console.error('Error generating E-PINs:', error);
    return { success: false, message: error.message };
  }
};

export const getAllEpins = async () => {
  try {
    const epinsCollectionRef = collection(db, 'epins');
    const querySnapshot = await getDocs(epinsCollectionRef);
    const epins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, epins };
  } catch (error) {
    console.error('Error getting all E-PINs:', error);
    return { success: false, message: error.message };
  }
};

export const generateSingleEpin = async () => {
  try {
    const epinsCollectionRef = collection(db, 'epins');
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7-digit random number
    const epinCode = `HHF${randomNum}`;
    await addDoc(epinsCollectionRef, {
      epin: epinCode,
      type: 'Normal',
      usedBy: null,
      isUsed: false,
      createdAt: serverTimestamp()
    });
    return { success: true, epin: epinCode };
  } catch (error) {
    console.error('Error generating single E-PIN:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update helpReceived for a user by userId based on confirmed receiveHelp docs
 * @param {string} userId - The userId to update
 */
export const updateHelpReceivedCountByUserId = async (userId) => {
  try {
    // Step 1: Fetch all receiveHelp docs where receiverId === userId and confirmedByReceiver === true
    const confirmedHelpsQuery = query(
      collection(db, 'receiveHelp'),
      where('receiverId', '==', userId),
      where('confirmedByReceiver', '==', true)
    );
    const confirmedHelpsSnap = await getDocs(confirmedHelpsQuery);
    const confirmedCount = confirmedHelpsSnap.size;
    // Step 2: Find the user document by userId
    const usersQuery = query(collection(db, 'users'), where('userId', '==', userId));
    const usersSnap = await getDocs(usersQuery);
    if (!usersSnap.empty) {
      const userDocRef = usersSnap.docs[0].ref;
      await updateDoc(userDocRef, { helpReceived: confirmedCount });
      return { success: true, helpReceived: confirmedCount };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Error updating helpReceived count:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update all user documents where isReceivingHeld or isOnHold is missing. Set both to false if not present.
 */
export const setDefaultHoldFlagsForUsers = async () => {
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  let updatedCount = 0;
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    let needsUpdate = false;
    const updateData = {};
    if (typeof data.isReceivingHeld === 'undefined') {
      updateData.isReceivingHeld = false;
      needsUpdate = true;
    }
    if (typeof data.isOnHold === 'undefined') {
      updateData.isOnHold = false;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await updateDoc(doc(db, 'users', docSnap.id), updateData);
      updatedCount++;
    }
  }
  return { success: true, updatedCount };
};

/**
 * ADMIN UNBLOCK USER - Complete unblock and new receiver assignment
 * @param {string} userUid - User UID to unblock
 * @param {string} adminUid - Admin UID performing the unblock
 * @returns {Promise<Object>} - Result of unblock operation
 */
export const adminUnblockUser = async (userUid, adminUid) => {
  if (!userUid || !adminUid) {
    throw new Error('User UID and admin UID are required');
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Get user document
      const userRef = doc(db, 'users', userUid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      if (!userData.isBlocked) {
        throw new Error('User is not blocked');
      }

      // 1. UNBLOCK THE USER
      transaction.update(userRef, {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBySystem: false,
        unblockedAt: serverTimestamp(),
        unblockedBy: adminUid
      });

      // 2. CANCEL ANY EXPIRED HELP ASSIGNMENTS
      // Find expired receiveHelp documents for this user
      const expiredReceiveHelpsQuery = query(
        collection(db, 'receiveHelp'),
        where('receiverUid', '==', userUid),
        where('status', '==', 'expired')
      );

      const expiredHelpsSnap = await getDocs(expiredReceiveHelpsQuery);

      for (const helpDoc of expiredHelpsSnap.docs) {
        const helpId = helpDoc.id;

        // Update expired receiveHelp document to cancelled
        transaction.update(doc(db, 'receiveHelp', helpId), {
          status: 'cancelled',
          cancelledBy: adminUid,
          cancelReason: 'Unblocked by admin - expired assignment cancelled',
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. ASSIGN NEW RECEIVER (outside transaction due to complexity)
      // This will be done after the transaction completes

      return {
        success: true,
        userUid,
        cancelledHelps: expiredHelpsSnap.size,
        needsNewAssignment: true
      };
    });

  } catch (error) {
    console.error('Error in admin unblock user:', error);
    throw error;
  }
};

/**
 * ADMIN UNBLOCK USER WITH NEW ASSIGNMENT - Complete workflow
 * @param {string} userUid - User UID to unblock
 * @param {string} adminUid - Admin UID performing the unblock
 * @returns {Promise<Object>} - Result of complete unblock operation
 */
export const adminUnblockUserWithNewAssignment = async (userUid, adminUid) => {
  try {
    // Step 1: Unblock the user
    const unblockResult = await adminUnblockUser(userUid, adminUid);

    if (!unblockResult.success) {
      throw new Error('Failed to unblock user');
    }

    // Step 2: Check if user can now send help
    const senderEligibility = await checkSenderEligibility({ uid: userUid });
    if (!senderEligibility.eligible) {
      return {
        ...unblockResult,
        newAssignment: null,
        message: 'User unblocked but not eligible for new assignment',
        reason: senderEligibility.reason
      };
    }

    // Step 3: Get user data for assignment
    const userRef = doc(db, 'users', userUid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    // Step 4: Find eligible receiver
    const eligibleReceiver = await findEligibleReceiver(userUid, userData.level);
    if (!eligibleReceiver) {
      return {
        ...unblockResult,
        newAssignment: null,
        message: 'User unblocked but no eligible receiver available'
      };
    }

    // Step 5: Create new help assignment
    const assignmentResult = await createSendHelpAssignment(
      { uid: userUid, ...userData },
      eligibleReceiver
    );

    if (!assignmentResult.success) {
      return {
        ...unblockResult,
        newAssignment: null,
        message: 'User unblocked but new assignment failed',
        error: assignmentResult.error
      };
    }

    return {
      ...unblockResult,
      newAssignment: {
        helpId: assignmentResult.helpId,
        receiver: assignmentResult.receiver,
        amount: assignmentResult.amount
      },
      message: 'User successfully unblocked with new assignment'
    };

  } catch (error) {
    console.error('Error in admin unblock with new assignment:', error);
    throw error;
  }
};