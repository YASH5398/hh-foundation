// Browser Console Script: Setup helpReceived field for all users
// Run this in your browser console on the admin panel or dashboard

console.log('🚀 Setting up helpReceived field for all users...');

// Function to count existing sendHelp entries for a user
async function countExistingHelp(userId) {
  try {
    const sendHelpQuery = query(
      collection(db, 'sendHelp'),
      where('receiverId', '==', userId),
      where('status', 'in', ['Pending', 'Completed', 'Confirmed'])
    );
    const snapshot = await getDocs(sendHelpQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting help for user:', userId, error);
    return 0;
  }
}

// Function to update a single user's helpReceived field
async function updateUserHelpReceived(userDoc) {
  try {
    const userData = userDoc.data();
    const userId = userData.userId;
    
    if (!userId) {
      console.log('⚠️ Skipping user without userId:', userDoc.id);
      return;
    }
    
    // Count existing help
    const existingHelpCount = await countExistingHelp(userId);
    
    // Update the user document
    await updateDoc(doc(db, 'users', userDoc.id), {
      helpReceived: existingHelpCount
    });
    
    console.log(`✅ Updated user ${userId}: helpReceived = ${existingHelpCount}`);
    return { userId, helpReceived: existingHelpCount };
  } catch (error) {
    console.error('❌ Error updating user:', userDoc.id, error);
    return null;
  }
}

// Main function to update all users
async function setupHelpReceivedForAllUsers() {
  try {
    console.log('📋 Fetching all users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Found ${usersSnapshot.size} users`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const result = await updateUserHelpReceived(userDoc);
      if (result) {
        results.push(result);
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Setup complete!');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('📊 Results:', results);
    
    return results;
  } catch (error) {
    console.error('❌ Error in setup:', error);
    throw error;
  }
}

// Function to check current helpReceived values
async function checkHelpReceivedValues() {
  try {
    console.log('🔍 Checking current helpReceived values...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersWithHelpReceived = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.helpReceived !== undefined) {
        usersWithHelpReceived.push({
          userId: userData.userId,
          helpReceived: userData.helpReceived,
          levelStatus: userData.levelStatus,
          isActivated: userData.isActivated
        });
      }
    }
    
    console.log('📊 Users with helpReceived field:', usersWithHelpReceived);
    return usersWithHelpReceived;
  } catch (error) {
    console.error('❌ Error checking helpReceived values:', error);
    return [];
  }
}

// Function to test the new atomic query
async function testNewQuery(level = 'Star', senderUid = null) {
  try {
    console.log(`🧪 Testing new atomic query for level: ${level}`);
    
    if (!senderUid) {
      console.log('⚠️ No senderUid provided, using test UID');
      senderUid = 'test-sender-uid';
    }
    
    const eligibleReceiversQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "<", 3),
      where("uid", "!=", senderUid), // Exclude sender
      orderBy("referralCount", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(eligibleReceiversQuery);
    const eligibleUsers = snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      uid: doc.id,
      helpReceived: doc.data().helpReceived,
      referralCount: doc.data().referralCount,
      isActivated: doc.data().isActivated,
      levelStatus: doc.data().levelStatus
    }));
    
    console.log(`✅ Found ${eligibleUsers.length} eligible users for level ${level}:`, eligibleUsers);
    return eligibleUsers;
  } catch (error) {
    console.error(`❌ Error testing query for level ${level}:`, error);
    console.log('💡 This might be due to missing helpReceived field or Firestore index issues');
    return [];
  }
}

// Function to test the query without uid filter (for debugging)
async function testQueryWithoutUidFilter(level = 'Star') {
  try {
    console.log(`🧪 Testing query without uid filter for level: ${level}`);
    
    const eligibleReceiversQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "<", 3),
      orderBy("referralCount", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(eligibleReceiversQuery);
    const eligibleUsers = snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      uid: doc.id,
      helpReceived: doc.data().helpReceived,
      referralCount: doc.data().referralCount,
      isActivated: doc.data().isActivated,
      levelStatus: doc.data().levelStatus
    }));
    
    console.log(`✅ Found ${eligibleUsers.length} eligible users (without uid filter):`, eligibleUsers);
    return eligibleUsers;
  } catch (error) {
    console.error(`❌ Error testing query without uid filter:`, error);
    return [];
  }
}

// Function to validate helpReceived field setup
async function validateHelpReceivedSetup() {
  try {
    console.log('🔍 Validating helpReceived field setup...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userData.userId;
      
      if (!userId) {
        missingCount++;
        continue;
      }
      
      if (userData.helpReceived === undefined) {
        invalidCount++;
        console.log(`❌ User ${userId} missing helpReceived field`);
      } else {
        // Verify the count matches actual sendHelp entries
        const actualCount = await countExistingHelp(userId);
        if (userData.helpReceived !== actualCount) {
          invalidCount++;
          console.log(`❌ User ${userId}: helpReceived=${userData.helpReceived}, actual=${actualCount}`);
        } else {
          validCount++;
        }
      }
    }
    
    console.log('📊 Validation Results:');
    console.log(`✅ Valid users: ${validCount}`);
    console.log(`❌ Invalid users: ${invalidCount}`);
    console.log(`⚠️ Missing userId: ${missingCount}`);
    
    return { validCount, invalidCount, missingCount };
  } catch (error) {
    console.error('❌ Error validating setup:', error);
    return { validCount: 0, invalidCount: 0, missingCount: 0 };
  }
}

// Function to test strict validation logic
async function testStrictValidation(level = 'Star', senderUid = null) {
  try {
    console.log(`🧪 Testing strict validation for level: ${level}`);
    
    if (!senderUid) {
      console.log('⚠️ No senderUid provided, using test UID');
      senderUid = 'test-sender-uid';
    }
    
    // First, get all users with helpReceived >= 3
    const usersWith3PlusHelp = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", ">=", 3)
    );
    
    const threePlusSnapshot = await getDocs(usersWith3PlusHelp);
    const usersWith3Plus = threePlusSnapshot.docs.map(doc => ({
      userId: doc.data().userId,
      uid: doc.id,
      helpReceived: doc.data().helpReceived,
      levelStatus: doc.data().levelStatus
    }));
    
    console.log(`📊 Users with helpReceived >= 3:`, usersWith3Plus);
    
    // Now test the actual query
    const eligibleReceiversQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "<", 3),
      where("uid", "!=", senderUid),
      orderBy("referralCount", "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(eligibleReceiversQuery);
    const eligibleUsers = snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      uid: doc.id,
      helpReceived: doc.data().helpReceived,
      referralCount: doc.data().referralCount,
      isActivated: doc.data().isActivated,
      levelStatus: doc.data().levelStatus
    }));
    
    console.log(`✅ Found ${eligibleUsers.length} eligible users:`, eligibleUsers);
    
    // Verify no users with helpReceived >= 3 are in the eligible list
    const invalidUsers = eligibleUsers.filter(user => user.helpReceived >= 3);
    if (invalidUsers.length > 0) {
      console.error(`❌ CRITICAL ERROR: Found ${invalidUsers.length} users with helpReceived >= 3 in eligible list:`, invalidUsers);
    } else {
      console.log(`✅ SUCCESS: No users with helpReceived >= 3 found in eligible list`);
    }
    
    return {
      usersWith3Plus,
      eligibleUsers,
      hasInvalidUsers: invalidUsers.length > 0
    };
  } catch (error) {
    console.error(`❌ Error testing strict validation:`, error);
    return { usersWith3Plus: [], eligibleUsers: [], hasInvalidUsers: false };
  }
}

// Function to simulate race condition test
async function testRaceCondition(level = 'Star') {
  try {
    console.log(`🏁 Testing race condition simulation for level: ${level}`);
    
    // Get a user with helpReceived = 2
    const usersWith2Help = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "==", 2)
    );
    
    const snapshot = await getDocs(usersWith2Help);
    if (snapshot.empty) {
      console.log('⚠️ No users with helpReceived = 2 found for testing');
      return;
    }
    
    const testUser = { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    console.log(`🧪 Testing with user: ${testUser.userId} (helpReceived: ${testUser.helpReceived})`);
    
    // Simulate multiple concurrent queries
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        (async () => {
          const query = query(
            collection(db, "users"),
            where("isActivated", "==", true),
            where("levelStatus", "==", level),
            where("helpReceived", "<", 3),
            where("uid", "!=", `test-sender-${i}`),
            orderBy("referralCount", "desc"),
            limit(1)
          );
          const snap = await getDocs(query);
          return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        })()
      );
    }
    
    const results = await Promise.all(promises);
    console.log('🏁 Race condition test results:', results);
    
    // Check if the test user appears in multiple results
    const testUserAppearances = results.filter(result => 
      result.some(user => user.uid === testUser.uid)
    ).length;
    
    if (testUserAppearances > 1) {
      console.warn(`⚠️ User ${testUser.userId} appeared in ${testUserAppearances} concurrent queries`);
    } else {
      console.log(`✅ User ${testUser.userId} appeared in ${testUserAppearances} concurrent queries (expected behavior)`);
    }
    
    return { testUser, results, testUserAppearances };
  } catch (error) {
    console.error(`❌ Error testing race condition:`, error);
    return null;
  }
}

// Function to test immediate assignment logic
async function testImmediateAssignment(level = 'Star', senderUid = null) {
  try {
    console.log(`🚀 Testing immediate assignment logic for level: ${level}`);
    
    if (!senderUid) {
      console.log('⚠️ No senderUid provided, using test UID');
      senderUid = 'test-sender-uid';
    }
    
    // Find a user with helpReceived = 0 or 1 to test with
    const testUsersQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "<", 2),
      orderBy("helpReceived", "desc"),
      limit(3)
    );
    
    const testUsersSnapshot = await getDocs(testUsersQuery);
    if (testUsersSnapshot.empty) {
      console.log('⚠️ No test users found with helpReceived < 2');
      return;
    }
    
    const testUser = { uid: testUsersSnapshot.docs[0].id, ...testUsersSnapshot.docs[0].data() };
    console.log(`🧪 Testing with user: ${testUser.userId} (current helpReceived: ${testUser.helpReceived})`);
    
    // Simulate the selection process
    const eligibleReceiversQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", "<", 3),
      where("uid", "!=", senderUid),
      orderBy("referralCount", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(eligibleReceiversQuery);
    const eligibleReceivers = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    
    console.log(`📊 Found ${eligibleReceivers.length} eligible receivers`);
    
    // Find our test user in the eligible list
    const testUserInList = eligibleReceivers.find(user => user.uid === testUser.uid);
    if (!testUserInList) {
      console.log(`❌ Test user ${testUser.userId} not found in eligible list`);
      return;
    }
    
    console.log(`✅ Test user ${testUser.userId} found in eligible list with helpReceived: ${testUserInList.helpReceived}`);
    
    // Simulate the immediate assignment (without actually doing it)
    console.log(`📝 Would immediately update helpReceived for ${testUser.userId}: ${testUserInList.helpReceived} → ${testUserInList.helpReceived + 1}`);
    
    // Check if this would make the user ineligible for future assignments
    if (testUserInList.helpReceived + 1 >= 3) {
      console.log(`⚠️ This assignment would make ${testUser.userId} ineligible for future assignments`);
    } else {
      console.log(`✅ ${testUser.userId} would still be eligible for ${3 - (testUserInList.helpReceived + 1)} more assignments`);
    }
    
    return {
      testUser,
      testUserInList,
      wouldBeIneligible: testUserInList.helpReceived + 1 >= 3
    };
  } catch (error) {
    console.error(`❌ Error testing immediate assignment:`, error);
    return null;
  }
}

// Function to verify no users have helpReceived > 3
async function verifyNoOverflow(level = 'Star') {
  try {
    console.log(`🔍 Verifying no users have helpReceived > 3 for level: ${level}`);
    
    const overflowQuery = query(
      collection(db, "users"),
      where("isActivated", "==", true),
      where("levelStatus", "==", level),
      where("helpReceived", ">", 3)
    );
    
    const snapshot = await getDocs(overflowQuery);
    const overflowUsers = snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      uid: doc.id,
      helpReceived: doc.data().helpReceived,
      levelStatus: doc.data().levelStatus
    }));
    
    if (overflowUsers.length > 0) {
      console.error(`❌ CRITICAL ERROR: Found ${overflowUsers.length} users with helpReceived > 3:`, overflowUsers);
      return { hasOverflow: true, overflowUsers };
    } else {
      console.log(`✅ SUCCESS: No users found with helpReceived > 3`);
      return { hasOverflow: false, overflowUsers: [] };
    }
  } catch (error) {
    console.error(`❌ Error verifying overflow:`, error);
    return { hasOverflow: false, overflowUsers: [] };
  }
}

// Function to test the complete assignment flow
async function testCompleteAssignmentFlow(level = 'Star', senderUid = null) {
  try {
    console.log(`🔄 Testing complete assignment flow for level: ${level}`);
    
    if (!senderUid) {
      console.log('⚠️ No senderUid provided, using test UID');
      senderUid = 'test-sender-uid';
    }
    
    // Step 1: Check current state
    const currentState = await testStrictValidation(level, senderUid);
    console.log('📊 Current state:', currentState);
    
    // Step 2: Test immediate assignment logic
    const assignmentTest = await testImmediateAssignment(level, senderUid);
    console.log('📝 Assignment test:', assignmentTest);
    
    // Step 3: Verify no overflow
    const overflowCheck = await verifyNoOverflow(level);
    console.log('🔍 Overflow check:', overflowCheck);
    
    // Step 4: Test race condition prevention
    const raceTest = await testRaceCondition(level);
    console.log('🏁 Race condition test:', raceTest);
    
    return {
      currentState,
      assignmentTest,
      overflowCheck,
      raceTest
    };
  } catch (error) {
    console.error(`❌ Error in complete assignment flow test:`, error);
    return null;
  }
}

// Export functions for manual execution
window.setupHelpReceived = setupHelpReceivedForAllUsers;
window.checkHelpReceived = checkHelpReceivedValues;
window.testNewQuery = testNewQuery;
window.testQueryWithoutUidFilter = testQueryWithoutUidFilter;
window.validateHelpReceivedSetup = validateHelpReceivedSetup;
window.testStrictValidation = testStrictValidation;
window.testRaceCondition = testRaceCondition;
window.testImmediateAssignment = testImmediateAssignment;
window.verifyNoOverflow = verifyNoOverflow;
window.testCompleteAssignmentFlow = testCompleteAssignmentFlow;

console.log('📝 Available functions:');
console.log('- setupHelpReceived() - Set up helpReceived field for all users');
console.log('- checkHelpReceived() - Check current helpReceived values');
console.log('- testNewQuery(level, senderUid) - Test the new atomic query');
console.log('- testQueryWithoutUidFilter(level) - Test query without uid filter');
console.log('- validateHelpReceivedSetup() - Validate the setup');
console.log('- testStrictValidation(level, senderUid) - Test strict validation logic');
console.log('- testRaceCondition(level) - Test race condition scenarios');
console.log('- testImmediateAssignment(level, senderUid) - Test immediate assignment logic');
console.log('- verifyNoOverflow(level) - Verify no users have helpReceived > 3');
console.log('- testCompleteAssignmentFlow(level, senderUid) - Test complete assignment flow');

// Auto-run validation if you want
// validateHelpReceivedSetup(); 