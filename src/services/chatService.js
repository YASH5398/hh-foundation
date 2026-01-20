import {
  db,
  auth,
  collection,
  doc,
  addDoc,
<<<<<<< HEAD
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from '../config/firebase.js';

/**
 * Unified Chat Service - Consolidated from firebaseService.js, firebaseChat.js, and old chatService.js
 * Handles all chat functionality: transaction chats, help chats, and direct user chats
 */
export class ChatService {

  /**
   * Send message to transaction chat (sendHelp/receiveHelp)
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - Transaction document ID
   * @param {string} senderId - User ID of sender
   * @param {string} text - Message text
   * @returns {Promise<Object>} Result object
   */
  static async sendTransactionMessage(transactionType, transactionId, senderId, text) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');

=======
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
      
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      const messageData = {
        senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
        read: false,
        createdAt: new Date().toISOString() // Fallback for immediate display
      };
<<<<<<< HEAD

      await addDoc(chatRef, messageData);
      return { success: true };
    } catch (error) {
      console.error('Error sending transaction message:', error);
=======
      
      await addDoc(chatRef, messageData);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      return { success: false, error: error.message };
    }
  }

  /**
<<<<<<< HEAD
   * Send message to help chat
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendHelpChatMessage({ chatId, senderUid, receiverUid, message }) {
    try {
      if (!senderUid || !receiverUid || !message) {
        throw new Error('Missing required fields');
      }

      const chatRef = doc(db, "helpChats", chatId);

      // Create chat doc if it doesn't exist
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          senderUid,
          receiverUid,
          createdAt: serverTimestamp(),
        });
      }

      // Add message
      await addDoc(collection(chatRef, "messages"), {
        senderUid,
        receiverUid,
        message,
        timestamp: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending help chat message:", error);
      throw error;
    }
  }

  /**
   * Send direct message between users
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendDirectMessage({ chatId, senderUid, receiverUid, message, senderProfileImage }) {
    try {
      if (!senderUid || !receiverUid) {
        throw new Error('Missing senderUid or receiverUid');
      }

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      // Create chat doc if it doesn't exist
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          senderUid,
          receiverUid,
          createdAt: serverTimestamp(),
        });
      }

      // Add message to messages subcollection
      await addDoc(collection(chatRef, "messages"), {
        senderUid,
        receiverUid,
        message,
        isRead: false,
        type: "text",
        timestamp: serverTimestamp(),
        senderProfileImage: senderProfileImage || '',
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    }
  }

  /**
   * Subscribe to transaction chat messages
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - Transaction document ID
   * @param {function} callback - Callback function for messages
   * @returns {function} Unsubscribe function
   */
  static subscribeToTransactionMessages(transactionType, transactionId, callback) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      const q = query(chatRef, orderBy('timestamp', 'asc'));

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      }, (error) => {
        console.error('Error listening to transaction messages:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up transaction message subscription:', error);
      return () => {};
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    }
  }

  /**
<<<<<<< HEAD
   * Subscribe to direct chat messages
   * @param {string} chatId - Chat document ID
   * @param {function} callback - Callback function for messages
   * @returns {function} Unsubscribe function
   */
  static subscribeToDirectMessages(chatId, callback) {
    try {
      if (!auth.currentUser) {
        callback([]);
        return () => {};
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
      }, (error) => {
        console.error('Error subscribing to direct messages:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up direct message subscription:', error);
      return () => {};
    }
  }

  /**
   * Mark transaction messages as read
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - Transaction document ID
   * @param {string} userId - User ID marking messages as read
   */
  static async markTransactionMessagesAsRead(transactionType, transactionId, userId) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      const q = query(chatRef, where('senderId', '!=', userId), where('read', '==', false));
      const snap = await getDocs(q);

      const batch = [];
      snap.docs.forEach((docSnap) => {
        batch.push(updateDoc(docSnap.ref, { read: true }));
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking transaction messages as read:', error);
    }
  }

  /**
   * Mark direct messages as read
   * @param {string} chatId - Chat document ID
   * @param {string} userUid - User UID marking messages as read
   */
  static async markDirectMessagesAsRead(chatId, userUid) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, where('receiverUid', '==', userUid), where('isRead', '==', false));
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        await updateDoc(docSnap.ref, { isRead: true });
      }
    } catch (error) {
      console.error('Error marking direct messages as read:', error);
    }
  }

  /**
   * Get chat reference for transaction
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - Transaction document ID
   * @returns {Object} Firestore collection reference
   */
  static getTransactionChatRef(transactionType, transactionId) {
    return collection(db, transactionType, transactionId, 'chat');
  }

  /**
   * Get chat ID for direct messaging
   * @param {string} receiverId - Receiver user ID
   * @param {string} senderId - Sender user ID
   * @returns {string} Chat ID
   */
  static getDirectChatId(receiverId, senderId) {
    return `${receiverId}_${senderId}`;
  }

  /**
   * Initialize direct chat document
   * @param {string} receiverId - Receiver user ID
   * @param {string} senderId - Sender user ID
   * @param {string} receiverName - Receiver display name
   * @param {string} senderName - Sender display name
   */
  static async initializeDirectChat(receiverId, senderId, receiverName, senderName) {
    try {
      const chatId = this.getDirectChatId(receiverId, senderId);
      const chatRef = doc(db, 'chats', chatId);

      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        const chatData = {
          participants: [receiverId, senderId],
          participantNames: {
            [receiverId]: receiverName,
            [senderId]: senderName
          },
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: null
        };

        await setDoc(chatRef, chatData);
      }

      return chatId;
    } catch (error) {
      console.error('Error initializing direct chat:', error);
      throw error;
    }
  }
}
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
