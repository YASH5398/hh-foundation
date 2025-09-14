// firebase-admin-setup/batchSetHoldForHelpedUsers.js

const admin = require('firebase-admin');
const path = require('path');

// Update this path to your service account key if needed
const serviceAccount = require(path.resolve(__dirname, './serviceAccountKey.json.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function batchSetHoldForHelpedUsers() {
  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;
  let batch = db.batch();
  let batchOps = 0;
  const BATCH_LIMIT = 400; // Firestore batch limit is 500

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    if ((data.helpReceived || 0) >= 3) {
      batch.update(userDoc.ref, {
        isReceivingHeld: true,
        isOnHold: true,
      });
      updatedCount++;
      batchOps++;
      console.log(`Queued update for user ${userDoc.id}`);
      if (batchOps >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`Committed a batch of ${batchOps} updates.`);
        batch = db.batch();
        batchOps = 0;
      }
    }
  }
  if (batchOps > 0) {
    await batch.commit();
    console.log(`Committed a final batch of ${batchOps} updates.`);
  }
  console.log(`Done. Updated ${updatedCount} user(s) with helpReceived >= 3.`);
}

batchSetHoldForHelpedUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error updating users:', err);
    process.exit(1);
  }); 