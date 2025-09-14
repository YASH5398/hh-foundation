const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Timestamp } = require('firebase-admin/firestore');
const db = admin.firestore();
const { assignReceiverOnActivation } = require('./assignHelpForActiveUsers');

// exports.referralReminderScheduler = functions.pubsub.schedule('every 12 hours').onRun(async (context) => {
//   const now = admin.firestore.Timestamp.now();
//   const usersSnapshot = await db.collection('users').get();
//   const promises = [];
//   usersSnapshot.forEach(docSnap => {
//     const user = docSnap.data();
//     const uid = docSnap.id;
//     const lastLoginTime = user.lastLoginTime;
//     const deviceToken = user.deviceToken;
//     const reminderSent = user.referralReminderSent;
//     if (!lastLoginTime || !deviceToken) return;
//     // Only send if not already sent since last login
//     if (reminderSent === lastLoginTime?.toMillis?.()) return;
//     const msSinceLogin = now.toMillis() - lastLoginTime.toMillis();
//     if (msSinceLogin > 2 * 24 * 60 * 60 * 1000) { // 2 days in ms
//       const payload = {
//         notification: {
//           title: "Referral Reminder",
//           body: "You've missed 2 days of referrals 😔. Your team is waiting — send invites now!",
//         },
//         token: deviceToken,
//       };
//       promises.push(
//         admin.messaging().send(payload).then(() => {
//           // Mark reminder as sent for this login
//           return db.collection('users').doc(uid).update({ referralReminderSent: lastLoginTime });
//         }).catch(err => {
//           console.error('FCM send error for', uid, err);
//         })
//       );
//     }
//   });
//   await Promise.all(promises);
//   return null;
// });

// Helper: Get required helps for a level
function getRequiredHelpsForLevel(level) {
  // Customize as needed
  if (level === 'Star') return 3;
  if (level === 'Silver') return 3;
  if (level === 'Gold') return 3;
  // Add more levels as needed
  return 3;
}

// Helper: Find the highest priority eligible receiver for a level
async function findPriorityReceiver(level, senderUid) {
  const usersSnap = await db.collection('users')
    .where('isActivated', '==', true)
    .where('isBlocked', '==', false)
    .where('levelStatus', '==', level)
    .get();
  let eligible = [];
  usersSnap.forEach(doc => {
    const user = doc.data();
    if (
      doc.id !== senderUid &&
      user.userId &&
      (user.helpReceived || 0) < getRequiredHelpsForLevel(level)
    ) {
      eligible.push({ ...user, uid: doc.id });
    }
  });
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => {
    const refA = a.referralCount || a.activeReferralCount || 0;
    const refB = b.referralCount || b.activeReferralCount || 0;
    if (refB !== refA) return refB - refA;
    // Tie-breaker: registrationTime (earlier first)
    const regA = a.registrationTime && a.registrationTime.toMillis ? a.registrationTime.toMillis() : 0;
    const regB = b.registrationTime && b.registrationTime.toMillis ? b.registrationTime.toMillis() : 0;
    return regA - regB;
  });
  return eligible[0];
}

// Comment out all Cloud Function exports for local script execution
exports.assignReceiverToActivatedSender = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before.isActivated && after.isActivated) {
      await assignReceiverOnActivation(context.params.userId);
    }
    return null;
  });

// Callable function: Assign help when sender clicks 'Send Help' or after confirmation
// exports.assignHelpToPriorityReceiver = functions.https.onCall(async (data, context) => {
//   const senderUid = context.auth && context.auth.uid;
//   if (!senderUid) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
//   const senderDoc = await db.collection('users').doc(senderUid).get();
//   if (!senderDoc.exists) throw new functions.https.HttpsError('not-found', 'Sender user not found.');
//   const sender = senderDoc.data();
//   const level = sender.levelStatus;
//   // Find highest priority eligible receiver
//   const receiver = await findPriorityReceiver(level, senderUid);
//   if (!receiver) {
//     return { success: false, message: 'No eligible receiver found at this level.' };
//   }
//   // Prevent duplicate assignment
//   const sendHelpSnap = await db.collection('sendHelp')
//     .where('senderUid', '==', senderUid)
//     .where('receiverUid', '==', receiver.uid)
//     .get();
//   if (!sendHelpSnap.empty) {
//     return { success: false, message: 'You have already been assigned to this receiver.' };
//   }
//   // Create sendHelp and receiveHelp docs
//   const docId = `${receiver.userId}_${sender.userId}_${Date.now()}`;
//   const now = admin.firestore.FieldValue.serverTimestamp();
//   const helpData = {
//     amount: 300,
//     status: 'pending',
//     confirmedByReceiver: false,
//     createdAt: now,
//     timestamp: Date.now(),
//     senderUid: senderUid,
//     senderId: sender.userId,
//     senderName: sender.fullName,
//     senderPhone: sender.phone || '',
//     senderWhatsapp: sender.whatsapp || '',
//     senderEmail: sender.email || '',
//     receiverUid: receiver.uid,
//     receiverId: receiver.userId,
//     receiverName: receiver.fullName,
//     receiverPhone: receiver.phone || '',
//     receiverWhatsapp: receiver.whatsapp || '',
//     receiverEmail: receiver.email || '',
//     paymentDetails: receiver.paymentMethod || {},
//   };
//   await db.collection('sendHelp').doc(docId).set(helpData);
//   await db.collection('receiveHelp').doc(docId).set(helpData);
//   return { success: true, docId, receiver };
// });

// --- Production Seed Script ---

async function seedProductionData() {
  const db = require('firebase-admin').firestore();

  // 1️⃣ USERS COLLECTION
  await db.doc('users/78IdmRfawILxgEU4pMpS').set({
    userId: 'HHF139909',
    fullName: 'suman raja',
    email: 'ravi@gmail.com',
    phone: '9876543210',
    whatsapp: '9876543210',
    password: 'hashed_password',
    sponsorId: 'HHF123456',
    uplineId: 'HHF000000',
    isActivated: true,
    isBlocked: false,
    level: 'Star',
    levelStatus: 'Active',
    registrationTime: Timestamp.fromDate(new Date('2025-06-23T06:30:00.000Z')),
    paymentMethod: {
      phonePe: 'ravi@upi',
      gpay: '',
      upi: 'ravi@upi'
    },
    bank: {
      accountNumber: '1234567890',
      bankName: 'SBI',
      ifscCode: 'SBIN0001234',
      name: 'mr yash'
    },
    profileImage: '',
    referralCount: 3,
    referredUsers: [],
    totalEarnings: 0,
    totalReceived: 0,
    totalSent: 0,
    totalTeam: 0,
    epins: 'DLX123456',
    deviceToken: 'abc123xyz456',
    helpReceived: 0,
    paymentBlocked: false,
    nextLevelPaymentDone: false
  });

  // 2️⃣ SEND HELP COLLECTION
  await db.doc('sendHelp/HHF139909_HHF251839_1752926593855').set({
    amount: 300,
    confirmedByReceiver: false,
    status: 'Pending',
    createdAt: Timestamp.fromDate(new Date('2025-07-19T12:03:12.000Z')),
    timestamp: 1752926593855,
    senderUid: '78IdmRfawILxgEU4pMpS',
    senderId: 'HHF123456',
    senderName: 'suman raja',
    senderPhone: '9876543210',
    senderWhatsapp: '9876543210',
    senderEmail: 'ravi@gmail.com',
    receiverUid: '78IdmRfawILxgEU4pMpS',
    receiverId: 'HHF139909',
    receiverName: 'suman raja',
    receiverPhone: '9876543210',
    receiverWhatsapp: '9876543210',
    receiverEmail: 'ravi@gmail.com',
    paymentDetails: {
      method: 'PhonePe',
      utrNumber: '',
      screenshotUrl: '',
      upi: 'ravi@upi',
      bank: {
        accountNumber: '1234567890',
        bankName: 'SBI',
        ifscCode: 'SBIN0001234',
        name: 'mr yash'
      }
    }
  });

  // 3️⃣ RECEIVE HELP COLLECTION
  await db.doc('receiveHelp/HHF139909_HHF251839_1752926593855').set({
    amount: 300,
    confirmedByReceiver: false,
    status: 'Pending',
    createdAt: Timestamp.fromDate(new Date('2025-07-19T12:03:12.000Z')),
    timestamp: 1752926593855,
    senderUid: '78IdmRfawILxgEU4pMpS',
    senderId: 'HHF123456',
    senderName: 'suman raja',
    senderPhone: '9876543210',
    senderWhatsapp: '9876543210',
    senderEmail: 'ravi@gmail.com',
    receiverUid: '78IdmRfawILxgEU4pMpS',
    receiverId: 'HHF139909',
    receiverName: 'suman raja',
    receiverPhone: '9876543210',
    receiverWhatsapp: '9876543210',
    receiverEmail: 'ravi@gmail.com',
    paymentDetails: {
      method: 'PhonePe',
      utrNumber: '',
      screenshotUrl: '',
      upi: 'ravi@upi',
      bank: {
        accountNumber: '1234567890',
        bankName: 'SBI',
        ifscCode: 'SBIN0001234',
        name: 'mr yash'
      }
    }
  });

  console.log('✅ Production seed data written to Firestore.');
}

// Uncomment to run:
// seedProductionData(); 

// --- New Production Seed Script (2025-07-19) ---

async function seedFinalProductionData() {
  const db = require('firebase-admin').firestore();

  // USERS COLLECTION
  await db.doc('users/78IdmRfawILxgEU4pMpS').set({
    userId: 'HHF139909',
    fullName: 'Ravi Sharma',
    email: 'ravi@gmail.com',
    phone: '9876543210',
    whatsapp: '9876543210',
    password: 'hashed-password',
    sponsorId: 'HHF100001',
    uplineId: 'HHF100001',
    isActivated: true,
    isBlocked: false,
    level: 'Star',
    levelStatus: 1,
    registrationTime: Timestamp.now(),
    paymentMethod: {
      gpay: 'ravi@okicici',
      phonePe: 'ravi@ibl',
      upi: 'ravi@paytm'
    },
    bank: {
      accountNumber: '1234567890',
      bankName: 'SBI',
      ifscCode: 'SBIN0001234',
      name: 'Mr. Ravi Sharma'
    },
    profileImage: '',
    referralCount: 3,
    referredUsers: [],
    totalEarnings: 0,
    totalReceived: 0,
    totalSent: 0,
    totalTeam: 0,
    epins: '',
    deviceToken: '',
    helpReceived: 0,
    paymentBlocked: false,
    nextLevelPaymentDone: false
  });

  // SEND HELP COLLECTION
  await db.doc('sendHelp/HHF139909_HHF251839_1752926593855').set({
    amount: 300,
    confirmedByReceiver: false,
    status: 'pending',
    createdAt: Timestamp.now(),
    timestamp: 1752926593855,
    senderUid: 'SCk5GMwN3TUClEd0cNienNuJ10z2',
    senderId: 'HHF251839',
    senderName: 'Amit Verma',
    senderPhone: '9988776655',
    senderWhatsapp: '9988776655',
    senderEmail: 'amit@gmail.com',
    receiverUid: '78IdmRfawILxgEU4pMpS',
    receiverId: 'HHF139909',
    receiverName: 'Ravi Sharma',
    receiverPhone: '9876543210',
    receiverWhatsapp: '9876543210',
    receiverEmail: 'ravi@gmail.com',
    paymentDetails: {
      method: '',
      utrNumber: '',
      screenshotUrl: '',
      bank: {},
      upi: ''
    }
  });

  // RECEIVE HELP COLLECTION
  await db.doc('receiveHelp/HHF139909_HHF251839_1752926593855').set({
    amount: 300,
    confirmedByReceiver: false,
    status: 'pending',
    createdAt: Timestamp.now(),
    timestamp: 1752926593855,
    senderUid: 'SCk5GMwN3TUClEd0cNienNuJ10z2',
    senderId: 'HHF251839',
    senderName: 'Amit Verma',
    senderPhone: '9988776655',
    senderWhatsapp: '9988776655',
    senderEmail: 'amit@gmail.com',
    receiverUid: '78IdmRfawILxgEU4pMpS',
    receiverId: 'HHF139909',
    receiverName: 'Ravi Sharma',
    receiverPhone: '9876543210',
    receiverWhatsapp: '9876543210',
    receiverEmail: 'ravi@gmail.com',
    paymentDetails: {
      method: '',
      utrNumber: '',
      screenshotUrl: '',
      bank: {},
      upi: ''
    }
  });

  console.log('✅ Final production seed data written to Firestore.');
}

// Uncomment to run:
// seedFinalProductionData(); 

// --- One-time backfill script for already activated users ---
async function backfillHelpAssignmentsForActivatedUsers() {
  const db = require('firebase-admin').firestore();
  const usersSnap = await db.collection('users')
    .where('isActivated', '==', true)
    .where('isBlocked', '==', false)
    .where('isOnHold', '==', false)
    .where('levelStatus', '==', 'Star')
    .get();

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    // Check payment method and bank fields
    const pm = user.paymentMethod || {};
    const bank = user.bank || {};
    if (!((pm.phonePe && pm.phonePe.trim()) || (pm.gpay && pm.gpay.trim()) || (pm.upi && pm.upi.trim()))) continue;
    if (!(bank.name && bank.name.trim() && bank.bankName && bank.bankName.trim())) continue;

    // Count receiveHelp docs (status != 'Rejected')
    const rhSnap = await db.collection('receiveHelp')
      .where('receiverId', '==', user.userId)
      .where('status', '!=', 'Rejected')
      .get();
    if (rhSnap.size >= 3) continue;

    // Find eligible senders
      const sendersSnap = await db.collection('users')
        .where('isActivated', '==', true)
        .where('isBlocked', '==', false)
      .where('levelStatus', '==', 'Star')
      .get();
    let senders = [];
    for (const senderDoc of sendersSnap.docs) {
      const sender = senderDoc.data();
      if (sender.userId === user.userId) continue;
      // Check if sender already sent help to this receiver
      const duplicate = await db.collection('sendHelp')
        .where('senderId', '==', sender.userId)
        .where('receiverId', '==', user.userId)
        .get();
      if (!duplicate.empty) continue;
      // Optionally, check if sender has paid (e.g., has a sendHelp doc with status Confirmed or admin-activated)
      senders.push({ ...sender, uid: senderDoc.id });
      if (senders.length + rhSnap.size >= 3) break;
    }
    // For each eligible sender, create sendHelp/receiveHelp
    for (const sender of senders) {
      const timestamp = Date.now();
      const docId = `${user.userId}_${sender.userId}_${timestamp}`;
        const helpData = {
          amount: 300,
        status: 'Pending',
          confirmedByReceiver: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp,
          senderUid: sender.uid,
          senderId: sender.userId,
          senderName: sender.fullName,
          senderPhone: sender.phone || '',
          senderWhatsapp: sender.whatsapp || '',
          senderEmail: sender.email || '',
        receiverUid: userDoc.id,
        receiverId: user.userId,
        receiverName: user.fullName,
        receiverPhone: user.phone || '',
        receiverWhatsapp: user.whatsapp || '',
        receiverEmail: user.email || '',
        paymentDetails: {},
      };
      await db.collection('sendHelp').doc(docId).set(helpData);
      await db.collection('receiveHelp').doc(docId).set(helpData);
      console.log(`Created sendHelp/receiveHelp for receiver ${user.userId} and sender ${sender.userId}`);
      if (senders.length + rhSnap.size >= 3) break;
    }
  }
  console.log('✅ Backfill complete.');
}

// Uncomment to run:
// backfillHelpAssignmentsForActivatedUsers(); 

// --- One-time utility to backfill missing sendHelp/receiveHelp docs for already activated users ---
async function backfillHelpAssignmentsForActivatedUsers() {
  const db = require('firebase-admin').firestore();
  const usersSnap = await db.collection('users')
    .where('isActivated', '==', true)
    .where('isBlocked', '==', false)
    .where('isReceivingHeld', '==', false)
    .where('level', '==', 1)
    .get();

  let totalEligible = 0;
  let totalDocsCreated = 0;
  let skippedUsers = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const pm = user.paymentMethod || {};
    const bank = user.bank || {};
    if (!((pm.phonePe && pm.phonePe.trim()) || (pm.gpay && pm.gpay.trim()) || (pm.upi && pm.upi.trim()))) {
      skippedUsers.push({ uid: userDoc.id, name: user.fullName, reason: 'Missing payment method' });
      continue;
    }
    if (!(bank.name && bank.name.trim() && bank.bankName && bank.bankName.trim())) {
      skippedUsers.push({ uid: userDoc.id, name: user.fullName, reason: 'Missing bank details' });
      continue;
    }
    // Check if already has receiveHelp docs
    const rhSnap = await db.collection('receiveHelp')
      .where('receiverId', '==', user.userId)
      .get();
    if (!rhSnap.empty) {
      skippedUsers.push({ uid: userDoc.id, name: user.fullName, reason: 'Already has receiveHelp docs' });
      continue;
    }
    totalEligible++;
    // Find 3 eligible senders
    const sendersSnap = await db.collection('users')
      .where('isActivated', '==', true)
      .where('isBlocked', '==', false)
      .where('isReceivingHeld', '==', false)
      .where('level', '==', 1)
      .get();
    let senders = [];
    for (const senderDoc of sendersSnap.docs) {
      const sender = senderDoc.data();
      if (sender.userId === user.userId) continue;
      // Check if sender already sent help to this receiver
      const duplicate = await db.collection('sendHelp')
        .where('senderId', '==', sender.userId)
        .where('receiverId', '==', user.userId)
        .get();
      if (!duplicate.empty) continue;
      senders.push({ ...sender, uid: senderDoc.id });
      if (senders.length >= 3) break;
    }
    if (senders.length === 0) {
      skippedUsers.push({ uid: userDoc.id, name: user.fullName, reason: 'No eligible senders found' });
      continue;
    }
    for (const sender of senders) {
      const timestamp = Date.now();
      const docId = `${user.userId}_${sender.userId}_${timestamp}`;
  const helpData = {
    amount: 300,
        status: 'Pending',
    confirmedByReceiver: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp,
        senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || '',
    senderWhatsapp: sender.whatsapp || '',
    senderEmail: sender.email || '',
        receiverUid: userDoc.id,
        receiverId: user.userId,
        receiverName: user.fullName,
        receiverPhone: user.phone || '',
        receiverWhatsapp: user.whatsapp || '',
        receiverEmail: user.email || '',
        paymentDetails: {},
  };
  await db.collection('sendHelp').doc(docId).set(helpData);
  await db.collection('receiveHelp').doc(docId).set(helpData);
      totalDocsCreated++;
    }
    console.log(`Backfilled for receiver: UID=${userDoc.id}, Name=${user.fullName}`);
  }
  console.log('--- Backfill Summary ---');
  console.log('Total eligible users:', totalEligible);
  console.log('Total docs created:', totalDocsCreated);
  console.log('Skipped users:', skippedUsers);
  return { totalEligible, totalDocsCreated, skippedUsers };
}

// Uncomment to run:
// backfillHelpAssignmentsForActivatedUsers(); 

// --- One-time utility to backfill referral counts for all users ---
async function backfillReferralCounts() {
  const db = require('firebase-admin').firestore();
  const usersSnap = await db.collection('users').get();
  let updated = 0;
  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    // Count direct referrals (users whose sponsorId == this user's userId)
    const referralsSnap = await db.collection('users')
      .where('sponsorId', '==', user.userId)
      .get();
    const referralCount = referralsSnap.size;
    await db.collection('users').doc(userDoc.id).update({ referralCount });
    updated++;
    console.log(`Updated referralCount for ${user.fullName} (${user.userId}): ${referralCount}`);
  }
  console.log(`Referral count backfill complete. Total users updated: ${updated}`);
}

// backfillReferralCounts(); 