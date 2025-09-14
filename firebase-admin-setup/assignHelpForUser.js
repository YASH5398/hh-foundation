// firebase-admin-setup/assignHelpForUser.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const { assignReceiverOnActivation } = require('./assignHelpForActiveUsers');

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Accept userId from command line args
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a userId as an argument. Example: node assignHelpForUser.js HHF123456');
  process.exit(1);
}

console.log(`🚀 Running help assignment logic for sender ID: ${userId}`);

assignReceiverOnActivation(userId)
  .then(() => {
    console.log(`✅ Help assignment completed for ${userId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during help assignment:', error);
    process.exit(1);
  }); 