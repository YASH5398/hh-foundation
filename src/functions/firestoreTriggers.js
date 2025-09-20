const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

// Trigger when a new message is created in any chat
exports.onMessageCreate = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const messageData = snap.data();
      const { chatId } = context.params;
      
      console.log('New message created:', messageData);
      
      // Get chat document to find participants
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) {
        console.log('Chat document not found');
        return null;
      }
      
      const chatData = chatDoc.data();
      const participants = chatData.participants || [];
      
      // Find the recipient (not the sender)
      const recipientId = participants.find(id => id !== messageData.senderId);
      
      if (!recipientId) {
        console.log('No recipient found');
        return null;
      }
      
      // Get recipient's FCM token
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      if (!recipientDoc.exists) {
        console.log('Recipient document not found');
        return null;
      }
      
      const recipientData = recipientDoc.data();
      const fcmToken = recipientData.fcmToken;
      
      if (!fcmToken) {
        console.log('Recipient has no FCM token');
        return null;
      }
      
      // Get sender's display name
      const senderDoc = await db.collection('users').doc(messageData.senderId).get();
      const senderName = senderDoc.exists ? 
        (senderDoc.data().displayName || senderDoc.data().email || 'Someone') : 
        'Someone';
      
      // Prepare notification payload
      const notificationPayload = {
        token: fcmToken,
        notification: {
          title: `New message from ${senderName}`,
          body: messageData.text || 'You have a new message',
          icon: '/icon-192x192.png'
        },
        data: {
          chatId: chatId,
          senderId: messageData.senderId,
          messageId: snap.id,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type: 'chat_message'
        },
        webpush: {
          fcm_options: {
            link: `/dashboard/chat?chatId=${chatId}`
          },
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: `chat-${chatId}`,
            renotify: true,
            actions: [
              {
                action: 'reply',
                title: 'Reply',
                icon: '/reply-icon.png'
              },
              {
                action: 'mark_read',
                title: 'Mark as Read',
                icon: '/check-icon.png'
              }
            ]
          }
        }
      };
      
      // Send the notification
      const response = await admin.messaging().send(notificationPayload);
      console.log('Successfully sent message notification:', response);
      
      // Update unread message count for recipient
      const recipientRef = db.collection('users').doc(recipientId);
      await recipientRef.update({
        [`unreadMessages.${chatId}`]: admin.firestore.FieldValue.increment(1),
        lastNotificationSent: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return response;
      
    } catch (error) {
      console.error('Error sending message notification:', error);
      return null;
    }
  });

// Trigger when a chat document is updated (for typing indicators, etc.)
exports.onChatUpdate = functions.firestore
  .document('chats/{chatId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const { chatId } = context.params;
      
      // Check if typing status changed
      if (beforeData.typing !== afterData.typing) {
        console.log('Typing status changed in chat:', chatId);
        
        // You can implement typing indicator notifications here if needed
        // For now, we'll just log it
      }
      
      return null;
    } catch (error) {
      console.error('Error handling chat update:', error);
      return null;
    }
  });

// Clean up old messages (optional - runs daily)
exports.cleanupOldMessages = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // This is a basic cleanup - you might want to implement more sophisticated logic
      console.log('Running daily cleanup of old messages...');
      
      // Add your cleanup logic here if needed
      
      return null;
    } catch (error) {
      console.error('Error in cleanup function:', error);
      return null;
    }
  });