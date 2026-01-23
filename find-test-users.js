#!/usr/bin/env node

/**
 * FIND ELIGIBLE TEST USERS
 * Queries live Firestore for users suitable for Send Help testing
 * Requirements:
 * - Two users with same levelStatus
 * - Different uid
 * - Both isActivated == true
 * - Sender has NO active sendHelp
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: 'hh-foundation'
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function findTestUsers() {
  console.log('🔍 SEARCHING FOR ELIGIBLE TEST USERS...\n');

  try {
    // Step 1: Get ALL users grouped by levelStatus
    console.log('📊 Step 1: Fetching all activated users...');
    const usersSnapshot = await db
      .collection('users')
      .where('isActivated', '==', true)
      .get();

    console.log(`✅ Found ${usersSnapshot.size} activated users\n`);

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });

    if (users.length < 2) {
      console.error('❌ ERROR: Need at least 2 users, found:', users.length);
      process.exit(1);
    }

    // Group by levelStatus
    const byLevel = {};
    users.forEach(user => {
      const level = user.levelStatus || user.level || 'Star';
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(user);
    });

    console.log('📋 Users by Level:');
    Object.entries(byLevel).forEach(([level, levelUsers]) => {
      console.log(`  ${level}: ${levelUsers.length} users`);
    });
    console.log('');

    // Find a level with 2+ users
    let testLevel = null;
    let levelUsers = [];
    for (const [level, users] of Object.entries(byLevel)) {
      if (users.length >= 2) {
        testLevel = level;
        levelUsers = users;
        break;
      }
    }

    if (!testLevel) {
      console.error('❌ ERROR: No level has 2+ users');
      process.exit(1);
    }

    console.log(`✅ Selected level: "${testLevel}" with ${levelUsers.length} users\n`);

    // Step 2: Check each user for active sendHelp
    console.log(`📍 Step 2: Checking active sendHelp for ${testLevel} users...\n`);

    const eligibleUsers = [];

    for (const user of levelUsers) {
      const activeSendQuery = await db
        .collection('sendHelp')
        .where('senderUid', '==', user.uid)
        .where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])
        .get();

      const hasActiveSend = !activeSendQuery.empty;
      const activeCount = activeSendQuery.size;

      // Get receive count for this user
      const receiveLimit = getReceiveLimit(testLevel);
      const activeReceiveCount = user.activeReceiveCount || 0;
      const canReceive = activeReceiveCount < receiveLimit;

      console.log(`👤 User: ${user.userId}`);
      console.log(`   UID: ${user.uid.substring(0, 16)}...`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Active sendHelp: ${activeCount} ${hasActiveSend ? '❌' : '✅'}`);
      console.log(`   Receive count: ${activeReceiveCount}/${receiveLimit} ${canReceive ? '✅' : '❌'}`);
      console.log(`   Blocked: ${user.isBlocked === true ? '❌' : '✅'}`);
      console.log(`   On Hold: ${user.isOnHold === true ? '❌' : '✅'}`);
      console.log(`   Receiving Held: ${user.isReceivingHeld === true ? '❌' : '✅'}`);
      console.log(`   Help Visibility: ${user.helpVisibility !== false ? '✅' : '❌'}`);
      console.log('');

      // Eligible if: no active send, not blocked, can receive, help visible
      if (!hasActiveSend && 
          user.isBlocked !== true && 
          user.isOnHold !== true &&
          user.isReceivingHeld !== true &&
          user.helpVisibility !== false &&
          canReceive) {
        eligibleUsers.push(user);
      }
    }

    console.log(`\n✅ Found ${eligibleUsers.length} eligible users\n`);

    if (eligibleUsers.length < 2) {
      console.error('❌ ERROR: Need 2 eligible users, found:', eligibleUsers.length);
      console.error('   At least one user needs: no active sendHelp, not blocked, help visible, under receive limit');
      process.exit(1);
    }

    // Select sender and receiver
    const sender = eligibleUsers[0];
    const receiver = eligibleUsers[1];

    console.log('🎯 TEST USER PAIR SELECTED:\n');
    console.log('─ SENDER ─');
    console.log(`  userId: ${sender.userId}`);
    console.log(`  uid: ${sender.uid}`);
    console.log(`  email: ${sender.email}`);
    console.log(`  level: ${testLevel}`);
    console.log(`  isActivated: true`);
    console.log('');
    console.log('─ RECEIVER ─');
    console.log(`  userId: ${receiver.userId}`);
    console.log(`  uid: ${receiver.uid}`);
    console.log(`  email: ${receiver.email}`);
    console.log(`  level: ${testLevel}`);
    console.log(`  activeReceiveCount: ${receiver.activeReceiveCount || 0}/${getReceiveLimit(testLevel)}`);
    console.log('');

    console.log('✅ READY FOR TESTING!\n');
    console.log('📝 Next steps:');
    console.log(`1. Login as SENDER: ${sender.email}`);
    console.log(`2. Navigate to Dashboard → Send Help`);
    console.log(`3. Click "Send Help" button`);
    console.log(`4. Watch Cloud Function logs: https://console.firebase.google.com/project/hh-foundation/functions/logs?functionName=startHelpAssignment`);
    console.log(`5. Verify sendHelp and receiveHelp documents created in Firestore`);
    console.log(`6. Login as RECEIVER: ${receiver.email}`);
    console.log(`7. Verify help appears in Receive Help screen`);
    console.log('');

    // Save to file for reference
    const testConfig = {
      timestamp: new Date().toISOString(),
      level: testLevel,
      sender: {
        userId: sender.userId,
        uid: sender.uid,
        email: sender.email
      },
      receiver: {
        userId: receiver.userId,
        uid: receiver.uid,
        email: receiver.email
      }
    };

    console.log('💾 Test config saved for reference');
    console.log(JSON.stringify(testConfig, null, 2));

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  }
}

function getReceiveLimit(level) {
  const limits = {
    'Star': 3,
    'Silver': 9,
    'Gold': 27,
    'Platinum': 81,
    'Diamond': 243
  };
  return limits[level] || 3;
}

// Run
findTestUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
