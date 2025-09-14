const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixBlockFlags() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    let needUpdate = false;
    const updates = {};
    const userRef = db.collection('users').doc(doc.id);

    ['isBlocked', 'isOnHold', 'isReceivingHeld'].forEach((field) => {
      if (typeof data[field] !== 'boolean') {
        updates[field] = false;
        needUpdate = true;
      }
    });

    if (needUpdate) {
      batch.update(userRef, updates);
      console.log(`🔁 Fixed block flags for ${doc.id}`);
    }
  });

  await batch.commit();
  console.log('✅ Block flags consistency check complete.');
}

fixBlockFlags(); 