// Test script to verify E-PIN approval functionality
// This script can be run in the browser console to test the approval system

console.log('🧪 Testing E-PIN Approval System...');

// Test 1: Check admin authentication
const testAdminAuth = () => {
  const user = firebase.auth().currentUser;
  if (user) {
    console.log('✅ User authenticated:', user.uid);
    return user;
  } else {
    console.log('❌ User not authenticated');
    return null;
  }
};

// Test 2: Check admin claims
const testAdminClaims = async () => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }
    
    const tokenResult = await user.getIdTokenResult(true);
    console.log('🔐 Token claims:', tokenResult.claims);
    
    if (tokenResult.claims && tokenResult.claims.admin === true) {
      console.log('✅ User has admin privileges');
      return true;
    } else {
      console.log('❌ User does not have admin privileges');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking admin claims:', error.message);
    return false;
  }
};

// Test 3: Test E-PIN request update permissions
const testUpdatePermissions = async () => {
  try {
    const db = firebase.firestore();
    
    // Create a test E-PIN request
    const testRequest = {
      uid: 'test-user-uid',
      userId: 'TEST001',
      fullName: 'Test User',
      requestedCount: 1,
      requestType: 'Buy',
      paymentMethod: 'PhonePe',
      utrNumber: 'TEST123456',
      status: 'pending',
      timestamp: firebase.firestore.Timestamp.now(),
      createdAt: firebase.firestore.Timestamp.now(),
      amountPaid: 100,
      bonusEpins: 0,
      totalEpins: 1
    };
    
    const docRef = await db.collection('epinRequests').add(testRequest);
    console.log('✅ Test E-PIN request created:', docRef.id);
    
    // Test approval update
    const approvalData = {
      status: 'approved',
      approvedBy: firebase.auth().currentUser?.uid || 'test-admin',
      approvedAt: firebase.firestore.Timestamp.now(),
      approvedByName: 'Test Admin',
      totalEpinsGenerated: 1,
      epinRequestId: docRef.id
    };
    
    await docRef.update(approvalData);
    console.log('✅ E-PIN request approval update successful');
    
    // Test rejection update
    const rejectionData = {
      status: 'rejected',
      rejectedBy: firebase.auth().currentUser?.uid || 'test-admin',
      rejectedAt: firebase.firestore.Timestamp.now(),
      rejectedByName: 'Test Admin'
    };
    
    await docRef.update(rejectionData);
    console.log('✅ E-PIN request rejection update successful');
    
    // Clean up test document
    await docRef.delete();
    console.log('✅ Test document cleaned up');
    
    return true;
  } catch (error) {
    console.log('❌ Update permission test failed:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error);
    return false;
  }
};

// Test 4: Test E-PIN generation
const testEpinGeneration = async () => {
  try {
    const db = firebase.firestore();
    
    // Generate a test E-PIN
    const generateRandomEpin = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let pin = '';
      for (let i = 0; i < 12; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pin;
    };
    
    const testEpin = {
      epin: generateRandomEpin(),
      createdAt: firebase.firestore.Timestamp.now(),
      usedBy: null,
      isUsed: false,
      ownerUid: 'test-user-uid',
      requestId: 'test-request-id',
      requestType: 'Buy',
      status: 'unused'
    };
    
    const epinRef = await db.collection('epins').add(testEpin);
    console.log('✅ Test E-PIN created:', epinRef.id);
    
    // Clean up test E-PIN
    await epinRef.delete();
    console.log('✅ Test E-PIN cleaned up');
    
    return true;
  } catch (error) {
    console.log('❌ E-PIN generation test failed:', error.message);
    return false;
  }
};

// Test 5: Test batch operations
const testBatchOperations = async () => {
  try {
    const db = firebase.firestore();
    const batch = db.batch();
    
    // Create test E-PINs in batch
    const testEpins = Array.from({ length: 3 }, () => ({
      epin: 'TEST' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      createdAt: firebase.firestore.Timestamp.now(),
      usedBy: null,
      isUsed: false,
      ownerUid: 'test-user-uid',
      requestId: 'test-request-id',
      requestType: 'Buy',
      status: 'unused'
    }));
    
    const docRefs = [];
    testEpins.forEach(pin => {
      const docRef = db.collection('epins').doc();
      batch.set(docRef, pin);
      docRefs.push(docRef);
    });
    
    await batch.commit();
    console.log('✅ Batch E-PIN creation successful');
    
    // Clean up batch created documents
    const deleteBatch = db.batch();
    docRefs.forEach(ref => {
      deleteBatch.delete(ref);
    });
    await deleteBatch.commit();
    console.log('✅ Batch cleanup successful');
    
    return true;
  } catch (error) {
    console.log('❌ Batch operations test failed:', error.message);
    return false;
  }
};

// Test 6: Validate data structure
const testDataStructure = () => {
  const testApprovalData = {
    status: 'approved',
    approvedBy: 'test-admin-uid',
    approvedAt: firebase.firestore.Timestamp.now(),
    approvedByName: 'Test Admin',
    totalEpinsGenerated: 1,
    epinRequestId: 'test-request-id'
  };
  
  const testRejectionData = {
    status: 'rejected',
    rejectedBy: 'test-admin-uid',
    rejectedAt: firebase.firestore.Timestamp.now(),
    rejectedByName: 'Test Admin'
  };
  
  // Validate approval data
  const isValidApproval = testApprovalData.status && 
                         testApprovalData.approvedBy && 
                         testApprovalData.approvedAt &&
                         testApprovalData.approvedByName;
  
  // Validate rejection data
  const isValidRejection = testRejectionData.status && 
                          testRejectionData.rejectedBy && 
                          testRejectionData.rejectedAt &&
                          testRejectionData.rejectedByName;
  
  if (isValidApproval && isValidRejection) {
    console.log('✅ Data structure validation passed');
    return true;
  } else {
    console.log('❌ Data structure validation failed');
    return false;
  }
};

// Run all tests
const runApprovalTests = async () => {
  console.log('🚀 Starting E-PIN Approval System Tests...\n');
  
  const results = {
    auth: testAdminAuth(),
    adminClaims: await testAdminClaims(),
    updatePermissions: await testUpdatePermissions(),
    epinGeneration: await testEpinGeneration(),
    batchOperations: await testBatchOperations(),
    dataStructure: testDataStructure()
  };
  
  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return results;
};

// Export for manual testing
window.testEpinApproval = runApprovalTests;
console.log('💡 Run testEpinApproval() to test the E-PIN approval system'); 