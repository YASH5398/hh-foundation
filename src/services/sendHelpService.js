import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAmountByLevel, getTotalHelpsByLevel, isIncomeBlocked } from '../shared/mlmCore';

const SYSTEM_USER_IDS = ['HHF123456', 'HHF000001', 'HHF999999'];

// Check sender eligibility for sending help
export async function checkSenderEligibility(currentUser) {
  if (!currentUser) return { eligible: false, reason: 'Not authenticated' };

  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return { eligible: false, reason: 'User not found' };

  const userData = userSnap.data();

  // Check activation and block status
  if (!userData.isActivated || userData.isBlocked) {
    return { eligible: false, reason: 'User not activated or blocked' };
  }

  // Check if user is income blocked
  if (isIncomeBlocked(userData)) {
    return { eligible: false, reason: 'User income is blocked' };
  }

  // Check if user already has a pending sendHelp
  const q = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', currentUser.uid),
    where('status', 'in', ['Pending', 'Payment Done'])
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { eligible: false, reason: 'Already has a pending sendHelp' };
  }

  return { eligible: true, userData };
}

// Get eligible receiver for send help assignment
export async function getEligibleReceiver(senderUid, senderLevel) {
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(query(
    usersRef,
    where('isActivated', '==', true),
    where('isReceivingHeld', '==', false),
    where('isOnHold', '==', false),
    where('isBlocked', '==', false),
    where('level', '==', senderLevel)
  ));

  const allReceivers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

  // Filter eligible receivers
  const filteredReceivers = allReceivers.filter(receiver =>
    receiver.isActivated === true &&
    receiver.isReceivingHeld !== true &&
    receiver.isOnHold !== true &&
    receiver.isBlocked !== true &&
    receiver.uid !== senderUid &&
    !SYSTEM_USER_IDS.includes(receiver.userId) &&
    (receiver.helpReceived || 0) < getTotalHelpsByLevel(receiver.level)
  );

  if (filteredReceivers.length === 0) return null;

  // Sort by referral count and return best receiver
  filteredReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  return filteredReceivers[0];
}

// Main orchestrator for Send Help assignment
export async function assignSendHelp(currentUser) {
  if (!currentUser) throw new Error('Not authenticated');

  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');

  const sender = { uid: userSnap.id, ...userSnap.data() };
  if (!sender.userId) throw new Error('Sender userId is missing');

  // Check sender eligibility
  const eligibility = await checkSenderEligibility(currentUser);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  // Check if already has pending send help
  const existingQ = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', sender.uid),
    where('status', 'in', ['Pending', 'Payment Done'])
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error('Already has a pending sendHelp');
  }

  // Get eligible receiver
  const receiver = await getEligibleReceiver(sender.uid, sender.level);
  if (!receiver) {
    throw new Error('No eligible receiver found');
  }

  // Generate docId and create documents
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;

  const helpData = {
    amount: 300,
    status: 'Pending',
    confirmedByReceiver: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp,
    senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || '',
    senderWhatsapp: sender.whatsapp || '',
    senderEmail: sender.email || '',
    receiverUid: receiver.uid,
    receiverId: receiver.userId,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone || '',
    receiverWhatsapp: receiver.whatsapp || '',
    receiverEmail: receiver.email || '',
    paymentDetails: {
      bank: receiver.bank || {},
      upi: receiver.paymentMethod || {},
      screenshotUrl: '',
      utrNumber: ''
    },
    level: sender.level
  };

  // Atomic Firestore writes
  await Promise.all([
    setDoc(doc(db, 'sendHelp', docId), helpData),
    setDoc(doc(db, 'receiveHelp', docId), helpData)
  ]);

  return {
    sendHelpId: docId,
    sendHelp: helpData,
    receiveHelp: helpData,
    receiver
  };
}

// Update payment proof for send help
export async function submitPaymentProof(docId, method, utrNumber, screenshotUrl) {
  const batch = writeBatch(db);

  batch.update(doc(db, 'sendHelp', docId), {
    status: 'Payment Done',
    paymentDetails: {
      method,
      utrNumber,
      screenshotUrl
    },
    updatedAt: serverTimestamp()
  });

  batch.update(doc(db, 'receiveHelp', docId), {
    status: 'Payment Done',
    paymentDetails: {
      method,
      utrNumber,
      screenshotUrl
    },
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}

// Confirm payment received - only update document status
export async function confirmHelpReceived(docId) {
  const batch = writeBatch(db);

  batch.update(doc(db, 'sendHelp', docId), {
    status: 'Confirmed',
    confirmedByReceiver: true,
    confirmationTime: serverTimestamp()
  });

  batch.update(doc(db, 'receiveHelp', docId), {
    status: 'Confirmed',
    confirmedByReceiver: true,
    confirmationTime: serverTimestamp()
  });

  await batch.commit();
}

// Send help assignment on activation
export async function assignHelpOnActivation(senderUid) {
  const userRef = doc(db, 'users', senderUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;

  const sender = { uid: userSnap.id, ...userSnap.data() };

  // Check sender eligibility
  if (!sender.isActivated || sender.isBlocked || isIncomeBlocked(sender)) {
    return false;
  }

  // Check if already has pending send help
  const existingQ = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', sender.uid),
    where('status', 'in', ['Pending', 'Payment Done'])
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) return false;

  // Get eligible receivers at same level
  const receiversQ = query(
    collection(db, 'users'),
    where('level', '==', sender.level),
    where('isActivated', '==', true),
    where('isBlocked', '==', false),
    where('isReceivingHeld', '==', false),
    where('isOnHold', '==', false)
  );

  const receiversSnap = await getDocs(receiversQ);
  const eligibleReceivers = receiversSnap.docs
    .map(doc => ({ uid: doc.id, ...doc.data() }))
    .filter(user =>
      user.uid !== sender.uid &&
      !SYSTEM_USER_IDS.includes(user.userId) &&
      (user.helpReceived || 0) < getTotalHelpsByLevel(user.level)
    )
    .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

  if (eligibleReceivers.length === 0) return false;

  const receiver = eligibleReceivers[0];
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;

  const helpData = {
    amount: 300,
    status: 'Pending',
    confirmedByReceiver: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp,
    senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || '',
    senderWhatsapp: sender.whatsapp || '',
    senderEmail: sender.email || '',
    receiverUid: receiver.uid,
    receiverId: receiver.userId,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone || '',
    receiverWhatsapp: receiver.whatsapp || '',
    receiverEmail: receiver.email || '',
    paymentDetails: {
      bank: receiver.bank || {},
      upi: receiver.paymentMethod || {},
      screenshotUrl: '',
      utrNumber: ''
    },
    level: sender.level
  };

  await Promise.all([
    setDoc(doc(db, 'sendHelp', docId), helpData),
    setDoc(doc(db, 'receiveHelp', docId), helpData)
  ]);

  return true;
}

// Real-time listeners for send help documents
export function listenToSendHelps(userUid, callback) {
  const q = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', userUid)
  );
  return onSnapshot(q, (snapshot) => {
    const sendHelps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sendHelps);
  });
}

// Real-time listeners for receive help documents
export function listenToReceiveHelps(userUid, callback) {
  const q = query(
    collection(db, 'receiveHelp'),
    where('receiverUid', '==', userUid)
  );
  return onSnapshot(q, (snapshot) => {
    const receiveHelps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(receiveHelps);
  });
}

// Admin functions for managing help requests
export function getSendHelpRequests(callback) {
  const q = query(collection(db, 'sendHelp'));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
}

export async function updateSendHelpRequest(id, requestData) {
  await updateDoc(doc(db, 'sendHelp', id), requestData);
}

export async function deleteSendHelpRequest(id) {
  await deleteDoc(doc(db, 'sendHelp', id));
}


// Utility: Get eligible receivers for Send Help assignment
export async function getStrictlyEligibleReceivers(senderUserId, senderLevel) {
  const usersRef = collection(db, 'users');
  const helpLimitsByLevel = { Star: 3, Silver: 9, Gold: 27, Platinum: 81, Diamond: 243 };
  const maxHelps = helpLimitsByLevel[senderLevel] || 3;
  const q = query(
    usersRef,
    where('isActivated', '==', true),
    where('isReceivingHeld', '==', false),
    where('isOnHold', '==', false),
    where('isBlocked', '==', false),
    where('helpVisibility', '==', true),
    where('levelStatus', '==', senderLevel)
  );
  const snap = await getDocs(q);
  let eligible = [];
  for (const docSnap of snap.docs) {
    const user = docSnap.data();
    const uid = docSnap.id;
    if (
      uid === senderUserId ||
      user.userId === senderUserId ||
      user.isSystemAccount === true ||
      (user.helpReceived || 0) >= maxHelps
    ) continue;
    eligible.push({ ...user, uid });
  }
  // Sort by referralCount DESC
  eligible.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  // Fallback: if no one has referralCount > 0, allow referralCount = 0
  if (eligible.length > 0 && (eligible[0].referralCount || 0) === 0) {
    return eligible;
  }
  const bestReferralCount = eligible.length > 0 ? eligible[0].referralCount : 0;
  const filtered = eligible.filter(u => u.referralCount === bestReferralCount && bestReferralCount > 0);
  return filtered.length > 0 ? filtered : eligible;
}

// Main orchestrator for Send Help assignment (refactored)
export async function assignSendHelp(currentUser) {
  if (!currentUser) throw new Error('Not authenticated');
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  const sender = { uid: userSnap.id, ...userSnap.data() };
  if (!sender.userId) throw new Error('Sender userId is missing or invalid.');
  if (!sender.levelStatus) throw new Error('Sender levelStatus is missing.');

  // 1. Check for existing sendHelp doc (pending or confirmed)
  const existingSendHelpQ = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', sender.uid),
    where('status', 'in', ['pending', 'confirmed'])
  );
  const existingSendHelpSnap = await getDocs(existingSendHelpQ);
  if (!existingSendHelpSnap.empty) {
    // Already has a pending or confirmed sendHelp, do not assign new receiver
    const docData = existingSendHelpSnap.docs[0].data();
    return {
      sendHelpId: existingSendHelpSnap.docs[0].id,
      sendHelp: docData,
      receiver: docData.receiverId
    };
  }

  // 2. Assign new eligible receiver
  const eligibleReceivers = await getStrictlyEligibleReceivers(sender.userId, sender.levelStatus);
  if (!eligibleReceivers.length) throw new Error('No eligible receiver found.');
  const selectedReceiver = eligibleReceivers[0];
  if (!selectedReceiver) throw new Error('No eligible receiver found.');

  // 3. Generate docId
  const timestamp = Date.now();
  const docId = `${selectedReceiver.userId}_${sender.userId}_${timestamp}`;

  // 4. Check for duplicate assignment
  const sendHelpRef = doc(db, 'sendHelp', docId);
  const sendHelpSnap = await getDoc(sendHelpRef);
  if (sendHelpSnap.exists()) {
    const data = sendHelpSnap.data();
    if (data.status === 'Pending' || data.status === 'Confirmed') {
      throw new Error('A Send Help assignment already exists for this pair.');
    }
  }

  // 5. Validate required receiver fields
  const requiredFields = ['userId', 'fullName', 'email'];
  for (const field of requiredFields) {
    if (!selectedReceiver[field]) throw new Error(`Receiver information is missing: ${field}`);
  }

  // 6. Create sendHelp and receiveHelp docs with correct paymentDetails structure
  const sendHelpData = {
    amount: 300, // Entry amount is always ₹300
    status: 'Pending',
    confirmedByReceiver: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp,
    senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || '',
    senderWhatsapp: sender.whatsapp || '',
    senderEmail: sender.email || '',
    senderProfileImage: sender.profileImage || '',
    receiverUid: selectedReceiver.uid,
    receiverId: selectedReceiver.userId,
    receiverName: selectedReceiver.fullName,
    receiverPhone: selectedReceiver.phone || '',
    receiverWhatsapp: selectedReceiver.whatsapp || '',
    receiverEmail: selectedReceiver.email || '',
    receiverProfileImage: selectedReceiver.profileImage || '',
    paymentDetails: {
      bank: {
        name: selectedReceiver.bank?.name || '',
        accountNumber: selectedReceiver.bank?.accountNumber || '',
        bankName: selectedReceiver.bank?.bankName || '',
        ifscCode: selectedReceiver.bank?.ifscCode || selectedReceiver.bank?.ifsc || '',
        method: 'Bank'
      },
      upi: {
        upi: selectedReceiver.paymentMethod?.upi || '',
        gpay: selectedReceiver.paymentMethod?.gpay || '',
        phonePe: selectedReceiver.paymentMethod?.phonePe || ''
      },
      screenshotUrl: '',
      utrNumber: ''
    }
  };

  const receiveHelpData = {
    ...sendHelpData,
    senderLevelStatus: sender.levelStatus,
    senderReferralCount: sender.referralCount || 0
  };

  // 7. Atomic Firestore writes
  await Promise.all([
    setDoc(sendHelpRef, sendHelpData),
    setDoc(doc(db, 'receiveHelp', docId), receiveHelpData)
  ]);

  // 8. Return info for UI
  return {
    sendHelpId: docId,
    sendHelp: sendHelpData,
    receiveHelp: receiveHelpData,
    receiver: selectedReceiver
  };
}

// Simplified send help assignment on activation
export async function assignHelpOnActivation(senderUid) {
  const userRef = doc(db, 'users', senderUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;

  const sender = { uid: userSnap.id, ...userSnap.data() };

  // Check sender eligibility
  if (!sender.isActivated || sender.isBlocked || isIncomeBlocked(sender)) {
    return false;
  }

  // Check if already has pending send help
  const existingQ = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', sender.uid),
    where('status', 'in', ['Pending', 'Payment Done'])
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) return false;

  // Get eligible receivers at same level
  const receiversQ = query(
    collection(db, 'users'),
    where('level', '==', sender.level),
    where('isActivated', '==', true),
    where('isBlocked', '==', false),
    where('isReceivingHeld', '==', false),
    where('isOnHold', '==', false)
  );

  const receiversSnap = await getDocs(receiversQ);
  const eligibleReceivers = receiversSnap.docs
    .map(doc => ({ uid: doc.id, ...doc.data() }))
    .filter(user =>
      user.uid !== sender.uid &&
      !SYSTEM_USER_IDS.includes(user.userId) &&
      (user.helpReceived || 0) < getTotalHelpsByLevel(user.level)
    )
    .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

  if (eligibleReceivers.length === 0) return false;

  const receiver = eligibleReceivers[0];
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;

  const helpData = {
    amount: 300,
    status: 'Pending',
    confirmedByReceiver: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp,
    senderUid: sender.uid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || '',
    senderWhatsapp: sender.whatsapp || '',
    senderEmail: sender.email || '',
    receiverUid: receiver.uid,
    receiverId: receiver.userId,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone || '',
    receiverWhatsapp: receiver.whatsapp || '',
    receiverEmail: receiver.email || '',
    paymentDetails: {
      bank: receiver.bank || {},
      upi: receiver.paymentMethod || {},
      screenshotUrl: '',
      utrNumber: ''
    },
    level: sender.level
  };

  await Promise.all([
    setDoc(doc(db, 'sendHelp', docId), helpData),
    setDoc(doc(db, 'receiveHelp', docId), helpData)
  ]);

  return true;
}

// Core exports for send help functionality