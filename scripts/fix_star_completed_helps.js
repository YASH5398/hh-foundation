/**
 * FIX STAR ACTIVATION BUG
 * ======================
 * 
 * Root Cause:
 * When a Star user's Send Help is confirmed, the backend sets status to 'completed',
 * but OLD confirmed helps may still have status='confirmed' instead of 'completed'.
 * This causes the frontend query to find them as "active" helps.
 * 
 * This script force-updates ALL confirmed/completed Star Send Helps to:
 * - status = 'completed'
 * - completedAt = serverTimestamp
 * - completedBy = 'system_migration_fix'
 * 
 * Run Mode:
 * - DRY_RUN = true: Only log what would be changed
 * - DRY_RUN = false: Actually apply the changes
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const DRY_RUN = true; // Set to false to apply changes

async function fixStarCompletedHelps() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  FIX STAR ACTIVATION BUG - COMPLETED HELPS MIGRATION     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✅ LIVE (will apply changes)'}\n`);

    try {
        // Step 1: Find all Star users where starSendHelpDone = true
        console.log('Step 1: Finding Star users with starSendHelpDone = true...');
        const starUsersQuery = await db.collection('users')
            .where('level', '==', 'Star')
            .where('starSendHelpDone', '==', true)
            .get();

        console.log(`Found ${starUsersQuery.size} Star users with starSendHelpDone = true\n`);

        if (starUsersQuery.empty) {
            console.log('✅ No Star users to process. Exiting.');
            return;
        }

        const starUserUids = starUsersQuery.docs.map(doc => doc.id);

        // Step 2: Find all sendHelp documents for these users with status = confirmed or completed
        console.log('Step 2: Finding sendHelp documents for Star users...');
        const batch = db.batch();
        let totalSendHelps = 0;
        let totalReceiveHelps = 0;
        let needsUpdate = [];

        for (const uid of starUserUids) {
            // Query sendHelp
            const sendHelpQuery = await db.collection('sendHelp')
                .where('senderUid', '==', uid)
                .where('status', 'in', ['confirmed', 'force_confirmed'])
                .get();

            sendHelpQuery.forEach(doc => {
                const data = doc.data();
                totalSendHelps++;

                console.log(`[SendHelp] ${doc.id}: senderUid=${uid}, status=${data.status}, senderLevel=${data.senderLevel}`);

                needsUpdate.push({
                    collection: 'sendHelp',
                    docId: doc.id,
                    currentStatus: data.status,
                    senderUid: uid
                });

                if (!DRY_RUN) {
                    batch.update(db.collection('sendHelp').doc(doc.id), {
                        status: 'completed',
                        completedAt: admin.firestore.FieldValue.serverTimestamp(),
                        completedBy: 'system_migration_star_fix',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            });

            // Query receiveHelp
            const receiveHelpQuery = await db.collection('receiveHelp')
                .where('senderUid', '==', uid)
                .where('status', 'in', ['confirmed', 'force_confirmed'])
                .get();

            receiveHelpQuery.forEach(doc => {
                const data = doc.data();
                totalReceiveHelps++;

                console.log(`[ReceiveHelp] ${doc.id}: senderUid=${uid}, status=${data.status}, senderLevel=${data.senderLevel}`);

                needsUpdate.push({
                    collection: 'receiveHelp',
                    docId: doc.id,
                    currentStatus: data.status,
                    senderUid: uid
                });

                if (!DRY_RUN) {
                    batch.update(db.collection('receiveHelp').doc(doc.id), {
                        status: 'completed',
                        completedAt: admin.firestore.FieldValue.serverTimestamp(),
                        completedBy: 'system_migration_star_fix',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('Summary:');
        console.log(`  - Total Star users: ${starUserUids.length}`);
        console.log(`  - SendHelp docs to update: ${totalSendHelps}`);
        console.log(`  - ReceiveHelp docs to update: ${totalReceiveHelps}`);
        console.log(`  - Total docs to update: ${needsUpdate.length}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        if (DRY_RUN) {
            console.log('🔍 DRY RUN MODE - No changes made');
            console.log('Set DRY_RUN = false to apply these changes\n');

            if (needsUpdate.length > 0) {
                console.log('Documents that would be updated:');
                needsUpdate.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.collection}/${item.docId} (status: ${item.currentStatus} → completed)`);
                });
            }
        } else {
            console.log('✅ Committing batch update...');
            await batch.commit();
            console.log(`✅ Successfully updated ${needsUpdate.length} documents`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Run the migration
fixStarCompletedHelps()
    .then(() => {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
