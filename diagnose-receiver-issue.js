/**
 * Diagnostic script to identify why startHelpAssignment returns NO_ELIGIBLE_RECEIVER
 * Run: node diagnose-receiver-issue.js <senderUid>
 */

const admin = require('firebase-admin');
const serviceAccount = require('./hh-foundation-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hh-foundation.firebaseio.com'
});

const db = admin.firestore();

async function diagnoseReceiverIssue(senderUid) {
  console.log('\n========== DIAGNOSIS: Receiver Eligibility Issue ==========\n');

  try {
    // Get sender info
    const senderSnap = await db.collection('users').doc(senderUid).get();
    if (!senderSnap.exists) {
      console.error(`❌ Sender ${senderUid} not found`);
      return;
    }

    const sender = senderSnap.data();
    console.log('📤 SENDER INFO:');
    console.log(`  UID: ${senderUid}`);
    console.log(`  Level: ${sender.levelStatus || sender.level}`);
    console.log(`  isBlocked: ${sender.isBlocked}`);
    console.log(`  isOnHold: ${sender.isOnHold}`);
    console.log('');

    // Step 1: Check how many users match ONLY basic filters
    console.log('🔍 STEP 1: Basic Query (helpVisibility, isActivated, isBlocked, isReceivingHeld)');
    const basicQuery = db
      .collection('users')
      .where('helpVisibility', '==', true)
      .where('isActivated', '==', true)
      .where('isBlocked', '==', false)
      .where('isReceivingHeld', '==', false);

    const basicSnap = await basicQuery.get();
    console.log(`  Total users matching: ${basicSnap.size}`);

    if (basicSnap.size === 0) {
      console.log('  ⚠️  ZERO users found! Checking for data type issues...\n');
      
      // Check if fields are strings instead of booleans
      console.log('🔍 STEP 2: Check ALL users for type issues');
      const allUsers = await db.collection('users').limit(100).get();
      console.log(`  Total users in system: ${allUsers.size}`);
      
      const typeIssues = [];
      allUsers.forEach(doc => {
        const u = doc.data();
        if (typeof u.helpVisibility === 'string') typeIssues.push({ uid: doc.id, field: 'helpVisibility', value: u.helpVisibility, type: typeof u.helpVisibility });
        if (typeof u.isActivated === 'string') typeIssues.push({ uid: doc.id, field: 'isActivated', value: u.isActivated, type: typeof u.isActivated });
        if (typeof u.isBlocked === 'string') typeIssues.push({ uid: doc.id, field: 'isBlocked', value: u.isBlocked, type: typeof u.isBlocked });
        if (typeof u.isReceivingHeld === 'string') typeIssues.push({ uid: doc.id, field: 'isReceivingHeld', value: u.isReceivingHeld, type: typeof u.isReceivingHeld });
      });

      if (typeIssues.length > 0) {
        console.log(`  ❌ Found ${typeIssues.length} type mismatches:\n`);
        typeIssues.slice(0, 10).forEach(issue => {
          console.log(`    - ${issue.uid}: ${issue.field} = "${issue.value}" (${issue.type})`);
        });
      } else {
        console.log('  ✅ No type mismatches found (booleans are correct)\n');
      }

      // Try individual filters
      console.log('🔍 STEP 3: Test each filter individually');
      const f1 = await db.collection('users').where('helpVisibility', '==', true).get();
      console.log(`  helpVisibility == true: ${f1.size} users`);

      const f2 = await db.collection('users').where('isActivated', '==', true).get();
      console.log(`  isActivated == true: ${f2.size} users`);

      const f3 = await db.collection('users').where('isBlocked', '==', false).get();
      console.log(`  isBlocked == false: ${f3.size} users`);

      const f4 = await db.collection('users').where('isReceivingHeld', '==', false).get();
      console.log(`  isReceivingHeld == false: ${f4.size} users`);

    } else {
      console.log(`  ✅ Found ${basicSnap.size} eligible receivers\n`);
      
      // Show first 5
      console.log('📋 First 5 receivers:');
      basicSnap.docs.slice(0, 5).forEach((doc, idx) => {
        const u = doc.data();
        console.log(`  ${idx + 1}. ${doc.id}`);
        console.log(`     userId: ${u.userId}, referralCount: ${u.referralCount}, level: ${u.levelStatus || u.level}`);
        console.log(`     helpVisibility: ${u.helpVisibility} (${typeof u.helpVisibility})`);
        console.log(`     isActivated: ${u.isActivated} (${typeof u.isActivated})`);
        console.log(`     isBlocked: ${u.isBlocked} (${typeof u.isBlocked})`);
        console.log(`     isReceivingHeld: ${u.isReceivingHeld} (${typeof u.isReceivingHeld})`);
        console.log('');
      });

      // Check if sender is in results
      if (basicSnap.docs.some(doc => doc.id === senderUid)) {
        console.log(`  ⚠️  Sender ${senderUid} IS in the results - needs to be filtered out in JS`);
      } else {
        console.log(`  ✅ Sender ${senderUid} is NOT in results`);
      }
    }

    console.log('\n========== END DIAGNOSIS ==========\n');

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    process.exit(0);
  }
}

// Get sender UID from command line or use default test user
const senderUid = process.argv[2] || 'test-sender-uid';
if (senderUid === 'test-sender-uid') {
  console.log('Usage: node diagnose-receiver-issue.js <senderUid>');
  console.log('Example: node diagnose-receiver-issue.js user123');
  process.exit(1);
}

diagnoseReceiverIssue(senderUid);
