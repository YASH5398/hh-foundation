/**
 * SEND HELP ELIGIBILITY TEST
 * Tests whether inactive users can query activated receivers
 * Logs detailed information about available receivers
 */

import { db, auth } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

/**
 * TEST CONFIGURATION
 * Update these values for testing with REAL user data
 */
const TEST_CONFIG = {
  // Use a REAL inactive user account for testing
  inactiveUserEmail: 'test@example.com', // Update with real email
  inactiveUserPassword: 'test123', // Update with real password

  // Expected level for testing - update based on your user's level
  testLevel: 'Star', // Change this to match your test user's level
};

/**
 * LOG HELPER FUNCTION
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log('Data:', data);
  }
}

/**
 * MAIN TEST FUNCTION
 */
export async function runSendHelpEligibilityTest() {
  log('🚀 STARTING SEND HELP ELIGIBILITY TEST');

  try {
    // Step 1: Authenticate with inactive user
    log('📋 Step 1: Authenticating with inactive user...');
    await signInWithEmailAndPassword(auth, TEST_CONFIG.inactiveUserEmail, TEST_CONFIG.inactiveUserPassword);
    log('✅ Successfully authenticated as inactive user');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication failed - no current user');
    }

    log('👤 Current user info:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    });

    // Step 2: Query users collection for activated users at same level
    log('📋 Step 2: Querying for activated receivers...');
    log(`🔍 Searching for users with level: "${TEST_CONFIG.testLevel}" and isActivated: true`);

    const receiversQuery = query(
      collection(db, 'users'),
      where('level', '==', TEST_CONFIG.testLevel),
      where('isActivated', '==', true)
    );

    log('🔧 Executing Firestore query...');
    const receiversSnap = await getDocs(receiversQuery);

    // Step 3: Analyze results
    log('📋 Step 3: Analyzing query results...');

    const allReceivers = receiversSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    log(`📊 TOTAL RECEIVERS FOUND: ${allReceivers.length}`);

    if (allReceivers.length === 0) {
      log('❌ NO RECEIVERS FOUND - This is the root cause of "No eligible receivers available"');
      log('🔍 Possible causes:');
      log('  - No activated users at this level');
      log('  - Firestore permissions blocking the query');
      log('  - Wrong field names (level vs levelStatus)');
      log('  - Wrong data types (string vs number)');
      log('  - Missing Firestore indexes');
      return {
        success: false,
        error: 'No receivers found',
        totalReceivers: 0,
        receivers: []
      };
    }

    // Step 4: Detailed receiver analysis
    log('📋 Step 4: Analyzing individual receivers...');

    const detailedReceivers = allReceivers.map((receiver, index) => {
      log(`👤 Receiver ${index + 1}:`, {
        userId: receiver.userId,
        uid: receiver.uid,
        level: receiver.level,
        isActivated: receiver.isActivated,
        isBlocked: receiver.isBlocked,
        isOnHold: receiver.isOnHold,
        isReceivingHeld: receiver.isReceivingHeld,
        paymentBlocked: receiver.paymentBlocked,
        helpReceived: receiver.helpReceived,
        levelType: typeof receiver.level,
        isActivatedType: typeof receiver.isActivated
      });

      return {
        userId: receiver.userId,
        uid: receiver.uid,
        level: receiver.level,
        isActivated: receiver.isActivated,
        referralCount: receiver.referralCount || 0,
        helpReceived: receiver.helpReceived || 0,
        isBlocked: receiver.isBlocked || false,
        isOnHold: receiver.isOnHold || false,
        isReceivingHeld: receiver.isReceivingHeld || false,
        paymentBlocked: receiver.paymentBlocked || false,
        isSystemAccount: receiver.isSystemAccount || false
      };
    });

    // Step 5: Check for eligible receivers (simulate the business logic)
    log('📋 Step 5: Checking receiver eligibility...');

    const eligibleReceivers = [];
    const ineligibleReasons = [];

    for (const receiver of detailedReceivers) {
      const reasons = [];

      // Exclude sender
      if (receiver.uid === currentUser.uid) {
        reasons.push('Is sender');
      }

      // Check activation
      if (!receiver.isActivated) {
        reasons.push('Not activated');
      }

      // Check blocking
      if (receiver.isBlocked || receiver.paymentBlocked) {
        reasons.push('Blocked');
      }

      // Check holds
      if (receiver.isOnHold || receiver.isReceivingHeld) {
        reasons.push('On hold');
      }

      // Check system account
      if (receiver.isSystemAccount) {
        reasons.push('System account');
      }

      if (reasons.length === 0) {
        eligibleReceivers.push(receiver);
        log(`✅ ELIGIBLE: ${receiver.userId} (Level: ${receiver.level}, Referrals: ${receiver.referralCount})`);
      } else {
        ineligibleReasons.push({
          userId: receiver.userId,
          reasons: reasons
        });
        log(`❌ INELIGIBLE: ${receiver.userId} - ${reasons.join(', ')}`);
      }
    }

    // Step 6: Final results
    log('📋 Step 6: Final test results...');
    log(`🎯 ELIGIBLE RECEIVERS: ${eligibleReceivers.length}`);
    log(`🚫 INELIGIBLE RECEIVERS: ${ineligibleReasons.length}`);

    if (eligibleReceivers.length > 0) {
      // Sort by referral count (highest first)
      const sortedEligible = [...eligibleReceivers].sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
      log('🥇 TOP ELIGIBLE RECEIVER:', {
        userId: sortedEligible[0].userId,
        level: sortedEligible[0].level,
        referralCount: sortedEligible[0].referralCount,
        helpReceived: sortedEligible[0].helpReceived
      });
    }

    // Step 7: Sign out
    await signOut(auth);
    log('👋 Signed out test user');

    return {
      success: eligibleReceivers.length > 0,
      totalReceivers: allReceivers.length,
      eligibleReceivers: eligibleReceivers.length,
      ineligibleReceivers: ineligibleReasons.length,
      topReceiver: eligibleReceivers.length > 0 ? eligibleReceivers[0] : null,
      receivers: detailedReceivers,
      ineligibleDetails: ineligibleReasons
    };

  } catch (error) {
    log('❌ TEST FAILED WITH ERROR:', error);

    // Detailed error analysis
    if (error.code === 'permission-denied') {
      log('🔒 PERMISSION DENIED ERROR - Firestore rules are blocking access');
      log('💡 Check Firestore rules for /users collection read permissions');
    } else if (error.code === 'failed-precondition') {
      log('📊 FAILED PRECONDITION - Missing Firestore index');
      log('💡 Create composite index for: level + isActivated');
    } else if (error.code === 'unauthenticated') {
      log('🔐 UNAUTHENTICATED - User not logged in');
    } else {
      log('❓ UNKNOWN ERROR - Check error details above');
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      totalReceivers: 0,
      receivers: []
    };
  }
}

/**
 * CONVENIENCE FUNCTION - Run test and log results
 */
export async function runTestAndLog() {
  console.log('='.repeat(80));
  console.log('SEND HELP ELIGIBILITY TEST');
  console.log('='.repeat(80));

  const result = await runSendHelpEligibilityTest();

  console.log('='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  if (result.success) {
    console.log('✅ TEST PASSED - Eligible receivers found!');
    console.log(`📊 Total receivers: ${result.totalReceivers}`);
    console.log(`🎯 Eligible receivers: ${result.eligibleReceivers}`);
    console.log(`🚫 Ineligible receivers: ${result.ineligibleReceivers}`);
  } else {
    console.log('❌ TEST FAILED - No eligible receivers');
    console.log(`📊 Total receivers found: ${result.totalReceivers}`);
    if (result.error) {
      console.log(`🔍 Error: ${result.error}`);
      if (result.errorCode) {
        console.log(`🔍 Error code: ${result.errorCode}`);
      }
    }
  }

  console.log('='.repeat(80));

  return result;
}

// Export for use in browser console or other files
window.runSendHelpEligibilityTest = runTestAndLog;
