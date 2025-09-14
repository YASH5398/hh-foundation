// firebase-admin-setup/addMissingHoldFieldsToUsers.js

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

async function addMissingHoldFieldsToUsers() {
  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;
  let batch = db.batch();
  let batchOps = 0;
  const BATCH_LIMIT = 500;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    let needsUpdate = false;
    const updateData = {};
    if (typeof data.isReceivingHeld === 'undefined') {
      updateData.isReceivingHeld = false;
      needsUpdate = true;
    }
    if (typeof data.isOnHold === 'undefined') {
      updateData.isOnHold = false;
      needsUpdate = true;
    }
    if (needsUpdate) {
      batch.update(userDoc.ref, updateData);
      updatedCount++;
      batchOps++;
      console.log(`Queued update for user ${userDoc.id}:`, updateData);
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
  console.log(`Done. Updated ${updatedCount} user(s) with missing hold fields.`);
}

addMissingHoldFieldsToUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error updating users:', err);
    process.exit(1);
  }); 