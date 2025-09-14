const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function removeKycDetailsFromUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    if (doc.data().kycDetails !== undefined) {
      const userRef = usersRef.doc(doc.id);
      batch.update(userRef, { kycDetails: admin.firestore.FieldValue.delete() });
    }
  });

  await batch.commit();
  console.log('✅ Removed kycDetails field from all users');
}

removeKycDetailsFromUsers().catch(console.error); 