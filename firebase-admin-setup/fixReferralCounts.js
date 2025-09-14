const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixReferralCounts() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const count = data.referralCount;
    if (count === null || count === undefined || count < 0) {
      const userRef = db.collection('users').doc(doc.id);
      batch.update(userRef, { referralCount: 0 });
      console.log(`✅ Fixed referralCount for ${doc.id}`);
    }
  });

  await batch.commit();
  console.log('🎉 All invalid referralCounts fixed.');
}

fixReferralCounts(); 