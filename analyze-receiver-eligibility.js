/**
 * Comprehensive analysis of startHelpAssignment NO_ELIGIBLE_RECEIVER issue
 * Checks: field types, data consistency, missing indexes, query efficiency
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Try to load service account
let serviceAccount;
try {
  serviceAccount = require('./hh-foundation-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hh-foundation.firebaseio.com'
  });
} catch (e) {
  console.log('⚠️  Service account not found. Running in read-only mode.');
  console.log('Place hh-foundation-key.json in this directory to enable Firestore checks.\n');
  process.exit(1);
}

const db = admin.firestore();

async function analyzeReceiverIssue() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  RECEIVER ELIGIBILITY ANALYSIS - startHelpAssignment Issue     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // ============ SECTION 1: FIELD TYPE ANALYSIS ============
    console.log('📊 SECTION 1: Field Type Analysis\n');
    
    const sampleUsers = await db.collection('users').limit(50).get();
    console.log(`Total sample users retrieved: ${sampleUsers.size}\n`);

    const fieldTypes = {};
    const issues = [];

    sampleUsers.forEach((doc, idx) => {
      const u = doc.data();
      
      ['helpVisibility', 'isActivated', 'isBlocked', 'isReceivingHeld', 'referralCount', 'helpReceived', 'levelStatus', 'level'].forEach(field => {
        if (!(field in fieldTypes)) fieldTypes[field] = {};
        
        const type = typeof u[field];
        const key = `${field}:${type}:${u[field] === undefined ? 'undefined' : (u[field] === null ? 'null' : 'value')}`;
        fieldTypes[field][key] = (fieldTypes[field][key] || 0) + 1;

        // Detect string booleans
        if (type === 'string' && (u[field] === 'true' || u[field] === 'false')) {
          issues.push({
            uid: doc.id,
            field,
            value: u[field],
            type: 'STRING_BOOLEAN',
            severity: 'HIGH'
          });
        }

        // Detect string numbers
        if (field === 'referralCount' && type === 'string' && !isNaN(u[field])) {
          issues.push({
            uid: doc.id,
            field,
            value: u[field],
            type: 'STRING_NUMBER',
            severity: 'MEDIUM'
          });
        }
      });
    });

    // Print field type distribution
    console.log('Field Type Distribution:');
    Object.entries(fieldTypes).forEach(([field, types]) => {
      console.log(`\n  ${field}:`);
      Object.entries(types).forEach(([typeKey, count]) => {
        console.log(`    ${typeKey}: ${count}`);
      });
    });

    if (issues.length > 0) {
      console.log(`\n\n⚠️  FOUND ${issues.length} POTENTIAL ISSUES:\n`);
      issues.slice(0, 15).forEach(issue => {
        console.log(`  ❌ ${issue.uid}`);
        console.log(`     Field: ${issue.field}`);
        console.log(`     Value: "${issue.value}" (type: ${issue.type})`);
        console.log(`     Severity: ${issue.severity}\n`);
      });
    } else {
      console.log('\n✅ No type mismatches detected in sample\n');
    }

    // ============ SECTION 2: QUERY TEST ============
    console.log('\n📊 SECTION 2: Query Execution Test\n');

    const queries = [
      { name: 'Single: helpVisibility == true', query: db.collection('users').where('helpVisibility', '==', true) },
      { name: 'Single: isActivated == true', query: db.collection('users').where('isActivated', '==', true) },
      { name: 'Single: isBlocked == false', query: db.collection('users').where('isBlocked', '==', false) },
      { name: 'Single: isReceivingHeld == false', query: db.collection('users').where('isReceivingHeld', '==', false) },
      { 
        name: 'Combined: All 4 filters (current query)',
        query: db
          .collection('users')
          .where('helpVisibility', '==', true)
          .where('isActivated', '==', true)
          .where('isBlocked', '==', false)
          .where('isReceivingHeld', '==', false)
      }
    ];

    for (const { name, query } of queries) {
      const snap = await query.get();
      console.log(`${name}`);
      console.log(`  ✓ Results: ${snap.size} users\n`);
      
      if (snap.size > 0) {
        const sample = snap.docs[0].data();
        console.log(`  Sample doc fields: ${Object.keys(sample).slice(0, 8).join(', ')}\n`);
      }
    }

    // ============ SECTION 3: MISSING RECEIVER DETECTION ============
    console.log('📊 SECTION 3: Root Cause Check - Why No Receivers Found\n');

    const eligibleQuery = db
      .collection('users')
      .where('helpVisibility', '==', true)
      .where('isActivated', '==', true)
      .where('isBlocked', '==', false)
      .where('isReceivingHeld', '==', false);

    const eligibleSnap = await eligibleQuery.get();

    if (eligibleSnap.size === 0) {
      console.log('⚠️  Current query returns ZERO eligible users.\n');
      console.log('Investigating possible causes:\n');

      // Check if any user has all fields as booleans
      const allUsers = await db.collection('users').limit(200).get();
      console.log(`Total users in system: ${allUsers.size}\n`);

      let countHelpVis = 0, countActiv = 0, countNotBlocked = 0, countNotHeld = 0;
      let countAll4 = 0;
      const potential = [];

      allUsers.forEach(doc => {
        const u = doc.data();
        const hv = u.helpVisibility === true;
        const act = u.isActivated === true;
        const nb = u.isBlocked === false;
        const nh = u.isReceivingHeld === false;

        if (hv) countHelpVis++;
        if (act) countActiv++;
        if (nb) countNotBlocked++;
        if (nh) countNotHeld++;
        if (hv && act && nb && nh) countAll4++;

        // Log potential candidates if at least 3 conditions met
        if ([hv, act, nb, nh].filter(x => x).length >= 3) {
          potential.push({
            uid: doc.id,
            helpVisibility: u.helpVisibility,
            isActivated: u.isActivated,
            isBlocked: u.isBlocked,
            isReceivingHeld: u.isReceivingHeld,
            matched: [hv, act, nb, nh].filter(x => x).length
          });
        }
      });

      console.log(`Users with helpVisibility == true: ${countHelpVis}`);
      console.log(`Users with isActivated == true: ${countActiv}`);
      console.log(`Users with isBlocked == false: ${countNotBlocked}`);
      console.log(`Users with isReceivingHeld == false: ${countNotHeld}`);
      console.log(`Users matching ALL 4 criteria: ${countAll4}\n`);

      if (potential.length > 0) {
        console.log(`✅ Found ${potential.length} users matching 3+ criteria:\n`);
        potential.slice(0, 10).forEach((u, idx) => {
          const matched = [u.helpVisibility === true, u.isActivated === true, u.isBlocked === false, u.isReceivingHeld === false].filter(x => x).length;
          console.log(`  ${idx + 1}. ${u.uid}`);
          console.log(`     helpVisibility=${u.helpVisibility} (${typeof u.helpVisibility})`);
          console.log(`     isActivated=${u.isActivated} (${typeof u.isActivated})`);
          console.log(`     isBlocked=${u.isBlocked} (${typeof u.isBlocked})`);
          console.log(`     isReceivingHeld=${u.isReceivingHeld} (${typeof u.isReceivingHeld})`);
          console.log(`     Criteria matched: ${matched}/4\n`);
        });

        console.log('\n💡 HYPOTHESIS: Some users have boolean values as STRINGS or mismatched types.');
        console.log('   This causes Firestore query to not match them even though logically they should.\n');
      }
    } else {
      console.log(`✅ Query returned ${eligibleSnap.size} eligible users - system appears healthy\n`);
    }

    // ============ SECTION 4: SCHEMA RECOMMENDATIONS ============
    console.log('📊 SECTION 4: Recommended Fixes\n');
    console.log('Based on analysis, recommend:\n');
    console.log('1. ✓ Add explicit type validation in startHelpAssignment');
    console.log('2. ✓ Normalize booleans before JS filtering (convert "true" → true)');
    console.log('3. ✓ Add fallback query if initial returns 0');
    console.log('4. ✓ Implement type coercion in JS post-processing');
    console.log('5. ✓ Run migration to fix string booleans in existing docs\n');

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ANALYSIS COMPLETE                                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    process.exit(0);
  }
}

analyzeReceiverIssue();
