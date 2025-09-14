// firebase-admin-setup/checkSendHelpAssignmentStatus.js

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK using serviceAccountKey.json from the same folder
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkSendHelpAssignmentStatus() {
  // Query the 20 latest users where isActivated: false, ordered by registrationTime desc
  const usersSnap = await db.collection('users')
    .where('isActivated', '==', false)
    .orderBy('registrationTime', 'desc')
    .limit(20)
    .get();

  if (usersSnap.empty) {
    console.log('No users found with isActivated: false');
    return;
  }

  let assigned = 0;
  let notAssigned = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userId = user.userId;
    // Check if any sendHelp doc exists where senderId == userId
    const sendHelpSnap = await db.collection('sendHelp').where('senderId', '==', userId).limit(1).get();
    const hasAssignment = !sendHelpSnap.empty;
    if (hasAssignment) {
      assigned++;
    } else {
      notAssigned++;
    }
    console.log(`User: ${userId} | Receiver Assigned: ${hasAssignment ? '✅' : '❌'}`);
  }

  console.log('\nSummary:');
  console.log(`✅ Assigned: ${assigned}`);
  console.log(`❌ Not Assigned: ${notAssigned}`);
}

checkSendHelpAssignmentStatus().catch(err => {
  console.error('Error running check:', err);
}); 