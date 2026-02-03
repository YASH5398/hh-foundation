const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Usage: node scripts/mandatory_migration.js [serviceAccountKey.json] [--apply]
const args = process.argv.slice(2);
const serviceAccountPath = args.find(arg => arg.endsWith('.json'));
const dryRun = !args.includes('--apply');

if (!serviceAccountPath) {
    console.error('Error: Please provide a path to your service account key JSON file.');
    console.log('You can find or create a service account in Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function runMigration() {
    console.log(`🚀 Starting Mandatory Star Activation Migration (${dryRun ? 'DRY RUN' : 'FULL RUN'})`);

    const stats = {
        sendHelpUpdated: 0,
        receiveHelpUpdated: 0,
        usersUpdated: 0,
        errors: 0
    };

    try {
        // Query for sendHelp where receiverConfirmed === true AND status != "completed"
        const sendHelpSnap = await db.collection('sendHelp')
            .where('receiverConfirmed', '==', true)
            .get();

        console.log(`🔍 Found ${sendHelpSnap.size} sendHelp documents with receiverConfirmed === true`);

        for (const doc of sendHelpSnap.docs) {
            const data = doc.data();
            const helpId = doc.id;
            const senderUid = data.senderUid;

            if (data.status !== 'completed') {
                console.log(`[FIX] Help ${helpId} - current status: ${data.status} -> moving to completed`);

                if (!dryRun) {
                    await db.runTransaction(async (tx) => {
                        const sRef = db.collection('sendHelp').doc(helpId);
                        const rRef = db.collection('receiveHelp').doc(helpId);
                        const userRef = db.collection('users').doc(senderUid);

                        tx.update(sRef, {
                            status: 'completed',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            completedAt: data.completedAt || admin.firestore.FieldValue.serverTimestamp()
                        });

                        tx.update(rRef, {
                            status: 'completed',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            completedAt: data.completedAt || admin.firestore.FieldValue.serverTimestamp()
                        });

                        tx.update(userRef, {
                            starSendHelpDone: true,
                            isActivated: true,
                            levelStatus: 'active'
                        });
                    });
                    stats.sendHelpUpdated++;
                    stats.receiveHelpUpdated++;
                    stats.usersUpdated++;
                } else {
                    stats.sendHelpUpdated++;
                    stats.receiveHelpUpdated++;
                    stats.usersUpdated++;
                }
            }
        }

        // Also check for documents in 'confirmed' or 'force_confirmed' status that are for Star level
        // (Just in case receiverConfirmed was missed)
        const confirmedSnap = await db.collection('sendHelp')
            .where('status', 'in', ['confirmed', 'force_confirmed'])
            .get();

        for (const doc of confirmedSnap.docs) {
            const data = doc.data();
            // Check if sender is star level (we might need to fetch user doc for this)
            const userSnap = await db.collection('users').doc(data.senderUid).get();
            const userData = userSnap.data();
            const level = userData?.level || userData?.levelStatus;

            if (level === 'Star' || level === 1) {
                console.log(`[FIX] Star Help ${doc.id} (Status: ${data.status}) -> moving to completed`);
                if (!dryRun) {
                    await db.runTransaction(async (tx) => {
                        tx.update(db.collection('sendHelp').doc(doc.id), { status: 'completed' });
                        tx.update(db.collection('receiveHelp').doc(doc.id), { status: 'completed' });
                        tx.update(db.collection('users').doc(data.senderUid), {
                            starSendHelpDone: true,
                            isActivated: true
                        });
                    });
                    stats.sendHelpUpdated++;
                } else {
                    stats.sendHelpUpdated++;
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
