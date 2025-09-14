// firebase-admin-setup/updateUserHoldFlags.js

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

async function fixUserHoldFlags() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
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
      await doc.ref.update(updateData);
      console.log(`Updated user ${doc.id}:`, updateData);
      updatedCount++;
    }
  }

  console.log(`Done. Updated ${updatedCount} user(s).`);
}

fixUserHoldFlags()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error updating users:', err);
    process.exit(1);
  }); 