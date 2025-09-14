// checkSendHelpAssignmentStatus.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function checkSendHelpAssignmentStatus() {
  // Fetch latest 20 users who are isActivated: false, ordered by registrationTime desc if available
  let usersSnap = await db.collection('users')
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
    console.log(`User: ${userId} | Receiver Assigned: ${hasAssignment ? '✅ Yes' : '❌ No'}`);
  }

  console.log('\nSummary:');
  console.log(`✅ Assigned: ${assigned}`);
  console.log(`❌ Not Assigned: ${notAssigned}`);
}

checkSendHelpAssignmentStatus().catch(err => {
  console.error('Error running check:', err);
}); 