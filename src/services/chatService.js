import {
  db,
  auth,
  collection,
  doc,
  addDoc,
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
      console.error('Error sending transaction message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
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
    }
  }

  /**
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