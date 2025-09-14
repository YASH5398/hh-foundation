// ESM conversion
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import "../src/services/helpService.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(`${__dirname}/serviceAccountKey.json`, "utf-8")
);

await admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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
      // Strictly check all 5 eligibility conditions for forced receiver
      if (
        receiver.isActivated !== true ||
        receiver.isBlocked !== false ||
        receiver.isReceivingHeld !== false ||
        receiver.isOnHold !== false ||
        (receiver.helpReceived || 0) >= 3
      ) {
        console.log(`⛔ Forced receiver ${receiver.userId} failed strict eligibility. Skipping force assignment.`);
        // Continue to normal eligible user flow
      } else {
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
  }
  // --- End Forced Receiver Logic ---

  // Step 1: Query eligible receivers from Firestore (do not filter system accounts at query level)
  const receiverQuery = db.collection("users")
    .where("isActivated", "==", true)
    .where("isReceivingHeld", "==", false)
    .where("isOnHold", "==", false)
    .where("paymentBlocked", "==", false);
  const receiversSnapshot = await receiverQuery.get();
  // Step 2: Convert snapshot to array
  let allReceivers = receiversSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  // Step 3: Defensive in-memory filter (exclude system accounts only for assignment)
  allReceivers = allReceivers.filter(user =>
    user.uid !== userUid && // skip self
    (!user.isSystemUser) // skip system accounts
  );
  // Before assigning SendHelp, check and update users with helpReceived >= 3
  for (const user of allReceivers) {
    if ((user.helpReceived || 0) >= 3) {
        await db.collection('users').doc(user.uid).update({
          isReceivingHeld: true,
          isOnHold: true
        });
      console.log(`⛔ User ${user.userId} set to hold (helpReceived >= 3)`);
    }
  }
  // Strict eligibility filter for receivers (only 4 conditions)
  const eligibleReceivers = allReceivers.filter(user =>
    user.isActivated === true &&
    user.isBlocked === false &&
    user.isOnHold === false &&
    user.isReceivingHeld === false
  );
  // Log eligible receivers
  console.log('Eligible receivers (4 conditions):', eligibleReceivers.map(u => ({ userId: u.userId, referralCount: u.referralCount, helpReceived: u.helpReceived })));
  // Sort by referralCount descending
  const sortedReceivers = eligibleReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  // Pick the top eligible receiver
  const selectedReceiver = sortedReceivers.length > 0 ? sortedReceivers[0] : null;
  if (!selectedReceiver) {
    console.log('❌ No eligible receiver found (4 conditions failed). Skipping assignment.');
    return false;
  }
  console.log('Chosen receiver:', selectedReceiver.userId, 'referrals:', selectedReceiver.referralCount, 'helpReceived:', selectedReceiver.helpReceived);
  // Check if any user satisfies the main eligibility conditions
  const anyEligible = allReceivers.some(user =>
    user.isReceivingHeld === false &&
    user.isBlocked === false &&
    user.isOnHold === false &&
    user.isActivated === true
  );
  if (!anyEligible) {
    console.log('❌ No eligible users found with isReceivingHeld: false, isBlocked: false, isOnHold: false, isActivated: true. Skipping assignment.');
    return false;
  }
  // Prioritize users with referralCount > 0, fallback to all eligible if none
  let prioritizedReceivers = allReceivers.filter(u => (u.referralCount || 0) > 0);
  if (prioritizedReceivers.length === 0) {
    prioritizedReceivers = allReceivers;
  }
  // Sort by referralCount descending
  prioritizedReceivers = prioritizedReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  // Step 7: Log and select
  console.log("Filtered eligible receivers:", prioritizedReceivers.map(u => u.userId));
  // Do NOT skip or hide system account documents in sendHelp/receiveHelp creation or display
  // Only exclude system accounts during receiver selection for new assignments
  if (selectedReceiver.uid === SYSTEM_RESERVED_UID || SYSTEM_USER_IDS.includes(selectedReceiver.userId) || selectedReceiver.isSystemUser) {
    console.log("System/test/dummy user detected as selected receiver — skipping assignment.");
    return false;
  }
  const timestamp = Date.now();
  const docId = `${selectedReceiver.userId}_${sender.userId}_${timestamp}`;
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
    receiverUid: selectedReceiver.uid,
    receiverId: selectedReceiver.userId,
    receiverName: selectedReceiver.fullName,
    receiverPhone: selectedReceiver.phone || "",
    receiverWhatsapp: selectedReceiver.whatsapp || "",
    receiverEmail: selectedReceiver.email || "",
    paymentDetails: selectedReceiver.paymentMethod || {},
  };
  await db.collection("sendHelp").doc(docId).set(helpData);
  await db.collection("receiveHelp").doc(docId).set(helpData);
  await blockOverfilledReceiver(selectedReceiver.uid, selectedReceiver.levelStatus || selectedReceiver.level, selectedReceiver.sendHelpCount + 1);
  // Auto-hold receiver if at limit
  await checkAndHoldReceiver(selectedReceiver.userId, selectedReceiver.uid, selectedReceiver.levelStatus || selectedReceiver.level);
  // After assignment, check if receiver now has 3 helps
  const receiverDocRef = db.collection('users').doc(selectedReceiver.uid);
  const receiverDocSnap = await receiverDocRef.get();
  if (receiverDocSnap.exists) {
    const receiverData = receiverDocSnap.data();
    if ((receiverData.helpReceived || 0) + 1 >= 3) {
      await receiverDocRef.update({
        isReceivingHeld: true,
        isOnHold: true
      });
      console.log(`⛔ User ${selectedReceiver.userId} set to hold (helpReceived >= 3)`);
    }
  }
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
  let totalAssigned = 0;
  let skipped = 0;
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userUid = userDoc.id;
    const sendHelpSnap = await db.collection("sendHelp")
      .where("senderUid", "==", userUid)
      .get();
    if (sendHelpSnap.size >= 3) {
      console.log(`✅ ${userData.userId} already has sendHelp`);
      skipped++;
      continue;
    }
    const assigned = await assignReceiverOnActivation(userUid);
    if (assigned) {
      totalAssigned++;
      console.log(`📌 SendHelp assigned for ${userData.userId}`);
    } else {
      skipped++;
      console.log(`⏭️  No eligible receiver for ${userData.userId}`);
    }
  }
  console.log(`🎉 Backfill complete for all active users. Total assigned: ${totalAssigned}, Skipped: ${skipped}`);
}

// One-time batch update: Set isOnHold and isReceivingHeld to false if missing
async function setMissingHoldFieldsToFalse() {
  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const updateObj = {};
    if (userData.isOnHold === undefined) {
      updateObj.isOnHold = false;
    }
    if (userData.isReceivingHeld === undefined) {
      updateObj.isReceivingHeld = false;
    }
    if (Object.keys(updateObj).length > 0) {
      await db.collection('users').doc(userDoc.id).update(updateObj);
      updatedCount++;
      console.log(`Updated user ${userData.userId || userDoc.id}:`, updateObj);
    }
  }
  console.log(`Batch update complete. Total users updated: ${updatedCount}`);
}
// Batch update: Set isOnHold and isReceivingHeld to false if missing
async function batchUpdateMissingHoldFields() {
  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const updates = {};
    if (userData.isOnHold === undefined) updates.isOnHold = false;
    if (userData.isReceivingHeld === undefined) updates.isReceivingHeld = false;
    if (Object.keys(updates).length > 0) {
      await userDoc.ref.update(updates);
      updatedCount++;
      console.log(`✅ Updated user ${userData.userId || userDoc.id}:`, updates);
    }
  }
  console.log(`Batch update complete. Total users updated: ${updatedCount}`);
}
// Run batch update before main logic
await batchUpdateMissingHoldFields();

async function checkAndHoldReceiver(userId, uid, level) {
  await getFirestore().doc(`users/${uid}`).update({
    isOnHold: true,
    isReceivingHeld: true,
  });
  console.log(`🛑 Receiver ${userId} (Level: ${level}) has been put ON HOLD.`);
}

assignHelpForActiveUsers(); 