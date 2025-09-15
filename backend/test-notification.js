const admin = require('firebase-admin');
const path = require('path');

// Test script to verify FCM setup
async function testNotificationSystem() {
  try {
    console.log('🧪 Testing HH Foundation Push Notification System...');
    
    // Initialize Firebase Admin SDK
    // Service account key automatically fetched from ./serviceAccountKey.json
    const serviceAccount = require('./serviceAccountKey.json');
    
    console.log('✅ Service account key loaded successfully');
    console.log(`📱 Project ID: ${serviceAccount.project_id}`);
    console.log(`🔑 Client Email: ${serviceAccount.client_email}`);
    console.log(`🆔 Private Key ID: ${serviceAccount.private_key_id}`);
    
    if (serviceAccount.project_id === 'your-firebase-project-id') {
      console.log('❌ Please update serviceAccountKey.json with your actual Firebase service account key');
      console.log('📋 Steps to get your service account key:');
      console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('   2. Click "Generate new private key"');
      console.log('   3. Download the JSON file and replace serviceAccountKey.json');
      return;
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    
    const db = admin.firestore();
    const messaging = admin.messaging();
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📱 Project ID: ${serviceAccount.project_id}`);
    
    // Test Firestore connection
    console.log('🔍 Testing Firestore connection...');
    const testDoc = await db.collection('test').doc('connection').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'FCM test connection'
    });
    console.log('✅ Firestore connection successful');
    
    // Clean up test document
    await db.collection('test').doc('connection').delete();
    
    // Check for existing FCM tokens
    console.log('🔍 Checking for existing FCM tokens...');
    const tokensSnapshot = await db.collection('fcmTokens').limit(5).get();
    
    if (tokensSnapshot.empty) {
      console.log('⚠️  No FCM tokens found in database');
      console.log('💡 To test notifications:');
      console.log('   1. Start your React app');
      console.log('   2. Login as a non-admin user');
      console.log('   3. Allow notification permissions when prompted');
      console.log('   4. Run this test script again');
    } else {
      console.log(`✅ Found ${tokensSnapshot.size} FCM token(s) in database`);
      
      // Test sending a notification to the first token
      const firstToken = tokensSnapshot.docs[0];
      const tokenData = firstToken.data();
      
      console.log('📤 Sending test notification...');
      
      const message = {
        token: tokenData.token,
        notification: {
          title: '🧪 Test Notification',
          body: 'Your HH Foundation push notification system is working!',
          icon: '/logo192.png'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          actionLink: '/dashboard'
        },
        webpush: {
          notification: {
            icon: '/logo192.png',
            badge: '/logo192.png',
            requireInteraction: true
          },
          fcmOptions: {
            link: '/dashboard'
          }
        }
      };
      
      try {
        const response = await messaging.send(message);
        console.log('✅ Test notification sent successfully!');
        console.log(`📨 Message ID: ${response}`);
        console.log(`👤 Sent to user: ${firstToken.id}`);
      } catch (error) {
        if (error.code === 'messaging/registration-token-not-registered') {
          console.log('⚠️  Token is no longer valid, cleaning up...');
          await db.collection('fcmTokens').doc(firstToken.id).delete();
          console.log('🧹 Invalid token removed from database');
        } else {
          console.error('❌ Error sending test notification:', error.message);
        }
      }
    }
    
    console.log('\n🎉 Notification system test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update VAPID key in src/services/fcmService.js');
    console.log('   2. Start backend server: npm start');
    console.log('   3. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('   4. Test with your React app');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'app/invalid-credential') {
      console.log('\n💡 Fix: Update serviceAccountKey.json with valid Firebase credentials');
    } else if (error.message.includes('ENOENT')) {
      console.log('\n💡 Fix: Make sure serviceAccountKey.json exists in the backend directory');
    }
  } finally {
    // Clean up
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
    process.exit(0);
  }
}

// Run the test
testNotificationSystem();