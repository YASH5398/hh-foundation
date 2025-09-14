// Test script to create a sample notification
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account key
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-admin-setup/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.log('Please ensure serviceAccountKey.json is properly configured in firebase-admin-setup folder');
    process.exit(1);
  }
}

const db = admin.firestore();

async function createTestNotification() {
  try {
    // Get a sample user ID from the users collection
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database. Please create a user first.');
      return;
    }
    
    const sampleUser = usersSnapshot.docs[0];
    const userId = sampleUser.id;
    
    console.log(`📧 Creating test notification for user: ${userId}`);
    
    const testNotification = {
      uid: userId,
      userId: userId, // Include both uid and userId for compatibility
      title: 'Welcome to Helping Hands Foundation!',
      message: 'Your notification system is working perfectly. You can now receive real-time updates.',
      type: 'admin',
      isRead: false,
      sentBy: 'system',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('notifications').add(testNotification);
    console.log('✅ Test notification created successfully!');
    console.log('📄 Document ID:', docRef.id);
    console.log('👤 Target User ID:', userId);
    console.log('📋 Notification data:', {
      ...testNotification,
      timestamp: 'serverTimestamp()'
    });
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
  }
}

// Run the function
createTestNotification().then(() => {
  console.log('Test completed!');
  process.exit(0);
});