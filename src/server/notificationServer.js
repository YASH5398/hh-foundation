const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Send notification endpoint
app.post('/api/send-notification', async (req, res) => {
  try {
    const { fcmToken, title, body, data = {} } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'FCM token is required' 
      });
    }

    const message = {
      token: fcmToken,
      notification: {
        title: title || 'New Message',
        body: body || 'You have a new message'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      webpush: {
        fcm_options: {
          link: data.chatUrl || '/dashboard/chat'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    res.json({
      success: true,
      messageId: response
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send notification to multiple tokens
app.post('/api/send-multicast-notification', async (req, res) => {
  try {
    const { fcmTokens, title, body, data = {} } = req.body;

    if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'FCM tokens array is required' 
      });
    }

    const message = {
      tokens: fcmTokens,
      notification: {
        title: title || 'New Message',
        body: body || 'You have a new message'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      webpush: {
        fcm_options: {
          link: data.chatUrl || '/dashboard/chat'
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent multicast message:', response);

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });

  } catch (error) {
    console.error('Error sending multicast message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Firebase Notification Server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Firebase Notification Server running on port ${PORT}`);
  console.log(`📱 Send notifications via POST /api/send-notification`);
  console.log(`🔥 Health check available at GET /api/health`);
});

module.exports = app;