// checkSendHelpAssignments.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function checkSendHelpAssignments() {
  const usersSnap = await db.collection('users').where('isActivated', '==', false).get();
  if (usersSnap.empty) {
    console.log('No users found with isActivated: false');
    return;
  }
  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userId = user.userId;
    const isSendHelpAssigned = user.isSendHelpAssigned;
    // Check if any sendHelp doc exists where senderId == userId
    const sendHelpSnap = await db.collection('sendHelp').where('senderId', '==', userId).limit(1).get();
    const sendHelpExists = !sendHelpSnap.empty;
    console.log(`User: ${userId} | isSendHelpAssigned: ${isSendHelpAssigned} | sendHelp doc exists: ${sendHelpExists ? 'yes' : 'no'}`);
  }
}

checkSendHelpAssignments().catch(err => {
  console.error('Error running check:', err);
}); 