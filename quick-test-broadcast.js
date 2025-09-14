// Quick test script for broadcast popup
// Copy and paste this into your browser console on the dashboard page

console.log('🚀 Quick Broadcast Test Starting...');

// Test 1: Check if we can access Firebase
async function quickTest() {
  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' && typeof window.db === 'undefined') {
      console.log('❌ Firebase not available in console');
      console.log('💡 Make sure you are on the dashboard page and logged in');
      return;
    }
    
    console.log('✅ Firebase available');
    
    // Get current user
    const currentUser = window.authContext?.currentUser || window.user;
    if (!currentUser?.uid) {
      console.log('❌ No user logged in');
      console.log('💡 Please log in and go to the dashboard page');
      return;
    }
    
    console.log('✅ User logged in:', currentUser.uid);
    
    // Import Firebase functions
    const { getDoc, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Check if broadcast exists
    const broadcastDoc = await getDoc(doc(db, 'broadcast', 'latest'));
    console.log('📢 Broadcast exists:', broadcastDoc.exists());
    
    if (!broadcastDoc.exists()) {
      console.log('📝 Creating test broadcast message...');
      
      await setDoc(doc(db, 'broadcast', 'latest'), {
        title: 'Hi {firstName} 👋',
        message: 'This is a test broadcast message! If you see this, the system is working.',
        timestamp: serverTimestamp(),
        targetLevels: [], // No filters = goes to all users
        statusFilter: [],
        manualUserIds: []
      });
      
      console.log('✅ Test broadcast created!');
    } else {
      console.log('📢 Broadcast already exists');
    }
    
    // Check dismissal state
    const dismissedDoc = await getDoc(doc(db, 'popupDismissed', currentUser.uid));
    const dismissedData = dismissedDoc.exists() ? dismissedDoc.data() : {};
    console.log('🗑️ Dismissal state:', dismissedData);
    
    if (dismissedData.latest === true) {
      console.log('🔄 Resetting dismissal state...');
      await setDoc(doc(db, 'popupDismissed', currentUser.uid), {
        latest: false
      }, { merge: true });
      console.log('✅ Dismissal reset!');
    }
    
    // Check user profile
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    console.log('👤 User profile exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 User data:', {
        levelStatus: userData.levelStatus,
        isActivated: userData.isActivated,
        isBlocked: userData.isBlocked,
        firstName: userData.firstName
      });
    }
    
    console.log('🎯 Test complete! Refresh the page to see the popup.');
    console.log('💡 If popup still doesn\'t show, check browser console for debug logs.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('💡 Make sure you are on the dashboard page and logged in');
  }
}

// Run the test
quickTest();

// Also provide manual commands
console.log('📝 Manual commands you can run:');
console.log('  quickTest() - Run the full test again');
console.log('  window.debugBroadcast.debugBroadcastPopup() - Detailed debug');
console.log('  window.debugBroadcast.resetDismissal() - Reset dismissal only');
console.log('  window.debugBroadcast.createTestBroadcast() - Create test message only'); 