import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';

export const createAgentChat = async (agentData, issueType, message, context) => {
  const chatRef = await addDoc(collection(db, 'agentAdminChats'), {
    agentUid: agentData.uid,
    agentUserId: agentData.userId,
    agentName: agentData.name,
    issueType,
    status: 'open',
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, 'agentAdminChats', chatRef.id, 'messages'), {
    sender: 'agent',
    text: message,
    context: context || '',
    createdAt: serverTimestamp()
  });

  return chatRef.id;
};

export const sendMessage = async (chatId, sender, text) => {
  await addDoc(collection(db, 'agentAdminChats', chatId, 'messages'), {
    sender,
    text,
    createdAt: serverTimestamp()
  });

  if (sender === 'admin') {
    await updateDoc(doc(db, 'agentAdminChats', chatId), {
      status: 'replied'
    });
  }
};

export const updateChatStatus = async (chatId, status) => {
  await updateDoc(doc(db, 'agentAdminChats', chatId), {
    status,
    updatedAt: serverTimestamp()
  });
};

export const subscribeToAgentChats = (agentUid, callback) => {
  const q = query(
    collection(db, 'agentAdminChats'),
    where('agentUid', '==', agentUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(chats);
  });
};

export const subscribeToAllChats = (callback) => {
  const q = query(
    collection(db, 'agentAdminChats'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(chats);
  });
};

export const subscribeToChatMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'agentAdminChats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};
