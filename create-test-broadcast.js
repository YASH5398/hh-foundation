// Script to create a test broadcast message
// Run this in the admin panel or use Firebase console

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestBroadcast() {
  try {
    await setDoc(doc(db, 'broadcast', 'latest'), {
      title: 'Hi {firstName} 👋',
      message: 'Welcome to the new dashboard! This is a test broadcast message to verify the popup system is working correctly.',
      timestamp: serverTimestamp(),
      targetLevels: [], // Empty array = no level filter = goes to all users
      statusFilter: [], // Empty array = no status filter = goes to all users  
      manualUserIds: [] // Empty array = no manual user filter = goes to all users
    });
    
    console.log('✅ Test broadcast message created successfully!');
    console.log('📢 Message will appear for all users on the dashboard');
    console.log('🔄 Refresh the dashboard page to see the popup');
    
  } catch (error) {
    console.error('❌ Error creating test broadcast:', error);
  }
}

// Alternative: Manual Firestore console instructions
console.log(`
📝 MANUAL FIREBASE CONSOLE INSTRUCTIONS:

1. Go to Firebase Console > Firestore Database
2. Create a new document:
   - Collection: broadcast
   - Document ID: latest
   - Fields:
     - title: "Hi {firstName} 👋"
     - message: "Welcome to the new dashboard! This is a test broadcast message."
     - timestamp: [server timestamp]
     - targetLevels: [] (empty array)
     - statusFilter: [] (empty array)
     - manualUserIds: [] (empty array)

3. Save the document
4. Go to your dashboard page and refresh
5. The popup should appear!

🔧 DEBUGGING:
- Check browser console for debug logs
- Run the debug script: window.debugBroadcast.debugBroadcastPopup()
- Reset dismissal: window.debugBroadcast.resetDismissal()
`);

// Export for use
module.exports = { createTestBroadcast }; 