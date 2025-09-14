const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixKycDetails() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();
  let fixedCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const userRef = db.collection('users').doc(doc.id);
    const defaultKyc = {
      aadhaar: "",
      pan: "",
      level: "Star",
      levelStatus: "Active",
      nextLevelPaymentDone: false,
      paymentBlocked: false,
    };

    let updates = {};
    let needUpdate = false;
    let kyc = (typeof data.kycDetails === "object" && data.kycDetails !== null) ? { ...data.kycDetails } : {};

    for (const key in defaultKyc) {
      if (!(key in kyc)) {
        kyc[key] = defaultKyc[key];
        needUpdate = true;
      }
    }

    if (needUpdate) {
      updates.kycDetails = kyc;
      batch.update(userRef, updates);
      console.log(`🔁 Fixed KYC for ${doc.id}`);
      fixedCount++;
    }
  });

  if (fixedCount > 0) {
    await batch.commit();
  }
  console.log(`✅ KYC details consistency check complete. Users fixed: ${fixedCount}`);
}

fixKycDetails(); 