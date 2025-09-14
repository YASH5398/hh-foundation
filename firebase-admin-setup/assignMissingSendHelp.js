const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

// Import the assignment function from assignHelpForActiveUsers.js
const { assignReceiverOnActivation } = require("./assignHelpForActiveUsers");

async function assignMissingSendHelp() {
  const usersSnap = await db.collection("users").where("isActivated", "==", true).get();
  let totalAssigned = 0;
  let alreadyAssigned = 0;
  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userUid = userDoc.id;
    // Check if sendHelp doc exists for this sender
    const sendHelpSnap = await db.collection("sendHelp")
      .where("senderUid", "==", userUid)
      .get();
    if (!sendHelpSnap.empty) {
      alreadyAssigned++;
      continue;
    }
    // Assign help if missing
    const assigned = await assignReceiverOnActivation(userUid);
    if (assigned) {
      totalAssigned++;
      console.log(`✅ Assigned sendHelp for ${user.userId}`);
    } else {
      console.log(`⏭️  Could not assign sendHelp for ${user.userId}`);
    }
  }
  console.log(`Done. Total assigned: ${totalAssigned}, Already assigned: ${alreadyAssigned}`);
}

assignMissingSendHelp(); 