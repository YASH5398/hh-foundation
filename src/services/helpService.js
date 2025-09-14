import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  writeBatch 
} from '../config/firebase.js';
import { 
  LEVEL_HELP_LIMIT, 
  LEVEL_CONFIG, 
  UPLINE_PAYMENT_STATUS,
  getRequiredHelpsByLevel,
  requiresUplinePayment,
  getUplinePaymentAmount
} from '../config/levelConfig.js';
import { HELP_STATUS } from '../config/statusConstants.js';

const sendHelpCollectionRef = collection(db, 'sendHelp');
const receiveHelpCollectionRef = collection(db, 'receiveHelp');
const helpHistoryCollectionRef = collection(db, 'helpHistory');

export const getSendHelpRequests = (callback) => {
  const q = query(
    sendHelpCollectionRef,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(requests);
  });
};

export const getReceiveHelpRequests = (callback) => {
  const q = query(
    receiveHelpCollectionRef,
    where('status', 'in', ['pending', 'confirmed']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(requests);
  });
};

export const updateSendHelpRequest = async (id, requestData, currentUser) => {
  try {
    const requestDoc = doc(db, 'sendHelp', id);
    await setDoc(requestDoc, {
      ...requestData,
      senderId: currentUser?.uid || '',
      senderUserId: currentUser?.userId || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, message: 'Send help request updated successfully' };
  } catch (error) {
    console.error('Error updating send help request:', error);
    return { success: false, message: error.message };
  }
};

export const updateReceiveHelpRequest = async (id, requestData, currentUser) => {
  try {
    const requestDoc = doc(db, 'receiveHelp', id);
    await setDoc(requestDoc, {
      ...requestData,
      receiverId: currentUser?.uid || '',
      receiverUserId: currentUser?.userId || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, message: 'Receive help request updated successfully' };
  } catch (error) {
    console.error('Error updating receive help request:', error);
    return { success: false, message: error.message };
  }
};

export const deleteSendHelpRequest = async (id) => {
  try {
    const requestDoc = doc(db, 'sendHelp', id);
    await deleteDoc(requestDoc);
    return { success: true, message: 'Send help request deleted successfully' };
  } catch (error) {
    console.error('Error deleting send help request:', error);
    return { success: false, message: error.message };
  }
};

export const deleteReceiveHelpRequest = async (id) => {
  try {
    const requestDoc = doc(db, 'receiveHelp', id);
    await deleteDoc(requestDoc);
    return { success: true, message: 'Receive help request deleted successfully' };
  } catch (error) {
    console.error('Error deleting receive help request:', error);
    return { success: false, message: error.message };
  }
};

export const getHelpHistory = async () => {
  try {
    const data = await getDocs(helpHistoryCollectionRef);
    return { 
      success: true, 
      data: data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    };
  } catch (error) {
    console.error('Error getting help history:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const addHelpHistoryEntry = async (entryData, currentUser) => {
  try {
    await addDoc(helpHistoryCollectionRef, {
      ...entryData,
      userId: currentUser?.uid || '',
      userUserId: currentUser?.userId || '',
      createdAt: serverTimestamp(),
    });
    return { success: true, message: 'Help history entry added successfully' };
  } catch (error) {
    console.error('Error adding help history entry:', error);
    return { success: false, message: error.message };
  }
};

export const updateHelpHistoryEntry = async (id, entryData) => {
  try {
    const entryDoc = doc(db, 'helpHistory', id);
    await updateDoc(entryDoc, {
      ...entryData,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Help history entry updated successfully' };
  } catch (error) {
    console.error('Error updating help history entry:', error);
    return { success: false, message: error.message };
  }
};

export const deleteHelpHistoryEntry = async (id) => {
  try {
    const entryDoc = doc(db, 'helpHistory', id);
    await deleteDoc(entryDoc);
    return { success: true, message: 'Help history entry deleted successfully' };
  } catch (error) {
    console.error('Error deleting help history entry:', error);
    return { success: false, message: error.message };
  }
};

// Assign help to a receiver based on rules
export async function assignHelp(senderId, level, amount) {
  // 1. Find eligible receiver
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('level', '==', level),
    where('paymentBlocked', '==', false),
    orderBy('referralCount', 'desc')
  );
  const usersSnap = await getDocs(q);
  let receiver = null;
  for (const docSnap of usersSnap.docs) {
    const user = docSnap.data();
    // Not self, not already received 3 helps at this level
    if (
      user.uid !== senderId &&
      (!user.helpsReceived || !user.helpsReceived[level] || user.helpsReceived[level] < 3)
    ) {
      receiver = user;
      break;
    }
  }
  if (!receiver) throw new Error('No eligible receiver found');

  // 2. Create sendHelp and receiveHelp entries atomically
  const batch = writeBatch(db);
  const sendHelpRef = doc(collection(db, 'sendHelp'));
  const receiveHelpRef = doc(collection(db, 'receiveHelp'));
  const helpData = {
    senderId,
    receiverId: receiver.uid,
    amount,
    level,
    status: 'Pending',
    createdAt: serverTimestamp(),
    paymentProof: '',
  };
  batch.set(sendHelpRef, helpData);
  batch.set(receiveHelpRef, {
    ...helpData,
    paymentDetails: receiver.paymentMethod || {},
  });
  await batch.commit();
  return { sendHelpId: sendHelpRef.id, receiveHelpId: receiveHelpRef.id, receiver };
}

// Mark help as paid (sender uploads proof)
export async function markHelpPaid(helpId, paymentProofUrl) {
  try {
    const helpRef = doc(db, 'sendHelp', helpId);
    await updateDoc(helpRef, {
      status: 'Paid',
      paymentProof: paymentProofUrl || '',
      paidAt: serverTimestamp(),
    });
    return { success: true, message: 'Help marked as paid successfully' };
  } catch (error) {
    console.error('Error marking help as paid:', error);
    return { success: false, message: error.message };
  }
}

// Mark help as confirmed (receiver confirms receipt)
export async function markHelpConfirmed(helpId, amount, receiverId, level) {
  try {
    // Update sendHelp and receiveHelp status
    const sendHelpRef = doc(db, 'sendHelp', helpId);
    const sendHelpDoc = await getDoc(sendHelpRef);
    
    if (!sendHelpDoc.exists()) {
      throw new Error('Send help document not found');
    }
    
    const senderId = sendHelpDoc.data().senderId;
    const receiveHelpQuery = query(
      collection(db, 'receiveHelp'),
      where('senderId', '==', senderId),
      where('receiverId', '==', receiverId),
      where('level', '==', level)
    );
    const receiveHelpSnap = await getDocs(receiveHelpQuery);
    
    const batch = writeBatch(db);
    batch.update(sendHelpRef, { 
      status: 'Confirmed',
      confirmedAt: serverTimestamp()
    });
    
    receiveHelpSnap.forEach(docSnap => {
      batch.update(doc(db, 'receiveHelp', docSnap.id), { 
        status: 'Confirmed',
        confirmedAt: serverTimestamp()
      });
    });
    
    // Update receiver's totalReceived
    const userRef = doc(db, 'users', receiverId);
    batch.update(userRef, {
      totalReceived: increment(amount),
      lastHelpReceived: serverTimestamp(),
    });
    
  await batch.commit();
    
  // Check for level upgrade
  await checkLevelUpgrade(receiverId, level);
    
    return { success: true, message: 'Help confirmed successfully' };
  } catch (error) {
    console.error('Error marking help as confirmed:', error);
    return { success: false, message: error.message };
  }
}

// Real-time listener for sendHelp
export function listenToSendHelps(uid, callback) {
  const q = query(
    sendHelpCollectionRef,
    where('senderId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

// Real-time listener for receiveHelp
export function listenToReceiveHelps(uid, callback) {
  const q = query(
    receiveHelpCollectionRef,
    where('receiverId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

// Check and upgrade user level if 3 helps confirmed
export async function checkLevelUpgrade(uid, level) {
  // Count confirmed helps at this level
  const q = query(
    collection(db, 'receiveHelp'),
    where('receiverId', '==', uid),
    where('level', '==', level),
    where('status', '==', 'Confirmed')
  );
  const snap = await getDocs(q);
  if (snap.size >= 3) {
    // Upgrade user
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      level: level + 1,
      levelStatus: getNextLevelStatus(level),
      countdown: serverTimestamp(),
    });
    // Optionally, reset helpsReceived[level]
  }
}

function getNextLevelStatus(level) {
  const statuses = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  return statuses[level] || 'Diamond';
}

// Check and block user if not sent help in 24h
export async function checkAndBlockUser(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const user = userSnap.data();
  if (!user.countdown) return;
  const now = Date.now();
  const signupTime = user.countdown.seconds * 1000;
  if (!user.isActivated && now - signupTime > 24 * 60 * 60 * 1000) {
    await updateDoc(userRef, { paymentBlocked: true });
  }
}

// --- SEND HELP FLOW (MLM) ---

/**
 * Get eligible receiver for Send Help (same level, isActivated, not sender, highest DirectTeamCount)
 * @param {string} senderUserId - The userId (e.g. HH123456) of the sender
 * @param {string} levelStatus - The sender's levelStatus (e.g. 'Star')
 * @returns {Promise<object|null>} - The eligible receiver user object or null
 */
export async function getEligibleReceiver(senderUserId, levelStatus) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('levelStatus', '==', levelStatus),
    where('isActivated', '==', true)
  );
  const usersSnap = await getDocs(q);
  let eligible = usersSnap.docs
    .map(doc => ({ ...doc.data(), docId: doc.id, uid: doc.id }))
    .filter(u => u.userId && u.userId !== senderUserId); // Do not filter by name/type
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => (b.DirectTeamCount || 0) - (a.DirectTeamCount || 0));
  return eligible[0];
}

/**
 * Check if sender already has a sendHelp doc with status != 'Confirmed'
 * @param {string} senderUserId
 * @returns {Promise<object|null>} - The sendHelp doc if exists, else null
 */
export async function getActiveSendHelp(senderUid) {
  const q = query(
    sendHelpCollectionRef,
    where('senderId', '==', senderUid),
    where('status', '!=', 'Confirmed')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Create sendHelp and receiveHelp docs for a help transaction
 * @param {object} senderUser - Sender user object (must include userId, phone, whatsappNumber, etc)
 * @param {object} receiverUser - Receiver user object (must include userId, phone, whatsappNumber, paymentMethod, etc)
 * @param {number} amount
 * @returns {Promise<{sendHelpId: string, receiveHelpId: string}>}
 */
export async function createSendAndReceiveHelp(senderUser, receiverUser, amount = 300) {
  // PART 1: Prevent duplicates
  const existingQuery = query(
    receiveHelpCollectionRef,
    where('senderId', '==', senderUser.uid),
    where('receiverId', '==', receiverUser.uid)
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    console.log('Duplicate receiveHelp doc detected, not creating a new one.');
    return { duplicate: true };
  }
  const sendHelpRef = doc(collection(db, 'sendHelp'));
  const receiveHelpRef = doc(collection(db, 'receiveHelp'));
  // Fetch sender details from users collection
  let senderDetails = {};
  try {
    const senderDocSnap = await getDoc(doc(db, 'users', senderUser.uid));
    if (senderDocSnap.exists()) {
      const senderData = senderDocSnap.data();
      senderDetails = {
        senderName: senderData.fullName || '',
        senderEmail: senderUser.email || senderData.email || '',
        senderPhone: senderData.phone || '',
        senderWhatsapp: senderData.whatsapp || '',
        senderProfileImage: senderData.profileImage || '',
      };
    }
  } catch (e) {
    senderDetails = {
      senderName: '', senderEmail: senderUser.email || '', senderPhone: '', senderWhatsapp: '', senderProfileImage: ''
    };
  }
  const helpData = {
    senderId: senderUser.uid,
    senderUserId: senderUser.userId,
    receiverId: receiverUser.uid,
    receiverUserId: receiverUser.userId,
    amount,
    status: 'Pending',
    createdAt: serverTimestamp(),
    senderPhone: senderUser.phone || '',
    receiverPhone: receiverUser.phone || '',
    senderWhatsApp: senderUser.whatsappNumber || senderUser.whatsapp || '',
    receiverWhatsApp: receiverUser.whatsappNumber || receiverUser.whatsapp || '',
    receiverPaymentMethod: receiverUser.paymentMethod || {},
    ...senderDetails // Add senderName, senderEmail, senderPhone, senderWhatsapp, senderProfileImage
  };
  const batch = writeBatch(db);
  batch.set(sendHelpRef, helpData);
  batch.set(receiveHelpRef, helpData);
  await batch.commit();
  return { sendHelpId: sendHelpRef.id, receiveHelpId: receiveHelpRef.id };
}

/**
 * Update status for both sendHelp and receiveHelp docs
 * @param {string} senderId - userId of sender
 * @param {string} receiverId - userId of receiver
 * @param {string} newStatus - 'Paid' or 'Confirmed'
 */
export async function updateHelpStatus(senderUid, receiverUid, newStatus) {
  const sendQ = query(
    sendHelpCollectionRef,
    where('senderId', '==', senderUid),
    where('receiverId', '==', receiverUid),
    where('status', '!=', 'Confirmed')
  );
  const sendSnap = await getDocs(sendQ);
  const receiveQ = query(
    collection(db, 'receiveHelp'),
    where('senderId', '==', senderUid),
    where('receiverId', '==', receiverUid),
    where('status', '!=', 'Confirmed')
  );
  const receiveSnap = await getDocs(receiveQ);
  const batch = writeBatch(db);
  sendSnap.forEach(docSnap => batch.update(doc(db, 'sendHelp', docSnap.id), { status: newStatus }));
  receiveSnap.forEach(docSnap => batch.update(doc(db, 'receiveHelp', docSnap.id), { status: newStatus }));
  await batch.commit();
}

/**
 * Real-time listener for a user's sendHelp (by senderId)
 * @param {string} senderUserId
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export function listenToSendHelpByUserId(senderUid, callback) {
  return sendHelpCollectionRef.where('senderId', '==', senderUid).onSnapshot(
    snapshot => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  );
}

/**
 * Real-time listener for a user's receiveHelp (by receiverId)
 * @param {string} receiverUserId
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export function listenToReceiveHelpByUserId(receiverUid, callback) {
  return receiveHelpCollectionRef.where('receiverId', '==', receiverUid).onSnapshot(
    snapshot => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  );
}

/**
 * Check if sender has active help documents
 * @param {string} senderUid - The sender's UID
 * @returns {Promise<boolean>} - True if active help exists
 */
export async function hasActiveSendHelp(senderUid) {
  const activeStatuses = [HELP_STATUS.PENDING, HELP_STATUS.PAYMENT_DONE];
  const q = query(
    collection(db, 'sendHelp'),
    where('senderUid', '==', senderUid),
    where('status', 'in', activeStatuses)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Create a new sendHelp document in Firestore with duplicate prevention.
 * @param {Object} data - The send help data (see below for fields).
 * @returns {Promise}
 *
 * Data fields:
 * - amount
 * - paymentMethod
 * - paymentScreenshotUrl
 * - receiverId (display only)
 * - receiverUid (security)
 * - senderId (display only)
 * - senderUid (security)
 * - status ("pending" by default)
 */
export async function createSendHelp({
  amount,
  paymentMethod,
  paymentScreenshotUrl,
  receiverId,
  receiverUid,
  senderId,
  senderUid
}) {
  // Check for duplicate active help documents
  const hasActive = await hasActiveSendHelp(senderUid);
  if (hasActive) {
    throw new Error('You already have an active help request. Please complete it before creating a new one.');
  }

  // Fetch sender and receiver user data from users collection
  const senderDoc = await getDoc(doc(db, 'users', senderUid));
  const receiverDoc = await getDoc(doc(db, 'users', receiverUid));
  const senderData = senderDoc.exists ? senderDoc.data() : {};
  const receiverData = receiverDoc.exists ? receiverDoc.data() : {};

  return await addDoc(collection(db, 'sendHelp'), {
    amount,
    createdAt: serverTimestamp(),
    paymentMethod,
    paymentScreenshotUrl,
    receiverId,
    receiverUid,
    senderId,
    senderUid,
    status: HELP_STATUS.PENDING,
    // Sender contact fields
    senderEmail: String(senderData.email || ''),
    senderPhone: String(senderData.phone || ''),
    senderWhatsapp: String(senderData.whatsapp || senderData.whatsappNumber || ''),
    senderProfileImage: String(senderData.profileImage || ''),
    // Receiver contact fields
    receiverEmail: String(receiverData.email || ''),
    receiverPhone: String(receiverData.phone || ''),
    receiverWhatsapp: String(receiverData.whatsapp || receiverData.whatsappNumber || ''),
    receiverProfileImage: String(receiverData.profileImage || ''),
  });
}

/**
 * Listen for incoming help for the current user (receiver).
 * @param {string} currentUserUid - The Firebase UID of the receiver.
 * @param {function} callback - Called with an array of help docs.
 * @returns {function} Unsubscribe function.
 */
export function listenForIncomingHelp(currentUserUid, callback) {
  const q = sendHelpCollectionRef.where('receiverUid', '==', currentUserUid);
  return q.onSnapshot(
    (snapshot) => {
      const helps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(helps);
    }
  );
}

/**
 * Mark a sendHelp document as completed (status: "Completed").
 * @param {string} docId - The Firestore document ID.
 * @returns {Promise}
 */
export async function markHelpCompleted(docId) {
  return await updateDoc(doc(db, 'sendHelp', docId), {
    status: HELP_STATUS.CONFIRMED
  });
}

/**
 * Create upline payment document for level upgrades
 * @param {string} userUid - User's UID
 * @param {string} newLevel - New level after upgrade
 * @param {number} amount - Payment amount
 * @returns {Promise}
 */
export async function createUplinePayment(userUid, newLevel, amount) {
  return await addDoc(collection(db, 'uplinePayments'), {
    userUid,
    level: newLevel,
    amount,
    status: UPLINE_PAYMENT_STATUS.PENDING,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Handle level upgrade after help confirmation
 * @param {string} receiverUid - Receiver's UID
 * @param {Object} receiverData - Receiver's user data
 * @returns {Promise}
 */
export async function handleLevelUpgrade(receiverUid, receiverData) {
  const currentLevel = receiverData.level || 'Star';
  const helpReceived = (receiverData.helpReceived || 0) + 1;
  const config = LEVEL_CONFIG[currentLevel];
  
  if (!config) return;
  
  // Update help received count
  await updateDoc(doc(db, 'users', receiverUid), {
    helpReceived
  });
  
  // Check if upgrade is needed
  if (helpReceived >= config.receiveCount && config.next) {
    const nextLevel = config.next;
    
    // Update user level and reset help count
    const updateData = {
      level: nextLevel,
      helpReceived: 0,
      levelUpgradedAt: db.FieldValue.serverTimestamp()
    };
    
    // Check if upline payment is required
    if (requiresUplinePayment(nextLevel)) {
      const paymentAmount = getUplinePaymentAmount(nextLevel);
      
      // Create upline payment document
      await createUplinePayment(receiverUid, nextLevel, paymentAmount);
      
      // Hold receiving until upline payment is confirmed
      updateData.isReceivingHeld = true;
    }
    
    await updateDoc(doc(db, 'users', receiverUid), updateData);
    
    console.log(`User ${receiverData.userId} upgraded to ${nextLevel}`);
  }
}

/**
 * This function checks if a receiver has reached their receive help limit.
 * If yes, it updates their `isReceivingHeld` to true to prevent further assignments.
 */
export const checkAndHoldReceiver = async (receiverId, receiverUid, receiverLevel) => {
  try {
    const activeStatuses = [HELP_STATUS.PENDING, HELP_STATUS.CONFIRMED, HELP_STATUS.PAYMENT_DONE];
    const q = query(
      collection(db, 'sendHelp'),
      where('receiverId', '==', receiverId),
      where('status', 'in', activeStatuses)
    ); // Active helps

    const snap = await getDocs(q);
    const currentHelps = snap.size;

    const maxHelpsAllowed = LEVEL_HELP_LIMIT[receiverLevel] || 3;

    if (currentHelps >= maxHelpsAllowed) {
      await updateDoc(doc(db, 'users', receiverUid), {
        isReceivingHeld: true,
      });
      console.log(`🛑 Receiver ${receiverId} is now on hold after ${currentHelps} helps.`);
    } else {
      console.log(`✅ Receiver ${receiverId} has ${currentHelps}/${maxHelpsAllowed} helps. Still eligible.`);
    }
  } catch (error) {
    console.error(`Error checking receiver ${receiverId}:`, error);
  }
};

// 🧠 Get all eligible receivers with improved duplicate prevention
export async function getEligibleReceivers(level, excludeSenderUid = null) {
  const usersSnapshot = await getDocs(query(
    collection(db, 'users'),
    where('isActivated', '==', true),
    where('helpVisibility', '==', true),
    where('isOnHold', '==', false),
    where('isReceivingHeld', '==', false),
    where('isBlocked', '==', false)
  ));
  
  console.log('📊 getEligibleReceivers query snapshot docs:', usersSnapshot.docs.map(doc => ({
    uid: doc.id,
    userId: doc.data().userId,
    isActivated: doc.data().isActivated,
    helpVisibility: doc.data().helpVisibility,
    isOnHold: doc.data().isOnHold,
    isReceivingHeld: doc.data().isReceivingHeld,
    isBlocked: doc.data().isBlocked,
    level: doc.data().level
  })));

  const eligibleReceivers = [];

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    // Skip sender (can't send help to themselves)
    if (excludeSenderUid && userData.uid === excludeSenderUid) continue;
    
    if (userData.isSystemAccount === true && (userData.helpReceived || 0) >= 3) {
      await updateDoc(doc(db, 'users', userData.uid), {
        helpReceived: 3,
        isReceivingHeld: true,
        isOnHold: true,
      });
      continue; // skip system users with 3 helps
    }
    if (userData.isReceivingHeld || userData.isOnHold) continue;

    // Check current active helps for this receiver
    const activeStatuses = [HELP_STATUS.PENDING, HELP_STATUS.PAYMENT_DONE];
    const activeHelpsSnapshot = await getDocs(query(
      collection(db, 'sendHelp'),
      where('receiverUid', '==', userData.uid),
      where('status', 'in', activeStatuses)
    ));
    
    const activeHelpsCount = activeHelpsSnapshot.size;
    const maxHelpsAllowed = LEVEL_HELP_LIMIT[userData.level] || 3;
    
    // Skip if receiver already has maximum active helps
    if (activeHelpsCount >= maxHelpsAllowed) {
      continue;
    }

    const helpsSnapshot = await getDocs(query(
      collection(db, 'receiveHelp'),
      where('receiverId', '==', userData.userId),
      where('confirmedByReceiver', '==', true)
    ));

    const confirmedCount = helpsSnapshot.size;
    const requiredHelps = getRequiredHelpsByLevel(userData.level);

    if (confirmedCount < requiredHelps) {
      eligibleReceivers.push({
        ...userData,
        activeHelpsCount,
        maxHelpsAllowed,
        availableSlots: maxHelpsAllowed - activeHelpsCount
      });
    }
  }

  // 🔝 Sort by: 1) Available slots (desc), 2) Referral count (desc), 3) Join date (asc)
  eligibleReceivers.sort((a, b) => {
    if (b.availableSlots !== a.availableSlots) {
      return b.availableSlots - a.availableSlots;
    }
    if (b.referralCount !== a.referralCount) {
      return b.referralCount - a.referralCount;
    }
    return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
  });

  return eligibleReceivers;
}

export async function holdSystemAccountIfLimitReached(user) {
  if (user.isSystemAccount === true && (user.helpReceived || 0) >= 3) {
    await updateDoc(doc(db, 'users', user.uid), { helpReceived: 3, isReceivingHeld: true, isOnHold: true });
    console.log(`System account ${user.userId} held and blocked after 3 helps (post-confirmation).`);
  }
}