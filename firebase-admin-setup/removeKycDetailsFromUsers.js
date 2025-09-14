const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json"); // replace with your path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

async function removeKycDetailsField() {
  try {
    const usersSnapshot = await db.collection("users").get();
    let updatedCount = 0;

    const batchArray = [];
    let batch = db.batch();
    let counter = 0;

    usersSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        kycDetails: FieldValue.delete(),
      });
      counter++;
      updatedCount++;

      if (counter === 400) {
        batchArray.push(batch);
        batch = db.batch();
        counter = 0;
      }
    });

    if (counter > 0) batchArray.push(batch);

    for (const b of batchArray) {
      await b.commit();
    }

    console.log(`✅ Removed 'kycDetails' field from ${updatedCount} users.`);
  } catch (error) {
    console.error("❌ Error removing kycDetails:", error);
  }
}

removeKycDetailsField(); 