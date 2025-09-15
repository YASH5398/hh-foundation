const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📱 FCM notification service ready`);
  console.log(`🔥 Firebase Admin SDK initialized`);
});

// Export for testing
module.exports = { app, admin, db, messaging };