const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUserFlags() {
  const usersSnapshot = await db.collection("users").get();
  let updatedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const updates = {};
    let changed = false;

    if ((data.helpReceived || 0) >= 3 && data.isReceivingHeld !== true) {
      updates.isReceivingHeld = true;
      changed = true;
    }
    if ((data.helpReceived || 0) < 3 && data.isReceivingHeld !== false) {
      updates.isReceivingHeld = false;
      changed = true;
    }
    if (data.isOnHold === true && (data.helpReceived || 0) < 3) {
      updates.isOnHold = false;
      changed = true;
    }

    if (changed) {
      await doc.ref.update(updates);
      console.log(`✅ Updated ${doc.id}:`, updates);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Done! Total users updated: ${updatedCount}`);
}

fixUserFlags().then(() => process.exit()); 