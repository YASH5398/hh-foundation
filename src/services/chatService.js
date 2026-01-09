import {
  db,
  auth,
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc
} from '../config/firebase.js';

/**
 * Chat service for handling both transaction chats and general user chats
 * Handles both subcollections under transaction documents and direct chat documents
 */
class ChatService {
  constructor() {
    this.activeListeners = new Map();
  }
  /**
   * Send a message to a transaction chat
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - The transaction document ID
   * @param {string} senderId - User ID of the sender
   * @param {string} text - Message text
   */
  static async sendMessage(transactionType, transactionId, senderId, text) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      
      const messageData = {
        senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
        read: false,
        createdAt: new Date().toISOString() // Fallback for immediate display
      };
      
      await addDoc(chatRef, messageData);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time messages for a transaction
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - The transaction document ID
   * @param {function} callback - Callback function to handle messages
   * @returns {function} Unsubscribe function
   */
  static subscribeToMessages(transactionType, transactionId, callback) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      const q = query(chatRef, orderBy('timestamp', 'asc'));
      
      return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(messages);
      }, (error) => {
        console.error('Error listening to messages:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Get the chat reference for a transaction
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - The transaction document ID
   * @returns {object} Firestore collection reference
   */
  static getChatRef(transactionType, transactionId) {
    return collection(db, transactionType, transactionId, 'chat');
  }

  // New methods for general user chats

  /**
   * Subscribe to real-time chat messages
   * @param {string} chatId - Chat document ID
   * @param {function} callback - Callback function to handle messages
   * @returns {function} Unsubscribe function
   */
  subscribeToChat(chatId, callback) {
    // Only proceed if we have authentication
    if (!auth.currentUser) {
      console.warn('ChatService: No authenticated user, skipping chat subscription');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    if (this.activeListeners.has(chatId)) {
      this.activeListeners.get(chatId)();
    }

    const chatRef = doc(db, 'chats', chatId);

    const unsubscribe = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const chatData = doc.data();
        callback(chatData.messages || []);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error listening to chat:', error);
      if (error.code === 'permission-denied') {
        console.warn('ChatService: Permission denied for chat', chatId);
      }
      callback([]);
    });

    this.activeListeners.set(chatId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from chat
   * @param {string} chatId - Chat document ID
   */
  unsubscribeFromChat(chatId) {
    if (this.activeListeners.has(chatId)) {
      this.activeListeners.get(chatId)();
      this.activeListeners.delete(chatId);
    }
  }

  /**
   * Send a message via backend API
   * @param {string} chatId - Chat document ID
   * @param {string} recipientId - Recipient user ID
   * @param {string} message - Message text
   * @returns {Promise} API response
   */
  async sendMessage(chatId, recipientId, message) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          recipientId,
          message
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param {string} chatId - Chat document ID
   * @returns {Promise} API response
   */
  async markMessagesAsRead(chatId) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark messages as read');
      }

      return result;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get user info
   * @param {string} userId - User ID
   * @returns {Promise} User data
   */
  async getUserInfo(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Generate chat ID between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Chat ID
   */
  generateChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners.clear();
  }
}

// Legacy exports for backward compatibility
export async function sendMessage(transactionType, transactionId, senderId, text) {
  return ChatService.sendMessage(transactionType, transactionId, senderId, text);
}

export function listenToMessages(transactionType, transactionId, callback) {
  return ChatService.subscribeToMessages(transactionType, transactionId, callback);
}

// Export singleton instance for general chat functionality
export const chatService = new ChatService();

// Export class for transaction chats
export { ChatService };