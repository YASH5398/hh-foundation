// Test script to verify E-PIN request functionality
// This script can be run in the browser console to test the E-PIN request system

console.log('🧪 Testing E-PIN Request System...');

// Test 1: Check if user is authenticated
const testUserAuth = () => {
  const user = firebase.auth().currentUser;
  if (user) {
    console.log('✅ User authenticated:', user.uid);
    return user;
  } else {
    console.log('❌ User not authenticated');
    return null;
  }
};

// Test 2: Check Firestore permissions
const testFirestorePermissions = async () => {
  try {
    const db = firebase.firestore();
    const testDoc = await db.collection('epinRequests').add({
      test: true,
      timestamp: new Date(),
      uid: 'test-uid'
    });
    console.log('✅ Can create E-PIN requests');
    
    // Clean up test document
    await testDoc.delete();
    console.log('✅ Can delete E-PIN requests');
    
    return true;
  } catch (error) {
    console.log('❌ Firestore permission error:', error.message);
    return false;
  }
};

// Test 3: Check real-time listeners
const testRealTimeListeners = () => {
  const db = firebase.firestore();
  const unsubscribe = db.collection('epinRequests').onSnapshot(
    (snapshot) => {
      console.log('✅ Real-time listener working. Document count:', snapshot.size);
      unsubscribe();
    },
    (error) => {
      console.log('❌ Real-time listener error:', error.message);
    }
  );
};

// Test 4: Check admin access
const testAdminAccess = async () => {
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('epinRequests').get();
    console.log('✅ Admin can read all E-PIN requests. Count:', snapshot.size);
    return true;
  } catch (error) {
    console.log('❌ Admin access error:', error.message);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting E-PIN Request System Tests...\n');
  
  const user = testUserAuth();
  if (!user) {
    console.log('⚠️  Skipping other tests - user not authenticated');
    return;
  }
  
  await testFirestorePermissions();
  testRealTimeListeners();
  await testAdminAccess();
  
  console.log('\n🎉 E-PIN Request System Tests Complete!');
};

// Export for manual testing
window.testEpinRequests = runAllTests;
console.log('💡 Run testEpinRequests() to test the E-PIN request system'); 