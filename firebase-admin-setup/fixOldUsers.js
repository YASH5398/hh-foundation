// firebase-admin-setup/fixOldUsers.js

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

async function fixOldUsers() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    if ((data.helpReceived || 0) >= 3) {
      await userDoc.ref.update({
        isReceivingHeld: true,
        isOnHold: true,
      });
      console.log(`Updated user ${userDoc.id}: isReceivingHeld and isOnHold set to true.`);
    }
  }

  console.log('Done fixing old users.');
}

fixOldUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error updating users:', err);
    process.exit(1);
  }); 