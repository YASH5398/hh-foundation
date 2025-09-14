const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function deleteDuplicateReceiveHelpDocs() {
  const snapshot = await db.collection("receiveHelp").get();
  const seen = new Set();

  for (const d of snapshot.docs) {
    const data = d.data();
    const comboKey = `${String(data.senderId).trim().toLowerCase()}_${String(data.receiverId).trim().toLowerCase()}`;

    if (seen.has(comboKey)) {
      await d.ref.delete();
      console.log("✅ Deleted duplicate:", d.id);
    } else {
      seen.add(comboKey);
    }
  }

  console.log("✅ Duplicate cleanup done");
}

deleteDuplicateReceiveHelpDocs().catch(console.error); 