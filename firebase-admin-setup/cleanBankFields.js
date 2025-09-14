const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanBankFields() {
  const usersSnapshot = await db.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    const bank = user.bank;
    if (bank) {
      const { accountNumber, ifscCode } = bank;
      if (!accountNumber?.trim() || !ifscCode?.trim()) {
        await doc.ref.update({ bank: admin.firestore.FieldValue.delete() });
        console.log(`✅ Removed bank object for ${user.userId}`);
      }
    }
  }
}

cleanBankFields().catch(console.error); 