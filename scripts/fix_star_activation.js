const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Usage: node scripts/fix_star_activation.js [serviceAccountKey.json] [--apply]
const args = process.argv.slice(2);
const serviceAccountPath = args.find(arg => arg.endsWith('.json'));
const dryRun = !args.includes('--apply');

if (!serviceAccountPath) {
    console.error('Error: Please provide a path to your service account key JSON file.');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function runMigration() {
    console.log(`🚀 Starting Star Activation Migration (${dryRun ? 'DRY RUN' : 'FULL RUN'})`);

    const stats = {
        totalScanned: 0,
        migratedUsers: 0,
        migratedSendHelp: 0,
        migratedReceiveHelp: 0,
        errors: 0
    };

    try {
        // 1. Find all Star users
        const usersSnap = await db.collection('users')
            .where('level', 'in', ['Star', 1]) // handle both formats
            .get();

        console.log(`🔍 Scanned ${usersSnap.size} Star users...`);
        stats.totalScanned = usersSnap.size;

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const uid = userDoc.id;

            // Find all sendHelp for this user
            const sendHelpSnap = await db.collection('sendHelp')
                .where('senderUid', '==', uid)
                .get();

            let userNeedsActivationFix = false;
            const confirmedHelps = sendHelpSnap.docs.filter(doc => {
                const d = doc.data();
                return ['confirmed', 'force_confirmed', 'payment_done'].includes(d.status) || d.receiverConfirmed === true;
            });

            if (confirmedHelps.length > 0) {
                // This user has at least one confirmed help.
                // They should be activated and starSendHelpDone should be true.
                if (userData.starSendHelpDone !== true || userData.isActivated !== true) {
                    userNeedsActivationFix = true;
                }

                // All these helps should be "completed"
                for (const helpDoc of confirmedHelps) {
                    const hData = helpDoc.data();
                    if (hData.status !== 'completed') {
                        console.log(`[FIX] Help ${helpDoc.id} (Sender: ${uid}) has status ${hData.status}, should be completed`);

                        if (!dryRun) {
                            await db.runTransaction(async (tx) => {
                                const sRef = db.collection('sendHelp').doc(helpDoc.id);
                                const rRef = db.collection('receiveHelp').doc(helpDoc.id);

                                tx.update(sRef, {
                                    status: 'completed',
                                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                                    completedBy: 'migration_script_fix'
                                });

                                // Also update receiveHelp if it exists
                                const rSnap = await tx.get(rRef);
                                if (rSnap.exists) {
                                    tx.update(rRef, {
                                        status: 'completed',
                                        completedAt: admin.firestore.FieldValue.serverTimestamp(),
                                        completedBy: 'migration_script_fix'
                                    });
                                    stats.migratedReceiveHelp++;
                                }
                                stats.migratedSendHelp++;
                            });
                        } else {
                            stats.migratedSendHelp++;
                            stats.migratedReceiveHelp++;
                        }
                    }
                }

                if (userNeedsActivationFix) {
                    console.log(`[FIX] User ${uid} needs activation/starSendHelpDone flag set`);
                    if (!dryRun) {
                        await db.collection('users').doc(uid).update({
                            starSendHelpDone: true,
                            isActivated: true,
                            activatedAt: userData.activatedAt || admin.firestore.FieldValue.serverTimestamp(),
                            level: userData.level || 'Star',
                            levelStatus: 'active'
                        });
                        stats.migratedUsers++;
                    } else {
                        stats.migratedUsers++;
                    }
                }
            }
        }

        console.log('\n✅ Migration finished!');
        console.log('Stats:', stats);
        if (dryRun) {
            console.log('\n⚠️ This was a DRY RUN. No changes were applied. Use --apply to execute.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
