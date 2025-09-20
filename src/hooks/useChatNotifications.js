import { useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendChatNotification } from '../services/chatNotificationService';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to handle chat notifications
 * Listens to new messages and triggers push notifications
 */
export const useChatNotifications = () => {
  const { user } = useAuth();

  // Function to get user data from Firestore
  const getUserData = useCallback(async (userId) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // Function to get FCM token for a user
  const getUserFCMToken = useCallback(async (userId) => {
    try {
      const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
      if (tokenDoc.exists) {
        return tokenDoc.data().token;
      }
      return null;
    } catch (error) {
      console.error('Error fetching FCM token:', error);
      return null;
    }
  }, []);

  // Function to handle new message notification
  const handleNewMessage = useCallback(async (messageData) => {
    try {
      const { senderId, recipientId, text, chatId, timestamp } = messageData;
      
      // Don't send notification if current user is the sender
      if (user && senderId === user.uid) {
        return;
      }

      // Get sender information
      const senderData = await getUserData(senderId);
      if (!senderData) {
        console.error('Sender data not found');
        return;
      }

      const senderName = senderData.displayName || senderData.name || 'Unknown User';

      // Get recipient's FCM token
      const recipientToken = await getUserFCMToken(recipientId);
      if (!recipientToken) {
        console.warn('No FCM token found for recipient:', recipientId);
        return;
      }

      // Send notification
      await sendChatNotification(
        recipientId,
        senderId,
        senderName,
        text,
        chatId
      );

      console.log('Chat notification sent for message:', messageData.id);
    } catch (error) {
      console.error('Error handling new message notification:', error);
    }
  }, [user, getUserData, getUserFCMToken]);

  // Set up Firestore listener for new messages
  useEffect(() => {
    if (!user) return;

    let unsubscribe = null;

    try {
      // Listen to messages where current user is the recipient
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('recipientId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      let isFirstLoad = true;

      unsubscribe = onSnapshot(q, (snapshot) => {
        // Skip the first load to avoid sending notifications for existing messages
        if (isFirstLoad) {
          isFirstLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const messageData = {
              id: change.doc.id,
              ...change.doc.data()
            };

            // Only process messages from the last 30 seconds to avoid old messages
            const messageTime = messageData.timestamp?.toDate?.() || new Date(messageData.timestamp);
            const now = new Date();
            const timeDiff = now - messageTime;

            if (timeDiff < 30000) { // 30 seconds
              handleNewMessage(messageData);
            }
          }
        });
      }, (error) => {
        console.error('Error listening to messages:', error);
      });

    } catch (error) {
      console.error('Error setting up message listener:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, handleNewMessage]);

  // Set up listener for all chats where user is a participant
  useEffect(() => {
    if (!user) return;

    let unsubscribe = null;

    try {
      // Listen to all messages in chats where user participates
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      let isFirstLoad = true;

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (isFirstLoad) {
          isFirstLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const messageData = {
              id: change.doc.id,
              ...change.doc.data()
            };

            // Check if current user is the recipient and not the sender
            if (messageData.recipientId === user.uid && 
                messageData.senderId !== user.uid) {
              
              // Only process recent messages
              const messageTime = messageData.timestamp?.toDate?.() || new Date(messageData.timestamp);
              const now = new Date();
              const timeDiff = now - messageTime;

              if (timeDiff < 30000) { // 30 seconds
                handleNewMessage(messageData);
              }
            }
          }
        });
      }, (error) => {
        console.error('Error listening to all messages:', error);
      });

    } catch (error) {
      console.error('Error setting up global message listener:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, handleNewMessage]);

  return {
    // Expose functions that components might need
    handleNewMessage,
    getUserData,
    getUserFCMToken
  };
};

export default useChatNotifications;