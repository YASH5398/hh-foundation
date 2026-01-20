<<<<<<< HEAD
import { createNotification } from './notificationService';
import { ChatService } from './chatService';

// Chat functions used by ChatModal component

// Chat functions used by ChatModal component
=======
import { db, auth } from '../config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, getFirestore, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';

// Authentication (Admin specific, can be extended)
export const adminSignIn = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const adminSignOut = async () => {
  return signOut(auth);
};

export const adminSendPasswordReset = async (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const updateLastLoginTime = async (uid) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    lastLoginTime: serverTimestamp(),
  });
};

export const updateDeviceToken = async (uid, deviceToken) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    deviceToken,
  });
};

// Team Viewer (Example - adjust based on actual data structure)
export const getTeamMembers = (callback, userId = null) => {
  const teamCollectionRef = collection(db, 'users'); // Assuming team members are also users
  let q = teamCollectionRef;
  if (userId) {
    q = query(teamCollectionRef, where('referredBy', '==', userId));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(members);
  });
  return unsubscribe;
};
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

export const sendWelcomeNotification = async (uid, fullName, userId) => {
  if (!uid || !fullName || !userId) return;
  const firstName = fullName.split(' ')[0];
  const message = `👋 Welcome back, ${firstName}! Let’s grow your team and earnings today.`;
<<<<<<< HEAD
  await createNotification({
    uid,
=======
  await addDoc(collection(db, 'notifications'), {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    userId,
    title: 'Welcome Back',
    message,
    type: 'welcome',
<<<<<<< HEAD
    eventKey: `welcome:${uid}`,
    preventDuplicates: true
=======
    timestamp: serverTimestamp(),
    isRead: false,
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  });
};

// --- Chat Service ---

export const sendMessage = async ({ chatId, senderUid, receiverUid, message, senderProfileImage }) => {
<<<<<<< HEAD
  return await ChatService.sendDirectMessage({
    chatId,
    senderUid,
    receiverUid,
    message,
    senderProfileImage
  });
};

export const sendMessageToHelpChats = async ({ chatId, senderUid, receiverUid, message }) => {
  return await ChatService.sendHelpChatMessage({ chatId, senderUid, receiverUid, message });
};

export const subscribeToMessages = (chatId, callback) => {
  return ChatService.subscribeToDirectMessages(chatId, callback);
};

export const markMessagesRead = async (chatId, userUid) => {
  return await ChatService.markDirectMessagesAsRead(chatId, userUid);
=======
  try {
    if (!senderUid || !receiverUid) {
      throw new Error('Missing senderUid or receiverUid');
    }
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    // 🛠️ Create chat doc if it doesn't exist
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        senderUid,
        receiverUid,
        createdAt: serverTimestamp(),
      });
    }
    // ✅ Now add message to messages subcollection
    try {
      await addDoc(collection(chatRef, "messages"), {
        senderUid,
        receiverUid,
        message,
        isRead: false,
        type: "text",
        timestamp: serverTimestamp(),
        senderProfileImage: senderProfileImage || '',
      });
    } catch (err) {
      console.error("Error adding chat message:", err);
      throw err;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const sendMessageToHelpChats = async ({ chatId, senderUid, receiverUid, message }) => {
  try {
    if (!senderUid || !receiverUid || !message) {
      throw new Error('Missing required fields');
    }

    const chatRef = doc(db, "helpChats", chatId);

    // Create chat doc if it doesn't exist
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        senderUid,
        receiverUid,
        createdAt: serverTimestamp(),
      });
    }

    // Add message
    await addDoc(collection(chatRef, "messages"), {
      senderUid,
      receiverUid,
      message, // ✅ must be `message` (NOT text)
      timestamp: serverTimestamp()
    });

  } catch (error) {
    console.error("❌ Error sending help chat message:", error);
    throw error;
  }
};

export const subscribeToMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

export const markMessagesRead = async (chatId, userUid) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, where('receiverUid', '==', userUid), where('isRead', '==', false));
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    await updateDoc(docSnap.ref, { isRead: true });
  }
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
};