const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUserLevels() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const kyc = data.kycDetails || {};
    let needUpdate = false;
    const userRef = db.collection('users').doc(doc.id);

    if (!kyc.level || typeof kyc.level !== 'string') {
      kyc.level = 'Star';
      needUpdate = true;
    }

    if (!kyc.levelStatus || typeof kyc.levelStatus !== 'string') {
      kyc.levelStatus = 'Active';
      needUpdate = true;
    }

    if (needUpdate) {
      batch.update(userRef, { kycDetails: kyc });
      console.log(`🔁 Fixed level for ${doc.id}`);
    }
  });

  await batch.commit();
  console.log('✅ Level consistency check complete.');
}

fixUserLevels(); 