const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanPaymentFields() {
  const usersSnapshot = await db.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    const payment = user.paymentMethod || {};
    let changed = false;
    const cleanedPayment = { ...payment };

    // Remove empty upi, gpay, phonePe
    ['upi', 'gpay', 'phonePe'].forEach((field) => {
      if (cleanedPayment[field] !== undefined && cleanedPayment[field].trim() === '') {
        delete cleanedPayment[field];
        changed = true;
      }
    });

    // Clean bank
    if (cleanedPayment.bank) {
      const { accountNumber, ifscCode } = cleanedPayment.bank;
      if (!accountNumber?.trim() || !ifscCode?.trim()) {
        delete cleanedPayment.bank;
        changed = true;
      }
    }

    // Only update if something changed
    if (changed) {
      await doc.ref.update({ paymentMethod: cleanedPayment });
      console.log(`✅ Cleaned paymentMethod for ${user.userId}`);
    }
  }
}

cleanPaymentFields().catch(console.error); 