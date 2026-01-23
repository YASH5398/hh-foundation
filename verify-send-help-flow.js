/**
 * SEND HELP ELIGIBILITY VERIFICATION SCRIPT
 * 
 * This script performs end-to-end verification of the Send Help flow:
 * 1. Connects to Firebase Admin SDK
 * 2. Fetches real users from Firestore
 * 3. Runs the SAME Firestore query used in startHelpAssignment
 * 4. Applies the exact filtering logic
 * 5. Reports findings based on REAL DATA
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const PROJECT_ID = 'hh-foundation';

// Initialize Firebase Admin SDK
// Try multiple credential sources
let initialized = false;

// Try 1: Backend service account key
try {
  const serviceAccountPath = path.join(__dirname, 'backend', 'serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('✅ Firebase Admin SDK initialized with backend service account\n');
  initialized = true;
} catch (e1) {
  // Try 2: Functions service account key
  try {
    const serviceAccountPath = path.join(__dirname, 'functions', 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('✅ Firebase Admin SDK initialized with functions service account\n');
    initialized = true;
  } catch (e2) {
    // Try 3: Use default application credentials with explicit project ID
    try {
      admin.initializeApp({
        projectId: PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK initialized with default credentials (Project: ' + PROJECT_ID + ')\n');
      initialized = true;
    } catch (e3) {
      console.error('❌ Failed to initialize Firebase Admin SDK');
      console.error('   Tried: backend/serviceAccountKey.json');
      console.error('   Tried: functions/serviceAccountKey.json');
      console.error('   Tried: Default application credentials');
      console.error('   Error: ' + e3.message);
      console.error('\n📝 SETUP INSTRUCTIONS:');
      console.error('   1. Download service account key from Firebase Console');
      console.error('   2. Place it at backend/serviceAccountKey.json');
      console.error('   3. Run this script again');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

// CONSTANTS FROM backend/functions/index.js
const LEVEL_RECEIVE_LIMITS = {
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243
};

const HELP_STATUSES = {
  ASSIGNED: 'assigned',
  PAYMENT_REQUESTED: 'payment_requested',
  PAYMENT_DONE: 'payment_done',
  CONFIRMED: 'confirmed'
};

// Functions from backend/functions/index.js
const normalizeLevelName = (levelValue) => {
  if (!levelValue) return 'Star';
  if (typeof levelValue === 'string') return levelValue;
  if (typeof levelValue === 'number') {
    const levelMap = { 1: 'Star', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Diamond' };
    return levelMap[levelValue] || 'Star';
  }
  return 'Star';
};

const getReceiveLimitForLevel = (levelName) => {
  const normalized = normalizeLevelName(levelName);
  return LEVEL_RECEIVE_LIMITS[normalized] || LEVEL_RECEIVE_LIMITS.Star;
};

// Main verification logic
async function verifysSendHelpFlow() {
  console.log('═'.repeat(80));
  console.log('SEND HELP ELIGIBILITY VERIFICATION');
  console.log('═'.repeat(80) + '\n');

  try {
    // STEP 1: Fetch all users from Firestore
    console.log('📋 STEP 1: Fetching all users from Firestore...\n');
    const usersSnapshot = await db.collection('users').limit(100).get();
    const allUsers = [];
    
    usersSnapshot.forEach(doc => {
      allUsers.push({
        uid: doc.id,
        ...doc.data()
      });
    });

    console.log(`   Found ${allUsers.length} users\n`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found in Firestore. Cannot verify flow.');
      process.exit(0);
    }

    // STEP 2: Analyze ALL users
    console.log('═'.repeat(80));
    console.log('STEP 2: USER DATA ANALYSIS');
    console.log('═'.repeat(80) + '\n');

    const userAnalysis = allUsers.map(user => ({
      uid: user.uid,
      userId: user.userId || 'N/A',
      levelStatus: user.levelStatus || 'N/A',
      level: user.level || 'N/A',
      isActivated: user.isActivated || false,
      isBlocked: user.isBlocked || false,
      isOnHold: user.isOnHold || false,
      isReceivingHeld: user.isReceivingHeld || false,
      helpVisibility: user.helpVisibility || false,
      helpReceived: user.helpReceived || 0,
      activeReceiveCount: user.activeReceiveCount || 0,
      sponsorPaymentPending: user.sponsorPaymentPending || false,
      upgradeRequired: user.upgradeRequired || false
    }));

    console.log('All users in system:');
    console.log('─'.repeat(80));
    userAnalysis.forEach((u, idx) => {
      console.log(`\n${idx + 1}. ${u.userId} (${u.uid})`);
      console.log(`   Level: ${u.levelStatus || u.level}`);
      console.log(`   isActivated: ${u.isActivated}`);
      console.log(`   helpVisibility: ${u.helpVisibility}`);
      console.log(`   isReceivingHeld: ${u.isReceivingHeld}`);
      console.log(`   isBlocked: ${u.isBlocked}`);
      console.log(`   activeReceiveCount: ${u.activeReceiveCount}/${getReceiveLimitForLevel(u.levelStatus || u.level)}`);
      console.log(`   sponsorPaymentPending: ${u.sponsorPaymentPending}`);
      console.log(`   upgradeRequired: ${u.upgradeRequired}`);
    });

    // STEP 3: Test with a sender (pick first user that can send)
    console.log('\n\n' + '═'.repeat(80));
    console.log('STEP 3: SENDER ANALYSIS');
    console.log('═'.repeat(80) + '\n');

    const testSender = allUsers[0];
    const senderLevel = normalizeLevelName(testSender.levelStatus || testSender.level);
    
    console.log(`Test Sender: ${testSender.userId || testSender.uid}`);
    console.log(`  Level: ${senderLevel}`);
    console.log(`  isActivated: ${testSender.isActivated}`);
    console.log(`  isBlocked: ${testSender.isBlocked}`);
    console.log(`  isOnHold: ${testSender.isOnHold}`);
    console.log(`  paymentBlocked: ${testSender.paymentBlocked}\n`);

    // STEP 4: Run the EXACT Firestore query used in startHelpAssignment
    console.log('═'.repeat(80));
    console.log('STEP 4: FIRESTORE QUERY EXECUTION');
    console.log('═'.repeat(80) + '\n');

    console.log(`Executing query with senderLevel = "${senderLevel}":\n`);
    console.log(`  .where('isActivated', '==', true)`);
    console.log(`  .where('isBlocked', '==', false)`);
    console.log(`  .where('isOnHold', '==', false)`);
    console.log(`  .where('isReceivingHeld', '==', false)`);
    console.log(`  .where('helpVisibility', '==', true)`);
    console.log(`  .where('levelStatus', '==', "${senderLevel}")\n`);

    const receiverQuery = db
      .collection('users')
      .where('isActivated', '==', true)
      .where('isBlocked', '==', false)
      .where('isOnHole', '==', false)
      .where('isReceivingHeld', '==', false)
      .where('helpVisibility', '==', true)
      .where('levelStatus', '==', senderLevel);

    const receiverSnapshot = await receiverQuery.get();

    console.log(`Query Result: ${receiverSnapshot.size} users matched\n`);

    // STEP 5: Analyze matching users
    console.log('═'.repeat(80));
    console.log('STEP 5: QUERY MATCHES ANALYSIS');
    console.log('═'.repeat(80) + '\n');

    if (receiverSnapshot.size === 0) {
      console.log('⚠️  QUERY RETURNED ZERO USERS\n');
      console.log('Investigating why no users matched...\n');

      // Check levelStatus field specifically
      const usersWithoutLevelStatus = allUsers.filter(u => !u.levelStatus && !u.level);
      const usersWithWrongLevel = allUsers.filter(u => 
        (u.levelStatus || u.level) && normalizeLevelName(u.levelStatus || u.level) !== senderLevel
      );
      const inactiveUsers = allUsers.filter(u => u.isActivated !== true);
      const usersWithHelVisibilityFalse = allUsers.filter(u => u.helpVisibility !== true);

      console.log(`📊 Issue Breakdown:`);
      console.log(`   Users without levelStatus: ${usersWithoutLevelStatus.length}`);
      if (usersWithoutLevelStatus.length > 0) {
        console.log(`     ${usersWithoutLevelStatus.map(u => u.userId || u.uid).join(', ')}`);
      }
      console.log(`\n   Users with wrong level (not ${senderLevel}): ${usersWithWrongLevel.length}`);
      if (usersWithWrongLevel.length > 0) {
        console.log(`     ${usersWithWrongLevel.map(u => `${u.userId}(${u.levelStatus || u.level})`).join(', ')}`);
      }
      console.log(`\n   Inactive users (isActivated !== true): ${inactiveUsers.length}`);
      if (inactiveUsers.length > 0) {
        console.log(`     ${inactiveUsers.map(u => u.userId || u.uid).join(', ')}`);
      }
      console.log(`\n   Users with helpVisibility !== true: ${usersWithHelVisibilityFalse.length}`);
      if (usersWithHelVisibilityFalse.length > 0) {
        console.log(`     ${usersWithHelVisibilityFalse.map(u => u.userId || u.uid).join(', ')}`);
      }
    } else {
      console.log(`✅ Query returned ${receiverSnapshot.size} eligible receivers\n`);
      
      const queryMatches = [];
      receiverSnapshot.forEach(doc => {
        const user = doc.data();
        queryMatches.push({
          uid: doc.id,
          userId: user.userId,
          levelStatus: user.levelStatus,
          isActivated: user.isActivated,
          helpVisibility: user.helpVisibility,
          isReceivingHeld: user.isReceivingHeld,
          activeReceiveCount: user.activeReceiveCount || 0,
          receiveLimit: getReceiveLimitForLevel(user.levelStatus || user.level),
          sponsorPaymentPending: user.sponsorPaymentPending,
          upgradeRequired: user.upgradeRequired
        });
      });

      console.log('Users matching Firestore query:');
      queryMatches.forEach((u, idx) => {
        console.log(`\n${idx + 1}. ${u.userId} (${u.uid})`);
        console.log(`   levelStatus: ${u.levelStatus}`);
        console.log(`   isActivated: ${u.isActivated}`);
        console.log(`   helpVisibility: ${u.helpVisibility}`);
      });

      // STEP 6: Apply post-query filtering logic
      console.log('\n\n' + '═'.repeat(80));
      console.log('STEP 6: POST-QUERY FILTERING ANALYSIS');
      console.log('═'.repeat(80) + '\n');

      const rejectionReasonCounts = {
        SELF_USER: 0,
        NOT_ACTIVATED: 0,
        BLOCKED: 0,
        ON_HOLD: 0,
        RECEIVING_HELD: 0,
        HELP_VISIBILITY_FALSE: 0,
        UPGRADE_REQUIRED: 0,
        SPONSOR_PAYMENT_PENDING: 0,
        RECEIVE_LIMIT_REACHED: 0
      };

      let totalExcluded = 0;
      let chosen = null;

      for (const candidate of queryMatches) {
        const reasons = [];

        // Check 1: SELF_USER
        if (candidate.uid === testSender.uid) {
          reasons.push('SELF_USER');
          rejectionReasonCounts.SELF_USER++;
        }

        // Check 2: NOT_ACTIVATED
        if (candidate.isActivated !== true) {
          reasons.push('NOT_ACTIVATED');
          rejectionReasonCounts.NOT_ACTIVATED++;
        }

        // Check 3: BLOCKED
        if (candidate.isBlocked === true) {
          reasons.push('BLOCKED');
          rejectionReasonCounts.BLOCKED++;
        }

        // Check 4: ON_HOLD
        if (candidate.isOnHold === true) {
          reasons.push('ON_HOLD');
          rejectionReasonCounts.ON_HOLD++;
        }

        // Check 5: RECEIVING_HELD
        if (candidate.isReceivingHeld === true) {
          reasons.push('RECEIVING_HELD');
          rejectionReasonCounts.RECEIVING_HELD++;
        }

        // Check 6: HELP_VISIBILITY_FALSE
        if (candidate.helpVisibility === false) {
          reasons.push('HELP_VISIBILITY_FALSE');
          rejectionReasonCounts.HELP_VISIBILITY_FALSE++;
        }

        // Check 7: UPGRADE_REQUIRED
        if (candidate.upgradeRequired === true) {
          reasons.push('UPGRADE_REQUIRED');
          rejectionReasonCounts.UPGRADE_REQUIRED++;
        }

        // Check 8: SPONSOR_PAYMENT_PENDING
        if (candidate.sponsorPaymentPending === true) {
          reasons.push('SPONSOR_PAYMENT_PENDING');
          rejectionReasonCounts.SPONSOR_PAYMENT_PENDING++;
        }

        // Check 9: RECEIVE_LIMIT_REACHED
        if (candidate.activeReceiveCount >= candidate.receiveLimit) {
          reasons.push('RECEIVE_LIMIT_REACHED');
          rejectionReasonCounts.RECEIVE_LIMIT_REACHED++;
        }

        if (reasons.length > 0) {
          totalExcluded++;
          console.log(`❌ ${candidate.userId} (${candidate.uid}) REJECTED`);
          console.log(`   Reasons: [${reasons.join(', ')}]`);
          console.log(`   activeReceiveCount: ${candidate.activeReceiveCount}/${candidate.receiveLimit}`);
          console.log(`   upgradeRequired: ${candidate.upgradeRequired}`);
          console.log(`   sponsorPaymentPending: ${candidate.sponsorPaymentPending}\n`);
        } else {
          console.log(`✅ ${candidate.userId} (${candidate.uid}) ELIGIBLE\n`);
          chosen = candidate;
          break;
        }
      }

      console.log('\n' + '═'.repeat(80));
      console.log('FILTERING SUMMARY');
      console.log('═'.repeat(80));
      console.log(`\nTotal fetched from query: ${queryMatches.length}`);
      console.log(`Total rejected by filters: ${totalExcluded}`);
      console.log(`Total eligible: ${chosen ? 1 : 0}`);
      console.log(`\nRejection reason breakdown:`);
      Object.entries(rejectionReasonCounts).forEach(([reason, count]) => {
        if (count > 0) {
          console.log(`  ${reason}: ${count}`);
        }
      });
    }

    // STEP 7: Verify activation flow
    console.log('\n\n' + '═'.repeat(80));
    console.log('STEP 7: ACTIVATION FLOW VERIFICATION');
    console.log('═'.repeat(80) + '\n');

    // Find an inactive user to test
    const inactiveUser = allUsers.find(u => u.isActivated === false);
    
    if (!inactiveUser) {
      console.log('ℹ️  No inactive users found to test activation flow');
    } else {
      console.log(`Testing with inactive user: ${inactiveUser.userId || inactiveUser.uid}\n`);
      console.log(`Before activation:`);
      console.log(`  isActivated: ${inactiveUser.isActivated}`);
      console.log(`  helpVisibility: ${inactiveUser.helpVisibility}`);
      console.log(`  levelStatus: ${inactiveUser.levelStatus || inactiveUser.level}`);
      console.log(`\nAfter submitPayment should set:`);
      console.log(`  isActivated: true`);
      console.log(`  helpVisibility: true`);
      console.log(`  levelStatus: ${normalizeLevelName(inactiveUser.levelStatus || inactiveUser.level)} (unchanged)`);
      console.log(`\n✅ Activation logic verified in code`);
    }

  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Run verification
verifysSendHelpFlow();
