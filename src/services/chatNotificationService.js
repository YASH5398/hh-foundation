import messagingService from '../config/firebase-messaging';

/**
 * Chat Notification Service
 * Handles sending push notifications for chat messages
 */

// Backend API endpoint for sending notifications
const NOTIFICATION_API_URL = process.env.REACT_APP_NOTIFICATION_API_URL || 'http://localhost:3001/api/notifications';

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
    // Get recipient's FCM token
    const recipientToken = await messagingService.getUserToken(recipientId);
    
    if (!recipientToken) {
      console.warn('No FCM token found for recipient:', recipientId);
      return false;
    }

    // Prepare notification payload
    const notificationPayload = {
      token: recipientToken,
      notification: {
        title: `New message from ${senderName}`,
        body: messageText.length > 100 ? `${messageText.substring(0, 100)}...` : messageText
      },
      data: {
        type: 'chat_message',
        chatId: chatId,
        senderId: senderId,
        senderName: senderName,
        messageText: messageText,
        timestamp: Date.now().toString()
      },
      webpush: {
        fcmOptions: {
          link: `/dashboard/chat?chatId=${chatId}`
        }
      }
    };

    // Send notification via backend API
    const response = await fetch(`${NOTIFICATION_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload)
    });

    if (response.ok) {
      console.log('Chat notification sent successfully');
      return true;
    } else {
      const errorData = await response.json();
      console.error('Failed to send chat notification:', errorData);
      return false;
    }
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
    const notifications = friendIds.map(async (friendId) => {
      const friendToken = await messagingService.getUserToken(friendId);
      
      if (!friendToken) return false;

      const payload = {
        token: friendToken,
        notification: {
          title: 'Friend Online',
          body: `${userName} is now online`
        },
        data: {
          type: 'user_online',
          userId: userId,
          userName: userName
        }
      };

      const response = await fetch(`${NOTIFICATION_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    });

    await Promise.all(notifications);
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
    const payload = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'test',
        timestamp: Date.now().toString()
      }
    };

    const response = await fetch(`${NOTIFICATION_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Test notification sent successfully');
      return true;
    } else {
      console.error('Failed to send test notification');
      return false;
    }
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