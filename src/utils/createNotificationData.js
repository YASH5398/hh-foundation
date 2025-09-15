import { Timestamp } from 'firebase/firestore';

/**
 * Creates a standardized notification data object with only defined fields
 * @param {Object} params - Notification parameters
 * @param {string} params.title - Required: Notification title
 * @param {string} params.message - Required: Notification message
 * @param {string} params.type - Required: 'admin' | 'activity'
 * @param {string} params.uid - Required: Firebase UID of receiver
 * @param {string} params.userId - Required: HHF custom ID of receiver
 * @param {string} [params.priority='medium'] - 'low' | 'medium' | 'high'
 * @param {string} [params.senderName='System'] - Name of sender
 * @param {string} [params.sentBy] - 'admin' | 'system'
 * @param {boolean} [params.isRead=false] - Read status
 * @param {boolean} [params.isDeleted=false] - Deleted status
 * @param {boolean} [params.seenInUI=false] - UI seen status
 * @param {boolean} [params.dismissible=true] - Can be dismissed
 * @param {string} [params.actionLink] - Optional action link
 * @param {string} [params.iconUrl] - Optional icon URL
 * @param {string} [params.category] - Optional category
 * @param {string} [params.relatedAction] - Optional related action
 * @param {string} [params.relatedHelpId] - Optional related help ID
 * @param {string} [params.relatedUserId] - Optional related user ID
 * @param {string} [params.levelStatus] - Optional level status
 * @returns {Object} Clean notification object without undefined fields
 */
export const createNotificationData = (params) => {
  // Validate required fields
  if (!params.title || !params.message || !params.type || !params.uid || !params.userId) {
    throw new Error('Missing required notification fields: title, message, type, uid, userId');
  }

  // Validate type
  if (!['admin', 'activity'].includes(params.type)) {
    throw new Error('Invalid notification type. Must be "admin" or "activity"');
  }

  // Validate priority
  const priority = params.priority || 'medium';
  if (!['low', 'medium', 'high'].includes(priority)) {
    throw new Error('Invalid priority. Must be "low", "medium", or "high"');
  }

  // Base notification object with required fields
  const notification = {
    title: params.title,
    message: params.message,
    type: params.type,
    priority,
    uid: params.uid,
    userId: params.userId,
    senderName: params.senderName || 'System',
    sentBy: params.sentBy || (params.type === 'admin' ? 'admin' : 'system'),
    timestamp: Timestamp.now(),
    isRead: params.isRead || false,
    isDeleted: params.isDeleted || false,
    seenInUI: params.seenInUI || false,
    readAt: params.readAt || null,
    dismissible: params.dismissible !== undefined ? params.dismissible : true
  };

  // Add optional fields only if they are defined and not null/empty
  const optionalFields = [
    'actionLink',
    'iconUrl',
    'category',
    'relatedAction',
    'relatedHelpId',
    'relatedUserId',
    'levelStatus'
  ];

  optionalFields.forEach(field => {
    if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
      notification[field] = params[field];
    }
  });

  return notification;
};

/**
 * Creates notification data for admin-sent notifications
 * @param {Object} params - Admin notification parameters
 * @returns {Object} Admin notification object
 */
export const createAdminNotificationData = (params) => {
  return createNotificationData({
    ...params,
    type: 'admin',
    sentBy: 'admin',
    senderName: params.senderName || 'Admin'
  });
};

/**
 * Creates notification data for activity-generated notifications
 * @param {Object} params - Activity notification parameters
 * @returns {Object} Activity notification object
 */
export const createActivityNotificationData = (params) => {
  return createNotificationData({
    ...params,
    type: 'activity',
    sentBy: 'system',
    senderName: params.senderName || 'System'
  });
};

/**
 * Helper function to clean notification data before sending to Firestore
 * Removes any undefined, null, or empty string values
 * @param {Object} data - Notification data object
 * @returns {Object} Cleaned notification data
 */
export const cleanNotificationData = (data) => {
  const cleaned = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};