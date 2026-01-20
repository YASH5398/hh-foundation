const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest: httpsOnRequest, onCall: httpsOnCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
// const { onUserDeleted } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');

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
  // Mandatory strict checks - ALL must be satisfied
  return (
    userData?.isActivated === true &&
    userData?.isBlocked === false &&
    userData?.isReceivingHeld === false &&
    userData?.upgradeRequired === false &&
    userData?.sponsorPaymentPending === false &&
    (userData?.activeReceiveCount || 0) < getReceiveLimitForLevel(userData?.levelStatus || userData?.level)
  );
};

const receiverIneligibilityReason = (userData) => {
  if (userData?.isActivated !== true) return 'not_activated';
  if (userData?.isBlocked === true) return 'blocked';
  if (userData?.isReceivingHeld === true) return 'receiving_held';
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
    const payload = request?.data || {};

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
      throw new HttpsError('permission-denied', 'senderUid mismatch');
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
      throw new HttpsError('internal', err?.message || 'Firestore operation failed', {
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
          throw new HttpsError('internal', 'Idempotency record missing helpId');
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

      const receiverQuery = db
        .collection('users')
        .where('isActivated', '==', true)
        .where('isReceivingHeld', '==', false)
        .where('levelStatus', '==', senderLevel)
        .orderBy('referralCount', 'desc')
        .orderBy('lastReceiveAssignedAt', 'asc')
        .limit(25);

      let receiverSnap;
      try {
        receiverSnap = await tx.get(receiverQuery);
      } catch (e) {
        safeThrowInternal(e, { step: 'tx.get.receiverQuery', senderLevel });
      }

      console.log('[startHelpAssignment] receiverCandidates.count', { senderUid, senderLevel, count: receiverSnap.size });
      if (receiverSnap.empty) {
        throw new HttpsError('failed-precondition', 'No eligible receivers available');
      }

      let chosenReceiverRef = null;
      let chosenReceiver = null;
      let skippedReceivers = [];
      
      for (const docSnap of receiverSnap.docs) {
        const candidate = docSnap.data() || {};
        const candidateUid = docSnap.id;
        
        // Log candidate details for debugging
        console.log('[startHelpAssignment] evaluating.candidate', {
          uid: candidateUid,
          helpReceived: candidate?.helpReceived || 0,
          level: candidate?.levelStatus || candidate?.level || 'Star',
          isActivated: candidate?.isActivated,
          isBlocked: candidate?.isBlocked,
          isOnHold: candidate?.isOnHold,
          isReceivingHeld: candidate?.isReceivingHeld,
          helpVisibility: candidate?.helpVisibility,
          upgradeRequired: candidate?.upgradeRequired,
          sponsorPaymentPending: candidate?.sponsorPaymentPending,
          activeReceiveCount: candidate?.activeReceiveCount || 0
        });
        
        // Skip if same as sender
        if (candidateUid === senderUid) {
          skippedReceivers.push({ uid: candidateUid, reason: 'same_as_sender' });
          continue;
        }
        
        // Check basic eligibility conditions
        if (candidate?.isActivated !== true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'not_activated' });
          continue;
        }
        
        if (candidate?.isBlocked === true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'blocked' });
          continue;
        }
        
        if (candidate?.isOnHold === true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'on_hold' });
          continue;
        }
        
        if (candidate?.isReceivingHeld === true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'receiving_held' });
          continue;
        }
        
        if (candidate?.helpVisibility === false) {
          skippedReceivers.push({ uid: candidateUid, reason: 'help_visibility_false' });
          continue;
        }
        
        if (candidate?.upgradeRequired === true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'upgrade_required' });
          continue;
        }
        
        if (candidate?.sponsorPaymentPending === true) {
          skippedReceivers.push({ uid: candidateUid, reason: 'sponsor_payment_pending' });
          continue;
        }
        
        // Check receive count limit (this allows helpReceived = 0)
        const currentLevel = candidate?.levelStatus || candidate?.level || 'Star';
        const receiveLimit = getReceiveLimitForLevel(currentLevel);
        const currentReceiveCount = candidate?.activeReceiveCount || 0;
        
        if (currentReceiveCount >= receiveLimit) {
          skippedReceivers.push({ 
            uid: candidateUid, 
            reason: 'receive_limit_reached',
            currentCount: currentReceiveCount,
            limit: receiveLimit
          });
          continue;
        }
        
        // Candidate is eligible - select them
        chosenReceiverRef = docSnap.ref;
        chosenReceiver = { uid: candidateUid, ...candidate };
        
        console.log('[startHelpAssignment] receiver.selected', {
          uid: candidateUid,
          helpReceived: candidate?.helpReceived || 0,
          level: currentLevel,
          activeReceiveCount: currentReceiveCount,
          receiveLimit: receiveLimit,
          reason: 'eligible'
        });
        
        break;
      }
      
      // Log all skipped receivers for debugging
      if (skippedReceivers.length > 0) {
        console.log('[startHelpAssignment] skipped.receivers', {
          count: skippedReceivers.length,
          details: skippedReceivers
        });
      }

      if (!chosenReceiverRef || !chosenReceiver) {
        console.log('[startHelpAssignment] no.eligible.receivers', {
          totalCandidates: receiverSnap.size,
          skippedCount: skippedReceivers.length,
          skippedReasons: skippedReceivers.reduce((acc, r) => {
            acc[r.reason] = (acc[r.reason] || 0) + 1;
            return acc;
          }, {})
        });
        throw new HttpsError('failed-precondition', 'NO_ELIGIBLE_RECEIVER', {
          code: 'NO_ELIGIBLE_RECEIVER',
          totalCandidates: receiverSnap.size,
          skippedCount: skippedReceivers.length,
          skippedReasons: skippedReceivers.reduce((acc, r) => {
            acc[r.reason] = (acc[r.reason] || 0) + 1;
            return acc;
          }, {})
        });
      }

      console.log('[startHelpAssignment] final.receiver.selected', {
        senderUid,
        receiverUid: chosenReceiver.uid,
        receiverUserId: chosenReceiver.userId || null,
        helpReceived: chosenReceiver.helpReceived || 0,
        level: chosenReceiver.levelStatus || chosenReceiver.level || 'Star',
        activeReceiveCount: chosenReceiver.activeReceiveCount || 0,
        referralCount: chosenReceiver.referralCount || 0,
        lastReceiveAssignedAt: chosenReceiver.lastReceiveAssignedAt || null
      });

      const createdAtMs = Date.now();
      const helpId = buildHelpDocId({ receiverUid: chosenReceiver.uid, senderUid, createdAtMs });
      const sendHelpRef = db.collection('sendHelp').doc(helpId);
      const receiveHelpRef = db.collection('receiveHelp').doc(helpId);

      const receiverLimit = getReceiveLimitForLevel(chosenReceiver.levelStatus || chosenReceiver.level);
      const receiverActiveCount = chosenReceiver.activeReceiveCount || 0;
      if (receiverActiveCount >= receiverLimit) {
        throw new HttpsError('aborted', 'Receiver slot full');
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

        receiverUid: chosenReceiver.uid,
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

      console.log('[startHelpAssignment] docs.created', { senderUid, helpId, receiverUid: chosenReceiver.uid });
      return { alreadyExists: false, helpId };
    });

    console.log('[startHelpAssignment] success', {
      senderUid,
      senderId,
      helpId: result?.helpId || null,
      alreadyExists: result?.alreadyExists === true,
      durationMs: Date.now() - startedAtMs
    });

    return {
      success: true,
      message: result.alreadyExists ? 'Help assignment already exists' : 'Help assignment created successfully',
      data: result
    };
  } catch (err) {
    console.error('[startHelpAssignment] crash', err);
    throw new HttpsError(
      typeof err?.code === 'string' ? err.code : 'internal',
      err?.message || 'startHelpAssignment crashed',
      err?.stack || null
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
  const { helpId, utr, method, screenshotPath, screenshotContentType, screenshotSize } = request.data || {};
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

// ============================================
// 24-HOUR PAYMENT DEADLINE SYSTEM
// ============================================

/**
 * SCHEDULED FUNCTION: Check for expired payment deadlines
 * Runs every 5 minutes to process expired helps
 */
exports.checkExpiredPaymentDeadlines = onSchedule('every 5 minutes', async (event) => {
  console.log('🔍 Starting deadline check for expired payments...');

  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Query for pending helps that haven't expired yet
    const expiredHelpsQuery = db.collection('sendHelp')
      .where('status', 'in', ['assigned', 'pending', 'payment_submitted'])
      .where('deadlineExpired', '==', false);

    const snapshot = await expiredHelpsQuery.get();

    if (snapshot.empty) {
      console.log('✅ No expired helps found');
      return null;
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each expired help
    for (const doc of snapshot.docs) {
      try {
        const helpData = doc.data();
        const expiresAt = helpData.expiresAt;

        // Check if deadline has actually expired
        if (!expiresAt || expiresAt.toMillis() > now.toMillis()) {
          continue; // Not expired yet
        }

        const helpId = doc.id;
        console.log(`⏰ Processing expired help: ${helpId}, sender: ${helpData.senderUid}`);

        // Use transaction to atomically block sender and update help
        await db.runTransaction(async (transaction) => {
          // Double-check the help is still pending (race condition protection)
          const currentHelpDoc = await transaction.get(db.collection('sendHelp').doc(helpId));
          if (!currentHelpDoc.exists) return;

          const currentHelpData = currentHelpDoc.data();
          if (!['assigned', 'pending', 'payment_submitted'].includes(currentHelpData.status) || currentHelpData.deadlineExpired || currentHelpData.autoBlocked) {
            return; // Already processed or not eligible for expiry
          }

          // Update help documents to blocked status
          const blockUpdate = {
            status: 'blocked',
            deadlineExpired: true,
            autoBlocked: true,
            blockedAt: now,
            blockReason: 'Payment deadline expired - 24 hours passed without payment completion',
            updatedAt: now
          };

          transaction.update(db.collection('sendHelp').doc(helpId), blockUpdate);
          transaction.update(db.collection('receiveHelp').doc(helpId), blockUpdate);

          // Block the sender account
          transaction.update(db.collection('users').doc(helpData.senderUid), {
            isBlocked: true,
            blockReason: 'Payment not completed within 24 hours - help assignment expired',
            blockedAt: now,
            paymentBlocked: true,
            blockedBySystem: true,
            blockedHelpId: helpId
          });

          // RELEASE the receiver - clear all hold flags so they become eligible again
          transaction.update(db.collection('users').doc(helpData.receiverUid), {
            isReceivingHeld: false,
            isOnHold: false,
            updatedAt: now
          });

          console.log(`🚫 Blocked sender ${helpData.senderUid} for expired help ${helpId}`);
        });

        processedCount++;

        // Send notification to sender about being blocked
        try {
          const blockNotification = {
            title: 'Account Blocked - Payment Deadline Expired',
            message: 'Your payment deadline has expired. Your account has been temporarily blocked. Please contact support to resolve this issue.',
            type: 'warning',
            priority: 'high',
            uid: helpData.senderUid,
            userId: helpData.senderId,
            actionLink: '/support',
            category: 'block',
            relatedAction: 'deadline_expired',
            relatedHelpId: helpId,
            senderName: 'System'
          };

          await createNotification(helpData.senderUid, blockNotification);
          console.log(`📧 Block notification sent to sender ${helpData.senderUid}`);
        } catch (notificationError) {
          console.error('Error sending block notification:', notificationError);
        }

      } catch (error) {
        console.error(`❌ Error processing expired help ${doc.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Deadline check completed: ${processedCount} processed, ${errorCount} errors`);
    return { processed: processedCount, errors: errorCount };

  } catch (error) {
    console.error('❌ Error in checkExpiredPaymentDeadlines:', error);
    throw error;
  }
});

/**
 * HTTP FUNCTION: Manually trigger deadline check (for testing/admin)
 */
exports.triggerDeadlineCheck = httpsOnCall(async (request) => {
  assertAuth(request);
  console.log('🔧 Manual deadline check triggered by:', request.auth.uid);

  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredHelpsQuery = db.collection('sendHelp')
      .where('status', 'in', ['assigned', 'pending', 'payment_submitted'])
      .where('deadlineExpired', '==', false);

    const snapshot = await expiredHelpsQuery.get();
    const expiredHelps = [];

    snapshot.forEach(doc => {
      const helpData = doc.data();
      const expiresAt = helpData.expiresAt;

      if (expiresAt && expiresAt.toMillis() <= now.toMillis()) {
        expiredHelps.push({
          id: doc.id,
          senderUid: helpData.senderUid,
          senderId: helpData.senderId,
          expiresAt: expiresAt.toDate(),
          createdAt: helpData.createdAt?.toDate()
        });
      }
    });

    return {
      success: true,
      expiredHelps: expiredHelps,
      count: expiredHelps.length,
      checkedAt: now.toDate()
    };

  } catch (error) {
    console.error('Error in triggerDeadlineCheck:', error);
    throw new HttpsError('internal', 'Failed to check deadlines');
  }
});

/**
 * SCHEDULED FUNCTION: Check for expired payment deadlines and auto-block users
 * Runs every 5 minutes to process expired helps
 */
exports.checkExpiredPaymentDeadlines = onSchedule('every 5 minutes', async (event) => {
  console.log('[SCHEDULED] Starting deadline check for expired payments...');

  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Query for pending helps that haven't expired yet
    const expiredHelpsQuery = db.collection('sendHelp')
      .where('status', 'in', ['assigned', 'pending', 'payment_submitted'])
      .where('deadlineExpired', '==', false);

    const snapshot = await expiredHelpsQuery.get();

    if (snapshot.empty) {
      console.log('[SCHEDULED] ✅ No expired helps found');
      return null;
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each expired help
    for (const doc of snapshot.docs) {
      try {
        const helpData = doc.data();
        const expiresAt = helpData.expiresAt;

        // Check if deadline has actually expired
        if (!expiresAt || expiresAt.toMillis() > now.toMillis()) {
          continue; // Not expired yet
        }

        const helpId = doc.id;
        console.log(`[SCHEDULED] ⏰ Processing expired help: ${helpId}, sender: ${helpData.senderUid}`);

        // Use transaction to atomically block sender and update help
        await db.runTransaction(async (transaction) => {
          // Double-check the help is still pending (race condition protection)
          const currentHelpDoc = await transaction.get(db.collection('sendHelp').doc(helpId));
          if (!currentHelpDoc.exists) return;

          const currentHelpData = currentHelpDoc.data();
          if (!['assigned', 'pending', 'payment_submitted'].includes(currentHelpData.status) || currentHelpData.deadlineExpired || currentHelpData.autoBlocked) {
            return; // Already processed or not eligible for expiry
          }

          // Update help documents to blocked status
          const blockUpdate = {
            status: 'blocked',
            deadlineExpired: true,
            autoBlocked: true,
            blockedAt: now,
            blockReason: 'Payment deadline expired - 24 hours passed without payment completion',
            updatedAt: now
          };

          transaction.update(db.collection('sendHelp').doc(helpId), blockUpdate);
          transaction.update(db.collection('receiveHelp').doc(helpId), blockUpdate);

          // Block the sender account
          transaction.update(db.collection('users').doc(helpData.senderUid), {
            isBlocked: true,
            blockReason: 'Payment not completed within 24 hours - help assignment expired',
            blockedAt: now,
            paymentBlocked: true,
            blockedBySystem: true,
            blockedHelpId: helpId,
            updatedAt: now
          });

          // RELEASE the receiver - clear all hold flags so they become eligible again
          transaction.update(db.collection('users').doc(helpData.receiverUid), {
            isReceivingHeld: false,
            isOnHold: false,
            updatedAt: now
          });

          console.log(`[SCHEDULED] 🚫 Blocked sender ${helpData.senderUid} for expired help ${helpId}`);
        });

        processedCount++;

        // Send notification to sender about being blocked
        try {
          const blockNotification = createActivityNotificationData({
            title: 'Account Blocked - Payment Deadline Expired',
            message: 'Your payment deadline has expired. Your account has been temporarily blocked. Please contact support to resolve this issue.',
            uid: helpData.senderUid,
            userId: helpData.senderId,
            priority: 'high',
            actionLink: '/support',
            category: 'block',
            relatedAction: 'deadline_expired',
            relatedHelpId: helpId,
            senderName: 'System'
          });

          await createNotification(helpData.senderUid, blockNotification);
          console.log(`[SCHEDULED] 📧 Block notification sent to sender ${helpData.senderUid}`);
        } catch (notificationError) {
          console.error('[SCHEDULED] Error sending block notification:', notificationError);
        }

      } catch (error) {
        console.error(`[SCHEDULED] ❌ Error processing expired help ${doc.id}:`, error);
        errorCount++;
      }
    }

    console.log(`[SCHEDULED] ✅ Deadline check completed: ${processedCount} processed, ${errorCount} errors`);
    return { processed: processedCount, errors: errorCount };

  } catch (error) {
    console.error('[SCHEDULED] ❌ Error in checkExpiredPaymentDeadlines:', error);
    throw error;
  }
});

/**
 * HTTP FUNCTION: Unblock user (admin only)
 */
exports.unblockUser = httpsOnCall(async (request) => {
  assertAdmin(request);
  const { userUid, reason } = request.data || {};

  if (!userUid) {
    throw new HttpsError('invalid-argument', 'User UID is required');
  }

  try {
    const db = admin.firestore();

    let userData = null;

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userUid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      userData = userDoc.data();

      if (!userData.isBlocked) {
        throw new HttpsError('failed-precondition', 'User is not blocked');
      }

      // Unblock the user
      transaction.update(userRef, {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        paymentBlocked: false,
        blockedBySystem: false,
        unblockedAt: admin.firestore.Timestamp.now(),
        unblockedBy: request.auth.uid,
        unblockReason: reason || 'Manually unblocked by admin'
      });

      console.log(`✅ Unblocked user ${userUid} by admin ${request.auth.uid}`);
    });

    // Send notification to unblocked user
    try {
      const unblockNotification = {
        title: 'Account Unblocked',
        message: 'Your account has been unblocked. You can now continue using the platform.',
        type: 'success',
        priority: 'high',
        uid: userUid,
        userId: userData?.userId || userUid,
        actionLink: '/dashboard',
        category: 'unblock',
        relatedAction: 'admin_unblock',
        senderName: 'Admin'
      };

      await createNotification(userUid, unblockNotification);
    } catch (notificationError) {
      console.error('Error sending unblock notification:', notificationError);
    }

    return { success: true, message: 'User unblocked successfully' };

  } catch (error) {
    console.error('Error unblocking user:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to unblock user');
  }
});

/**
 * HTTP FUNCTION: Delete user completely (admin only)
 * Permanently deletes user and all associated data
 */
exports.adminDeleteUser = httpsOnCall(async (request) => {
  assertAdmin(request);
  console.log(`🗑️ Admin delete user requested by: ${request.auth.uid}`);

  const { userId } = request.data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    console.log(`🗑️ Starting deletion of user: ${userId}`);

    // Get user document to verify it exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    console.log(`🗑️ User found: ${userData.fullName} (${userData.userId})`);

    // 1. Delete all related documents in parallel
    const deletePromises = [];

    // Delete sendHelp documents
    const sendHelpQuery = db.collection('sendHelp')
      .where('senderUid', '==', userId);
    const sendHelpSnapshot = await sendHelpQuery.get();
    sendHelpSnapshot.forEach(doc => {
      console.log(`🗑️ Deleting sendHelp: ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete sendHelp documents where user is receiver
    const sendHelpReceiverQuery = db.collection('sendHelp')
      .where('receiverUid', '==', userId);
    const sendHelpReceiverSnapshot = await sendHelpReceiverQuery.get();
    sendHelpReceiverSnapshot.forEach(doc => {
      console.log(`🗑️ Deleting sendHelp (as receiver): ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete receiveHelp documents
    const receiveHelpQuery = db.collection('receiveHelp')
      .where('senderUid', '==', userId);
    const receiveHelpSnapshot = await receiveHelpQuery.get();
    receiveHelpSnapshot.forEach(doc => {
      console.log(`🗑️ Deleting receiveHelp: ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete receiveHelp documents where user is receiver
    const receiveHelpReceiverQuery = db.collection('receiveHelp')
      .where('receiverUid', '==', userId);
    const receiveHelpReceiverSnapshot = await receiveHelpReceiverQuery.get();
    receiveHelpReceiverSnapshot.forEach(doc => {
      console.log(`🗑️ Deleting receiveHelp (as receiver): ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete helpHistory documents
    const helpHistoryQuery = db.collection('helpHistory')
      .where('userId', '==', userId);
    const helpHistorySnapshot = await helpHistoryQuery.get();
    helpHistorySnapshot.forEach(doc => {
      console.log(`🗑️ Deleting helpHistory: ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete notifications
    const notificationsQuery = db.collection('notifications')
      .where('userId', '==', userId);
    const notificationsSnapshot = await notificationsQuery.get();
    notificationsSnapshot.forEach(doc => {
      console.log(`🗑️ Deleting notification: ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });

    // Delete FCM tokens
    const fcmTokenRef = db.collection('fcmTokens').doc(userId);
    deletePromises.push(fcmTokenRef.delete());

    // Delete user document
    const userRef = db.collection('users').doc(userId);
    deletePromises.push(userRef.delete());

    // Execute all deletions
    console.log(`🗑️ Executing ${deletePromises.length} delete operations...`);
    await Promise.all(deletePromises);

    // 3. Delete Firebase Auth user (this must be done by admin SDK)
    try {
      console.log(`🗑️ Deleting Firebase Auth user: ${userId}`);
      await admin.auth().deleteUser(userId);
      console.log(`✅ Firebase Auth user deleted: ${userId}`);
    } catch (authError) {
      console.error('❌ Error deleting Firebase Auth user:', authError);
      // Don't fail the entire operation if auth deletion fails
      // (user data is already deleted)
    }

    console.log(`✅ User deletion completed: ${userId}`);
    return {
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId,
      deletedUserName: userData.fullName
    };

  } catch (error) {
    console.error('❌ Error in adminDeleteUser:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to delete user completely');
  }
});

/**
 * SET ADMIN ROLE - Callable function for existing admins to grant admin role
 * Only callable by existing admins using custom auth claims
 */
exports.setAdminRole = httpsOnCall(async (request) => {
  assertAdmin(request);

  const targetUid = request.data?.uid;
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid UID is required');
  }

  try {
    // Set custom claim for admin role
    await admin.auth().setCustomUserClaims(targetUid, {
      role: 'admin'
    });

    console.log(`✅ Admin role granted to user: ${targetUid} by admin: ${request.auth.uid}`);

    return {
      success: true,
      message: `Admin role granted to user ${targetUid}`,
      uid: targetUid
    };

  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    throw new HttpsError('internal', 'Failed to set admin role');
  }
});

/**
 * REMOVE ADMIN ROLE - Callable function for admins to revoke admin role
 * Only callable by existing admins
 */
exports.removeAdminRole = httpsOnCall(async (request) => {
  assertAdmin(request);

  const targetUid = request.data?.uid;
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid UID is required');
  }

  // Prevent admin from removing their own role
  if (targetUid === request.auth.uid) {
    throw new HttpsError('permission-denied', 'Cannot remove your own admin role');
  }

  try {
    // Remove custom claim for admin role
    await admin.auth().setCustomUserClaims(targetUid, {
      role: null // Remove the role claim
    });

    console.log(`✅ Admin role revoked from user: ${targetUid} by admin: ${request.auth.uid}`);

    return {
      success: true,
      message: `Admin role revoked from user ${targetUid}`,
      uid: targetUid
    };

  } catch (error) {
    console.error('❌ Error removing admin role:', error);
    throw new HttpsError('internal', 'Failed to remove admin role');
  }
});

// ============================
// AI SUPPORT CHATBOT FUNCTIONS
// ============================

// Check E-PIN status
exports.checkEpinStatus = httpsOnCall(async (request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return { success: true, cors: true };
  }

  assertAuth(request);
  const uid = request.auth.uid;
  const { epinCode } = request.data || {};

  try {
    if (!epinCode) {
      return {
        success: false,
        message: 'E-PIN code is required',
        issue: 'missing_epin_code'
      };
    }

    // Check epins collection for the code
    const epinRef = db.collection('epins').doc(epinCode);
    const epinSnap = await epinRef.get();

    if (!epinSnap.exists) {
      return {
        success: false,
        message: 'E-PIN code does not exist',
        issue: 'epin_not_found'
      };
    }

    const epinData = epinSnap.data();

    // Check if already used
    if (epinData.isUsed) {
      return {
        success: false,
        message: `E-PIN was used on ${epinData.usedAt?.toDate()?.toLocaleDateString()} by ${epinData.usedBy}`,
        issue: 'epin_already_used'
      };
    }

    // Check if expired (assuming 1 year validity)
    const now = new Date();
    const createdAt = epinData.createdAt?.toDate();
    const oneYearLater = new Date(createdAt);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    if (now > oneYearLater) {
      return {
        success: false,
        message: 'E-PIN has expired',
        issue: 'epin_expired'
      };
    }

    return {
      success: true,
      message: 'E-PIN is valid and available',
      data: {
        value: epinData.value,
        createdAt: epinData.createdAt?.toDate(),
        expiresAt: oneYearLater
      }
    };

  } catch (error) {
    console.error('Error checking E-PIN status:', error);
    return {
      success: false,
      message: 'Unable to check E-PIN status. Please try again.',
      issue: 'system_error'
    };
  }
});

// Check Send Help Status
exports.checkSendHelpStatus = httpsOnCall(async (request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return { success: true, cors: true };
  }

  assertAuth(request);
  const uid = request.auth.uid;

  try {
    // Get user's active send help
    const sendHelpQuery = db.collection('sendHelp')
      .where('senderUid', '==', uid)
      .where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])
      .orderBy('createdAt', 'desc')
      .limit(5);

    const sendHelpSnap = await sendHelpQuery.get();
    const activeHelps = [];

    sendHelpSnap.forEach(doc => {
      const data = doc.data();
      activeHelps.push({
        id: doc.id,
        receiverName: data.receiverName,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        nextTimeoutAtMs: data.nextTimeoutAtMs
      });
    });

    // Check user status for sending
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    const canSend = !userData?.isBlocked && !userData?.isOnHold && !userData?.paymentBlocked;

    return {
      success: true,
      canSend,
      activeHelps,
      userStatus: {
        isBlocked: userData?.isBlocked || false,
        isOnHold: userData?.isOnHold || false,
        paymentBlocked: userData?.paymentBlocked || false,
        blockReason: userData?.blockReason
      }
    };

  } catch (error) {
    console.error('Error checking send help status:', error);
    return {
      success: false,
      message: 'Unable to check send help status',
      issue: 'system_error'
    };
  }
});

// Check Receive Help Status
exports.checkReceiveHelpStatus = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;

  try {
    // Get user's active receive help
    const receiveHelpQuery = db.collection('receiveHelp')
      .where('receiverUid', '==', uid)
      .where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])
      .orderBy('createdAt', 'desc')
      .limit(5);

    const receiveHelpSnap = await receiveHelpQuery.get();
    const activeHelps = [];

    receiveHelpSnap.forEach(doc => {
      const data = doc.data();
      activeHelps.push({
        id: doc.id,
        senderName: data.senderName,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        nextTimeoutAtMs: data.nextTimeoutAtMs
      });
    });

    // Check user eligibility
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    const eligibility = receiverIneligibilityReason(userData);
    const canReceive = eligibility === 'not_eligible' ? false : true;

    return {
      success: true,
      canReceive,
      ineligibilityReason: eligibility,
      activeHelps,
      userStatus: {
        level: userData?.level || userData?.levelStatus,
        activeReceiveCount: userData?.activeReceiveCount || 0,
        isReceivingHeld: userData?.isReceivingHeld || false,
        isBlocked: userData?.isBlocked || false,
        upgradeRequired: userData?.upgradeRequired || false,
        sponsorPaymentPending: userData?.sponsorPaymentPending || false
      }
    };

  } catch (error) {
    console.error('Error checking receive help status:', error);
    return {
      success: false,
      message: 'Unable to check receive help status',
      issue: 'system_error'
    };
  }
});

// Check Referral Status
exports.checkReferralStatus = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;

  try {
    // Get user's referral data
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return {
        success: false,
        message: 'User not found',
        issue: 'user_not_found'
      };
    }

    const userData = userSnap.data();

    // Get referred users
    const referredUsersQuery = db.collection('users')
      .where('sponsorId', '==', userData.userId);

    const referredUsersSnap = await referredUsersQuery.get();
    const referredUsers = [];

    referredUsersSnap.forEach(doc => {
      const data = doc.data();
      referredUsers.push({
        userId: data.userId,
        fullName: data.fullName,
        level: data.level || data.levelStatus,
        createdAt: data.createdAt?.toDate(),
        isActivated: data.isActivated
      });
    });

    return {
      success: true,
      referralLink: `https://helpinghandsfoundation.in/register?sponsor=${userData.userId}`,
      totalReferrals: referredUsers.length,
      activeReferrals: referredUsers.filter(u => u.isActivated).length,
      referredUsers,
      userData: {
        userId: userData.userId,
        referralCount: userData.referralCount || 0
      }
    };

  } catch (error) {
    console.error('Error checking referral status:', error);
    return {
      success: false,
      message: 'Unable to check referral status',
      issue: 'system_error'
    };
  }
});

// Check Upcoming Payments
exports.checkUpcomingPayments = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;

  try {
    // Get user data
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return {
        success: false,
        message: 'User not found',
        issue: 'user_not_found'
      };
    }

    const userData = userSnap.data();
    const currentLevel = userData.level || userData.levelStatus;

    // Calculate next income
    const nextIncome = getAmountByLevel(currentLevel);
    const upgradeAmount = getUpgradeAmount(currentLevel);
    const sponsorPaymentAmount = getSponsorPaymentAmount(currentLevel);

    // Check if user needs upgrade
    const needsUpgrade = userData.upgradeRequired === true;
    const sponsorPaymentPending = userData.sponsorPaymentPending === true;

    return {
      success: true,
      currentLevel,
      nextIncome,
      needsUpgrade,
      upgradeAmount,
      sponsorPaymentPending,
      sponsorPaymentAmount,
      userStatus: {
        isReceivingHeld: userData.isReceivingHeld || false,
        isBlocked: userData.isBlocked || false,
        activeReceiveCount: userData.activeReceiveCount || 0
      }
    };

  } catch (error) {
    console.error('Error checking upcoming payments:', error);
    return {
      success: false,
      message: 'Unable to check upcoming payments',
      issue: 'system_error'
    };
  }
});

// Create Support Ticket from Chatbot
exports.createSupportTicketFromChatbot = httpsOnCall(async (request) => {
  assertAuth(request);
  const uid = request.auth.uid;
  const { issueType, issueDescription, relatedData } = request.data || {};

  try {
    if (!issueType || !issueDescription) {
      throw new HttpsError('invalid-argument', 'Issue type and description are required');
    }

    // Create ticket in supportTickets collection
    const ticketRef = db.collection('supportTickets').doc();
    await ticketRef.set({
      id: ticketRef.id,
      userId: uid,
      subject: `AI Support: ${issueType}`,
      description: issueDescription,
      priority: 'medium',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'chatbot',
      relatedData: relatedData || {},
      agentId: null
    });

    return {
      success: true,
      message: 'Support ticket created successfully',
      ticketId: ticketRef.id
    };

  } catch (error) {
    console.error('Error creating support ticket:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to create support ticket');
  }
});

// ============================
// BOOTSTRAP ADMIN FUNCTION
// ============================

/**
 * BOOTSTRAP ADMIN - One-time function to create the first admin
 * This function can be called without authentication to bootstrap the first admin
 * Should be removed after the first admin is created for security
 */
exports.bootstrapFirstAdmin = httpsOnCall(async (request) => {
  const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';
  const BOOTSTRAP_SECRET = 'bootstrap-admin-2024'; // Simple secret for security
  
  const { secret } = request.data || {};
  
  // Basic security check
  if (secret !== BOOTSTRAP_SECRET) {
    throw new HttpsError('permission-denied', 'Invalid bootstrap secret');
  }

  try {
    // Check if user exists
    const userRecord = await admin.auth().getUser(TARGET_UID);
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });

    console.log(`✅ Bootstrap admin created: ${TARGET_UID}`);

    // Log this action for security
    await db.collection('adminActions').add({
      actionType: 'bootstrap_admin_created',
      targetUid: TARGET_UID,
      performedBy: 'system',
      reason: 'Initial admin bootstrap',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userEmail: userRecord.email
    });

    return {
      success: true,
      message: 'Bootstrap admin created successfully',
      uid: TARGET_UID,
      email: userRecord.email,
      note: 'User must log out and log in again for claims to take effect'
    };

  } catch (error) {
    console.error('❌ Bootstrap admin error:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Target user not found');
    }
    
    throw new HttpsError('internal', 'Failed to create bootstrap admin');
  }
});