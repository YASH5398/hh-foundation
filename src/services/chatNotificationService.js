import messagingService from '../config/firebase-messaging';

/**
 * Chat Notification Service
 * Handles sending push notifications for chat messages
 */

// Backend API endpoint was removed from frontend. Notifications are server-driven.

/**
 * Send push notification for a new chat message
 * @param {string} recipientId - The user ID of the message recipient
 * @param {string} senderId - The user ID of the message sender
 * @param {string} senderName - The name of the message sender
 * @param {string} messageText - The text content of the message
 * @param {string} chatId - The chat ID
 * @returns {Promise<boolean>} - Success status
 */
export const sendChatNotification = async (recipientId, senderId, senderName, messageText, chatId) => {
  try {
    // Client-side push sending removed. Server should send push notifications.
    return false;
  } catch (error) {
    console.error('Error sending chat notification:', error);
    return false;
  }
};

/**
 * Send notification when user comes online
 * @param {string} userId - The user ID
 * @param {string} userName - The user name
 * @param {Array} friendIds - Array of friend user IDs to notify
 */
export const sendOnlineNotification = async (userId, userName, friendIds) => {
  try {
    // Client-side push sending removed. Server should send push notifications.
    return;
  } catch (error) {
    console.error('Error sending online notifications:', error);
  }
};

/**
 * Test notification function for debugging
 * @param {string} token - FCM token to test
 * @param {string} title - Test notification title
 * @param {string} body - Test notification body
 */
export const sendTestNotification = async (token, title = 'Test Notification', body = 'This is a test message') => {
  try {
    // Client-side push sending removed. Server should send push notifications.
    return false;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

export default {
  sendChatNotification,
  sendOnlineNotification,
  sendTestNotification
};