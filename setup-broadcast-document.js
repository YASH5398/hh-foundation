// Script to create the required Firestore document for broadcast system
// Run this in the browser console on the dashboard page

console.log('🔧 Setting up broadcast document...');

async function setupBroadcastDocument() {
  try {
    // Import Firebase functions
    const { getDoc, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Check if broadcast document already exists
    const broadcastDoc = await getDoc(doc(db, 'broadcast', 'latest'));
    
    if (broadcastDoc.exists()) {
      console.log('📢 Broadcast document already exists');
      const data = broadcastDoc.data();
      console.log('📋 Current broadcast data:', data);
      
      // Ask if user wants to update it
      if (confirm('Broadcast document already exists. Do you want to update it with a test message?')) {
        await createBroadcastMessage();
      }
    } else {
      console.log('📝 Creating new broadcast document...');
      await createBroadcastMessage();
    }
    
  } catch (error) {
    console.error('❌ Error setting up broadcast document:', error);
  }
}

async function createBroadcastMessage() {
  try {
    const { setDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Create the broadcast document with all required fields
    await setDoc(doc(db, 'broadcast', 'latest'), {
      title: 'Hi {firstName} 👋',
      message: 'Welcome to the Helping Hands Foundation dashboard! This is a test broadcast message to verify the notification system is working correctly.',
      timestamp: serverTimestamp(),
      targetLevels: [], // Empty array = no level filter = goes to all users
      statusFilter: [], // Empty array = no status filter = goes to all users
      manualUserIds: [], // Empty array = no manual user filter = goes to all users
      createdAt: serverTimestamp(), // Additional timestamp field
      isActive: true // Active status
    });
    
    console.log('✅ Broadcast document created successfully!');
    console.log('📋 Document path: broadcast/latest');
    console.log('📋 Fields created:');
    console.log('  - title: "Hi {firstName} 👋"');
    console.log('  - message: Welcome message');
    console.log('  - timestamp: Server timestamp');
    console.log('  - targetLevels: [] (no level filter)');
    console.log('  - statusFilter: [] (no status filter)');
    console.log('  - manualUserIds: [] (no manual user filter)');
    console.log('  - createdAt: Server timestamp');
    console.log('  - isActive: true');
    
    console.log('🔄 Refresh the dashboard page to see the popup!');
    
  } catch (error) {
    console.error('❌ Error creating broadcast message:', error);
  }
}

// Function to clear dismissal state for current user
async function clearDismissalState() {
  try {
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get current user
    const currentUser = window.authContext?.currentUser || window.user;
    if (!currentUser?.uid) {
      console.log('❌ No user logged in');
      return;
    }
    
    // Clear dismissal state
    await setDoc(doc(db, 'popupDismissed', currentUser.uid), {
      latest: false
    }, { merge: true });
    
    console.log('✅ Dismissal state cleared for user:', currentUser.uid);
    console.log('🔄 Refresh the page to see the popup');
    
  } catch (error) {
    console.error('❌ Error clearing dismissal state:', error);
  }
}

// Function to check user profile
async function checkUserProfile() {
  try {
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get current user
    const currentUser = window.authContext?.currentUser || window.user;
    if (!currentUser?.uid) {
      console.log('❌ No user logged in');
      return;
    }
    
    // Check user profile
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User profile exists');
      console.log('📋 User data:', {
        uid: currentUser.uid,
        levelStatus: userData.levelStatus || 'Not set',
        isActivated: userData.isActivated || false,
        isBlocked: userData.isBlocked || false,
        firstName: userData.firstName || userData.fullName?.split(' ')[0] || 'Not set',
        fullName: userData.fullName || 'Not set'
      });
    } else {
      console.log('❌ User profile not found');
      console.log('💡 User profile should exist in users collection');
    }
    
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
  }
}

// Function to run complete setup
async function completeSetup() {
  console.log('🚀 Starting complete broadcast setup...');
  
  // 1. Create broadcast document
  await setupBroadcastDocument();
  
  // 2. Clear dismissal state
  await clearDismissalState();
  
  // 3. Check user profile
  await checkUserProfile();
  
  console.log('🎯 Complete setup finished!');
  console.log('📝 Next steps:');
  console.log('  1. Refresh the dashboard page');
  console.log('  2. Check browser console for debug logs');
  console.log('  3. Look for the broadcast popup');
}

// Export functions
window.setupBroadcast = {
  setupBroadcastDocument,
  createBroadcastMessage,
  clearDismissalState,
  checkUserProfile,
  completeSetup
};

// Run complete setup automatically
completeSetup();

console.log('📝 Available commands:');
console.log('  window.setupBroadcast.completeSetup() - Run full setup');
console.log('  window.setupBroadcast.setupBroadcastDocument() - Create broadcast only');
console.log('  window.setupBroadcast.clearDismissalState() - Clear dismissal only');
console.log('  window.setupBroadcast.checkUserProfile() - Check user profile only'); 