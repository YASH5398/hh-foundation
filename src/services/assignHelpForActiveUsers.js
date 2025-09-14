import { db } from "../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

function generateDocId(receiverId, senderId, timestamp) {
  return `${receiverId}_${senderId}_${timestamp}`;
}

function getRequiredReceiverCount(level) {
  switch (level) {
    case "Star": return 3;
    case "Silver": return 9;
    case "Gold": return 27;
    case "Platinum": return 81;
    case "Diamond": return 243;
    default: return 3;
  }
}

function getAmountByLevel(level) {
  switch (level) {
    case "Star": return 300;
    case "Silver": return 600;
    case "Gold": return 2000;
    case "Platinum": return 20000;
    case "Diamond": return 200000;
    default: return 300;
  }
}

export async function assignHelpForEligibleUsers() {
  const usersRef = collection(db, "users");
  const activeUsersSnap = await getDocs(query(usersRef, where("isActivated", "==", true)));
  const activeUsers = activeUsersSnap.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));

  // Debug: List all users
  console.log("All users:");
  activeUsers.forEach(u => {
    console.log(u.uid, u.userId, u.referralCount, u.isSystemAccount, u.isActivated, u.isOnHold, u.isReceivingHeld);
  });

  for (const sender of activeUsers) {
    if (
      sender.isBlocked || sender.isOnHold || sender.isReceivingHeld || !sender.uid
    ) continue;

    const senderLevel = sender.levelStatus || "Star";
    const requiredReceivers = getRequiredReceiverCount(senderLevel);
    const existingSendHelpSnap = await getDocs(
      query(collection(db, "sendHelp"), where("senderUid", "==", sender.uid))
    );
    if (existingSendHelpSnap.size >= requiredReceivers) continue;
    const remaining = requiredReceivers - existingSendHelpSnap.size;

    const receiversSnap = await getDocs(
      query(usersRef, where("isActivated", "==", true))
    );
    const receivers = receiversSnap.docs
      .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));

    // Debug: List all active receivers
    console.log("All active users:", receivers.length);
    // Check and hold users that have received required helps
    for (const receiver of receivers) {
      if ((receiver.helpReceived || 0) >= 3 && (!receiver.isReceivingHeld || !receiver.isOnHold)) {
        await updateDoc(doc(db, "users", receiver.uid), { helpReceived: 3, isReceivingHeld: true, isOnHold: true });
      }
    }
    const eligibleReceivers = receivers.filter(user =>
      user.isActivated === true &&
      user.isOnHold !== true &&
      user.isReceivingHeld !== true &&
      user.isSystemAccount !== true &&
      (user.helpReceived === undefined || user.helpReceived < 3) &&
      user.uid !== sender.uid &&
      user.levelStatus === senderLevel &&
      user.helpVisibility !== false
    ).sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
    // Only assign to users with >0 referrals if available
    const bestReferralCount = eligibleReceivers.length > 0 ? eligibleReceivers[0].referralCount : 0;
    const filteredReceivers = eligibleReceivers.filter(u => u.referralCount === bestReferralCount && bestReferralCount > 0);
    const finalReceivers = filteredReceivers.length > 0 ? filteredReceivers : eligibleReceivers;

    // Log eligible receivers
    console.log("Filtered Eligible Receivers:", finalReceivers.map(u => u.userId));
    if (finalReceivers.length === 0) {
      console.warn("No eligible receiver found. Check flags and system account status.");
    }

    // Debug: List eligible receivers
    console.log("Eligible receivers:", finalReceivers.map(u => ({
      userId: u.userId,
      referralCount: u.referralCount,
      isSystemAccount: u.isSystemAccount,
      isActivated: u.isActivated,
      isOnHold: u.isOnHold,
      isReceivingHeld: u.isReceivingHeld
    })));

    let count = 0;
    for (const receiver of finalReceivers) {
      // Hard block: skip system account
      if (receiver.isSystemAccount) {
        console.warn("Skipping system account:", receiver.userId);
        continue;
      }
      // Check if sender already helped this receiver
      const sendHelpDocs = await getDocs(query(
        collection(db, "sendHelp"),
        where("senderUid", "==", sender.uid),
        where("receiverUid", "==", receiver.uid)
      ));
      if (!sendHelpDocs.empty) continue;

      // Skip receivers with no valid payment method
      if (!receiver.paymentMethod?.upi?.upi && !receiver.paymentMethod?.bank?.accountNumber) {
        console.log('❌ No payment method found for', receiver.userId);
        continue;
      }

      const timestamp = Date.now();
      const docId = generateDocId(receiver.userId, sender.userId, timestamp);
      const nowISO = new Date().toISOString();
      const amount = getAmountByLevel(senderLevel);

      const baseDoc = {
        receiverId: receiver.userId,
        receiverUid: receiver.uid,
        receiverName: receiver.fullName,
        receiverPhone: receiver.phone,
        receiverWhatsapp: receiver.whatsapp,
        receiverEmail: receiver.email,
        senderId: sender.userId,
        senderUid: sender.uid,
        senderName: sender.fullName,
        senderPhone: sender.phone,
        senderWhatsapp: sender.whatsapp,
        senderEmail: sender.email,
        amount,
        status: "Pending",
        confirmedByReceiver: false,
        confirmationTime: null,
        createdAt: nowISO,
        updatedAt: nowISO,
        timestamp,
        paymentDetails: {
          bank: {
            name: receiver.bank?.name || "",
            accountNumber: receiver.bank?.accountNumber || "",
            bankName: receiver.bank?.bankName || "",
            ifscCode: receiver.bank?.ifscCode || "",
            method: "bank"
          },
          upi: {
            upi: receiver.paymentMethod?.upi || "",
            gpay: receiver.paymentMethod?.gpay || "",
            phonePe: receiver.paymentMethod?.phonePe || ""
          },
          utrNumber: "",
          screenshotUrl: ""
        }
      };

      await setDoc(doc(db, "sendHelp", docId), baseDoc);
      await setDoc(doc(db, "receiveHelp", docId), {
        ...baseDoc,
        status: "Pending",
        confirmedByReceiver: false
      });
      count++;
      if (count >= remaining) break;
    }
  }
  console.log("✅ Help assigned to eligible users.");
}

/**
 * Assign a receiver to a new user (isActivated: false) immediately on signup.
 * Criteria for eligible receiver:
 * - isActivated: true
 * - isOnHold: false
 * - isReceivingHeld: false
 * - paymentBlocked: false
 * - levelStatus: "Star"
 * - Prefer higher referralCount
 *
 * Creates sendHelp and receiveHelp docs with ID: `${receiverId}_${senderId}_${timestamp}`
 * Updates new user doc to set isSendHelpAssigned: true
 * Logs if no receiver is available, but does not skip the rest.
 */
export async function assignReceiverToNewUser(newUserId) {
  const usersRef = collection(db, "users");
  const newUserSnap = await getDoc(doc(db, "users", newUserId));
  if (!newUserSnap.exists()) {
    console.warn("New user not found:", newUserId);
    return;
  }
  const newUser = { uid: newUserSnap.id, ...newUserSnap.data() };
  if (newUser.isActivated !== false) {
    console.log("User is already activated or not a new user:", newUserId);
    return;
  }
  // Find eligible receivers
  const receiversQuery = query(
    usersRef,
    where("isActivated", "==", true),
    where("isBlocked", "==", false),
    where("isOnHold", "==", false),
    where("isReceivingHeld", "==", false),
    where("helpVisibility", "==", true),
    where("referralCount", ">=", 0),
    orderBy("referralCount", "desc"),
    limit(20)
  );
  const receiversSnap = await getDocs(receiversQuery);
  let receivers = receiversSnap.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
  // Exclude self, system accounts, and those without payment method
  receivers = receivers.filter(user =>
    user.uid !== newUserId &&
    user.isSystemAccount !== true &&
    (user.paymentMethod?.upi?.upi || user.paymentMethod?.bank?.accountNumber)
  );

  // Filter out receivers who already have 3 or more confirmed receiveHelps
  const eligibleReceivers = [];
  for (const receiver of receivers) {
    // Check confirmed receiveHelps for this receiver
    const confirmedHelpsSnap = await getDocs(query(
      collection(db, "receiveHelp"),
      where("receiverId", "==", receiver.userId),
      where("confirmedByReceiver", "==", true)
    ));
    if ((confirmedHelpsSnap.size || 0) >= 3) {
      continue;
    }
    // Check if this receiver is already receiving from this sender
    const duplicateSnap = await getDocs(query(
      collection(db, "sendHelp"),
      where("senderId", "==", newUser.userId),
      where("receiverId", "==", receiver.userId)
    ));
    if (!duplicateSnap.empty) {
      continue;
    }
    eligibleReceivers.push(receiver);
  }

  console.log(`Found ${eligibleReceivers.length} eligible receivers for new user ${newUser.userId}`);
  const receiver = eligibleReceivers[0];
  if (!receiver) {
    console.warn("No eligible receiver found for new user:", newUserId);
    // Log reasons
    if (receivers.length === 0) {
      console.warn("No receivers matched the initial Firestore query conditions.");
    } else {
      console.warn("Receivers were filtered out due to confirmed helps >= 3 or duplicate sender-receiver pair.");
    }
    // Still update user to avoid blocking
    await updateDoc(doc(db, "users", newUserId), { isSendHelpAssigned: false });
    return;
  }
  // Create sendHelp and receiveHelp docs
  const timestamp = Date.now();
  const docId = `${receiver.userId}_${newUser.userId}_${timestamp}`;
  const nowISO = new Date().toISOString();
  const amount = getAmountByLevel("Star");
  const baseDoc = {
    receiverId: receiver.userId,
    receiverUid: receiver.uid,
    receiverName: receiver.fullName,
    receiverPhone: receiver.phone,
    receiverWhatsapp: receiver.whatsapp,
    receiverEmail: receiver.email,
    senderId: newUser.userId,
    senderUid: newUser.uid,
    senderName: newUser.fullName,
    senderPhone: newUser.phone,
    senderWhatsapp: newUser.whatsapp,
    senderEmail: newUser.email,
    amount,
    status: "Pending",
    confirmedByReceiver: false,
    confirmationTime: null,
    createdAt: nowISO,
    updatedAt: nowISO,
    timestamp,
    paymentDetails: {
      bank: {
        name: receiver.bank?.name || "",
        accountNumber: receiver.bank?.accountNumber || "",
        bankName: receiver.bank?.bankName || "",
        ifscCode: receiver.bank?.ifscCode || "",
        method: "bank"
      },
      upi: {
        upi: receiver.paymentMethod?.upi || "",
        gpay: receiver.paymentMethod?.gpay || "",
        phonePe: receiver.paymentMethod?.phonePe || ""
      },
      utrNumber: "",
      screenshotUrl: ""
    }
  };
  await setDoc(doc(db, "sendHelp", docId), baseDoc);
  await setDoc(doc(db, "receiveHelp", docId), {
    ...baseDoc,
    status: "Pending",
    confirmedByReceiver: false
  });
  // Update new user doc to set isSendHelpAssigned: true
  await updateDoc(doc(db, "users", newUserId), { isSendHelpAssigned: true });
  console.log(`✅ Assigned receiver (${receiver.userId}) to new user (${newUser.userId})`);
}

// Helper to be called after each receiveHelp confirmation
export async function holdSystemAccountIfLimitReached(user) {
  if (user.isSystemAccount === true && (user.helpReceived || 0) >= 3) {
    await updateDoc(doc(db, "users", user.uid), {
      helpReceived: 3,
      isReceivingHeld: true,
      isOnHold: true,
    });
  }
} 