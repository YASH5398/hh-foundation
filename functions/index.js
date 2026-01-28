const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest: httpsOnRequest, onCall: httpsOnCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
// const { onUserDeleted } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const { OpenAI } = require('openai');

// Firebase Params - API Keys and Configuration
const OPENAI_API_KEY = defineString('OPENAI_API_KEY');

// Import Chatbot Handler - Rule-Based AI Chatbot
const handleChatbotMessage = require('./chatbot/handleChatbotMessage');

admin.initializeApp();

setGlobalOptions({ region: 'us-central1' });

const db = admin.firestore();

// Import MLM core logic - SINGLE SOURCE OF TRUTH
const {
  LEVEL_CONFIG,
  LEVEL_ORDER,
  isIncomeBlocked,
  getCurrentBlockPoint,
  getRequiredPaymentForUnblock,
  getTotalHelpsByLevel,
  getAmountByLevel,
  getNextLevel,
  getBlockPointsByLevel,
  getUpgradeAmount,
  getSponsorPaymentAmount,
  getLevelIndex,
  isMaxLevel,
  validateLevelUpgrade,
  validateSponsorPayment,
  validateUpgradePayment
} = require('./shared/mlmCore');

// Import eligibility utilities - SINGLE SOURCE OF TRUTH
const { checkReceiveHelpEligibility, getEligibilityMessage } = require('./shared/eligibilityUtils');

// ============================
// HELP (SEND/RECEIVE) V2 - PRODUCTION FLOW
// ============================

const HELP_STATUSES = Object.freeze({
  ASSIGNED: 'assigned',
  PAYMENT_REQUESTED: 'payment_requested',
  PAYMENT_DONE: 'payment_done',
  CONFIRMED: 'confirmed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  FORCE_CONFIRMED: 'force_confirmed'
});

const LEVEL_RECEIVE_LIMITS = Object.freeze({
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243
});

// Timeouts (ms) - server authority only
const ASSIGNED_TO_REQUEST_TIMEOUT_MS = 60 * 60 * 1000; // 1h for receiver to request payment
const PAYMENT_REQUEST_TO_DONE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h for sender to pay

const allowedTransitions = Object.freeze({
  [HELP_STATUSES.ASSIGNED]: new Set([HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.TIMEOUT, HELP_STATUSES.CANCELLED]),
  [HELP_STATUSES.PAYMENT_REQUESTED]: new Set([HELP_STATUSES.PAYMENT_DONE, HELP_STATUSES.DISPUTED, HELP_STATUSES.TIMEOUT, HELP_STATUSES.CANCELLED]),
  [HELP_STATUSES.PAYMENT_DONE]: new Set([HELP_STATUSES.CONFIRMED, HELP_STATUSES.DISPUTED, HELP_STATUSES.TIMEOUT, HELP_STATUSES.CANCELLED, HELP_STATUSES.FORCE_CONFIRMED]),
  [HELP_STATUSES.CONFIRMED]: new Set([]),
  [HELP_STATUSES.FORCE_CONFIRMED]: new Set([]),
  [HELP_STATUSES.TIMEOUT]: new Set([]),
  [HELP_STATUSES.CANCELLED]: new Set([]),
  [HELP_STATUSES.DISPUTED]: new Set([HELP_STATUSES.FORCE_CONFIRMED, HELP_STATUSES.CANCELLED])
});

const normalizeLevelName = (levelValue) => {
  if (!levelValue) return 'Star';
  if (typeof levelValue === 'string') return levelValue;
  if (typeof levelValue === 'number') {
    const levelMap = { 1: 'Star', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Diamond' };
    return levelMap[levelValue] || 'Star';
  }
  return 'Star';
};

const assertAuth = (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
};

const assertAdmin = (request) => {
  assertAuth(request);
  if (request.auth.token?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }
};

const canTransition = (from, to) => {
  const set = allowedTransitions[from];
  return !!set && set.has(to);
};

const getReceiveLimitForLevel = (levelName) => {
  const normalized = normalizeLevelName(levelName);
  return LEVEL_RECEIVE_LIMITS[normalized] || LEVEL_RECEIVE_LIMITS.Star;
};

const isReceiverEligibleStrict = (userData) => {
  // Use the single source of truth eligibility function
  const { eligible } = checkReceiveHelpEligibility(userData);
  
  // Additional business logic checks (not covered by basic eligibility)
  if (!eligible) return false;
  
  // Check upgrade and sponsor payment requirements
  if (userData?.upgradeRequired === true) return false;
  if (userData?.sponsorPaymentPending === true) return false;
  
  // Check receive limit
  const limit = getReceiveLimitForLevel(userData?.levelStatus || userData?.level);
  if ((userData?.activeReceiveCount || 0) >= limit) return false;
  
  return true;
};

const receiverIneligibilityReason = (userData) => {
  // First check basic eligibility
  const { eligible, reason } = checkReceiveHelpEligibility(userData);
  if (!eligible) {
    // Map our detailed reasons to the existing reason codes
    if (reason.includes('isActivated')) return 'not_activated';
    if (reason.includes('isBlocked')) return 'blocked';
    if (reason.includes('isOnHold')) return 'on_hold';
    if (reason.includes('isReceivingHeld')) return 'receiving_held';
    if (reason.includes('paymentBlocked')) return 'payment_blocked';
    if (reason.includes('helpVisibility')) return 'help_visibility_disabled';
    if (reason.includes('levelStatus')) return 'level_status_missing';
    return 'not_eligible';
  }
  
  // Check additional business logic
  if (userData?.upgradeRequired === true) return 'upgrade_required';
  if (userData?.sponsorPaymentPending === true) return 'sponsor_payment_pending';
  const limit = getReceiveLimitForLevel(userData?.levelStatus || userData?.level);
  if ((userData?.activeReceiveCount || 0) >= limit) return 'receive_limit_reached';
  
  return 'not_eligible';
};

const buildHelpDocId = ({ receiverUid, senderUid, createdAtMs }) => {
  return `${receiverUid}_${senderUid}_${createdAtMs}`;
};

const writeAdminActionLog = async ({ actionType, helpId, performedBy, reason }) => {
  const ref = db.collection('adminActions').doc();
  await ref.set({
    actionType,
    helpId,
    performedBy,
    reason: reason || '',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
};

const TERMINAL_STATUSES = new Set([
  HELP_STATUSES.CONFIRMED,
  HELP_STATUSES.TIMEOUT,
  HELP_STATUSES.CANCELLED,
  HELP_STATUSES.FORCE_CONFIRMED
]);

const buildHelpNotificationId = ({ helpId, role, status, action }) => {
  return `${helpId}_${role}_${status}_${action || 'state'}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
};

const createHelpNotification = async ({ toUid, title, message, helpId, role, status, actionLink }) => {
  if (!toUid || !helpId || !role || !status) return;
  const notificationId = buildHelpNotificationId({ helpId, role, status, action: 'help' });
  const notificationRef = db.collection('notifications').doc(notificationId);
  await notificationRef.set({
    uid: toUid,
    userId: toUid,
    title,
    message,
    type: 'activity',
    category: 'help',
    priority: 'high',
    actionLink: actionLink || '/dashboard',
    relatedHelpId: helpId,
    helpId,
    role,
    status,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
};

const releaseReceiverSlotIfNeeded = async (tx, { receiveRef, sendRef, receiverUid }) => {
  const rSnap = await tx.get(receiveRef);
  const sSnap = await tx.get(sendRef);
  if (!rSnap.exists || !sSnap.exists) return;
  const r = rSnap.data();
  const s = sSnap.data();
  const alreadyReleased = r?.slotReleased === true || s?.slotReleased === true;
  if (alreadyReleased) return;

  const userRef = db.collection('users').doc(receiverUid);
  const userSnap = await tx.get(userRef);
  if (userSnap.exists) {
    const current = userSnap.data()?.activeReceiveCount || 0;
    const next = Math.max(0, current - 1);
    tx.update(userRef, { activeReceiveCount: next });
  }

  const patch = {
    slotReleased: true,
    slotReleasedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  tx.update(receiveRef, patch);
  tx.update(sendRef, patch);
};

// Callable: receiver eligibility for UI gating (server truth)
exports.getReceiveEligibility = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found');
  }
  const userData = userSnap.data();
  const eligible = isReceiverEligibleStrict(userData);
  const reasonCode = eligible ? null : receiverIneligibilityReason(userData);
  const blockType = !eligible ? (
    reasonCode === 'upgrade_required' ? 'upgradeRequired' :
    reasonCode === 'sponsor_payment_pending' ? 'sponsorPaymentPending' :
    reasonCode === 'receiving_held' ? 'isReceivingHeld' :
    reasonCode === 'blocked' ? 'isBlocked' :
    null
  ) : null;

  return {
    success: true,
    message: eligible ? 'User is eligible to receive help' : `User is not eligible: ${reasonCode}`,
    data: {
      isEligible: eligible,
      reasonCode,
      blockType,
      flags: {
        isOnHold: userData?.isOnHold === true,
        isReceivingHeld: userData?.isReceivingHeld === true,
        isBlocked: userData?.isBlocked === true,
        upgradeRequired: userData?.upgradeRequired === true,
        sponsorPaymentPending: userData?.sponsorPaymentPending === true
      },
      activeReceiveCount: userData?.activeReceiveCount || 0,
      levelAllowedLimit: getReceiveLimitForLevel(userData?.levelStatus || userData?.level)
    }
  };
});

// Callable: start assignment (server-side matching, transactional, race-safe)
exports.startHelpAssignment = httpsOnCall(async (request) => {
  console.log('[startHelpAssignment] entry', {
    authUid: request?.auth?.uid || null,
    data: request?.data || null
  });

  const startedAtMs = Date.now();
  try {
    if (!request?.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const senderUid = request.auth.uid;
    const payload = request.data || {};

    console.log('[startHelpAssignment] start', {
      senderUid,
      payload,
      startedAtMs
    });

    const payloadSenderUid = payload?.senderUid;
    const senderId = payload?.senderId;
    const idempotencyKey = payload?.idempotencyKey;

    if (typeof payloadSenderUid !== 'string' || payloadSenderUid.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'senderUid required', { field: 'senderUid' });
    }
    if (payloadSenderUid !== senderUid) {
      throw new HttpsError('failed-precondition', 'senderUid mismatch');
    }
    if (typeof senderId !== 'string' || senderId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'senderId required', { field: 'senderId' });
    }
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'idempotencyKey required', { field: 'idempotencyKey' });
    }

    await db.collection('_debug').add({
      fn: 'startHelpAssignment',
      senderUid,
      senderId,
      idempotencyKey,
      payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now()
    });

    const safeThrowInternal = (err, meta) => {
      console.error('[startHelpAssignment] firestore.error', {
        meta: meta || null,
        senderUid,
        message: err?.message,
        code: err?.code,
        stack: err?.stack
      });
      throw new HttpsError('failed-precondition', err?.message || 'Firestore operation failed', {
        ...(meta || {}),
        originalMessage: err?.message || String(err),
        originalCode: err?.code || null
      });
    };

    const senderRef = db.collection('users').doc(senderUid);
    const idempotencyRef = db.collection('helpIdempotency').doc(`${senderUid}_${idempotencyKey}`);

    const result = await db.runTransaction(async (tx) => {
      console.log('[startHelpAssignment] tx.begin', { senderUid, senderId, idempotencyKey });

      let idemSnap;
      try {
        idemSnap = await tx.get(idempotencyRef);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.get.idempotency' });
      }

      if (idemSnap.exists) {
        const existingHelpId = idemSnap.data()?.helpId || null;
        console.log('[startHelpAssignment] idempotency.hit', { senderUid, senderId, idempotencyKey, helpId: existingHelpId });
        if (!existingHelpId) {
          throw new HttpsError('failed-precondition', 'Idempotency record missing helpId');
        }
        return { alreadyExists: true, helpId: existingHelpId };
      }

      let senderSnap;
      try {
        senderSnap = await tx.get(senderRef);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.get.sender' });
      }

      if (!senderSnap.exists) {
        throw new HttpsError('failed-precondition', 'Sender user document missing');
      }

      const sender = senderSnap.data() || {};
      console.log('[startHelpAssignment] sender.data', {
        senderUid,
        senderId,
        senderIdFromDoc: sender?.userId || null,
        isBlocked: sender?.isBlocked === true,
        isOnHold: sender?.isOnHold === true,
        paymentBlocked: sender?.paymentBlocked === true,
        blockReason: sender?.blockReason || null,
        levelStatus: sender?.levelStatus || null,
        level: sender?.level || null
      });

      if ((sender?.userId || null) !== senderId) {
        throw new HttpsError('failed-precondition', 'senderId does not match user document');
      }
      if (sender?.isBlocked === true || sender?.isOnHold === true || sender?.paymentBlocked === true) {
        throw new HttpsError('failed-precondition', sender?.blockReason || 'Sender is blocked/on hold');
      }

      const senderLevel = normalizeLevelName(sender.levelStatus || sender.level);

      const activeSendQuery = db
        .collection('sendHelp')
        .where('senderUid', '==', senderUid)
        .where('status', 'in', [HELP_STATUSES.ASSIGNED, HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE]);

      let activeSendSnap;
      try {
        activeSendSnap = await tx.get(activeSendQuery);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.get.activeSendQuery' });
      }

      console.log('[startHelpAssignment] activeSend.count', { senderUid, count: activeSendSnap.size });
      if (!activeSendSnap.empty) {
        throw new HttpsError('failed-precondition', 'Sender already has an active help');
      }

      // Helper: Normalize boolean field (handle string booleans like "true"/"false")
      const normalizeBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        return !!value;
      };

      // Helper: Normalize number field (handle string numbers)
      const normalizeNumber = (value, defaultVal = 0) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && !isNaN(value)) return Number(value);
        return defaultVal;
      };

      // Main query: ONLY essential filters
      const receiverQuery = db
        .collection('users')
        .where('helpVisibility', '==', true)
        .where('isActivated', '==', true)
        .where('isBlocked', '==', false)
        .where('isReceivingHeld', '==', false)
        .limit(500);

      console.log('[startHelpAssignment] receiver.query.spec', {
        collection: 'users',
        filters: {
          helpVisibility: '== true',
          isActivated: '== true',
          isBlocked: '== false',
          isReceivingHeld: '== false'
        },
        limit: 500
      });

      let receiverSnap;
      try {
        receiverSnap = await tx.get(receiverQuery);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.get.receiverQuery', errorMsg: e?.message });
      }

      console.log('[startHelpAssignment] receiver.query.result', { 
        usersFetched: receiverSnap.size,
        isEmpty: receiverSnap.empty
      });

      // Post-fetch processing in JavaScript with type normalization
      let receiversToCheck = receiverSnap.docs
        .map(doc => ({
          ref: doc.ref,
          id: doc.id,
          data: doc.data(),
          // Normalize types for reliable filtering
          _normalized: {
            helpVisibility: normalizeBoolean(doc.data()?.helpVisibility),
            isActivated: normalizeBoolean(doc.data()?.isActivated),
            isBlocked: normalizeBoolean(doc.data()?.isBlocked),
            isReceivingHeld: normalizeBoolean(doc.data()?.isReceivingHeld),
            referralCount: normalizeNumber(doc.data()?.referralCount, 0)
          }
        }))
        // RE-VALIDATE: Re-check normalized types (in case Firestore filters weren't exact)
        .filter(u => 
          u._normalized.helpVisibility === true &&
          u._normalized.isActivated === true &&
          u._normalized.isBlocked === false &&
          u._normalized.isReceivingHeld === false
        )
        // Exclude sender UID
        .filter(u => u.id !== senderUid)
        // Exclude system accounts
        .filter(u => u.data?.isSystemAccount !== true)
        // Sort by referralCount DESC
        .sort((a, b) => {
          const aRef = a._normalized.referralCount;
          const bRef = b._normalized.referralCount;
          return bRef - aRef;
        });

      const afterNormalization = receiversToCheck.length;
      console.log('[startHelpAssignment] receiver.filtering', { 
        afterQuery: receiverSnap.size,
        afterNormalization: afterNormalization,
        senderExcluded: receiverSnap.docs.some(d => d.id === senderUid) ? true : false
      });

      let chosenReceiverRef = null;
      let chosenReceiver = null;
      let chosenReceiverUid = null;
      let fallbackUsed = false;
      
      // Pick first receiver if any
      if (receiversToCheck.length > 0) {
        const chosen = receiversToCheck[0];
        chosenReceiverRef = chosen.ref;
        chosenReceiver = chosen.data;
        chosenReceiverUid = chosen.id;
        
        console.log('[startHelpAssignment] receiver.selected', { 
          selectedUid: chosen.id,
          userId: chosen.data?.userId || null,
          referralCount: chosen._normalized.referralCount
        });
      }

      // FALLBACK STRATEGY: If zero eligible found, try relaxed query
      if (!chosenReceiverRef && !chosenReceiver) {
        console.log('[startHelpAssignment] fallback.trigger', {
          reason: 'zero_receivers_from_main_query',
          attempting: 'relaxed_fallback_query'
        });

        const fallbackQuery = db
          .collection('users')
          .where('isActivated', '==', true)
          .where('isBlocked', '==', false)
          .limit(500);

        let fallbackSnap;
        try {
          fallbackSnap = await tx.get(fallbackQuery);
        } catch (e) {
          console.log('[startHelpAssignment] fallback.query.failed', { errorMsg: e?.message });
          fallbackSnap = { docs: [], empty: true };
        }

        if (fallbackSnap && !fallbackSnap.empty) {
          // Apply same normalization and filtering
          const fallbackCandidates = fallbackSnap.docs
            .map(doc => ({
              ref: doc.ref,
              id: doc.id,
              data: doc.data(),
              _normalized: {
                helpVisibility: normalizeBoolean(doc.data()?.helpVisibility),
                isActivated: normalizeBoolean(doc.data()?.isActivated),
                isBlocked: normalizeBoolean(doc.data()?.isBlocked),
                isReceivingHeld: normalizeBoolean(doc.data()?.isReceivingHeld),
                referralCount: normalizeNumber(doc.data()?.referralCount, 0)
              }
            }))
            // Apply eligibility filters
            .filter(u => u._normalized.isActivated === true && u._normalized.isBlocked === false)
            .filter(u => u.id !== senderUid)
            .filter(u => u.data?.isSystemAccount !== true)
            .sort((a, b) => b._normalized.referralCount - a._normalized.referralCount);

          if (fallbackCandidates.length > 0) {
            const chosen = fallbackCandidates[0];
            chosenReceiverRef = chosen.ref;
            chosenReceiver = chosen.data;
            chosenReceiverUid = chosen.id;
            fallbackUsed = true;

            console.log('[startHelpAssignment] fallback.success', {
              selectedUid: chosen.id,
              userId: chosen.data?.userId || null,
              candidatesAvailable: fallbackCandidates.length
            });
          }
        }
      }

      // Final check: no receivers found even after fallback
      if (!chosenReceiverRef || !chosenReceiver) {
        console.log('[startHelpAssignment] no_eligible_receiver', {
          mainQuery: receiverSnap.size,
          afterFiltering: afterNormalization,
          fallbackUsed: fallbackUsed
        });
        
        return { 
          success: false, 
          reason: 'NO_ELIGIBLE_RECEIVER'
        };
      }

      // RE-VALIDATE receiver in transaction before assignment (check for concurrent modifications)
      console.log('[startHelpAssignment] revalidate.receiver', {
        receiverUid: chosenReceiverUid,
        step: 'before_assignment'
      });

      const freshReceiverSnap = await tx.get(chosenReceiverRef);
      if (!freshReceiverSnap.exists) {
        throw new HttpsError('failed-precondition', 'Receiver document disappeared during assignment');
      }

      const freshReceiver = freshReceiverSnap.data();
      if (normalizeBoolean(freshReceiver?.isBlocked) === true || 
          normalizeBoolean(freshReceiver?.isReceivingHeld) === true) {
        throw new HttpsError('failed-precondition', 'Receiver became ineligible during assignment');
      }

      // Use fresh data for the assignment
      chosenReceiver = freshReceiver;

      console.log('[startHelpAssignment] final.receiver.selected', {
        senderUid,
        receiverUid: chosenReceiverUid,
        receiverUserId: chosenReceiver.userId || null,
        helpReceived: chosenReceiver.helpReceived || 0,
        level: chosenReceiver.levelStatus || chosenReceiver.level || 'Star',
        activeReceiveCount: chosenReceiver.activeReceiveCount || 0,
        referralCount: chosenReceiver.referralCount || 0,
        lastReceiveAssignedAt: chosenReceiver.lastReceiveAssignedAt || null
      });

      const createdAtMs = Date.now();
      const helpId = buildHelpDocId({ receiverUid: chosenReceiverUid, senderUid, createdAtMs });
      const sendHelpRef = db.collection('sendHelp').doc(helpId);
      const receiveHelpRef = db.collection('receiveHelp').doc(helpId);

      const receiverLimit = getReceiveLimitForLevel(chosenReceiver.levelStatus || chosenReceiver.level);
      const receiverActiveCount = chosenReceiver.activeReceiveCount || 0;
      if (receiverActiveCount >= receiverLimit) {
        throw new HttpsError('failed-precondition', 'Receiver slot full');
      }

      const amount = getAmountByLevel(senderLevel);
      const assignedAtMs = createdAtMs;
      const nextTimeoutAtMs = assignedAtMs + ASSIGNED_TO_REQUEST_TIMEOUT_MS;

      const baseHelpDoc = {
        id: helpId,
        status: HELP_STATUSES.ASSIGNED,
        slotReleased: false,

        senderUid,
        senderId,
        senderName: sender.fullName || sender.name || sender.displayName || null,
        senderPhone: sender.phone || null,
        senderLevel,

        receiverUid: chosenReceiverUid,
        receiverId: chosenReceiver.userId || null,
        receiverName: chosenReceiver.fullName || chosenReceiver.name || chosenReceiver.displayName || null,
        receiverPhone: chosenReceiver.phone || null,
        receiverLevel: normalizeLevelName(chosenReceiver.levelStatus || chosenReceiver.level),

        amount,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        assignedAtMs,
        paymentRequestedAt: null,
        paymentRequestedAtMs: null,
        paymentDoneAt: null,
        paymentDoneAtMs: null,
        confirmedAt: null,

        nextTimeoutAtMs,
        timeoutReason: null,

        payment: {
          utr: null,
          method: null,
          screenshotUrl: null,
          screenshotPath: null,
          screenshotContentType: null,
          screenshotSize: null
        },

        dispute: {
          isDisputed: false,
          disputedAt: null,
          reason: null
        },

        audit: {
          createdBy: senderUid,
          idempotencyKey
        }
      };

      try {
        tx.set(sendHelpRef, baseHelpDoc);
        tx.set(receiveHelpRef, baseHelpDoc);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.set.helpDocs', helpId });
      }

      try {
        tx.update(chosenReceiverRef, {
          activeReceiveCount: admin.firestore.FieldValue.increment(1),
          lastReceiveAssignedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.update.receiver', receiverUid: chosenReceiver.uid, helpId });
      }

      try {
        tx.set(idempotencyRef, {
          senderUid,
          senderId,
          idempotencyKey,
          helpId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.set.idempotency', helpId });
      }

      console.log('[startHelpAssignment] docs.created', { senderUid, helpId, receiverUid: chosenReceiverUid });
      return { alreadyExists: false, helpId };
    });

    console.log('[startHelpAssignment] success', {
      senderUid,
      senderId,
      helpId: result?.helpId || null,
      alreadyExists: result?.alreadyExists === true,
      durationMs: Date.now() - startedAtMs
    });

    // Handle case where no receiver was found
    if (result.success === false && result.reason === 'NO_ELIGIBLE_RECEIVER') {
      return {
        success: false,
        reason: 'NO_ELIGIBLE_RECEIVER',
        data: result
      };
    }

    return {
      success: true,
      message: result.alreadyExists ? 'Help assignment already exists' : 'Help assignment created successfully',
      data: result
    };
  } catch (err) {
    console.error('[startHelpAssignment] crash', err);
    if (err instanceof HttpsError) {
      throw err;
    }

    const allowedCodes = new Set(['unauthenticated', 'invalid-argument', 'failed-precondition']);
    const code = allowedCodes.has(err?.code) ? err.code : 'failed-precondition';
    throw new HttpsError(
      code,
      err?.message || 'startHelpAssignment crashed',
      err?.details || null
    );
  }
});

// Callable: receiver requests payment
exports.requestPayment = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { helpId } = request.data || {};
  if (!helpId) throw new HttpsError('invalid-argument', 'helpId required');

  await db.runTransaction(async (tx) => {
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const sendRef = db.collection('sendHelp').doc(helpId);
    const [rSnap, sSnap] = await Promise.all([tx.get(receiveRef), tx.get(sendRef)]);
    if (!rSnap.exists || !sSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const r = rSnap.data();
    const s = sSnap.data();
    if (r.receiverUid !== uid) throw new HttpsError('permission-denied', 'Not receiver');
    if (r.status !== s.status) throw new HttpsError('failed-precondition', 'Help out of sync');
    if (TERMINAL_STATUSES.has(r.status)) return;
    if (r.status === HELP_STATUSES.PAYMENT_REQUESTED) return;
    if (!canTransition(r.status, HELP_STATUSES.PAYMENT_REQUESTED)) throw new HttpsError('failed-precondition', 'Invalid status transition');

    // Re-check receiver eligibility at action time
    const receiverUserSnap = await tx.get(db.collection('users').doc(uid));
    if (!receiverUserSnap.exists) throw new HttpsError('not-found', 'Receiver user not found');
    const receiverUser = receiverUserSnap.data();
    if (!isReceiverEligibleStrict(receiverUser)) throw new HttpsError('failed-precondition', `Receiver not eligible: ${receiverIneligibilityReason(receiverUser)}`);

    const paymentRequestedAtMs = Date.now();
    const nextTimeoutAtMs = paymentRequestedAtMs + PAYMENT_REQUEST_TO_DONE_TIMEOUT_MS;

    const patch = {
      status: HELP_STATUSES.PAYMENT_REQUESTED,
      paymentRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentRequestedAtMs,
      nextTimeoutAtMs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    tx.update(receiveRef, patch);
    tx.update(sendRef, patch);
  });

  // Dedupe-safe notifications
  try {
    const sendDoc = await db.collection('sendHelp').doc(helpId).get();
    if (sendDoc.exists) {
      const d = sendDoc.data();
      await createHelpNotification({
        toUid: d.senderUid,
        title: '💳 Payment Requested',
        message: `Receiver has requested your payment of ₹${d.amount}.`,
        helpId,
        role: 'sender',
        status: HELP_STATUSES.PAYMENT_REQUESTED,
        actionLink: '/send-help'
      });
    }
  } catch (_) {}

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

exports.createUserNotification = httpsOnCall(async (request) => {
  assertAuth(request);
  const callerUid = request.auth.uid;
  const isAdmin = request.auth.token?.role === 'admin';

  const {
    targetUid,
    title,
    message,
    type = 'system',
    category,
    priority,
    actionLink,
    relatedAction,
    relatedHelpId,
    eventKey,
    preventDuplicates = true
  } = request.data || {};

  const toUid = targetUid || callerUid;
  if (!toUid) throw new HttpsError('invalid-argument', 'targetUid required');
  if (toUid !== callerUid && !isAdmin) throw new HttpsError('permission-denied', 'Admin required to notify other users');
  if (!type) throw new HttpsError('invalid-argument', 'type is required');
  if (!title || !message) throw new HttpsError('invalid-argument', 'title and message are required');

  const key = eventKey || relatedHelpId || null;
  if (!key) throw new HttpsError('invalid-argument', 'eventKey or relatedHelpId required for idempotency');

  const raw = `${toUid}|${type}|${key}`;
  const digest = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 24);
  const notificationId = `n_${toUid}_${type}_${digest}`;
  const ref = db.collection('notifications').doc(notificationId);

  if (preventDuplicates) {
    const existing = await ref.get();
    if (existing.exists) return { ok: true, id: notificationId, duplicate: true };
  }

  await ref.set({
    uid: toUid,
    userId: toUid,
    title,
    message,
    type,
    category: category || null,
    priority: priority || null,
    actionLink: actionLink || null,
    relatedAction: relatedAction || null,
    relatedHelpId: relatedHelpId || null,
    eventKey: key,
    isRead: false,
    deleted: false,
    isDeleted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: false });

  return { ok: true, id: notificationId, duplicate: false };
});

exports.setNotificationRead = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const isAdmin = request.auth.token?.role === 'admin';
  const { notificationId, isRead = true } = request.data || {};
  if (!notificationId) throw new HttpsError('invalid-argument', 'notificationId required');

  const ref = db.collection('notifications').doc(notificationId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const n = snap.data();
    if (n.userId !== uid && !isAdmin) throw new HttpsError('permission-denied', 'Not your notification');
    tx.update(ref, {
      isRead: !!isRead,
      read: !!isRead,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

exports.bulkMarkNotificationsRead = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const isAdmin = request.auth.token?.role === 'admin';
  const { notificationIds } = request.data || {};
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) return { ok: true, updated: 0 };

  const unique = Array.from(new Set(notificationIds)).slice(0, 200);
  await db.runTransaction(async (tx) => {
    for (const id of unique) {
      const ref = db.collection('notifications').doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) continue;
      const n = snap.data();
      if (n.userId !== uid && !isAdmin) continue;
      tx.update(ref, { isRead: true, read: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  });

  return { ok: true, updated: unique.length };
});

exports.deleteUserNotification = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const isAdmin = request.auth.token?.role === 'admin';
  const { notificationId } = request.data || {};
  if (!notificationId) throw new HttpsError('invalid-argument', 'notificationId required');

  const ref = db.collection('notifications').doc(notificationId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const n = snap.data();
    if (n.userId !== uid && !isAdmin) throw new HttpsError('permission-denied', 'Not your notification');
    tx.update(ref, {
      deleted: true,
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

// Callable: sender submits payment proof + UTR uniqueness
exports.submitPayment = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { helpId, utr, method, screenshotUrl, screenshotPath, screenshotContentType, screenshotSize } = request.data || {};
  if (!helpId || !utr || typeof utr !== 'string') throw new HttpsError('invalid-argument', 'helpId and utr required');

  const normalizedUtr = utr.trim().toUpperCase();
  if (normalizedUtr.length < 6) throw new HttpsError('invalid-argument', 'Invalid UTR');

  await db.runTransaction(async (tx) => {
    const sendRef = db.collection('sendHelp').doc(helpId);
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const utrRef = db.collection('utrIndex').doc(normalizedUtr);

    const [sSnap, rSnap, utrSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef), tx.get(utrRef)]);
    if (!sSnap.exists || !rSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const s = sSnap.data();
    const r = rSnap.data();
    if (s.senderUid !== uid) throw new HttpsError('permission-denied', 'Not sender');
    if (s.status !== r.status) throw new HttpsError('failed-precondition', 'Help out of sync');
    if (TERMINAL_STATUSES.has(s.status)) return;
    if (s.status !== HELP_STATUSES.PAYMENT_REQUESTED) return;
    if (utrSnap.exists) throw new HttpsError('already-exists', 'UTR already used');
    if (!canTransition(s.status, HELP_STATUSES.PAYMENT_DONE)) return;

    const paymentDoneAtMs = Date.now();

    tx.set(utrRef, {
      helpId,
      senderUid: s.senderUid,
      receiverUid: s.receiverUid,
      utr: normalizedUtr,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const patch = {
      status: HELP_STATUSES.PAYMENT_DONE,
      paymentDoneAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentDoneAtMs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      payment: {
        utr: normalizedUtr,
        method: method || null,
        screenshotUrl: screenshotUrl || null,
        screenshotPath: screenshotPath || null,
        screenshotContentType: screenshotContentType || null,
        screenshotSize: typeof screenshotSize === 'number' ? screenshotSize : null
      }
    };
    tx.update(sendRef, patch);
    tx.update(receiveRef, patch);
  });

  try {
    const receiveDoc = await db.collection('receiveHelp').doc(helpId).get();
    if (receiveDoc.exists) {
      const d = receiveDoc.data();
      await createHelpNotification({
        toUid: d.receiverUid,
        title: '✅ Payment Submitted',
        message: `Sender submitted payment proof for ₹${d.amount}. Please confirm after verification.`,
        helpId,
        role: 'receiver',
        status: HELP_STATUSES.PAYMENT_DONE,
        actionLink: '/receive-help'
      });
    }
  } catch (_) {}

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

// Callable: receiver confirms or disputes
exports.receiverResolvePayment = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { helpId, action, disputeReason } = request.data || {};
  if (!helpId || !action) throw new HttpsError('invalid-argument', 'helpId and action required');
  if (!['confirm', 'dispute'].includes(action)) throw new HttpsError('invalid-argument', 'Invalid action');

  await db.runTransaction(async (tx) => {
    const sendRef = db.collection('sendHelp').doc(helpId);
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
    if (!sSnap.exists || !rSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const s = sSnap.data();
    const r = rSnap.data();
    if (r.receiverUid !== uid) throw new HttpsError('permission-denied', 'Not receiver');
    if (s.status !== r.status) throw new HttpsError('failed-precondition', 'Help out of sync');
    if (TERMINAL_STATUSES.has(r.status)) return;

    if (action === 'confirm') {
      if (r.status !== HELP_STATUSES.PAYMENT_DONE) return;
      if (!canTransition(r.status, HELP_STATUSES.CONFIRMED)) return;
      const patch = {
        status: HELP_STATUSES.CONFIRMED,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      tx.update(sendRef, patch);
      tx.update(receiveRef, patch);

      await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
    }

    if (action === 'dispute') {
      if (![HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE].includes(r.status)) return;
      if (!canTransition(r.status, HELP_STATUSES.DISPUTED)) return;
      const patch = {
        status: HELP_STATUSES.DISPUTED,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        dispute: {
          isDisputed: true,
          disputedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason: disputeReason || null
        }
      };
      tx.update(sendRef, patch);
      tx.update(receiveRef, patch);
    }
  });

  try {
    const sendDoc = await db.collection('sendHelp').doc(helpId).get();
    if (sendDoc.exists) {
      const d = sendDoc.data();
      if (action === 'confirm') {
        await createHelpNotification({
          toUid: d.senderUid,
          title: '🎉 Payment Confirmed',
          message: `Receiver confirmed your payment of ₹${d.amount}.`,
          helpId,
          role: 'sender',
          status: HELP_STATUSES.CONFIRMED,
          actionLink: '/send-help'
        });
      }
      if (action === 'dispute') {
        await createHelpNotification({
          toUid: d.senderUid,
          title: '⚠️ Payment Disputed',
          message: `Receiver disputed your payment. Please contact support.`,
          helpId,
          role: 'sender',
          status: HELP_STATUSES.DISPUTED,
          actionLink: '/support'
        });
      }
    }
  } catch (_) {}

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

exports.cancelHelp = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { helpId, reason } = request.data || {};
  if (!helpId) throw new HttpsError('invalid-argument', 'helpId required');

  await db.runTransaction(async (tx) => {
    const sendRef = db.collection('sendHelp').doc(helpId);
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
    if (!sSnap.exists || !rSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const s = sSnap.data();
    const r = rSnap.data();
    if (s.status !== r.status) throw new HttpsError('failed-precondition', 'Help out of sync');
    if (TERMINAL_STATUSES.has(s.status)) return;
    const isParticipant = s.senderUid === uid || s.receiverUid === uid;
    if (!isParticipant) throw new HttpsError('permission-denied', 'Not participant');

    const patch = {
      status: HELP_STATUSES.CANCELLED,
      cancelReason: reason || null,
      cancelledBy: uid,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    tx.update(sendRef, patch);
    tx.update(receiveRef, patch);
    await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: s.receiverUid });
  });

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

// Admin callable: force confirm (logs adminActions)
exports.adminForceConfirm = httpsOnCall(async (request) => {
  assertAdmin(request);
  const performedBy = request.auth.uid;
  const { helpId, reason } = request.data || {};
  if (!helpId) throw new HttpsError('invalid-argument', 'helpId required');

  await db.runTransaction(async (tx) => {
    const sendRef = db.collection('sendHelp').doc(helpId);
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
    if (!sSnap.exists || !rSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const s = sSnap.data();
    const r = rSnap.data();
    if (TERMINAL_STATUSES.has(s.status) || s.status === HELP_STATUSES.FORCE_CONFIRMED) return;
    if (!canTransition(s.status, HELP_STATUSES.FORCE_CONFIRMED) && s.status !== HELP_STATUSES.DISPUTED) return;

    const patch = {
      status: HELP_STATUSES.FORCE_CONFIRMED,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      audit: {
        ...(s.audit || {}),
        forceConfirmedBy: performedBy
      }
    };
    tx.update(sendRef, patch);
    tx.update(receiveRef, patch);

    await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
  });

  await writeAdminActionLog({ actionType: 'force_confirm', helpId, performedBy, reason });

  try {
    const sendDoc = await db.collection('sendHelp').doc(helpId).get();
    if (sendDoc.exists) {
      const d = sendDoc.data();
      await createHelpNotification({
        toUid: d.senderUid,
        title: '✅ Force Confirmed',
        message: 'Admin has force-confirmed this payment.',
        helpId,
        role: 'sender',
        status: HELP_STATUSES.FORCE_CONFIRMED,
        actionLink: '/send-help'
      });
      await createHelpNotification({
        toUid: d.receiverUid,
        title: '✅ Force Confirmed',
        message: 'Admin has force-confirmed this payment.',
        helpId,
        role: 'receiver',
        status: HELP_STATUSES.FORCE_CONFIRMED,
        actionLink: '/receive-help'
      });
    }
  } catch (_) {}

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

// Scheduled timeout processor (server driven)
exports.processHelpTimeouts = onSchedule('every 1 minutes', async () => {
  const now = Date.now();
  const dueQuery = db
    .collection('receiveHelp')
    .where('status', 'in', [HELP_STATUSES.ASSIGNED, HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE])
    .where('nextTimeoutAtMs', '<=', now)
    .orderBy('nextTimeoutAtMs', 'asc')
    .limit(50);

  const dueSnap = await dueQuery.get();
  if (dueSnap.empty) return;

  const promises = dueSnap.docs.map(async (docSnap) => {
    const helpId = docSnap.id;
    await db.runTransaction(async (tx) => {
      const receiveRef = db.collection('receiveHelp').doc(helpId);
      const sendRef = db.collection('sendHelp').doc(helpId);
      const [rSnap, sSnap] = await Promise.all([tx.get(receiveRef), tx.get(sendRef)]);
      if (!rSnap.exists || !sSnap.exists) return;
      const r = rSnap.data();
      const s = sSnap.data();
      if (r.status !== s.status) return;
      if (![HELP_STATUSES.ASSIGNED, HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE].includes(r.status)) return;
      if ((r.nextTimeoutAtMs || 0) > now) return;

      let timeoutReason = 'timeout';
      const receiverUserRef = db.collection('users').doc(r.receiverUid);
      const senderUserRef = db.collection('users').doc(r.senderUid);

      if (r.status === HELP_STATUSES.ASSIGNED) {
        timeoutReason = 'receiver_no_request';
        tx.update(receiverUserRef, {
          isReceivingHeld: true,
          isOnHold: true
        });
      }

      if (r.status === HELP_STATUSES.PAYMENT_REQUESTED) {
        timeoutReason = 'sender_no_payment';
        tx.update(senderUserRef, {
          isOnHold: true
        });
      }

      if (r.status === HELP_STATUSES.PAYMENT_DONE) {
        timeoutReason = 'receiver_no_confirmation';
        tx.update(receiverUserRef, {
          isReceivingHeld: true,
          isOnHold: true
        });
      }

      const patch = {
        status: HELP_STATUSES.TIMEOUT,
        timeoutReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      tx.update(receiveRef, patch);
      tx.update(sendRef, patch);

      await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
    });
  });

  await Promise.allSettled(promises);
});

exports.resumeBlockedReceives = httpsOnCall(async (request) => {
  assertAuth(request);
  const callerUid = request.auth.uid;
  const { uid } = request.data || {};
  const targetUid = uid || callerUid;

  const userRef = db.collection('users').doc(targetUid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User not found');

  const { activeReceiveCount } = await internalResumeBlockedReceives(targetUid);
  return { ok: true, uid: targetUid, activeReceiveCount };
});

// 
// exports.onAuthUserDeleted = onUserDeleted(async (event) => {
//   const uid = event.data?.uid;
//   if (!uid) return;
//
//   const activeSnap = await db
//     .collection('sendHelp')
//     .where('senderUid', '==', uid)
//     .where('status', 'in', [HELP_STATUSES.ASSIGNED, HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE, HELP_STATUSES.DISPUTED])
//     .get();
//
//   const ops = activeSnap.docs.map(async (docSnap) => {
//     const helpId = docSnap.id;
//     await db.runTransaction(async (tx) => {
//       const sendRef = db.collection('sendHelp').doc(helpId);
//       const receiveRef = db.collection('receiveHelp').doc(helpId);
//       const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
//       if (!sSnap.exists || !rSnap.exists) return;
//       const s = sSnap.data();
//       const r = rSnap.data();
//       if (TERMINAL_STATUSES.has(s.status)) return;
//       const patch = {
//         status: HELP_STATUSES.CANCELLED,
//         cancelReason: 'sender_account_deleted',
//         cancelledBy: 'system',
//         cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
//       tx.update(sendRef, patch);
//       tx.update(receiveRef, patch);
//       await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
//     });
//   });
//
//   await Promise.allSettled(ops);
// });
//    const helpId = docSnap.id;
//    await db.runTransaction(async (tx) => {
//      const sendRef = db.collection('sendHelp').doc(helpId);
//      const receiveRef = db.collection('receiveHelp').doc(helpId);
//      const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
//      if (!sSnap.exists || !rSnap.exists) return;
//      const s = sSnap.data();
//      const r = rSnap.data();
//      if (TERMINAL_STATUSES.has(s.status)) return;
//      const patch = {
//        status: HELP_STATUSES.CANCELLED,
//        cancelReason: 'sender_account_deleted',
//        cancelledBy: 'system',
//        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
//        updatedAt: admin.firestore.FieldValue.serverTimestamp()
//      };
//      tx.update(sendRef, patch);
//      tx.update(receiveRef, patch);
//      await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
//    });
//  });
//
//  await Promise.allSettled(ops);

// Helper functions for level management
const unblockUserIncome = async (userId, level) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    isReceivingHeld: false,
    isOnHold: false,
    lastUnblockTime: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[unblockUserIncome] Unblocked income for user ${userId} at level ${level}`);
};

const upgradeUserLevel = async (userId, newLevel) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    level: newLevel,
    helpReceived: 0, // Reset help counter for new level
    isReceivingHeld: false,
    isOnHold: false,
    levelStatus: 'active',
    lastUpgradeTime: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[upgradeUserLevel] Upgraded user ${userId} to level ${newLevel}`);
};

// Helper functions for creating standardized notification data
const createNotificationData = (params) => {
  const {
    title,
    message,
    type = 'activity',
    priority = 'medium',
    uid,
    userId,
    senderName = 'System',
    sentBy = 'system',
    actionLink,
    iconUrl,
    category,
    relatedAction,
    relatedHelpId,
    relatedUserId,
    levelStatus,
    dismissible = true,
    ...otherFields
  } = params;

  // Validate required fields
  if (!title || !message || !uid || !userId) {
    throw new Error('Title, message, uid, and userId are required');
  }

  // Base notification object with required fields
  const notification = {
    title,
    message,
    type,
    priority,
    uid,
    userId,
    senderName,
    sentBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false,
    isDeleted: false,
    seenInUI: false,
    readAt: null,
    dismissible
  };

  // Add optional fields only if they have values
  if (actionLink) notification.actionLink = actionLink;
  if (iconUrl) notification.iconUrl = iconUrl;
  if (category) notification.category = category;
  if (relatedAction) notification.relatedAction = relatedAction;
  if (relatedHelpId) notification.relatedHelpId = relatedHelpId;
  if (relatedUserId) notification.relatedUserId = relatedUserId;
  if (levelStatus) notification.levelStatus = levelStatus;

  // Add any other valid fields
  Object.keys(otherFields).forEach(key => {
    if (otherFields[key] !== undefined && otherFields[key] !== null) {
      notification[key] = otherFields[key];
    }
  });

  return notification;
};

const createActivityNotificationData = (params) => {
  return createNotificationData({
    ...params,
    type: 'activity',
    sentBy: 'system',
    senderName: params.senderName || 'System'
  });
};

const internalResumeBlockedReceives = async (targetUid) => {
  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(targetUid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return;
    tx.update(userRef, {
      isReceivingHeld: false,
      isOnHold: false,
      sponsorPaymentPending: false,
      upgradeRequired: false,
      lastUnblockTime: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  const activeSnap = await db
    .collection('receiveHelp')
    .where('receiverUid', '==', targetUid)
    .where('status', 'in', [HELP_STATUSES.ASSIGNED, HELP_STATUSES.PAYMENT_REQUESTED, HELP_STATUSES.PAYMENT_DONE])
    .get();
  const activeCount = activeSnap.docs.filter(d => d.data()?.slotReleased !== true).length;
  await db.collection('users').doc(targetUid).set({ activeReceiveCount: activeCount }, { merge: true });
  return { activeReceiveCount: activeCount };
};

exports.onReceiveHelpStatusProcessed = onDocumentUpdated('receiveHelp/{docId}', async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();
  const helpId = context.params.docId;

  // Process only when status becomes confirmed/force_confirmed
  const beforeStatus = before?.status;
  const afterStatus = after?.status;
  if (beforeStatus === afterStatus) return null;
  if (![HELP_STATUSES.CONFIRMED, HELP_STATUSES.FORCE_CONFIRMED].includes(afterStatus)) return null;

  // Idempotency guard
  if (after?.incomeProcessed === true) return null;

  const receiverUid = after?.receiverUid;
  if (!receiverUid) return null;

  try {
    await db.runTransaction(async (tx) => {
      const receiveRef = db.collection('receiveHelp').doc(helpId);
      const sendRef = db.collection('sendHelp').doc(helpId);
      const [rSnap, sSnap] = await Promise.all([tx.get(receiveRef), tx.get(sendRef)]);
      if (!rSnap.exists || !sSnap.exists) return;
      const r = rSnap.data();
      const s = sSnap.data();
      if (r.incomeProcessed === true || s.incomeProcessed === true) return;
      if (![HELP_STATUSES.CONFIRMED, HELP_STATUSES.FORCE_CONFIRMED].includes(r.status)) return;

      const userRef = db.collection('users').doc(receiverUid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        tx.update(receiveRef, { incomeProcessed: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.update(sendRef, { incomeProcessed: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        return;
      }
      const userData = userSnap.data();
      const prevHelpReceived = userData.helpReceived || 0;
      const nextHelpReceived = prevHelpReceived + 1;

      const receiverUpdate = {
        helpReceived: nextHelpReceived,
        totalReceived: (userData.totalReceived || 0) + (r.amount || 0)
      };

      // Apply blocking logic and explicit reason flags
      if (isIncomeBlocked({ ...userData, helpReceived: nextHelpReceived })) {
        receiverUpdate.isReceivingHeld = true;
        receiverUpdate.isOnHold = true;

        const required = getRequiredPaymentForUnblock({ ...userData, helpReceived: nextHelpReceived });
        if (required?.type === 'upgrade') {
          receiverUpdate.upgradeRequired = true;
          receiverUpdate.sponsorPaymentPending = false;
        }
        if (required?.type === 'sponsor') {
          receiverUpdate.sponsorPaymentPending = true;
          receiverUpdate.upgradeRequired = false;
        }
      }

      if (nextHelpReceived >= getTotalHelpsByLevel(userData.level)) {
        receiverUpdate.levelStatus = 'completed';
      }

      tx.update(userRef, receiverUpdate);

      const processedPatch = {
        incomeProcessed: true,
        incomeProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      tx.update(receiveRef, processedPatch);
      tx.update(sendRef, processedPatch);
    });
  } catch (e) {
    console.error('[onReceiveHelpStatusProcessed] Error:', e);
  }

  return null;
});

// Cloud Function: Confirm help received (secure frontend endpoint)
exports.confirmHelpReceived = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { helpId } = request.data || {};
  if (!helpId) throw new HttpsError('invalid-argument', 'Help ID is required');

  await db.runTransaction(async (tx) => {
    const sendRef = db.collection('sendHelp').doc(helpId);
    const receiveRef = db.collection('receiveHelp').doc(helpId);
    const [sSnap, rSnap] = await Promise.all([tx.get(sendRef), tx.get(receiveRef)]);
    if (!sSnap.exists || !rSnap.exists) throw new HttpsError('not-found', 'Help not found');
    const s = sSnap.data();
    const r = rSnap.data();
    if (s.status !== r.status) throw new HttpsError('failed-precondition', 'Help out of sync');
    if (r.receiverUid !== uid) throw new HttpsError('permission-denied', 'Not receiver');
    if (TERMINAL_STATUSES.has(r.status)) return;
    if (r.status !== HELP_STATUSES.PAYMENT_DONE) return;

    const patch = {
      status: HELP_STATUSES.CONFIRMED,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    tx.update(sendRef, patch);
    tx.update(receiveRef, patch);

    await releaseReceiverSlotIfNeeded(tx, { receiveRef, sendRef, receiverUid: r.receiverUid });
  });

  return {
    success: true,
    message: 'Payment request submitted successfully',
    data: { ok: true }
  };
});

exports.onLevelPaymentConfirmedV2 = onDocumentUpdated('levelPayments/{paymentId}', async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();
  if (!after) return null;
  if (before?.status === after?.status) return null;
  if (after.status !== 'confirmed') return null;

  const userId = after.userId;
  if (!userId) return null;

  try {
    await internalResumeBlockedReceives(userId);
  } catch (e) {
    console.error('[onLevelPaymentConfirmedV2] Error:', e);
  }

  return null;
});

// Cloud Function: E-PIN request status notifications
exports.onEpinRequestUpdateV2 = onDocumentUpdated('epinRequests/{requestId}', async (change, context) => {
    const requestId = context.params.requestId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
        const { requestedBy, status, quantityRequested, totalEpins } = afterData;
        
        if (!requestedBy) {
          console.log('No requestedBy UID found for E-PIN request notification');
          return null;
        }
        
        let title, message, actionLink;
        
        switch (status) {
          case 'approved':
            title = '✅ E-PIN Request Approved!';
            message = `Your request for ${quantityRequested} E-PINs has been approved. You will receive ${totalEpins} E-PINs total.`;
            actionLink = '/dashboard/epins/history';
            break;
          case 'rejected':
            title = '❌ E-PIN Request Rejected';
            message = `Your request for ${quantityRequested} E-PINs has been rejected. Please contact support for more information.`;
            actionLink = '/dashboard/support';
            break;
          case 'cancelled':
            title = '🚫 E-PIN Request Cancelled';
            message = `Your request for ${quantityRequested} E-PINs has been cancelled.`;
            actionLink = '/dashboard/epins/request';
            break;
          default:
            return null; // Don't send notification for other status changes
        }
        
        const epinNotification = createActivityNotificationData({
          title,
          message,
          uid: requestedBy,
          userId: requestedBy,
          priority: 'high',
          actionLink,
          category: 'epin',
          relatedAction: `epin_${status}`,
          senderName: 'E-PIN System'
        });
        
        await createNotification(requestedBy, epinNotification);
        await sendPushNotification(requestedBy, epinNotification);
        
        console.log(`E-PIN ${status} notification sent for request: ${requestId}`);
        
      } catch (error) {
        console.error('Error in onEpinRequestUpdate notification:', error);
      }
    }

    return null;
  });

// ============================================================================
// TEMPORARY DEBUG FUNCTION - Send Help Eligibility Verification
// ============================================================================
// This function helps verify if Firestore queries for Send Help are working
// Usage: GET /debugSendHelpEligibility?senderUid=xxx
// This function will be removed after debugging
// ============================================================================

exports.debugSendHelpEligibility = httpsOnRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const senderUid = req.query.senderUid;

    if (!senderUid) {
      res.status(400).json({
        error: 'Missing senderUid query parameter',
        example: '/debugSendHelpEligibility?senderUid=uid123'
      });
      return;
    }

    console.log('[DEBUG] debugSendHelpEligibility start', { senderUid });

    // Get sender data
    const senderSnap = await db.collection('users').doc(senderUid).get();
    if (!senderSnap.exists) {
      res.status(404).json({
        error: 'Sender user not found',
        senderUid
      });
      return;
    }

    const sender = senderSnap.data();

    console.log('[DEBUG] SENDER_DATA', {
      uid: senderUid,
      userId: sender.userId,
      levelStatus: sender.levelStatus,
      level: sender.level,
      isActivated: sender.isActivated,
      isBlocked: sender.isBlocked,
      isOnHold: sender.isOnHold,
      paymentBlocked: sender.paymentBlocked
    });

    // Normalize sender level
    const senderLevel = sender.levelStatus || sender.level || 'Star';

    console.log('[DEBUG] NORMALIZED_SENDER_LEVEL', senderLevel);

    // Run the exact same query as startHelpAssignment
    console.log('[DEBUG] RUNNING_QUERY', {
      isActivated: true,
      helpVisibility: true,
      isReceivingHeld: false,
      isBlocked: false,
      isOnHold: false,
      levelStatus: senderLevel
    });

    const receiverQuery = db
      .collection('users')
      .where('isActivated', '==', true)
      .where('helpVisibility', '==', true)
      .where('isReceivingHeld', '==', false)
      .where('isBlocked', '==', false)
      .where('isOnHold', '==', false)
      .where('levelStatus', '==', senderLevel);

    const snap = await receiverQuery.get();

    console.log('[DEBUG] QUERY_RESULT', {
      totalMatched: snap.size,
      isEmpty: snap.empty,
      senderLevel
    });

    // Log each matching receiver
    const receivers = [];
    snap.forEach(doc => {
      const u = doc.data();
      const receiverInfo = {
        uid: doc.id,
        userId: u.userId,
        levelStatus: u.levelStatus,
        level: u.level,
        isActivated: u.isActivated,
        helpVisibility: u.helpVisibility,
        isBlocked: u.isBlocked,
        isOnHold: u.isOnHold,
        isReceivingHeld: u.isReceivingHeld,
        helpReceived: u.helpReceived || 0,
        activeReceiveCount: u.activeReceiveCount || 0,
        sponsorPaymentPending: u.sponsorPaymentPending,
        upgradeRequired: u.upgradeRequired
      };

      console.log('[DEBUG] MATCHING_RECEIVER', receiverInfo);
      receivers.push(receiverInfo);
    });

    // Return summary
    res.json({
      success: true,
      sender: {
        uid: senderUid,
        userId: sender.userId,
        levelStatus: sender.levelStatus,
        isActivated: sender.isActivated,
        isBlocked: sender.isBlocked
      },
      query: {
        senderLevel,
        conditions: {
          isActivated: true,
          helpVisibility: true,
          isReceivingHeld: false,
          isBlocked: false,
          isOnHold: false,
          levelStatus: senderLevel
        }
      },
      result: {
        totalMatched: snap.size,
        receivers: receivers
      }
    });

  } catch (error) {
    console.error('[DEBUG] ERROR', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
// ============================
// HTTP FUNCTION: VALIDATE E-PIN
// ============================
exports.validateEpin = httpsOnRequest(async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.status(200).json({ success: true });
      return;
    }

    // Handle POST
    if (req.method === 'POST') {
      const { epin } = req.body;

      // Validate input
      if (!epin || typeof epin !== 'string' || epin.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Invalid E-PIN format' });
        return;
      }

      const epinTrimmed = epin.trim();

      // Query Firestore for matching E-PIN
      const epinsRef = admin.firestore().collection('epins');
      const snapshot = await epinsRef
        .where('epin', '==', epinTrimmed)
        .where('status', '==', 'unused')
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(400).json({ success: false, message: 'Invalid or already used E-PIN' });
        return;
      }

      const epinDoc = snapshot.docs[0];
      res.status(200).json({ 
        success: true, 
        epinId: epinDoc.id,
        message: 'E-PIN validated successfully'
      });
      return;
    }

    // Handle other methods
    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('validateEpin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// HTTP FUNCTION: CHECK E-PIN (NEW)
// ============================
exports.checkEpinHttp = httpsOnRequest(async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.status(200).json({ success: true });
      return;
    }

    // Handle POST
    if (req.method === 'POST') {
      const { epin } = req.body;

      // Validate input
      if (!epin || typeof epin !== 'string' || epin.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Invalid E-PIN format' });
        return;
      }

      const epinTrimmed = epin.trim();

      // Query Firestore for matching E-PIN
      const epinsRef = admin.firestore().collection('epins');
      const snapshot = await epinsRef
        .where('epin', '==', epinTrimmed)
        .where('status', '==', 'unused')
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(400).json({ success: false, message: 'Invalid or already used E-PIN' });
        return;
      }

      const epinDoc = snapshot.docs[0];
      res.status(200).json({ 
        success: true, 
        epinId: epinDoc.id,
        message: 'E-PIN validated successfully'
      });
      return;
    }

    // Handle other methods
    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('checkEpinHttp error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NOTE: Legacy chatbot function commented out for sync purposes
// exports.chatbotReply = httpsOnRequest(async (req, res) => { /* legacy code */ });

// ============================
// CHATBOT MESSAGE HANDLER (MODULAR)
// ============================
// Exported from functions/chatbot/handleChatbotMessage.js
exports.handleChatbotMessage = handleChatbotMessage;
