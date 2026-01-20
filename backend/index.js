const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

<<<<<<< HEAD
=======
// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary credentials
if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️ CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET not set in .env file');
} else {
  console.log('✅ Cloudinary configured successfully');
}

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
// Initialize Firebase Admin SDK
// Service account key automatically fetched from ./serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hh-foundation-default-rtdb.firebaseio.com'
});

// Firebase Project Configuration:
// Project ID: hh-foundation
// Database URL: https://hh-foundation-default-rtdb.firebaseio.com
// Service Account: firebase-adminsdk-fbsvc@hh-foundation.iam.gserviceaccount.com

const db = admin.firestore();
const messaging = admin.messaging();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

<<<<<<< HEAD
=======
// Cloudinary image upload endpoint (server-side secure upload)
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Validate Cloudinary credentials are configured
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary not configured on server' });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: 'epinScreenshots',
      resource_type: 'image',
    });

    console.log('✅ Cloudinary upload successful:', result.public_id);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
// Send chat notification endpoint
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { token, notification, data = {}, webpush } = req.body;

    if (!token || !notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, notification.title, notification.body'
      });
    }

    // Prepare notification message for chat
    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/logo192.png'
      },
      data: {
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'hh_foundation_chat'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
          tag: data.chatId || 'chat',
          actions: [
            {
              action: 'open_chat',
              title: 'Open Chat'
            },
            {
              action: 'mark_read',
              title: 'Mark as Read'
            }
          ]
        },
        fcmOptions: webpush?.fcmOptions || {
          link: '/dashboard/chat'
        }
      }
    };

    // Send the notification
    const response = await messaging.send(message);
    
    console.log('Successfully sent chat notification:', response);
    
    res.json({
      success: true,
      messageId: response,
      message: 'Chat notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending chat notification:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send chat notification'
    });
  }
});

// Send notification endpoint
app.post('/api/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data = {}, actionLink } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, title, body'
      });
    }

    // Get user's FCM token
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'No FCM token found for user'
      });
    }

    const tokenData = tokenDoc.data();
    const deviceToken = tokenData.token;

    if (!deviceToken) {
      return res.status(404).json({
        success: false,
        error: 'No device token found for user'
      });
    }

    // Prepare notification message
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: body,
        icon: '/logo192.png'
      },
      data: {
        actionLink: actionLink || '/dashboard',
        userId: userId,
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'hh_foundation_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
          actions: [
            {
              action: 'open',
              title: 'Open App'
            }
          ]
        },
        fcmOptions: {
          link: actionLink || '/dashboard'
        }
      }
    };

    // Send the notification
    const response = await messaging.send(message);
    
    console.log('Successfully sent message:', response);
    
    res.json({
      success: true,
      messageId: response,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered') {
      // Token is invalid, remove it from database
      try {
        await db.collection('fcmTokens').doc(req.body.userId).delete();
        console.log('Removed invalid token for user:', req.body.userId);
      } catch (deleteError) {
        console.error('Error removing invalid token:', deleteError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

// Send bulk notifications endpoint
app.post('/api/send-bulk-notifications', async (req, res) => {
  try {
    const { userIds, title, body, data = {}, actionLink } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userIds (array), title, body'
      });
    }

    const results = [];
    const batchSize = 500; // FCM multicast limit

    // Process in batches
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Get tokens for this batch
      const tokens = [];
      const tokenPromises = batch.map(async (userId) => {
        try {
          const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
          if (tokenDoc.exists && tokenDoc.data().token) {
            return { userId, token: tokenDoc.data().token };
          }
        } catch (error) {
          console.error(`Error getting token for user ${userId}:`, error);
        }
        return null;
      });

      const tokenResults = await Promise.all(tokenPromises);
      const validTokens = tokenResults.filter(result => result !== null);

      if (validTokens.length === 0) {
        continue;
      }

      // Prepare multicast message
      const message = {
        tokens: validTokens.map(t => t.token),
        notification: {
          title: title,
          body: body,
          icon: '/logo192.png'
        },
        data: {
          actionLink: actionLink || '/dashboard',
          timestamp: new Date().toISOString(),
          ...data
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'hh_foundation_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          notification: {
            icon: '/logo192.png',
            badge: '/logo192.png',
            requireInteraction: true
          },
          fcmOptions: {
            link: actionLink || '/dashboard'
          }
        }
      };

      // Send multicast
      const response = await messaging.sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const failedToken = validTokens[idx];
            failedTokens.push({
              userId: failedToken.userId,
              token: failedToken.token,
              error: resp.error?.code || 'Unknown error'
            });
            
            // Remove invalid tokens
            if (resp.error?.code === 'messaging/registration-token-not-registered') {
              db.collection('fcmTokens').doc(failedToken.userId).delete()
                .catch(err => console.error('Error removing invalid token:', err));
            }
          }
        });
        
        results.push({
          batch: i / batchSize + 1,
          successCount: response.successCount,
          failureCount: response.failureCount,
          failedTokens
        });
      } else {
        results.push({
          batch: i / batchSize + 1,
          successCount: response.successCount,
          failureCount: 0
        });
      }
    }

    const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
    const totalFailure = results.reduce((sum, r) => sum + r.failureCount, 0);

    res.json({
      success: true,
      totalSent: totalSuccess,
      totalFailed: totalFailure,
      batchResults: results,
      message: `Bulk notification sent to ${totalSuccess} users`
    });

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send bulk notifications'
    });
  }
});

// Get user's FCM token endpoint
app.get('/api/user/:userId/token', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'No FCM token found for user'
      });
    }

    res.json({
      success: true,
      token: tokenDoc.data().token,
      updatedAt: tokenDoc.data().updatedAt
    });

  } catch (error) {
    console.error('Error getting user token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user token'
    });
  }
});

// Delete user's FCM token endpoint
app.delete('/api/user/:userId/token', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.collection('fcmTokens').doc(userId).delete();
    
    res.json({
      success: true,
      message: 'FCM token deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user token'
    });
  }
});

// Chat endpoints

// Send chat message endpoint
app.post('/api/chat/send-message', async (req, res) => {
  try {
    const { senderId, receiverId, text, senderName } = req.body;

    if (!senderId || !receiverId || !text || !senderName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderId, receiverId, text, senderName'
      });
    }

    // Create chat ID (consistent ordering)
    const chatId = [senderId, receiverId].sort().join('_');
    
    // Create message object
    const message = {
      senderId,
      receiverId,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      readStatus: false,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Get chat document reference
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      // Create new chat document
      await chatRef.set({
        participants: [senderId, receiverId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: text,
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastSenderId: senderId,
        messages: [message]
      });
    } else {
      // Update existing chat
      await chatRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(message),
        lastMessage: text,
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastSenderId: senderId
      });
    }

    // Send push notification to receiver
    try {
      const receiverTokenDoc = await db.collection('fcmTokens').doc(receiverId).get();
      
      if (receiverTokenDoc.exists) {
        const receiverToken = receiverTokenDoc.data().token;
        
        if (receiverToken) {
          // Truncate message for notification
          const notificationText = text.length > 50 ? text.substring(0, 50) + '...' : text;
          
          const notificationMessage = {
            token: receiverToken,
            notification: {
              title: `New message from ${senderName}`,
              body: notificationText,
              icon: '/logo192.png'
            },
            data: {
              type: 'chat_message',
              chatId: chatId,
              senderId: senderId,
              senderName: senderName,
              messageId: message.id,
              timestamp: new Date().toISOString()
            },
            android: {
              notification: {
                sound: 'default',
                priority: 'high',
                channelId: 'hh_foundation_chat'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1
                }
              }
            },
            webpush: {
              notification: {
                icon: '/logo192.png',
                badge: '/logo192.png',
                requireInteraction: true,
                tag: chatId,
                actions: [
                  {
                    action: 'open_chat',
                    title: 'Reply'
                  },
                  {
                    action: 'mark_read',
                    title: 'Mark as Read'
                  }
                ]
              },
              fcmOptions: {
                link: `/dashboard/chat?chatId=${chatId}`
              }
            }
          };

          await messaging.send(notificationMessage);
          console.log('Chat notification sent to receiver:', receiverId);
        }
      }
    } catch (notificationError) {
      console.error('Error sending chat notification:', notificationError);
      // Don't fail the message send if notification fails
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      chatId: chatId,
      messageId: message.id
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

// Get chat messages endpoint
app.get('/api/chat/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, lastMessageId } = req.query;

    const chatDoc = await db.collection('chats').doc(chatId).get();
    
    if (!chatDoc.exists) {
      return res.json({
        success: true,
        messages: [],
        hasMore: false
      });
    }

    let messages = chatDoc.data().messages || [];
    
    // Sort messages by timestamp (newest first for pagination)
    messages.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp) || new Date(0);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp) || new Date(0);
      return bTime - aTime;
    });

    // Handle pagination
    if (lastMessageId) {
      const lastIndex = messages.findIndex(msg => msg.id === lastMessageId);
      if (lastIndex !== -1) {
        messages = messages.slice(lastIndex + 1);
      }
    }

    // Limit results
    const limitNum = parseInt(limit);
    const hasMore = messages.length > limitNum;
    const paginatedMessages = messages.slice(0, limitNum);

    // Reverse for chronological order (oldest first)
    paginatedMessages.reverse();

    res.json({
      success: true,
      messages: paginatedMessages,
      hasMore: hasMore
    });

  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get messages'
    });
  }
});

// Mark messages as read endpoint
app.post('/api/chat/:chatId/mark-read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    const chatData = chatDoc.data();
    const messages = chatData.messages || [];

    // Mark all messages from other users as read
    const updatedMessages = messages.map(message => {
      if (message.senderId !== userId && !message.readStatus) {
        return { ...message, readStatus: true };
      }
      return message;
    });

    await chatRef.update({
      messages: updatedMessages
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark messages as read'
    });
  }
});

// Get user's chat list endpoint
app.get('/api/user/:userId/chats', async (req, res) => {
  try {
    const { userId } = req.params;

    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageTime', 'desc')
      .get();

    const chats = [];
    
    for (const doc of chatsSnapshot.docs) {
      const chatData = doc.data();
      const messages = chatData.messages || [];
      
      // Count unread messages
      const unreadCount = messages.filter(msg => 
        msg.senderId !== userId && !msg.readStatus
      ).length;

      // Get other participant info
      const otherParticipantId = chatData.participants.find(id => id !== userId);
      
      chats.push({
        chatId: doc.id,
        otherParticipantId,
        lastMessage: chatData.lastMessage || '',
        lastMessageTime: chatData.lastMessageTime,
        lastSenderId: chatData.lastSenderId,
        unreadCount,
        participants: chatData.participants
      });
    }

    res.json({
      success: true,
      chats: chats
    });

  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get chats'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📱 FCM notification service ready`);
  console.log(`🔥 Firebase Admin SDK initialized`);
});

// Export for testing
module.exports = { app, admin, db, messaging };