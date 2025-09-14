// Test script to verify broadcast system
// Run this in browser console on the dashboard page

console.log('🔍 Testing Broadcast System...');

// Test 1: Check if broadcast message exists
async function testBroadcastMessage() {
  try {
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { db } = await import('./src/config/firebase.js');
    
    const broadcastDoc = await getDoc(doc(db, 'broadcast', 'latest'));
    console.log('📢 Broadcast message exists:', broadcastDoc.exists());
    
    if (broadcastDoc.exists()) {
      const data = broadcastDoc.data();
      console.log('📋 Broadcast data:', data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Error checking broadcast:', error);
    return null;
  }
}

// Test 2: Check user eligibility
async function testUserEligibility(userUid) {
  try {
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { db } = await import('./src/config/firebase.js');
    
    const userDoc = await getDoc(doc(db, 'users', userUid));
    console.log('👤 User exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('📋 User data:', userData);
      return userData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error checking user:', error);
    return null;
  }
}

// Test 3: Check dismissal state
async function testDismissalState(userUid) {
  try {
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { db } = await import('./src/config/firebase.js');
    
    const dismissedDoc = await getDoc(doc(db, 'popupDismissed', userUid));
    console.log('🗑️ Dismissal state exists:', dismissedDoc.exists());
    
    if (dismissedDoc.exists()) {
      const dismissedData = dismissedDoc.data();
      console.log('📋 Dismissal data:', dismissedData);
      return dismissedData;
    }
    return {};
  } catch (error) {
    console.error('❌ Error checking dismissal:', error);
    return {};
  }
}

// Test 4: Reset dismissal state (for testing)
async function resetDismissalState(userUid) {
  try {
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { db } = await import('./src/config/firebase.js');
    
    await setDoc(doc(db, 'popupDismissed', userUid), {
      latest: false
    }, { merge: true });
    
    console.log('✅ Dismissal state reset for user:', userUid);
  } catch (error) {
    console.error('❌ Error resetting dismissal:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running broadcast system tests...');
  
  // Get current user UID (you'll need to replace this with actual user UID)
  const userUid = 'YOUR_USER_UID_HERE'; // Replace with actual UID
  
  const broadcastData = await testBroadcastMessage();
  const userData = await testUserEligibility(userUid);
  const dismissalData = await testDismissalState(userUid);
  
  console.log('📊 Test Results:');
  console.log('- Broadcast exists:', !!broadcastData);
  console.log('- User exists:', !!userData);
  console.log('- User dismissed:', dismissalData.latest === true);
  
  if (broadcastData && userData) {
    // Check eligibility logic
    let isEligible = true;
    
    if (broadcastData.targetLevels && broadcastData.targetLevels.length > 0) {
      isEligible = isEligible && broadcastData.targetLevels.includes(userData.levelStatus);
    }
    
    if (broadcastData.statusFilter && broadcastData.statusFilter.length > 0) {
      const userStatus = userData.isActivated ? 'active' : 'inactive';
      isEligible = isEligible && broadcastData.statusFilter.includes(userStatus);
    }
    
    if (broadcastData.manualUserIds && broadcastData.manualUserIds.length > 0) {
      isEligible = isEligible && broadcastData.manualUserIds.includes(userUid);
    }
    
    const hasFilters = (broadcastData.targetLevels && broadcastData.targetLevels.length > 0) ||
                      (broadcastData.statusFilter && broadcastData.statusFilter.length > 0) ||
                      (broadcastData.manualUserIds && broadcastData.manualUserIds.length > 0);
    
    if (!hasFilters) {
      isEligible = true;
    }
    
    if (userData.isBlocked) {
      isEligible = false;
    }
    
    console.log('- User eligible:', isEligible);
    console.log('- Should show popup:', isEligible && dismissalData.latest !== true);
  }
}

// Export functions for manual testing
window.testBroadcastSystem = {
  testBroadcastMessage,
  testUserEligibility,
  testDismissalState,
  resetDismissalState,
  runAllTests
};

console.log('✅ Test functions loaded. Run window.testBroadcastSystem.runAllTests() to test the system.'); 