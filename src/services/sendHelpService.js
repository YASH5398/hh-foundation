import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, serverTimestamp, writeBatch, increment, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const levelAmount = {
  Star: 300,
  Silver: 600,
  Gold: 2000,
  Platinum: 20000,
  Diamond: 200000
};

const LEVEL_HELP_LIMIT = { Star: 3, Silver: 9, Gold: 27, Platinum: 81, Diamond: 243 };

const getMaxHelpsForLevel = (level) => LEVEL_HELP_LIMIT[level] || 3;

const getReceiverAssignedHelpCount = async (receiverId, level) => {
  const receiveHelpRef = collection(db, 'receiveHelp');
  const q = query(
    receiveHelpRef,
    where('receiverId', '==', receiverId),
    where('level', '==', level),
    where('status', 'in', ['Pending', 'Confirmed'])
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

const SYSTEM_USER_IDS = ['HHF123456', 'HHF000001', 'HHF999999'];

export async function getEligibleReceiver(senderUid, senderLevel) {
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(query(
    usersRef,
    where('isActivated', '==', true),
    where('helpVisibility', '==', true),
    where('isOnHold', '==', false),
    where('isReceivingHeld', '==', false),
    where('isBlocked', '==', false),
    orderBy('referralCount', 'desc')
  ));

  const allReceivers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  console.log('📊 Query snapshot docs:', allReceivers.map(user => ({
    uid: user.uid,
    userId: user.userId,
    isActivated: user.isActivated,
    helpVisibility: user.helpVisibility,
    isOnHold: user.isOnHold,
    isReceivingHeld: user.isReceivingHeld,
    isBlocked: user.isBlocked
  })));

  // Filter only eligible receivers
  const filteredReceivers = allReceivers.filter(receiver =>
    receiver.isActivated === true &&
    receiver.helpVisibility === true &&
    receiver.isOnHold !== true &&
    receiver.isReceivingHeld !== true &&
    receiver.isBlocked !== true &&
    receiver.uid !== senderUid &&
    !SYSTEM_USER_IDS.includes(receiver.userId)
  );

  console.log('📊 Filtered eligible receivers:', filteredReceivers.length);

  for (const receiver of filteredReceivers) {
    // Log each considered receiver
    console.log('Checking receiver:', receiver.userId);

    // Check if receiver is already assigned to this sender
    const checkSendHelp = await db
      .collection('sendHelp')
      .where('senderUid', '==', senderUid)
      .where('receiverUid', '==', receiver.uid)
      .limit(1)
      .get();

    if (checkSendHelp.empty) {
      console.log('Selected receiver:', receiver.userId);
      return receiver; // ✅ Found eligible receiver
    }
  }

  console.log('No eligible receiver found, trying fallback to first active user');
  
  // Fallback: Pick the first active user from users collection
  const fallbackUser = allReceivers.find(user => 
    user.isActivated && 
    user.userId && 
    user.userId.trim() !== '' && 
    user.uid !== senderUid &&
    !SYSTEM_USER_IDS.includes(user.userId)
  );
  
  if (fallbackUser) {
    console.log('Found fallback user:', fallbackUser.userId);
    return fallbackUser;
  }
  
  console.log('No fallback user found either');
  return null; // ❌ No eligible receiver found
}

function getRequiredHelpCount(level) {
  if (level === 1) return 3; // Star
  if (level === 2) return 9; // Silver
  if (level === 3) return 27; // Gold
  if (level === 4) return 81; // Platinum
  if (level === 5) return 243; // Diamond
  return 3;
}

// 1. Sender Eligibility Check
export async function checkSenderEligibility(currentUser) {
  if (!currentUser) return { eligible: false, reason: 'Not authenticated' };
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { eligible: false, reason: 'User not found' };
  const userData = userSnap.data();
  if (!userData.isActivated || userData.isBlocked) {
    return { eligible: false, reason: 'User not eligible' };
  }
  // Block only if any sendHelp with status 'Pending' exists for this sender and level
  const q = query(
    collection(db, 'sendHelp'),
    where('senderId', '==', userData.userId),
    where('status', '==', 'Pending'),
    where('level', '==', userData.levelStatus)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { eligible: false, reason: 'Already has a pending sendHelp in this level' };
  }
  return { eligible: true, userData };
}

// 2. Receiver Selection Logic
export async function selectReceiver(userData) {
  let levelsToTry = [userData.levelStatus];
  if (userData.levelStatus === 'Star') levelsToTry.push('Silver');
  for (const level of levelsToTry) {
    const q = query(
      collection(db, 'users'),
      where('isActivated', '==', true),
      where('isReceivingHeld', '==', false),
      where('isOnHold', '==', false),
      where('isBlocked', '==', false),
      where('isSystemAccount', '==', false),
      where('helpReceived', '<', 3),
      where('levelStatus', '==', level)
    );
    const snap = await getDocs(q);
    const allReceivers = snap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    const eligible = [];
    for (const u of allReceivers) {
      if (!u.userId || u.userId === userData.userId) continue;
      // Count confirmed helps for this user at this level
      const helpsSnapshot = await getDocs(query(
        collection(db, 'receiveHelp'),
        where('receiverId', '==', u.userId),
        where('confirmedByReceiver', '==', true),
        where('level', '==', u.levelStatus)
      ));
      const confirmedCount = helpsSnapshot.size;
      const LEVEL_HELP_LIMIT = { Star: 3, Silver: 9, Gold: 27, Platinum: 81, Diamond: 243 };
      const requiredHelps = LEVEL_HELP_LIMIT[u.levelStatus] || 3;
      if (confirmedCount >= requiredHelps) continue;
      eligible.push(u);
    }
    if (eligible.length > 0) {
      eligible.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
      return eligible[0];
    }
  }
  console.warn('No eligible receiver found. Check isActivated, isReceivingHeld, isOnHold, isBlocked, helpReceived, isSystemAccount filters.');
  return null;
}

// 3. Create Send Help + Receive Help Docs
export async function createSendAndReceiveHelp(userData, receiver) {
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${userData.userId}_${timestamp}`;
  const sendHelpData = {
    receiverId: receiver.userId,
    receiverUid: receiver.uid,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone,
    receiverWhatsapp: receiver.whatsapp,
    receiverEmail: receiver.email,
    senderId: userData.userId,
    senderUid: userData.uid,
    senderName: userData.fullName,
    senderPhone: userData.phone,
    senderWhatsapp: userData.whatsapp,
    senderEmail: userData.email,
    amount: 300,
    status: 'Pending',
    confirmedByReceiver: false,
    confirmationTime: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp,
    paymentDetails: {
      bank: {
        name: userData.bank?.name || '',
        accountNumber: userData.bank?.accountNumber || '',
        bankName: userData.bank?.bankName || '',
        ifscCode: userData.bank?.ifscCode || '',
        method: 'Bank'
      },
      upi: {
        upi: userData.paymentMethod?.upi || '',
        gpay: userData.paymentMethod?.gpay || '',
        phonePe: userData.paymentMethod?.phonePe || ''
      },
      screenshotUrl: '',
      utrNumber: ''
    }
  };
  const receiveHelpData = {
    ...sendHelpData
  };
  await setDoc(doc(db, 'sendHelp', docId), sendHelpData);
  await setDoc(doc(db, 'receiveHelp', docId), receiveHelpData);
  return docId;
}

// 4. Payment Form (UI) & Update Logic
export async function submitPaymentProof(docId, method, utrNumber, screenshotUrl) {
  await updateDoc(doc(db, 'sendHelp', docId), {
    status: 'Paid',
    paymentDetails: {
      method,
      utrNumber,
      screenshotUrl
    }
  });
}

// Utility to update helpReceived count for a receiver
export const updateHelpReceivedCount = async (receiverId) => {
  const receiveHelpRef = collection(db, "receiveHelp");
  const q = query(receiveHelpRef, where("receiverId", "==", receiverId), where("confirmedByReceiver", "==", true));
  const snapshot = await getDocs(q);
  const confirmedCount = snapshot.size;

  const usersRef = collection(db, "users");
  const userQ = query(usersRef, where("userId", "==", receiverId));
  const userSnap = await getDocs(userQ);

  if (!userSnap.empty) {
    const userDoc = userSnap.docs[0];
    await updateDoc(doc(db, "users", userDoc.id), {
      helpReceived: confirmedCount,
    });
  }
};

// Utility to increment helpReceived and set hold flags if needed
export const incrementHelpReceivedAndSetHold = async (userUid, currentHelpReceived) => {
  if ((currentHelpReceived || 0) + 1 >= 3) {
    await updateDoc(doc(db, 'users', userUid), {
      helpReceived: increment(1),
      isReceivingHeld: true,
      isOnHold: true,
    });
  } else {
    await updateDoc(doc(db, 'users', userUid), {
      helpReceived: increment(1),
    });
  }
};

export async function confirmHelpReceived(docId) {
  await updateDoc(doc(db, 'sendHelp', docId), {
    status: 'Confirmed',
    confirmedByReceiver: true
  });
  await updateDoc(doc(db, 'receiveHelp', docId), {
    status: 'Confirmed',
    confirmedByReceiver: true
  });

  // After confirmation, update helpReceived count for the receiver
  const receiveHelpSnap = await getDoc(doc(db, 'receiveHelp', docId));
  if (receiveHelpSnap.exists()) {
    const data = receiveHelpSnap.data();
    const receiverUserId = data.receiverId; // Use userId, not uid
    if (receiverUserId) {
      // Get user doc by userId
      const usersQuery = query(collection(db, 'users'), where('userId', '==', receiverUserId));
      const usersSnap = await getDocs(usersQuery);
      if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        const userUid = userDoc.id;
        const userData = userDoc.data();
        await incrementHelpReceivedAndSetHold(userUid, userData.helpReceived);
      }
    }
  }
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

export async function assignHelpOnActivation(senderUid) {
  const userRef = doc(db, 'users', senderUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;
  const sender = { uid: userSnap.id, ...userSnap.data() };
  if (!sender.isActivated || sender.isBlocked || sender.isReceivingHeld) return false;
  const senderLevel = sender.levelStatus || sender.level;
  // Check if already has a sendHelp doc (pending or confirmed)
  const existingSendHelpQ = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', sender.uid),
    where('status', 'in', ['pending', 'confirmed'])
  );
  const existingSendHelpSnap = await getDocs(existingSendHelpQ);
  if (!existingSendHelpSnap.empty) return false;
  // Find eligible receivers
  const q = query(
    collection(db, 'users'),
    where('levelStatus', '==', senderLevel)
  );
  const usersSnapshot = await getDocs(q);
  const allReceivers = usersSnapshot.docs.map(docSnap => ({ ...docSnap.data(), uid: docSnap.id }));
  for (const user of allReceivers) {
    if (user.isSystemAccount === true && (user.helpReceived || 0) >= 3) {
      await updateDoc(doc(db, "users", user.uid), { helpReceived: 3, isReceivingHeld: true, isOnHold: true });
      continue;
    }
    if (user.isReceivingHeld || user.isOnHold) return;
  }
  const filteredReceivers = allReceivers.filter(user =>
    user.isActivated &&
    !user.isReceivingHeld &&
    !user.isBlocked &&
    user.userId !== sender.userId &&
    !SYSTEM_USER_IDS.includes(user.userId)
  );
  let eligibleReceivers = [];
  for (const user of filteredReceivers) {
    if (user.isSystemAccount === true && (user.helpReceived || 0) >= 3) {
      await updateDoc(doc(db, "users", user.uid), { helpReceived: 3, isReceivingHeld: true, isOnHold: true });
      continue;
    }
    const assignedCount = await getReceiverAssignedHelpCount(user.userId, user.levelStatus);
    const maxHelpsAllowed = getMaxHelpsForLevel(user.levelStatus);
    if (assignedCount >= maxHelpsAllowed) {
      await updateDoc(doc(db, 'users', user.uid), { isReceivingHeld: true });
      continue;
    }
    eligibleReceivers.push({ ...user, assignedCount });
  }
  eligibleReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  console.log('Eligible receivers:', eligibleReceivers.map(u => ({ userId: u.userId, referralCount: u.referralCount, assignedCount: u.assignedCount })));
  eligibleReceivers.forEach(u => console.log('filteredReceiver.userId:', u.userId));
  const receiver = eligibleReceivers[0];
  if (!receiver) return false;
  console.log('Selected receiver:', receiver.userId);
  if (SYSTEM_USER_IDS.includes(receiver.userId)) throw new Error('System user selected as receiver, which should never happen!');
  // Create sendHelp and receiveHelp docs
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;
  const amount = 300; // or use levelAmount[senderLevel] if needed
  const helpData = {
    amount,
    confirmedByReceiver: false,
    status: 'Pending',
    timestamp,
    createdAt: serverTimestamp(),
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
    paymentDetails: receiver.paymentMethod || {},
    level: senderLevel
  };
  await setDoc(doc(db, 'sendHelp', docId), helpData);
  await setDoc(doc(db, 'receiveHelp', docId), helpData);
  // After assignment, check if receiver should be held
  const newAssignedCount = await getReceiverAssignedHelpCount(receiver.userId, receiver.levelStatus);
  const maxHelpsAllowed = getMaxHelpsForLevel(receiver.levelStatus);
  if (newAssignedCount >= maxHelpsAllowed) {
    await updateDoc(doc(db, 'users', receiver.uid), { isReceivingHeld: true });
  }
  await holdSystemAccountIfLimitReached(receiver);
  return true;
}

// Add these exports at the end of the file
export { LEVEL_HELP_LIMIT, getMaxHelpsForLevel };

// Remove the CommonJS export and keep only ES6 exports
// Remove: module.exports = { assignReceiverOnActivation, assignHelpForActiveUsers };
// Add:
export { assignReceiverOnActivation, assignHelpForActiveUsers };