// firebase-admin-setup/assignHelpForAllEligibleUsers.js

const admin = require('firebase-admin');
const path = require('path');

// Update this path to your service account key if needed
const serviceAccount = require(path.resolve(__dirname, './serviceAccountKey.json.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Import assignReceiverOnActivation from your backend logic
// You may need to adjust the import path as per your project structure
const { assignReceiverOnActivation } = require('./assignHelpForActiveUsers');

async function assignHelpForAllEligibleUsers() {
  const usersSnapshot = await db.collection('users').get();
  let eligibleCount = 0;
  let assignedCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    if (
      data.isActivated === true &&
      data.isOnHold !== true &&
      data.isReceivingHeld !== true &&
      data.isBlocked !== true &&
      data.isSystemAccount !== true
    ) {
      eligibleCount++;
      try {
        await assignReceiverOnActivation(userDoc.id);
        assignedCount++;
        console.log(`Assigned help for user ${userDoc.id}`);
      } catch (err) {
        console.error(`Error assigning help for user ${userDoc.id}:`, err.message);
      }
    }
  }
  console.log(`Done. Eligible users: ${eligibleCount}, Assigned: ${assignedCount}`);
}

assignHelpForAllEligibleUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error in assignment:', err);
    process.exit(1);
  }); 