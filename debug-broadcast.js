// Debug script for broadcast popup
// Run this in browser console on the dashboard page

console.log('🔍 Debugging Broadcast Popup...');

// Debug function to check all conditions
async function debugBroadcastPopup() {
  try {
    // Import Firebase functions
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get current user from auth context
    const currentUser = window.authContext?.currentUser || window.user;
    console.log('👤 Current user:', currentUser);
    
    if (!currentUser?.uid) {
      console.log('❌ No user logged in');
      return;
    }
    
    const userUid = currentUser.uid;
    console.log('🔑 User UID:', userUid);
    
    // 1. Check if broadcast message exists
    console.log('📢 Checking broadcast message...');
    const broadcastDoc = await getDoc(doc(db, 'broadcast', 'latest'));
    console.log('📢 Broadcast exists:', broadcastDoc.exists());
    
    if (!broadcastDoc.exists()) {
      console.log('❌ No broadcast message found in Firestore');
      return;
    }
    
    const broadcastData = broadcastDoc.data();
    console.log('📋 Broadcast data:', broadcastData);
    
    // 2. Check if user has dismissed
    console.log('🗑️ Checking dismissal state...');
    const dismissedDoc = await getDoc(doc(db, 'popupDismissed', userUid));
    const dismissedData = dismissedDoc.exists() ? dismissedDoc.data() : {};
    console.log('🗑️ Dismissal data:', dismissedData);
    
    if (dismissedData.latest === true) {
      console.log('❌ User has dismissed this message');
      return;
    }
    
    // 3. Check user profile
    console.log('👤 Checking user profile...');
    const userDoc = await getDoc(doc(db, 'users', userUid));
    console.log('👤 User profile exists:', userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log('❌ User profile not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('📋 User data:', userData);
    
    // 4. Check eligibility
    console.log('🔍 Checking eligibility...');
    let isEligible = true;
    
    // Level filter
    if (broadcastData.targetLevels && broadcastData.targetLevels.length > 0) {
      const levelMatch = broadcastData.targetLevels.includes(userData.levelStatus);
      console.log('🔍 Level check:', userData.levelStatus, 'in', broadcastData.targetLevels, '=', levelMatch);
      isEligible = isEligible && levelMatch;
    }
    
    // Status filter
    if (broadcastData.statusFilter && broadcastData.statusFilter.length > 0) {
      const userStatus = userData.isActivated ? 'active' : 'inactive';
      const statusMatch = broadcastData.statusFilter.includes(userStatus);
      console.log('🔍 Status check:', userStatus, 'in', broadcastData.statusFilter, '=', statusMatch);
      isEligible = isEligible && statusMatch;
    }
    
    // Manual user filter
    if (broadcastData.manualUserIds && broadcastData.manualUserIds.length > 0) {
      const userMatch = broadcastData.manualUserIds.includes(userUid);
      console.log('🔍 Manual user check:', userUid, 'in', broadcastData.manualUserIds, '=', userMatch);
      isEligible = isEligible && userMatch;
    }
    
    // Check if any filters are applied
    const hasFilters = (broadcastData.targetLevels && broadcastData.targetLevels.length > 0) ||
                      (broadcastData.statusFilter && broadcastData.statusFilter.length > 0) ||
                      (broadcastData.manualUserIds && broadcastData.manualUserIds.length > 0);
    
    if (!hasFilters) {
      console.log('✅ No filters applied - message goes to all users');
      isEligible = true;
    }
    
    // Check if user is blocked
    if (userData.isBlocked) {
      console.log('❌ User is blocked');
      isEligible = false;
    }
    
    console.log('🎯 Final eligibility result:', isEligible);
    
    if (isEligible) {
      console.log('✅ User should see the broadcast popup!');
      console.log('💡 If popup is not showing, check:');
      console.log('   1. Component is rendered in DashboardHome.jsx');
      console.log('   2. No CSS hiding the popup');
      console.log('   3. No JavaScript errors in console');
    } else {
      console.log('❌ User is not eligible for broadcast message');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Function to reset dismissal state for testing
async function resetDismissal() {
  try {
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const currentUser = window.authContext?.currentUser || window.user;
    if (!currentUser?.uid) {
      console.log('❌ No user logged in');
      return;
    }
    
    await setDoc(doc(db, 'popupDismissed', currentUser.uid), {
      latest: false
    }, { merge: true });
    
    console.log('✅ Dismissal state reset for user:', currentUser.uid);
    console.log('🔄 Refresh the page to see the popup');
  } catch (error) {
    console.error('❌ Error resetting dismissal:', error);
  }
}

// Function to create a test broadcast message
async function createTestBroadcast() {
  try {
    const { setDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    await setDoc(doc(db, 'broadcast', 'latest'), {
      title: 'Hi {firstName} 👋',
      message: 'Welcome to the new dashboard! This is a test broadcast message.',
      timestamp: serverTimestamp(),
      targetLevels: [], // No filters = goes to all users
      statusFilter: [],
      manualUserIds: []
    });
    
    console.log('✅ Test broadcast message created!');
    console.log('🔄 Refresh the page to see the popup');
  } catch (error) {
    console.error('❌ Error creating test broadcast:', error);
  }
}

// Export functions
window.debugBroadcast = {
  debugBroadcastPopup,
  resetDismissal,
  createTestBroadcast
};

console.log('✅ Debug functions loaded!');
console.log('📝 Run these commands:');
console.log('   window.debugBroadcast.debugBroadcastPopup() - Check why popup is not showing');
console.log('   window.debugBroadcast.resetDismissal() - Reset dismissal state');
console.log('   window.debugBroadcast.createTestBroadcast() - Create test message'); 