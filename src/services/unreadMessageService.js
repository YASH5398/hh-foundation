import { doc, updateDoc, onSnapshot, collection, query, where, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import FirebaseChatService from './firebaseChat';

/**
 * Enhanced service to handle unread message tracking for both transaction chats and direct chats
 */
export class UnreadMessageService {
  /**
   * Mark messages as read for a specific user in a transaction
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - The transaction document ID
   * @param {string} userId - The user ID who is reading the messages
   */
  static async markMessagesAsRead(transactionType, transactionId, userId) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      const q = query(
        chatRef,
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark direct chat messages as read
   * @param {string} receiverId - The receiver user ID
   * @param {string} senderId - The sender user ID
   * @param {string} userId - The user ID who is reading the messages
   */
  static async markDirectChatMessagesAsRead(receiverId, senderId, userId) {
    try {
      return await FirebaseChatService.markMessagesAsRead(receiverId, senderId, userId);
    } catch (error) {
      console.error('Error marking direct chat messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread message count for a specific user in a transaction
   * @param {string} transactionType - 'sendHelp' or 'receiveHelp'
   * @param {string} transactionId - The transaction document ID
   * @param {string} userId - The user ID to check unread messages for
   * @param {function} callback - Callback function to receive unread count
   * @returns {function} Unsubscribe function
   */
  static subscribeToUnreadCount(transactionType, transactionId, userId, callback) {
    try {
      const chatRef = collection(db, transactionType, transactionId, 'chat');
      const q = query(
        chatRef,
        where('senderId', '!=', userId),
        where('read', '==', false),
        orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
      }, (error) => {
        console.error('Error listening to unread count:', error);
        callback(0);
      });
    } catch (error) {
      console.error('Error setting up unread count subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Get unread message count for direct chat
   * @param {string} receiverId - The receiver user ID
   * @param {string} senderId - The sender user ID
   * @param {string} userId - The user ID to check unread messages for
   * @param {function} callback - Callback function to receive unread count
   * @returns {function} Unsubscribe function
   */
  static subscribeToDirectChatUnreadCount(receiverId, senderId, userId, callback) {
    try {
      return FirebaseChatService.subscribeToUnreadCount(receiverId, senderId, userId, callback);
    } catch (error) {
      console.error('Error setting up direct chat unread count subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Get total unread messages across all transactions and direct chats for a user
   * @param {string} userId - The user ID
   * @param {function} callback - Callback function to receive total unread count
   * @returns {function} Unsubscribe function
   */
  static subscribeToTotalUnreadCount(userId, callback) {
    const unsubscribeFunctions = [];
    let transactionUnread = 0;
    let directChatUnread = 0;
    
    const updateTotal = () => {
      callback(transactionUnread + directChatUnread);
    };

    try {
      // Subscribe to transaction chat unread counts
      const transactionTypes = ['sendHelp', 'receiveHelp'];
      
      transactionTypes.forEach(transactionType => {
        const transactionRef = collection(db, transactionType);
        const q = query(
          transactionRef,
          where('participants', 'array-contains', userId)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          let typeUnreadCount = 0;
          const chatUnsubscribes = [];
          
          snapshot.forEach((transactionDoc) => {
            const chatRef = collection(db, transactionType, transactionDoc.id, 'chat');
            const chatQuery = query(
              chatRef,
              where('senderId', '!=', userId),
              where('read', '==', false)
            );
            
            const chatUnsubscribe = onSnapshot(chatQuery, (chatSnapshot) => {
              typeUnreadCount += chatSnapshot.size;
              transactionUnread = typeUnreadCount;
              updateTotal();
            });
            
            chatUnsubscribes.push(chatUnsubscribe);
          });
          
          // Clean up previous chat subscriptions
          unsubscribeFunctions.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
          });
          unsubscribeFunctions.push(...chatUnsubscribes);
        });
        
        unsubscribeFunctions.push(unsubscribe);
      });

      // Subscribe to direct chat unread counts
      const directChatUnsubscribe = FirebaseChatService.subscribeToUserChats(
        userId,
        (userChats) => {
          let totalDirectUnread = 0;
          const directUnsubscribes = [];
          
          userChats.forEach(chat => {
            const otherUserId = chat.participants.find(p => p !== userId);
            const unreadUnsubscribe = FirebaseChatService.subscribeToUnreadCount(
              otherUserId,
              userId,
              userId,
              (count) => {
                totalDirectUnread += count;
                directChatUnread = totalDirectUnread;
                updateTotal();
              }
            );
            directUnsubscribes.push(unreadUnsubscribe);
          });
          
          unsubscribeFunctions.push(...directUnsubscribes);
        }
      );
      
      unsubscribeFunctions.push(directChatUnsubscribe);
      
      return () => {
        unsubscribeFunctions.forEach(unsubscribe => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
      };
    } catch (error) {
      console.error('Error setting up total unread count subscription:', error);
      return () => {};
    }
  }

  /**
   * Get unread badge count for Send Help section
   * @param {string} userId - The user ID
   * @param {function} callback - Callback function to receive badge count
   * @returns {function} Unsubscribe function
   */
  static subscribeToSendHelpUnreadCount(userId, callback) {
    try {
      // Subscribe to direct chats unread count for Send Help section
      return FirebaseChatService.subscribeToUserChats(
        userId,
        (userChats) => {
          let totalUnread = 0;
          const unsubscribes = [];
          
          userChats.forEach(chat => {
            const otherUserId = chat.participants.find(p => p !== userId);
            const unreadUnsubscribe = FirebaseChatService.subscribeToUnreadCount(
              otherUserId,
              userId,
              userId,
              (count) => {
                totalUnread += count;
              }
            );
            unsubscribes.push(unreadUnsubscribe);
          });
          
          callback(totalUnread);
          
          // Return cleanup function
          return () => {
            unsubscribes.forEach(unsubscribe => {
              if (typeof unsubscribe === 'function') {
                unsubscribe();
              }
            });
          };
        }
      );
    } catch (error) {
      console.error('Error setting up Send Help unread count subscription:', error);
      return () => {};
    }
  }

  /**
   * Create notification badge component data
   * @param {number} count - Unread message count
   * @returns {object} Badge component props
   */
  static createBadgeData(count) {
    if (count === 0) {
      return {
        show: false,
        count: 0,
        text: ''
      };
    }
    
    return {
      show: true,
      count: count,
      text: count > 99 ? '99+' : count.toString(),
      className: 'bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center'
    };
  }
}

export default UnreadMessageService;