const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function generateUserId(existingIds) {
  let id;
  do {
    id = `HHF${Math.floor(100000 + Math.random() * 900000)}`;
  } while (existingIds.has(id));
  return id;
}

async function fixUserIds() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  // Collect all existing userIds to avoid duplicates
  const existingIds = new Set();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.userId && data.userId !== 'loading') {
      existingIds.add(data.userId);
    }
  });

  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const userId = data.userId;

    if (!userId) {
      const newUserId = generateUserId(existingIds);
      existingIds.add(newUserId);
      console.log(`Updating user ${doc.id} with userId: ${newUserId}`);
      await doc.ref.update({ userId: newUserId });
      updated++;
    }
  }

  console.log(`✅ Done updating userIds! Updated ${updated} users.`);
}

fixUserIds().catch((err) => {
  console.error('❌ Error updating userIds:', err);
}); 