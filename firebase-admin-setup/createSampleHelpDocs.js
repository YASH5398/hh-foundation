// firebase-admin-setup/createSampleHelpDocs.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createSampleDocs() {
  const sender = {
    uid: 'SENDER_UID_123',
    userId: 'HHF251839',
    fullName: 'Ravi Kumar',
    phone: '9876543210',
    whatsapp: '9876543210',
    email: 'ravi@gmail.com',
  };
  const receiver = {
    uid: 'RECEIVER_UID_456',
    userId: 'HHF139909',
    fullName: 'Mr Yash',
    phone: '9876543200',
    whatsapp: '9876543200',
    email: 'yash@gmail.com',
  };
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;
  const helpData = {
    amount: 300,
    confirmedByReceiver: false,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    timestamp,
    senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone,
    senderWhatsapp: sender.whatsapp,
    senderEmail: sender.email,
    receiverUid: receiver.uid,
    receiverId: receiver.userId,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone,
    receiverWhatsapp: receiver.whatsapp,
    receiverEmail: receiver.email,
    paymentDetails: {
      method: '',
      utrNumber: '',
      screenshotUrl: '',
      bank: {
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        name: ''
      },
      upi: {
        gpay: '',
        phonePe: '',
        upi: ''
      }
    }
  };
  await db.collection('sendHelp').doc(docId).set(helpData);
  await db.collection('receiveHelp').doc(docId).set(helpData);
  console.log('Sample sendHelp and receiveHelp documents created with ID:', docId);
}

createSampleDocs()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); }); 