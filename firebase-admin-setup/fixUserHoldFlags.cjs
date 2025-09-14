const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUserHoldFlags() {
  const usersSnapshot = await db.collection("users").get();
  let count = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (data.isOnHold !== false) updates.isOnHold = false;
    if (data.isReceivingHeld !== false) updates.isReceivingHeld = false;

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`✅ Updated: ${doc.id}`);
      count++;
    }
  }

  console.log(`\nTotal users updated: ${count}`);
}

fixUserHoldFlags().then(() => process.exit()); 