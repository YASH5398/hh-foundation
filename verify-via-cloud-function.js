/**
 * SEND HELP VERIFICATION - RUN VIA CLOUD FUNCTION
 * 
 * This script creates a temporary Cloud Function that will:
 * 1. Query all users from Firestore
 * 2. Run the same receiver query as startHelpAssignment
 * 3. Apply the filtering logic
 * 4. Log findings for analysis
 * 
 * Copy and paste the exported function into Firebase Cloud Console
 * or deploy using: firebase deploy --only functions:verifySendHelpEligibility
 */

const { httpsOnCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();

// CONSTANTS FROM backend/functions/index.js
const LEVEL_RECEIVE_LIMITS = {
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243
};

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

// EXPORTED CLOUD FUNCTION
exports.verifySendHelpEligibility = httpsOnCall(async (request) => {
  const { testSenderLevel = 'Star' } = request.data || {};

  console.log('\n' + '='.repeat(80));
  console.log('SEND HELP ELIGIBILITY VERIFICATION CLOUD FUNCTION');
  console.log('='.repeat(80));
  console.log(`Test sender level: ${testSenderLevel}\n`);

  try {
    // STEP 1: Fetch all users
    console.log('STEP 1: Fetching all users...');
    const usersSnapshot = await db.collection('users').limit(100).get();
    const allUsers = [];

    usersSnapshot.forEach(doc => {
      allUsers.push({
        uid: doc.id,
        ...doc.data()
      });
    });

    console.log(`Found ${allUsers.length} users\n`);

    // STEP 2: User analysis
    console.log('STEP 2: USER DATA SUMMARY');
    console.log('-'.repeat(80));
    const userSummary = allUsers.map(u => ({
      userId: u.userId || 'N/A',
      level: normalizeLevelName(u.levelStatus || u.level),
      isActivated: u.isActivated || false,
      helpVisibility: u.helpVisibility || false,
      isBlocked: u.isBlocked || false,
      isOnHold: u.isOnHold || false,
      isReceivingHeld: u.isReceivingHeld || false,
      activeReceiveCount: u.activeReceiveCount || 0,
      sponsorPaymentPending: u.sponsorPaymentPending || false,
      upgradeRequired: u.upgradeRequired || false
    }));

    console.log(JSON.stringify(userSummary, null, 2));
    console.log('\n');

    // STEP 3: Run Firestore query
    console.log('STEP 3: FIRESTORE QUERY');
    console.log('-'.repeat(80));
    console.log(`Executing query with levelStatus = "${testSenderLevel}":`);
    console.log('  .where(isActivated, ==, true)');
    console.log('  .where(isBlocked, ==, false)');
    console.log('  .where(isOnHole, ==, false)');
    console.log('  .where(isReceivingHeld, ==, false)');
    console.log('  .where(helpVisibility, ==, true)');
    console.log(`  .where(levelStatus, ==, "${testSenderLevel}")\n`);

    const receiverQuery = db
      .collection('users')
      .where('isActivated', '==', true)
      .where('isBlocked', '==', false)
      .where('isOnHole', '==', false)
      .where('isReceivingHeld', '==', false)
      .where('helpVisibility', '==', true)
      .where('levelStatus', '==', testSenderLevel);

    const querySnapshot = await receiverQuery.get();

    console.log(`Query Result: ${querySnapshot.size} users matched\n`);

    // STEP 4: Analyze results
    if (querySnapshot.size === 0) {
      console.log('⚠️  QUERY RETURNED ZERO USERS');
      console.log('\nAnalyzing why...\n');

      const usersWithoutLevelStatus = allUsers.filter(u => !u.levelStatus && !u.level);
      const usersWithWrongLevel = allUsers.filter(u =>
        (u.levelStatus || u.level) && normalizeLevelName(u.levelStatus || u.level) !== testSenderLevel
      );
      const inactiveUsers = allUsers.filter(u => u.isActivated !== true);
      const blockedUsers = allUsers.filter(u => u.isBlocked === true);
      const usersOnHold = allUsers.filter(u => u.isOnHold === true);
      const usersReceivingHeld = allUsers.filter(u => u.isReceivingHeld === true);
      const usersHelpVisibilityFalse = allUsers.filter(u => u.helpVisibility !== true);

      const analysis = {
        totalUsers: allUsers.length,
        usersWithoutLevelStatus: {
          count: usersWithoutLevelStatus.length,
          userIds: usersWithoutLevelStatus.map(u => u.userId || u.uid)
        },
        usersWithWrongLevel: {
          count: usersWithWrongLevel.length,
          userIds: usersWithWrongLevel.map(u => u.userId || u.uid),
          details: usersWithWrongLevel.map(u => ({
            userId: u.userId || u.uid,
            level: normalizeLevelName(u.levelStatus || u.level)
          }))
        },
        inactiveUsers: {
          count: inactiveUsers.length,
          userIds: inactiveUsers.map(u => u.userId || u.uid)
        },
        blockedUsers: {
          count: blockedUsers.length,
          userIds: blockedUsers.map(u => u.userId || u.uid)
        },
        usersOnHold: {
          count: usersOnHold.length,
          userIds: usersOnHold.map(u => u.userId || u.uid)
        },
        usersReceivingHeld: {
          count: usersReceivingHeld.length,
          userIds: usersReceivingHeld.map(u => u.userId || u.uid)
        },
        usersHelpVisibilityFalse: {
          count: usersHelpVisibilityFalse.length,
          userIds: usersHelpVisibilityFalse.map(u => u.userId || u.uid)
        }
      };

      console.log(JSON.stringify(analysis, null, 2));

      return {
        success: true,
        queryResult: 0,
        reason: 'No users matched the Firestore query',
        analysis
      };
    } else {
      console.log(`✅ Query returned ${querySnapshot.size} eligible receivers\n`);

      const queryMatches = [];
      querySnapshot.forEach(doc => {
        queryMatches.push({
          userId: doc.data().userId || doc.id,
          uid: doc.id,
          levelStatus: doc.data().levelStatus,
          isActivated: doc.data().isActivated,
          helpVisibility: doc.data().helpVisibility,
          activeReceiveCount: doc.data().activeReceiveCount || 0,
          receiveLimit: getReceiveLimitForLevel(doc.data().levelStatus || doc.data().level)
        });
      });

      console.log('Users matching query:');
      console.log(JSON.stringify(queryMatches, null, 2));

      // STEP 5: Apply post-query filtering
      console.log('\n\nSTEP 5: POST-QUERY FILTERING ANALYSIS');
      console.log('-'.repeat(80) + '\n');

      const filteringAnalysis = {
        totalFromQuery: queryMatches.length,
        filtered: [],
        eligible: []
      };

      for (const candidate of queryMatches) {
        const reasons = [];

        if (candidate.activeReceiveCount >= candidate.receiveLimit) {
          reasons.push('RECEIVE_LIMIT_REACHED');
        }

        if (reasons.length > 0) {
          filteringAnalysis.filtered.push({
            userId: candidate.userId,
            rejectionReasons: reasons,
            details: {
              activeReceiveCount: candidate.activeReceiveCount,
              receiveLimit: candidate.receiveLimit
            }
          });
        } else {
          filteringAnalysis.eligible.push({
            userId: candidate.userId,
            levelStatus: candidate.levelStatus
          });
        }
      }

      console.log(JSON.stringify(filteringAnalysis, null, 2));

      return {
        success: true,
        queryResult: querySnapshot.size,
        analysis: filteringAnalysis
      };
    }
  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error.message);
    console.error(error.stack);

    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});

// DEPLOYMENT INSTRUCTIONS
/*
To deploy this function:

1. Copy the exports.verifySendHelpEligibility function into
   c:\Users\dell\hh\functions\index.js or backend\functions\index.js

2. Run: firebase deploy --only functions:verifySendHelpEligibility

3. Test with:
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"data": {"testSenderLevel": "Star"}}' \
     https://us-central1-hh-foundation.cloudfunctions.net/verifySendHelpEligibility

4. Or call from client:
   const functions = firebase.functions('us-central1');
   const verifySendHelpEligibility = functions.httpsCallable('verifySendHelpEligibility');
   const result = await verifySendHelpEligibility({testSenderLevel: 'Star'});
   console.log(result.data);
*/
