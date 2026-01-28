/**
 * Firestore Triggers for Real-time Notifications
 * Integrated with notificationTriggers.js
 * 
 * This file contains the onDocumentCreated/onDocumentUpdated triggers
 * that automatically create notifications when events occur
 */

const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const {
  notifyReceiverAssigned,
  notifySenderAssigned,
  notifyPaymentRequest,
  notifyPaymentDone,
  notifyPaymentConfirmed,
  notifyNewReferral,
  notifyLevelUpgrade,
  notifyIncomeBlocked,
  notifyIncomeUnblocked,
  notifyAdminAction
} = require('./notificationTriggers');

const db = admin.firestore();

// ============================
// SEND HELP TRIGGERS
// ============================

/**
 * TRIGGER 1: Notify receiver when assigned to a sendHelp
 * Listens to sendHelp documents
 * Fires when: status transitions to 'assigned' and receiverId is set
 */
exports.onSendHelpReceiverAssigned = onDocumentUpdated('sendHelp/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  // Only proceed if status changed to 'assigned' and receiver is set
  if (before.status === after.status || after.status !== 'assigned' || !after.receiverId) {
    return;
  }

  try {
    // Fetch sender and receiver details
    const [senderSnap, receiverSnap] = await Promise.all([
      db.collection('users').doc(after.senderId).get(),
      db.collection('users').doc(after.receiverId).get()
    ]);

    if (!senderSnap.exists || !receiverSnap.exists) {
      console.warn('❌ Sender or receiver not found for sendHelp:', change.data.after.id);
      return;
    }

    const senderData = senderSnap.data();
    const receiverData = receiverSnap.data();

    // EVENT 1: Notify receiver
    await notifyReceiverAssigned({
      sendHelpId: change.data.after.id,
      senderId: after.senderId,
      senderName: senderData.fullName || senderData.name || 'Unknown',
      receiverId: after.receiverId,
      receiverName: receiverData.fullName || receiverData.name || 'Unknown',
      amount: after.amount,
      level: after.level || senderData.level || 'Star'
    });

    console.log('✅ Receiver assigned notification sent for sendHelp:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onSendHelpReceiverAssigned:', error);
  }
});

/**
 * TRIGGER 3: Notify receiver when payment is requested
 * Fires when: status transitions to 'payment_requested'
 */
exports.onSendHelpPaymentRequested = onDocumentUpdated('sendHelp/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  if (before.status === after.status || after.status !== 'payment_requested') {
    return;
  }

  try {
    const [senderSnap, receiverSnap] = await Promise.all([
      db.collection('users').doc(after.senderId).get(),
      db.collection('users').doc(after.receiverId).get()
    ]);

    if (!senderSnap.exists || !receiverSnap.exists) return;

    const senderData = senderSnap.data();

    // EVENT 3: Notify receiver that payment is requested
    await notifyPaymentRequest({
      sendHelpId: change.data.after.id,
      senderId: after.senderId,
      senderName: senderData.fullName || senderData.name || 'Unknown',
      receiverId: after.receiverId,
      amount: after.amount
    });

    console.log('✅ Payment request notification sent for sendHelp:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onSendHelpPaymentRequested:', error);
  }
});

/**
 * TRIGGER 4: Notify receiver when sender marks payment as done
 * Fires when: status transitions to 'payment_done'
 */
exports.onSendHelpPaymentDone = onDocumentUpdated('sendHelp/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  if (before.status === after.status || after.status !== 'payment_done') {
    return;
  }

  try {
    const [senderSnap, receiverSnap] = await Promise.all([
      db.collection('users').doc(after.senderId).get(),
      db.collection('users').doc(after.receiverId).get()
    ]);

    if (!senderSnap.exists || !receiverSnap.exists) return;

    const senderData = senderSnap.data();
    const receiverData = receiverSnap.data();

    // EVENT 4: Notify receiver that payment is marked done
    await notifyPaymentDone({
      sendHelpId: change.data.after.id,
      senderName: senderData.fullName || senderData.name || 'Unknown',
      receiverId: after.receiverId,
      receiverName: receiverData.fullName || receiverData.name || 'Unknown',
      amount: after.amount
    });

    console.log('✅ Payment done notification sent for sendHelp:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onSendHelpPaymentDone:', error);
  }
});

/**
 * TRIGGER 5: Notify sender when receiver confirms payment
 * Fires when: status transitions to 'confirmed' or 'force_confirmed'
 */
exports.onSendHelpPaymentConfirmed = onDocumentUpdated('sendHelp/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  const isConfirmed = (after.status === 'confirmed' || after.status === 'force_confirmed') 
    && (before.status !== 'confirmed' && before.status !== 'force_confirmed');

  if (!isConfirmed) {
    return;
  }

  try {
    const [senderSnap, receiverSnap] = await Promise.all([
      db.collection('users').doc(after.senderId).get(),
      db.collection('users').doc(after.receiverId).get()
    ]);

    if (!senderSnap.exists || !receiverSnap.exists) return;

    const receiverData = receiverSnap.data();

    // EVENT 5: Notify sender that payment is confirmed
    await notifyPaymentConfirmed({
      sendHelpId: change.data.after.id,
      senderId: after.senderId,
      senderName: senderSnap.data().fullName || senderSnap.data().name || 'Unknown',
      receiverId: after.receiverId,
      receiverName: receiverData.fullName || receiverData.name || 'Unknown',
      amount: after.amount
    });

    console.log('✅ Payment confirmed notification sent for sendHelp:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onSendHelpPaymentConfirmed:', error);
  }
});

// ============================
// RECEIVE HELP TRIGGERS
// ============================

/**
 * TRIGGER 2: Notify receiver when sender is assigned to a receiveHelp
 * Fires when: status transitions to 'assigned' and senderId is set
 */
exports.onReceiveHelpSenderAssigned = onDocumentUpdated('receiveHelp/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  if (before.status === after.status || after.status !== 'assigned' || !after.senderId) {
    return;
  }

  try {
    const [receiverSnap, senderSnap] = await Promise.all([
      db.collection('users').doc(after.receiverUid).get(),
      db.collection('users').doc(after.senderId).get()
    ]);

    if (!receiverSnap.exists || !senderSnap.exists) return;

    const receiverData = receiverSnap.data();
    const senderData = senderSnap.data();

    // EVENT 2: Notify receiver that sender is assigned
    await notifySenderAssigned({
      receiveHelpId: change.data.after.id,
      receiverId: after.receiverUid,
      receiverName: receiverData.fullName || receiverData.name || 'Unknown',
      senderId: after.senderId,
      senderName: senderData.fullName || senderData.name || 'Unknown',
      amount: after.amount,
      level: senderData.level || 'Star'
    });

    console.log('✅ Sender assigned notification sent for receiveHelp:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onReceiveHelpSenderAssigned:', error);
  }
});

// ============================
// USER TRIGGERS (Referral, Level, Income, Admin)
// ============================

/**
 * TRIGGER 6: Notify user when new referral joins
 * Listens for users being added/updated with referrer info
 */
exports.onNewReferralJoined = onDocumentCreated('users/{docId}', async (snap) => {
  const userData = snap.data();

  // Only process if referrer info exists
  if (!userData.referrerId || !userData.referredBy) {
    return;
  }

  try {
    const referrerSnap = await db.collection('users').doc(userData.referrerId).get();
    if (!referrerSnap.exists) return;

    const referrerData = referrerSnap.data();

    // EVENT 6: Notify referrer about new member
    await notifyNewReferral({
      userId: userData.referrerId,
      referredUserId: snap.id,
      referredName: userData.fullName || userData.name || 'New Member',
      referralCode: userData.referredBy
    });

    console.log('✅ New referral notification sent for referrer:', userData.referrerId);
  } catch (error) {
    console.error('❌ Error in onNewReferralJoined:', error);
  }
});

/**
 * TRIGGER 7: Notify user when level is upgraded
 * Fires when: user.level changes to a higher level
 */
exports.onUserLevelUpgraded = onDocumentUpdated('users/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  const levelOrder = { Star: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5 };
  const beforeLevel = levelOrder[before.level] || 0;
  const afterLevel = levelOrder[after.level] || 0;

  // Only notify on upgrade
  if (afterLevel <= beforeLevel) {
    return;
  }

  try {
    const levelBenefits = {
      Silver: 5000,
      Gold: 15000,
      Platinum: 45000,
      Diamond: 135000
    };

    // EVENT 7: Notify user about level upgrade
    await notifyLevelUpgrade({
      userId: change.data.after.id,
      userName: after.fullName || after.name || 'User',
      newLevel: after.level,
      previousLevel: before.level,
      benefitAmount: levelBenefits[after.level] || 0
    });

    console.log('✅ Level upgrade notification sent for user:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onUserLevelUpgraded:', error);
  }
});

/**
 * TRIGGER 8: Notify user when income is blocked
 * Fires when: isIncomeBlocked flag is set to true
 */
exports.onUserIncomeBlocked = onDocumentUpdated('users/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  // Only trigger when income becomes blocked (wasn't before)
  if (before.isIncomeBlocked === true || after.isIncomeBlocked !== true) {
    return;
  }

  try {
    // EVENT 8: Notify user about income block
    await notifyIncomeBlocked({
      userId: change.data.after.id,
      blockReason: after.incomeBlockReason || 'unknown',
      requiredAmount: after.incomeBlockRequiredAmount || null,
      blockType: after.incomeBlockType || 'general'
    });

    console.log('✅ Income blocked notification sent for user:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onUserIncomeBlocked:', error);
  }
});

/**
 * TRIGGER 9: Notify user when income is unblocked
 * Fires when: isIncomeBlocked flag is set to false after being true
 */
exports.onUserIncomeUnblocked = onDocumentUpdated('users/{docId}', async (change) => {
  const before = change.data.before.data();
  const after = change.data.after.data();

  // Only trigger when income becomes unblocked (was blocked before)
  if (before.isIncomeBlocked !== true || after.isIncomeBlocked !== false) {
    return;
  }

  try {
    // EVENT 9: Notify user about income unblock
    await notifyIncomeUnblocked({
      userId: change.data.after.id,
      previousBlockReason: before.incomeBlockReason || 'unknown',
      paidAmount: after.incomeUnblockPaymentAmount || 0
    });

    console.log('✅ Income unblocked notification sent for user:', change.data.after.id);
  } catch (error) {
    console.error('❌ Error in onUserIncomeUnblocked:', error);
  }
});

/**
 * TRIGGER 10: Notify user when admin performs action
 * Listens to adminActions collection
 * Should be called explicitly by admin endpoints
 */
exports.onAdminActionCreated = onDocumentCreated('adminActions/{docId}', async (snap) => {
  const actionData = snap.data();

  // Validate required fields
  if (!actionData.targetUserId || !actionData.action) {
    console.warn('❌ Invalid admin action data:', snap.id);
    return;
  }

  try {
    const adminSnap = await db.collection('users').doc(actionData.adminId || 'system').get();
    const adminName = adminSnap.exists ? (adminSnap.data().fullName || 'Admin') : 'Admin';

    // EVENT 10: Notify affected user about admin action
    await notifyAdminAction({
      userId: actionData.targetUserId,
      adminId: actionData.adminId || 'system',
      adminName: adminName,
      action: actionData.action,
      reason: actionData.reason || '',
      affectedFields: actionData.affectedFields || []
    });

    console.log('✅ Admin action notification sent for user:', actionData.targetUserId);
  } catch (error) {
    console.error('❌ Error in onAdminActionCreated:', error);
  }
});

module.exports = {};
