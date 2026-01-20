/**
 * SEND HELP RECEIVER DEBUG TEST
 * Comprehensive test to identify why "No eligible receivers available" occurs
 */

import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * FETCH ALL USERS AND LOG DETAILED INFORMATION
 */
export async function runSendHelpReceiverDebugTest() {
  console.log('🚀 STARTING SEND HELP RECEIVER DEBUG TEST');
  console.log('==========================================');

  try {
    // 1. Fetch ALL users
    console.log('📊 Step 1: Fetching ALL users from Firestore...');
    const allUsersQuery = query(collection(db, 'users'));
    const allUsersSnap = await getDocs(allUsersQuery);
    const allUsers = allUsersSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${allUsers.length} total users in system`);

    // 2. Display user table
    console.log('\n📋 USER TABLE (All Users):');
    console.log('==========================================');
    console.log('| UID | Full Name | Level Status | Activated | Blocked |');
    console.log('==========================================');

    allUsers.forEach(user => {
      const uid = user.uid.substring(0, 8) + '...';
      const name = (user.fullName || 'Unknown').substring(0, 15);
      const level = user.levelStatus || 'N/A';
      const activated = user.isActivated ? '✅' : '❌';
      const blocked = (user.isBlocked || user.paymentBlocked) ? '🚫' : '✅';

      console.log(`| ${uid} | ${name.padEnd(15)} | ${level.padEnd(12)} | ${activated} | ${blocked} |`);
    });
    console.log('==========================================');

    // 3. Filter activated users
    const activatedUsers = allUsers.filter(user => user.isActivated === true);
    console.log(`\n🎯 ACTIVATED USERS: ${activatedUsers.length}`);

    // 4. Group by level
    const usersByLevel = {};
    activatedUsers.forEach(user => {
      const level = user.levelStatus || 'Unknown';
      if (!usersByLevel[level]) {
        usersByLevel[level] = [];
      }
      usersByLevel[level].push(user);
    });

    console.log('\n📈 USERS BY LEVEL:');
    Object.keys(usersByLevel).forEach(level => {
      console.log(`  ${level}: ${usersByLevel[level].length} users`);
    });

    // 5. Test specific query (Star level, activated)
    console.log('\n🔍 TESTING SPECIFIC QUERY (Star level, activated):');
    const starQuery = query(
      collection(db, 'users'),
      where('levelStatus', '==', 'Star'),
      where('isActivated', '==', true)
    );

    const starSnap = await getDocs(starQuery);
    const starUsers = starSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    console.log(`  Query returned: ${starUsers.length} users`);
    starUsers.forEach(user => {
      console.log(`    - ${user.userId} (${user.fullName})`);
    });

    // 6. Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (allUsers.length === 0) {
      console.log('❌ NO USERS FOUND - Database is empty');
      return { success: false, reason: 'No users in database' };
    }

    if (activatedUsers.length === 0) {
      console.log('❌ NO ACTIVATED USERS - All users are inactive');
      return { success: false, reason: 'No activated users' };
    }

    const starLevelUsers = usersByLevel['Star'] || [];
    if (starLevelUsers.length === 0) {
      console.log('❌ NO STAR LEVEL USERS - No users at Star level');
      return { success: false, reason: 'No Star level users' };
    }

    if (starUsers.length === 0) {
      console.log('❌ QUERY FAILED - Firestore query returned 0 results despite users existing');
      console.log('💡 Possible causes:');
      console.log('   - Field name mismatch (level vs levelStatus)');
      console.log('   - Data type mismatch');
      console.log('   - Missing Firestore index');
      console.log('   - Permission rules');
      return { success: false, reason: 'Query failed despite data existing' };
    }

    console.log('✅ QUERY SUCCESSFUL - Receivers should be available');
    return {
      success: true,
      totalUsers: allUsers.length,
      activatedUsers: activatedUsers.length,
      starLevelUsers: starLevelUsers.length,
      queryResults: starUsers.length
    };

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    return { success: false, error: error.message };
  }
}

/**
 * RUN TEST AND LOG RESULTS
 */
export async function runTestAndLog() {
  const result = await runSendHelpReceiverDebugTest();

  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));

  if (result.success) {
    console.log('✅ TEST PASSED');
    console.log(`   Total users: ${result.totalUsers}`);
    console.log(`   Activated users: ${result.activatedUsers}`);
    console.log(`   Star level users: ${result.starLevelUsers}`);
    console.log(`   Query results: ${result.queryResults}`);
  } else {
    console.log('❌ TEST FAILED');
    console.log(`   Reason: ${result.reason || result.error}`);
  }

  console.log('='.repeat(50));
  return result;
}

// Make globally available for console testing
window.runSendHelpReceiverDebugTest = runTestAndLog;
