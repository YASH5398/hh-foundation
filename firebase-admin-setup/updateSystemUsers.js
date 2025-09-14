const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const SYSTEM_USER_IDS = ['HHF000001', 'HHF999999', 'HHF139909']; // Add all system/test/dummy userIds here
const SYSTEM_UIDS = ['78IdmRfawILxgEU4pMpS']; // Add all system/test/dummy UIDs here

async function updateSystemUsers() {
  // Update by userId
  for (const userId of SYSTEM_USER_IDS) {
    const snap = await db.collection('users').where('userId', '==', userId).get();
    for (const docRef of snap.docs) {
      await docRef.ref.update({ isBlocked: true, isReceivingHeld: true, isSystemUser: true });
      console.log(`Updated userId ${userId} (${docRef.id})`);
    }
  }
  // Update by UID
  for (const uid of SYSTEM_UIDS) {
    const userDoc = db.collection('users').doc(uid);
    const docSnap = await userDoc.get();
    if (docSnap.exists) {
      await userDoc.update({ isBlocked: true, isReceivingHeld: true, isSystemUser: true });
      console.log(`Updated UID ${uid}`);
    }
  }
  // Update all users with isSystemUser: true
  const sysSnap = await db.collection('users').where('isSystemUser', '==', true).get();
  for (const docRef of sysSnap.docs) {
    await docRef.ref.update({ isBlocked: true, isReceivingHeld: true });
    console.log(`Updated isSystemUser true: ${docRef.id}`);
  }
  console.log('System/test/dummy users updated.');
}

updateSystemUsers(); 