console.log('🔁 Script started...');
const admin = require("firebase-admin");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.js");
require('../src/services/helpService.cjs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
console.log('✅ Firebase Admin Initialized');

const db = getFirestore();

function getMaxHelpsForLevel(level) {
  if (level === 'Star') return 3;
  if (level === 'Silver') return 9;
  if (level === 'Gold') return 27;
  if (level === 'Platinum') return 81;
  if (level === 'Diamond') return 243;
  return 3;
} 

// Utility: Block receiver if overfilled (updated for new max per level)
async function blockOverfilledReceiver(receiverUid, receiverLevel, helpReceived) {
  const maxHelps = getMaxHelpsForLevel(receiverLevel);
  if ((helpReceived || 0) >= maxHelps) {
    await db.collection("users").doc(receiverUid).update({
      isReceivingHeld: true,
      paymentBlocked: true
    });
    console.log(`⛔ Blocked overfilled receiver: ${receiverUid}`);
    await cleanupPendingAssignmentsByUid(receiverUid);
  }
}

// Utility: Cleanup pending assignments for overfilled receiver by UID
async function cleanupPendingAssignmentsByUid(receiverUid) {
  // Get receiver's userId
  const receiverDoc = await db.collection("users").doc(receiverUid).get();
  if (!receiverDoc.exists) return;
  const receiver = receiverDoc.data();
  const receiverUserId = receiver.userId;
  // Find all sendHelp docs with status 'pending' and receiverId == receiverUserId
  const sendHelpSnap = await db.collection("sendHelp")
    .where("receiverId", "==", receiverUserId)
    .where("status", "==", "pending")
    .get();
  for (const doc of sendHelpSnap.docs) {
    const data = doc.data();
    if (!data.paymentDetails || !data.paymentDetails.screenshotUrl) {
      await db.collection("sendHelp").doc(doc.id).delete();
      await db.collection("receiveHelp").doc(doc.id).delete();
      console.log(`🗑️ Deleted pending sendHelp/receiveHelp for sender ${data.senderId}`);
    } else {
      const senderUid = data.senderUid;
      console.log(`🔁 Reassigning sender ${data.senderId}`);
      await assignReceiverOnActivation(senderUid);
    }
  }
}

const SYSTEM_RESERVED_UID = "78IdmRfawILxgEU4pMpS";
const SYSTEM_USER_IDS = ['HHF000001', 'HHF999999', SYSTEM_RESERVED_UID];

async function assignReceiverOnActivation(userUid) {
  if (userUid === SYSTEM_RESERVED_UID) {
    console.log("System user detected as sender — skipping assignment.");
    return false;
  }
  const senderDoc = await db.collection("users").doc(userUid).get();
  if (!senderDoc.exists) return false;
  const sender = senderDoc.data();

  // --- Forced Receiver Logic ---
  const forceDocRef = db.collection("globalSettings").doc("forceReceiver");
  const forceDocSnap = await forceDocRef.get();
  if (forceDocSnap.exists) {
    const forceData = forceDocSnap.data();
    if (forceData.enabled && forceData.receiverUid && forceData.receiverUserId) {
      if (forceData.receiverUid === SYSTEM_RESERVED_UID) {
        console.log("System user detected as forced receiver — skipping assignment.");
        return false;
      }
      if (SYSTEM_USER_IDS.includes(forceData.receiverUserId)) {
        console.log("System/test userId detected as forced receiver — skipping assignment.");
        return false;
      }
      const receiverDoc = await db.collection("users").doc(forceData.receiverUid).get();
      if (!receiverDoc.exists) {
        console.log("❌ Forced receiver UID not found:", forceData.receiverUid);
        return false;
      }
      const receiver = receiverDoc.data();
      if (receiver.uid === SYSTEM_RESERVED_UID || receiver.isSystemUser) {
        console.log("System user detected as forced receiver (doc) — skipping assignment.");
        return false;
      }
      const maxHelps = getMaxHelpsForLevel(receiver.levelStatus || receiver.level);
      // Count sendHelp docs for this receiver (pending or confirmed)
      const shSnap = await db.collection("sendHelp")
        .where("receiverId", "==", forceData.receiverUserId)
        .where("status", "in", ["pending", "confirmed"])
        .get();
      console.log(`[FORCED] Receiver ${forceData.receiverUserId} has ${shSnap.size} active sendHelp docs (max allowed: ${maxHelps})`);
      if (shSnap.size >= maxHelps) {
        await db.collection("users").doc(forceData.receiverUid).update({ isReceivingHeld: true });
        await cleanupPendingAssignmentsBeyondMax(forceData.receiverUserId, maxHelps);
        console.log(`⛔ Forced receiver is at max helps: ${forceData.receiverUserId}`);
        return false;
      }
      if (receiver.paymentBlocked || receiver.isReceivingHeld || receiver.isBlocked) {
        console.log(`⛔ Forced receiver is blocked or held: ${receiver.userId}`);
        return false;
      }
      const timestamp = Date.now();
      const docId = `${forceData.receiverUserId}_${sender.userId}_${timestamp}`;
      const helpData = {
        amount: 300,
        status: "pending",
        confirmedByReceiver: false,
        createdAt: Timestamp.now(),
        timestamp,
        senderUid: userUid,
        senderId: sender.userId,
        senderName: sender.fullName,
        senderPhone: sender.phone || "",
        senderWhatsapp: sender.whatsapp || "",
        senderEmail: sender.email || "",
        receiverUid: forceData.receiverUid,
        receiverId: forceData.receiverUserId,
        receiverName: receiver.fullName,
        receiverPhone: receiver.phone || "",
        receiverWhatsapp: receiver.whatsapp || "",
        receiverEmail: receiver.email || "",
        paymentDetails: receiver.paymentMethod || {},
      };
      await db.collection("sendHelp").doc(docId).set(helpData);
      await db.collection("receiveHelp").doc(docId).set(helpData);
      console.log(`🚩 Forced receiver assigned for ${sender.userId} → ${forceData.receiverUserId}`);
      await blockOverfilledReceiver(forceData.receiverUid, receiver.levelStatus || receiver.level, shSnap.size + 1);
      return true;
    }
  }
  // --- End Forced Receiver Logic ---

  const level = sender.levelStatus || sender.level || "Star";
  // Step 1: Query eligible receivers from Firestore (do not filter system accounts at query level)
  const receiverQuery = db.collection("users")
    .where("isActivated", "==", true)
    .where("isBlocked", "==", false)
    .where("isReceivingHeld", "==", false)
    .orderBy("referralCount", "desc")
    .limit(10);
  const receiversSnapshot = await receiverQuery.get();
  // Step 2: Convert snapshot to array
  const allReceivers = receiversSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  // Step 3: Defensive in-memory filter (exclude system accounts only for assignment)
  const filteredReceivers = allReceivers.filter(user =>
    user.uid !== userUid && // skip self
    (!alreadySentToUserIds || !alreadySentToUserIds.includes(user.userId)) // skip if sender already sent help to this receiver
  );
  // Step 4: Log and select
  console.log("Filtered eligible receivers:", filteredReceivers.map(u => u.userId));
  const receiver = filteredReceivers.length > 0 ? filteredReceivers[0] : null;
  if (!receiver) {
    console.log('⚠️ No eligible receiver found (system account skipped or none available)');
    return false;
  }
  // Do NOT skip or hide system account documents in sendHelp/receiveHelp creation or display
  // Only exclude system accounts during receiver selection for new assignments
  if (receiver.uid === SYSTEM_RESERVED_UID || SYSTEM_USER_IDS.includes(receiver.userId) || receiver.isSystemUser) {
    console.log("System/test/dummy user detected as selected receiver — skipping assignment.");
    return false;
  }
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;
  const helpData = {
    amount: 300,
    status: "pending",
    confirmedByReceiver: false,
    createdAt: Timestamp.now(),
    timestamp,
    senderUid: userUid,
    senderId: sender.userId,
    senderName: sender.fullName,
    senderPhone: sender.phone || "",
    senderWhatsapp: sender.whatsapp || "",
    senderEmail: sender.email || "",
    receiverUid: receiver.uid,
    receiverId: receiver.userId,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone || "",
    receiverWhatsapp: receiver.whatsapp || "",
    receiverEmail: receiver.email || "",
    paymentDetails: receiver.paymentMethod || {},
  };
  await db.collection("sendHelp").doc(docId).set(helpData);
  await db.collection("receiveHelp").doc(docId).set(helpData);
  await blockOverfilledReceiver(receiver.uid, receiver.levelStatus || receiver.level, receiver.sendHelpCount + 1);
  // Auto-hold receiver if at limit
  await checkAndHoldReceiver(receiver.userId, receiver.uid, receiver.levelStatus || receiver.level);
  return true;
}

async function createHelpDocs(sender, receiver) {
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${sender.userId}_${timestamp}`;
  const helpData = {
    amount: 300,
    confirmedByReceiver: false,
    status: 'Pending',
    createdAt: new Date().toISOString(), // or use Firestore Timestamp if available
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
  console.log(`[ASSIGN] Created sendHelp/receiveHelp: Sender ${sender.userId} → Receiver ${receiver.userId}`);
}

// Remove any pending sendHelp/receiveHelp docs for a receiver beyond the max allowed
async function cleanupPendingAssignmentsBeyondMax(receiverUserId, maxAllowed) {
  const sendHelpSnap = await db.collection("sendHelp")
    .where("receiverId", "==", receiverUserId)
    .where("status", "==", "pending")
    .get();
  // Sort by createdAt/timestamp ascending (oldest first)
  const sorted = sendHelpSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (a.createdAt?.toMillis?.() || a.timestamp || 0) - (b.createdAt?.toMillis?.() || b.timestamp || 0));
  // Keep only the first maxAllowed, remove the rest
  const toRemove = sorted.slice(maxAllowed);
  for (const sh of toRemove) {
    await db.collection("sendHelp").doc(sh.id).delete();
    await db.collection("receiveHelp").doc(sh.id).delete();
    // Optionally: reassign sender
    if (sh.senderUid) {
      await assignReceiverOnActivation(sh.senderUid);
    }
  }
}

// Call this after user activation
async function onUserActivated(userUid) {
  await assignReceiverOnActivation(userUid);
}

async function assignHelpForActiveUsers() {
  const usersSnapshot = await db.collection("users").where("isActivated", "==", true).get();
  const users = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
  console.log('📦 Total Users Fetched:', users.length);
  let totalAssigned = 0;
  let skipped = 0;
  for (const sender of users) {
    console.log(`👤 Processing sender: ${sender.userId} (${sender.uid})`);
    const sendHelpSnap = await db.collection("sendHelp")
      .where("senderUid", "==", sender.uid)
      .get();
    if (sendHelpSnap.size >= 3) {
      console.log(`✅ ${sender.userId} already has sendHelp`);
      skipped++;
      continue;
    }
    const assigned = await assignReceiverOnActivation(sender.uid);
    if (assigned && assigned.receiver && assigned.sender) {
      console.log(`🎉 Help assigned: ${assigned.sender.userId} ➡️ ${assigned.receiver.userId}`);
      totalAssigned++;
    } else if (assigned) {
      totalAssigned++;
    } else {
      skipped++;
      console.log(`⏭️ No eligible receiver for ${sender.userId}`);
    }
  }
  console.log(`🎉 Backfill complete for all active users. Total assigned: ${totalAssigned}, Skipped: ${skipped}`);
}

assignHelpForActiveUsers(); 