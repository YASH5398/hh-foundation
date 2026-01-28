/**
 * Notification Triggers Service
 * Centralized handler for all user activity notifications
 * Ensures no duplicates and consistent notification structure
 * 
 * Events:
 * 1. New receiver assigned in Send Help
 * 2. New sender assigned in Receive Help
 * 3. Payment request created
 * 4. Payment marked as "Payment Done" by sender
 * 5. Payment confirmed by receiver
 * 6. New referral joined under the user
 * 7. User level upgrade completed
 * 8. Income blocked due to pending upgrade or sponsor payment
 * 9. Income unblocked after required payment
 * 10. Admin action affecting user (block, unblock, hold, release)
 */

const admin = require('firebase-admin');
const db = admin.firestore();

// ============================
// NOTIFICATION BUILDER UTILITIES
// ============================

/**
 * Build unique notification ID to prevent duplicates
 * Uses event type + related ID + timestamp precision to ensure uniqueness
 */
const buildNotificationId = ({ userId, eventType, relatedId, action, timestamp }) => {
  // Format: userId_eventType_relatedId_action_timestamp
  // Allows idempotent creation (same inputs = same ID)
  const ts = Math.floor(timestamp / 1000); // Second precision
  return `${userId}_${eventType}_${relatedId}_${action}_${ts}`
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .substring(0, 100); // Firestore doc ID limit
};

/**
 * Create notification in Firestore with deduplication
 */
const createNotification = async ({
  userId,
  title,
  message,
  type,
  relatedId,
  data = {},
  priority = 'normal'
}) => {
  if (!userId || !title || !message || !type) {
    console.warn('❌ Invalid notification parameters', {
      userId,
      title,
      message,
      type
    });
    return null;
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const notificationId = buildNotificationId({
      userId,
      eventType: type,
      relatedId: relatedId || 'system',
      action: data.action || 'created',
      timestamp: Date.now()
    });

    const notificationRef = db.collection('notifications').doc(notificationId);
    
    // Use set with merge to handle race conditions
    await notificationRef.set({
      userId,
      title,
      message,
      type,
      relatedId: relatedId || null,
      isRead: false,
      priority,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: data || {}
    }, { merge: true });

    console.log('✅ Notification created:', {
      notificationId,
      userId,
      type,
      relatedId
    });

    return notificationId;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

// ============================
// SEND HELP NOTIFICATIONS
// ============================

/**
 * EVENT 1: New receiver assigned in Send Help
 * Trigger: When sendHelp.status changes from 'pending' to 'assigned'
 */
const notifyReceiverAssigned = async ({ sendHelpId, senderId, senderName, receiverId, receiverName, amount, level }) => {
  return createNotification({
    userId: receiverId,
    title: '📩 Help Assigned to You',
    message: `${senderName} needs ${level} level help for ₹${amount}. Please request payment when ready.`,
    type: 'send_help',
    relatedId: sendHelpId,
    data: {
      action: 'assigned',
      senderId,
      senderName,
      amount,
      level,
      relatedDocType: 'sendHelp'
    },
    priority: 'high'
  });
};

/**
 * EVENT 3 & 4: Payment request created / Payment marked as "Payment Done"
 */
const notifyPaymentRequest = async ({ sendHelpId, senderId, senderName, receiverId, amount }) => {
  // Notify receiver that payment has been requested
  return createNotification({
    userId: receiverId,
    title: '💳 Payment Request Received',
    message: `${senderName} requested ₹${amount} payment for help. Status: Payment Requested.`,
    type: 'payment',
    relatedId: sendHelpId,
    data: {
      action: 'payment_requested',
      senderId,
      senderName,
      amount,
      relatedDocType: 'sendHelp'
    },
    priority: 'high'
  });
};

const notifyPaymentDone = async ({ sendHelpId, senderName, receiverId, receiverName, amount }) => {
  // Notify receiver that payment has been marked as done by sender
  return createNotification({
    userId: receiverId,
    title: '✅ Payment Marked as Done',
    message: `${senderName} marked ₹${amount} payment as done. Please confirm receipt.`,
    type: 'payment',
    relatedId: sendHelpId,
    data: {
      action: 'payment_done',
      senderName,
      amount,
      relatedDocType: 'sendHelp'
    },
    priority: 'high'
  });
};

/**
 * EVENT 5: Payment confirmed by receiver
 */
const notifyPaymentConfirmed = async ({ sendHelpId, senderId, senderName, receiverId, receiverName, amount }) => {
  // Notify sender that payment has been confirmed by receiver
  return createNotification({
    userId: senderId,
    title: '🎉 Payment Confirmed',
    message: `${receiverName} confirmed receiving ₹${amount}. Help transaction completed successfully!`,
    type: 'payment',
    relatedId: sendHelpId,
    data: {
      action: 'payment_confirmed',
      receiverId,
      receiverName,
      amount,
      relatedDocType: 'sendHelp'
    },
    priority: 'high'
  });
};

// ============================
// RECEIVE HELP NOTIFICATIONS
// ============================

/**
 * EVENT 2: New sender assigned in Receive Help
 */
const notifySenderAssigned = async ({ receiveHelpId, receiverId, receiverName, senderId, senderName, amount, level }) => {
  return createNotification({
    userId: receiverId,
    title: '✨ Help Sender Assigned',
    message: `${senderName} (${level} level) has been assigned to send you ₹${amount} help.`,
    type: 'receive_help',
    relatedId: receiveHelpId,
    data: {
      action: 'sender_assigned',
      senderId,
      senderName,
      amount,
      level,
      relatedDocType: 'receiveHelp'
    },
    priority: 'high'
  });
};

// ============================
// REFERRAL NOTIFICATIONS
// ============================

/**
 * EVENT 6: New referral joined under the user
 */
const notifyNewReferral = async ({ userId, referredUserId, referredName, referralCode }) => {
  return createNotification({
    userId,
    title: '👥 New Referral Joined',
    message: `${referredName} joined using your referral code. You're growing your network!`,
    type: 'referral',
    relatedId: referredUserId,
    data: {
      action: 'referral_joined',
      referredUserId,
      referredName,
      referralCode,
      relatedDocType: 'user'
    },
    priority: 'normal'
  });
};

// ============================
// LEVEL & INCOME NOTIFICATIONS
// ============================

/**
 * EVENT 7: User level upgrade completed
 */
const notifyLevelUpgrade = async ({ userId, userName, newLevel, previousLevel, benefitAmount }) => {
  return createNotification({
    userId,
    title: '🚀 Level Upgraded!',
    message: `Congratulations! You've been upgraded from ${previousLevel} to ${newLevel} level. New income potential: ₹${benefitAmount}`,
    type: 'system',
    relatedId: userId,
    data: {
      action: 'level_upgraded',
      newLevel,
      previousLevel,
      benefitAmount,
      relatedDocType: 'user'
    },
    priority: 'high'
  });
};

/**
 * EVENT 8: Income blocked due to pending upgrade or sponsor payment
 */
const notifyIncomeBlocked = async ({ userId, blockReason, requiredAmount, blockType }) => {
  const reasonMessages = {
    upgrade_required: 'Your income is blocked until you complete a level upgrade payment.',
    sponsor_payment_pending: 'Your income is blocked until you complete your sponsor payment.',
    receiving_held: 'Your income is currently on hold due to system policy.',
    isBlocked: 'Your account has been blocked. Please contact support.'
  };

  const message = reasonMessages[blockReason] || 'Your income has been temporarily blocked.';

  return createNotification({
    userId,
    title: '⛔ Income Blocked',
    message: `${message}${requiredAmount ? ` Required amount: ₹${requiredAmount}` : ''}`,
    type: 'system',
    relatedId: userId,
    data: {
      action: 'income_blocked',
      blockReason,
      blockType,
      requiredAmount: requiredAmount || null,
      relatedDocType: 'user'
    },
    priority: 'high'
  });
};

/**
 * EVENT 9: Income unblocked after required payment
 */
const notifyIncomeUnblocked = async ({ userId, previousBlockReason, paidAmount }) => {
  return createNotification({
    userId,
    title: '✅ Income Unblocked',
    message: `Great news! Your income has been unblocked. You paid ₹${paidAmount} and are back to earning.`,
    type: 'system',
    relatedId: userId,
    data: {
      action: 'income_unblocked',
      previousBlockReason,
      paidAmount,
      relatedDocType: 'user'
    },
    priority: 'high'
  });
};

// ============================
// ADMIN ACTION NOTIFICATIONS
// ============================

/**
 * EVENT 10: Admin action affecting user (block, unblock, hold, release)
 */
const notifyAdminAction = async ({ userId, adminId, adminName, action, reason, affectedFields = [] }) => {
  const actionMessages = {
    block: `Your account has been blocked by admin ${adminName}. Reason: ${reason}`,
    unblock: `Your account has been unblocked by admin ${adminName}.`,
    hold: `Your help receiving has been put on hold by admin ${adminName}. Reason: ${reason}`,
    release: `Your help receiving has been released by admin ${adminName}.`,
    suspend: `Your account has been suspended by admin ${adminName}. Reason: ${reason}`,
    reinstate: `Your account has been reinstated by admin ${adminName}.`
  };

  return createNotification({
    userId,
    title: '⚠️ Admin Action',
    message: actionMessages[action] || `Admin action performed: ${action}`,
    type: 'system',
    relatedId: userId,
    data: {
      action: `admin_${action}`,
      adminId,
      adminName,
      reason: reason || null,
      affectedFields: affectedFields || [],
      relatedDocType: 'user'
    },
    priority: 'high'
  });
};

// ============================
// EXPORTS
// ============================

module.exports = {
  createNotification,
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
};
