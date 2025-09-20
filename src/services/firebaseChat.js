import { 
  db, 
  storage,
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
  limit,
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from '../config/firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import fcmService from './fcmService.js';

/**
 * Enhanced Firebase Chat Service for Real-time Messaging
 * Supports Send Help transactions with full WhatsApp-like features
 */
export class FirebaseChatService {
  
  /**
   * Create or get chat document ID
   * Format: ${receiverId}_${senderId}
   */
  static getChatId(receiverId, senderId) {
    return `${receiverId}_${senderId}`;
  }

  /**
   * Initialize chat document if it doesn't exist
   */
  static async initializeChat(receiverId, senderId, receiverName, senderName) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const chatRef = doc(db, 'chats', chatId);
      
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        const chatData = {
          participants: [receiverId, senderId],
          participantNames: {
            [receiverId]: receiverName,
            [senderId]: senderName
          },
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: {
            [receiverId]: 0,
            [senderId]: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(chatRef, chatData);
        console.log('✅ Chat initialized:', chatId);
      }
      
      return chatId;
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      throw error;
    }
  }

  static async sendMessage(receiverId, senderId, message, type = 'text', imageUrl = null) {
    try {
      // Generate chat ID
      const chatId = this.getChatId(receiverId, senderId);
      
      // Initialize chat if it doesn't exist
      await this.initializeChat(receiverId, senderId, 'Receiver', 'Sender');
      
      const messageData = {
        senderId,
        receiverId,
        message,
        type,
        imageUrl,
        timestamp: serverTimestamp(),
        status: 'sent',
        id: Date.now().toString()
      };

      // Add message to Firestore
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);

      // Update chat document with last message info
      await this.updateChatLastMessage(chatId, messageData);

      // Send push notification to receiver
      await this.sendPushNotification(receiverId, senderId, message, chatId);

      console.log('✅ Message sent successfully:', docRef.id);
      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update chat document with last message info
   */
  static async updateChatLastMessage(chatId, messageData) {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: messageData.message,
        lastMessageTime: messageData.timestamp,
        lastMessageSender: messageData.senderId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating chat last message:', error);
    }
  }

  /**
   * Send push notification to receiver
   */
  static async sendPushNotification(receiverId, senderId, messageText, chatId) {
    try {
      // Get sender info for notification
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      const senderName = senderDoc.exists() ? senderDoc.data().name || 'Someone' : 'Someone';

      // Import FCM service dynamically to avoid circular dependencies
      const { fcmService } = await import('./fcmService');
      
      // Send chat notification
      await fcmService.sendChatNotification(receiverId, senderName, messageText, chatId);
      
      console.log('✅ Push notification sent to:', receiverId);
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  /**
   * Subscribe to real-time messages
   */
  static subscribeToMessages(receiverId, senderId, callback) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
          });
        });
        callback(messages);
      }, (error) => {
        console.error('❌ Error listening to messages:', error);
        callback([]);
      });
    } catch (error) {
      console.error('❌ Error setting up message subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(receiverId, senderId, userId) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      // Get unread messages for this user
      const q = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('status', '!=', 'read')
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { status: 'read' });
      });
      
      // Reset unread count for this user
      const chatRef = doc(db, 'chats', chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(receiverId, senderId, userId) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        return data.unreadCount?.[userId] || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to unread count changes
   */
  static subscribeToUnreadCount(receiverId, senderId, userId, callback) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const chatRef = doc(db, 'chats', chatId);
      
      return onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const count = data.unreadCount?.[userId] || 0;
          callback(count);
        } else {
          callback(0);
        }
      }, (error) => {
        console.error('❌ Error listening to unread count:', error);
        callback(0);
      });
    } catch (error) {
      console.error('❌ Error setting up unread count subscription:', error);
      return () => {};
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  static async uploadImage(file, chatId) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const fileName = `chat_images/${chatId}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // You can emit progress events here if needed
          },
          (error) => {
            console.error('❌ Error uploading image:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('❌ Error creating upload task:', error);
        reject(error);
      }
    });
  }

  /**
   * Set typing status
   */
  static async setTypingStatus(receiverId, senderId, userId, isTyping) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const typingRef = doc(db, 'chats', chatId, 'typing', userId);
      
      if (isTyping) {
        await setDoc(typingRef, {
          isTyping: true,
          timestamp: serverTimestamp()
        });
        
        // Auto-clear typing status after 3 seconds
        setTimeout(async () => {
          await deleteDoc(typingRef);
        }, 3000);
      } else {
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error('❌ Error setting typing status:', error);
    }
  }

  /**
   * Subscribe to typing status
   */
  static subscribeToTypingStatus(receiverId, senderId, otherUserId, callback) {
    try {
      const chatId = this.getChatId(receiverId, senderId);
      const typingRef = doc(db, 'chats', chatId, 'typing', otherUserId);
      
      return onSnapshot(typingRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback(data.isTyping || false);
        } else {
          callback(false);
        }
      }, (error) => {
        console.error('❌ Error listening to typing status:', error);
        callback(false);
      });
    } catch (error) {
      console.error('❌ Error setting up typing status subscription:', error);
      return () => {};
    }
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(userId) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const chats = [];
      
      snapshot.forEach((doc) => {
        chats.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return chats;
    } catch (error) {
      console.error('❌ Error getting user chats:', error);
      return [];
    }
  }

  /**
   * Subscribe to user's chat list
   */
  static subscribeToUserChats(userId, callback) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          });
        });
        callback(chats);
      }, (error) => {
        console.error('❌ Error listening to user chats:', error);
        callback([]);
      });
    } catch (error) {
      console.error('❌ Error setting up user chats subscription:', error);
      return () => {};
    }
  }
}

// Helper function for Firestore increment (since it's not imported)
function increment(value) {
  return {
    increment: value
  };
}

export default FirebaseChatService;