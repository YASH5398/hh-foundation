/**
 * VERIFY STAR ACTIVATION STATE
 * ============================
 * 
 * This script checks the current state of Star users and their helps
 * to identify if any users have the receiver-appearing-after-activation bug.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function verifyStarActivationState() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  STAR ACTIVATION BUG - DIAGNOSIS SCRIPT');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Step 1: Find Star users with starSendHelpDone = true
        console.log('Step 1: Finding activated Star users...');
        const starUsersQuery = await db.collection('users')
            .where('level', '==', 'Star')
            .where('starSendHelpDone', '==', true)
            .get();

        console.log(`✅ Found ${starUsersQuery.size} activated Star users\n`);

        if (starUsersQuery.empty) {
            console.log('✅ No activated Star users found. No bug possible.');
            return;
        }

        let bugCount = 0;
        const buggyUsers = [];

        // Check each user
        for (const userDoc of starUsersQuery.docs) {
            const uid = userDoc.id;
            const userData = userDoc.data();

            console.log(`\n[${uid}] ${userData.fullName || userData.name || 'Unknown'}`);
            console.log(`  - User ID: ${userData.userId}`);
            console.log(`  - starSendHelpDone: ${userData.starSendHelpDone}`);
            console.log(`  - isActivated: ${userData.isActivated}`);

            // Query for "active" helps (same query the frontend uses)
            const activeStatuses = ['assigned', 'payment_requested', 'payment_done'];
            const activeSendHelps = await db.collection('sendHelp')
                .where('senderUid', '==', uid)
                .where('status', 'in', activeStatuses)
                .get();

            if (!activeSendHelps.empty) {
                console.log(`  ✅ NO ACTIVE HELPS (frontend query returns ${activeSendHelps.size} - correct!)`);
            } else {
                console.log(`  ✅ No active helps found (frontend query correct)`);
            }

            // Check for ANY sendHelp docs (including completed/confirmed)
            const allSendHelps = await db.collection('sendHelp')
                .where('senderUid', '==', uid)
                .get();

            console.log(`  - Total sendHelp docs: ${allSendHelps.size}`);

            // List status breakdown
            const statusBreakdown = {};
            allSendHelps.forEach(doc => {
                const status = doc.data().status;
                statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
            });

            console.log(`  - Status breakdown:`, JSON.stringify(statusBreakdown, null, 2));

            // Check if any help is NOT completed
            const nonCompletedHelps = allSendHelps.docs.filter(doc => {
                const status = doc.data().status;
                return !['completed'].includes(status);
            });

            if (nonCompletedHelps.length > 0) {
                console.log(`  ⚠️  WARNING: Found ${nonCompletedHelps.length} non-completed helps!`);
                bugCount++;
                buggyUsers.push({
                    uid,
                    userId: userData.userId,
                    name: userData.fullName || userData.name,
                    nonCompletedHelps: nonCompletedHelps.map(doc => ({
                        helpId: doc.id,
                        status: doc.data().status,
                        receiverName: doc.data().receiverName
                    }))
                });

                nonCompletedHelps.forEach(doc => {
                    const data = doc.data();
                    console.log(`    - helpId: ${doc.id}`);
                    console.log(`      status: ${data.status}`);
                    console.log(`      receiver: ${data.receiverName} (${data.receiverId})`);
                    console.log(`      createdAt: ${data.createdAt?.toDate().toISOString() || 'unknown'}`);
                });
            } else {
                console.log(`  ✅ All helps are completed (no bug)`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('SUMMARY:');
        console.log(`  - Total activated Star users: ${starUsersQuery.size}`);
        console.log(`  - Users with the bug: ${bugCount}`);
        console.log(`  - Users without the bug: ${starUsersQuery.size - bugCount}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        if (bugCount > 0) {
            console.log('⚠️  BUG DETECTED!\n');
            console.log('Affected users:');
            buggyUsers.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name} (${user.userId})`);
                console.log(`   UID: ${user.uid}`);
                console.log(`   Non-completed helps:`);
                user.nonCompletedHelps.forEach(help => {
                    console.log(`     - ${help.helpId} (status: ${help.status})`);
                });
            });

            console.log('\n📝 NEXT STEPS:');
            console.log('1. Review the script: scripts/fix_star_completed_helps.js');
            console.log('2. Run in DRY mode first: node scripts/fix_star_completed_helps.js');
            console.log('3. If output looks correct, set DRY_RUN = false and run again');
        } else {
            console.log('✅ NO BUG DETECTED');
            console.log('All activated Star users have properly completed helps.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Run the verification
verifyStarActivationState()
    .then(() => {
        console.log('\n✅ Verification completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });
