const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function backfillReceiveHelpSenderDetails() {
  const receiveHelpSnap = await db.collection('receiveHelp').get();
  for (const doc of receiveHelpSnap.docs) {
    const data = doc.data();
    const senderUid = data.senderUid || data.senderId;
    if (!senderUid) continue;
    const senderDoc = await db.collection('users').doc(senderUid).get();
    if (!senderDoc.exists) continue;
    const sender = senderDoc.data();
    await doc.ref.update({
      senderName: sender.fullName || '',
      senderEmail: sender.email || '',
      senderPhone: sender.phone || '',
      senderWhatsapp: sender.whatsapp || '',
      senderProfileImage: sender.profileImage || ''
    });
    console.log(`Updated receiveHelp doc: ${doc.id}`);
  }
  console.log('Backfill complete!');
}

backfillReceiveHelpSenderDetails().catch(console.error); 