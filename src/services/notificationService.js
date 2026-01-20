import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { createAdminNotificationData, createActivityNotificationData, cleanNotificationData } from '../utils/createNotificationData';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { requireFreshIdToken } from './authReady';
import { setNotificationRead, bulkMarkNotificationsRead, deleteNotification } from './notificationActions';

// NotificationService functions (no class)

const notificationsRef = collection(db, 'notifications');
const callCreateUserNotification = httpsCallable(functions, 'createUserNotification');

export async function createNotification(notificationData) {
  try {
    if (!notificationData.title || !notificationData.message || !notificationData.uid || !notificationData.userId) {
      throw new Error('Missing required fields: title, message, uid, userId');
    }

    // Only allow creating notifications for current user (server enforces too)
    await requireFreshIdToken();
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || notificationData.uid !== currentUid) {
      throw new Error('Not authorized to create notification for another user');
    }

    const categorizedData = categorizeNotification(notificationData);
    const cleanedData = cleanNotificationData(categorizedData);
    const { preventDuplicates, ...finalData } = cleanedData;

    const res = await callCreateUserNotification({
      targetUid: finalData.uid,
      title: finalData.title,
      message: finalData.message,
      type: finalData.type || 'system',
      eventKey: finalData.eventKey || finalData.relatedHelpId || finalData.relatedAction || `${finalData.type || 'system'}:${finalData.title}`,
      category: finalData.category,
      priority: finalData.priority,
      actionLink: finalData.actionLink,
      relatedAction: finalData.relatedAction,
      relatedHelpId: finalData.relatedHelpId,
      preventDuplicates: preventDuplicates !== false
    });

    return { success: true, id: res.data?.id, duplicate: !!res.data?.duplicate };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

function categorizeNotification(notificationData) {
    const { title = '', message = '', type = 'system' } = notificationData;
    const content = `${title} ${message}`.toLowerCase();

    // Determine category
    let category = notificationData.category || 'general';
    let priority = notificationData.priority || 'medium';

    // Payment-related notifications
    if (content.includes('payment') || content.includes('₹') || content.includes('amount') ||
        content.includes('transaction') || content.includes('transfer')) {
      category = 'payment';
      priority = content.includes('failed') || content.includes('error') ? 'high' : 'medium';
    }

    // Level and upgrade notifications
    else if (content.includes('level') || content.includes('upgrade') || content.includes('achievement')) {
      category = 'upgrade';
      priority = 'high';
    }

    // Referral notifications
    else if (content.includes('referral') || content.includes('joined') || content.includes('network')) {
      category = 'referral';
      priority = 'medium';
    }

    // Help and assignment notifications
    else if (content.includes('help') || content.includes('assignment') || content.includes('receive') ||
             content.includes('send')) {
      category = 'help';
      priority = 'high';
    }

    // E-PIN notifications
    else if (content.includes('e-pin') || content.includes('epin') || content.includes('testimonial')) {
      category = 'epin';
      priority = content.includes('approved') ? 'high' : 'medium';
    }

    // Support notifications
    else if (content.includes('support') || content.includes('ticket') || content.includes('agent')) {
      category = 'support';
      priority = 'medium';
    }

    // Security and blocked notifications
    else if (content.includes('blocked') || content.includes('security') || content.includes('suspended')) {
      category = 'security';
      priority = 'high';
    }

    // Warning and error notifications
    else if (content.includes('alert') || content.includes('warning') || content.includes('error') ||
             content.includes('failed') || content.includes('issue')) {
      category = 'warning';
      priority = 'high';
    }

    // Success notifications
    else if (content.includes('success') || content.includes('completed') || content.includes('confirmed')) {
      category = 'success';
      priority = 'medium';
    }

    // Admin notifications
    else if (type === 'admin' || content.includes('admin') || content.includes('announcement')) {
      category = 'admin';
      priority = 'medium';
    }

    // Add metadata for grouping
    const groupKey = generateGroupKey(category, notificationData.relatedAction, notificationData.relatedHelpId);
    const tags = extractTags(content);

    return {
      ...notificationData,
      category,
      priority,
      groupKey,
      tags,
      searchableContent: content
    };
  }

function generateGroupKey(category, relatedAction, relatedId) {
  const parts = [category];
  if (relatedAction) parts.push(relatedAction);
  if (relatedId) parts.push(relatedId);
  return parts.join('_').toLowerCase();
}

function extractTags(content) {
  const tags = [];
  const keywords = {
    payment: ['payment', '₹', 'amount', 'transaction', 'transfer'],
    urgent: ['urgent', 'immediate', 'asap', 'important'],
    success: ['success', 'completed', 'confirmed', 'approved'],
    error: ['error', 'failed', 'issue', 'problem']
  };
  Object.entries(keywords).forEach(([tag, words]) => {
    if (words.some(word => content.includes(word))) {
      tags.push(tag);
    }
  });
  return tags;
}

export async function getUserData(userId) {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('userId', '==', userId),
      limit(1)
    );
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) {
      return null;
    }
    const userData = snapshot.docs[0].data();
    return {
      uid: snapshot.docs[0].id,
      userId: userData.userId,
      ...userData
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}


export async function sendToAllUsers(notificationData) {
  throw new Error('sendToAllUsers is deprecated: use server-side/admin tooling');
}


export async function sendToRole(targetRole, notificationData) {
  throw new Error('sendToRole is deprecated: use server-side/admin tooling');
}

export async function createBulkNotifications(userIds, notificationData) {
  throw new Error('createBulkNotifications is deprecated: use server-side/admin tooling');
}

// Send payment request notification
export async function sendPaymentRequestNotification(senderUid, senderId, receiverName, amount, helpId) {
  try {
    const notificationData = {
      title: 'Payment Request',
      message: `${receiverName} has requested payment of ₹${amount} for help transaction ${helpId}`,
      type: 'payment',
      uid: senderUid,
      userId: senderId,
      relatedAction: 'payment_request',
      relatedHelpId: helpId,
      preventDuplicates: false
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error sending payment request notification:', error);
    throw error;
  }
}

// Subscribe to all notifications (for admin panel)
const subscribeToAllNotifications = async (onUpdate, onError) => {
  try {
    // Force token refresh before creating listener
    await auth.currentUser.getIdToken(true);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('isDeleted', '==', false),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    return onSnapshot(q,
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        onUpdate(notifications);
      },
      (error) => {
        console.error('Error in notifications listener:', error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Export the subscribe function for use in other components
export { subscribeToAllNotifications };

// Get notification categories and their descriptions
export function getNotificationCategories() {
  return {
    payment: {
      label: '💰 Payments',
      description: 'Payment confirmations, transfers, and transactions',
      color: 'green',
      priority: 'high'
    },
    upgrade: {
      label: '🎯 Upgrades',
      description: 'Level upgrades, achievements, and milestones',
      color: 'purple',
      priority: 'high'
    },
    referral: {
      label: '👥 Referrals',
      description: 'New referrals and network growth',
      color: 'blue',
      priority: 'medium'
    },
    help: {
      label: '🤝 Help',
      description: 'Help assignments and support requests',
      color: 'emerald',
      priority: 'high'
    },
    epin: {
      label: '⭐ E-PINs',
      description: 'E-PIN requests, approvals, and rewards',
      color: 'yellow',
      priority: 'medium'
    },
    support: {
      label: '🎫 Support',
      description: 'Support tickets and agent communications',
      color: 'orange',
      priority: 'medium'
    },
    security: {
      label: '🛡️ Security',
      description: 'Account security and access changes',
      color: 'red',
      priority: 'high'
    },
    warning: {
      label: '⚠️ Alerts',
      description: 'Important alerts and warnings',
      color: 'yellow',
      priority: 'high'
    },
    success: {
      label: '✅ Success',
      description: 'Successful operations and confirmations',
      color: 'green',
      priority: 'medium'
    },
    admin: {
      label: '👨‍💼 Admin',
      description: 'Administrative messages and announcements',
      color: 'indigo',
      priority: 'medium'
    },
    general: {
      label: '📢 General',
      description: 'General system notifications',
      color: 'gray',
      priority: 'low'
    }
  };
}

// Get priority levels and their descriptions
export function getPriorityLevels() {
  return {
    low: {
      label: 'Low',
      description: 'General information notifications',
      color: 'gray',
      score: 0
    },
    medium: {
      label: 'Medium',
      description: 'Important updates and information',
      color: 'blue',
      score: 10
    },
    high: {
      label: 'High',
      description: 'Critical alerts requiring immediate attention',
      color: 'red',
      score: 20
    }
  };
}

// Filter notifications by category
export function filterByCategory(notifications, category) {
  if (!category || category === 'all') return notifications;
  return notifications.filter(notification => notification.category === category);
}

// Filter notifications by priority
export function filterByPriority(notifications, minPriority = 'low') {
  const priorities = getPriorityLevels();
  const minScore = priorities[minPriority]?.score || 0;

  return notifications.filter(notification =>
    (notification.priorityScore || 0) >= minScore
  );
}

// Search notifications by content
export function searchNotifications(notifications, searchTerm) {
  if (!searchTerm) return notifications;

  const term = searchTerm.toLowerCase();
  return notifications.filter(notification =>
    notification.title?.toLowerCase().includes(term) ||
    notification.message?.toLowerCase().includes(term) ||
    notification.searchableContent?.includes(term) ||
    notification.tags?.some(tag => tag.includes(term))
  );
}

// Re-export notification action functions with expected names
export async function markAsRead(notificationId) {
  return await setNotificationRead(notificationId, true);
}

export async function markAllAsRead(userUid) {
  try {
    // Query for all unread notifications for this user
    const userNotificationsQuery = query(
      notificationsRef,
      where('uid', '==', userUid),
      where('isRead', '==', false),
      where('isDeleted', '==', false)
    );

    const snapshot = await getDocs(userNotificationsQuery);
    const unreadNotificationIds = snapshot.docs.map(doc => doc.id);

    if (unreadNotificationIds.length === 0) {
      return { success: true, updated: 0 };
    }

    return await bulkMarkNotificationsRead(unreadNotificationIds);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
}

export { deleteNotification };