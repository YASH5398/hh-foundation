/**
 * Test script for enhanced Send Help & Receive Help debugging system
 * Tests the new eligibility checking and force override functionality
 */

const admin = require('firebase-admin');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');

// Initialize Firebase Admin (for server-side testing)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Firebase Client (for callable functions)
const firebaseConfig = {
  // Add your Firebase config here
  projectId: 'hh-foundation'
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test functions
const testCheckUserEligibility = async (userId) => {
  console.log(`\n=== Testing User Eligibility Check for ${userId} ===`);
  
  try {
    // This would normally be called from the admin UI
    // For testing, we'll simulate the admin service call
    const db = admin.firestore();
    
    // Find user by userId
    const usersQuery = db.collection('users').where('userId', '==', userId);
    const usersSnap = await usersQuery.get();
    
    if (usersSnap.empty) {
      console.log(`❌ User ${userId} not found`);
      return;
    }
    
    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;
    
    console.log(`✅ Found user: ${uid}`);
    console.log(`📊 User Data:`, {
      isActivated: userData.isActivated,
      isBlocked: userData.isBlocked,
      isOnHold: userData.isOnHold,
      isReceivingHeld: userData.isReceivingHeld,
      upgradeRequired: userData.upgradeRequired,
      sponsorPaymentPending: userData.sponsorPaymentPending,
      forceReceiveOverride: userData.forceReceiveOverride,
      activeReceiveCount: userData.activeReceiveCount || 0,
      level: userData.levelStatus || userData.level || 'Star'
    });
    
    return { uid, userData };
  } catch (error) {
    console.error(`❌ Error checking eligibility:`, error.message);
  }
};

const testForceReceiverAssignment = async (userId) => {
  console.log(`\n=== Testing Force Receiver Assignment for ${userId} ===`);
  
  try {
    const db = admin.firestore();
    
    // Find user by userId
    const usersQuery = db.collection('users').where('userId', '==', userId);
    const usersSnap = await usersQuery.get();
    
    if (usersSnap.empty) {
      console.log(`❌ User ${userId} not found`);
      return;
    }
    
    const userDoc = usersSnap.docs[0];
    const userDocRef = db.collection('users').doc(userDoc.id);
    const userData = userDoc.data();
    
    console.log(`📝 Before Force Assignment:`, {
      isActivated: userData.isActivated,
      isOnHold: userData.isOnHold,
      isReceivingHeld: userData.isReceivingHeld,
      forceReceiveOverride: userData.forceReceiveOverride
    });
    
    // Apply force receiver assignment logic
    const updateData = {
      isActivated: true,
      isOnHold: false,
      isReceivingHeld: false,
      helpVisibility: true,
      forceReceiveOverride: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update kycDetails.levelStatus if kycDetails exists
    if (userData.kycDetails) {
      updateData['kycDetails.levelStatus'] = 'active';
    } else {
      updateData.kycDetails = {
        levelStatus: 'active'
      };
    }
    
    await userDocRef.update(updateData);
    
    console.log(`✅ Force assignment applied successfully`);
    console.log(`📝 After Force Assignment:`, updateData);
    
    return { success: true, uid: userDoc.id, updateData };
  } catch (error) {
    console.error(`❌ Error in force assignment:`, error.message);
    return { success: false, error: error.message };
  }
};

const testStartHelpAssignmentWithDebugging = async (senderUid, senderId) => {
  console.log(`\n=== Testing Enhanced startHelpAssignment for ${senderId} ===`);
  
  try {
    const startHelpAssignment = httpsCallable(functions, 'startHelpAssignment');
    
    const result = await startHelpAssignment({
      senderUid,
      senderId,
      idempotencyKey: `test_${Date.now()}`
    });
    
    console.log(`✅ Help assignment result:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`❌ Help assignment failed:`, error.message);
    
    // Check if error contains enhanced debugging info
    if (error.details && error.details.skipDiagnostics) {
      console.log(`🔍 Enhanced Debug Info:`, {
        totalCandidates: error.details.totalCandidates,
        skipSummary: error.details.summary,
        skipDetails: error.details.skipDiagnostics.slice(0, 3) // Show first 3 for brevity
      });
    }
    
    return { success: false, error: error.message, details: error.details };
  }
};

const testReceiveEligibility = async (uid) => {
  console.log(`\n=== Testing getReceiveEligibility for ${uid} ===`);
  
  try {
    const getReceiveEligibility = httpsCallable(functions, 'getReceiveEligibility');
    
    const result = await getReceiveEligibility();
    
    console.log(`✅ Eligibility result:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`❌ Eligibility check failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// Main test execution
const runTests = async () => {
  console.log('🚀 Starting Enhanced Debugging System Tests\n');
  
  // Test with a sample user ID (replace with actual user ID from your system)
  const testUserId = 'HHF1001'; // Replace with actual user ID
  
  try {
    // Step 1: Check user eligibility
    const eligibilityResult = await testCheckUserEligibility(testUserId);
    
    if (eligibilityResult) {
      const { uid, userData } = eligibilityResult;
      
      // Step 2: Test receive eligibility function
      await testReceiveEligibility(uid);
      
      // Step 3: Test force receiver assignment if needed
      if (!userData.isActivated || userData.isBlocked || userData.isReceivingHeld) {
        console.log(`\n🔧 User needs force assignment, applying...`);
        await testForceReceiverAssignment(testUserId);
      }
      
      // Step 4: Test enhanced help assignment with debugging
      await testStartHelpAssignmentWithDebugging(uid, testUserId);
    }
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  }
};

// Export for use in other scripts
module.exports = {
  testCheckUserEligibility,
  testForceReceiverAssignment,
  testStartHelpAssignmentWithDebugging,
  testReceiveEligibility,
  runTests
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}