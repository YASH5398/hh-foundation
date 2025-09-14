import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  updateDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from '../config/firebase.js';

const chatsCollectionRef = collection(db, 'chats');
const messagesCollectionRef = collection(db, 'messages');

/**
 * Create or get existing chat between two users
 * @param {string} user1Uid - First user's UID
 * @param {string} user2Uid - Second user's UID
 * @param {string} helpId - Related help document ID
 * @returns {Promise<string>} - Chat document ID
 */
export async function createOrGetChat(user1Uid, user2Uid, helpId) {
  try {
    // Check if chat already exists
    const q = query(
      chatsCollectionRef,
      where('participants', 'array-contains-any', [user1Uid, user2Uid])
    );
    
    const snapshot = await getDocs(q);
    let existingChat = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(user1Uid) && data.participants.includes(user2Uid)) {
        existingChat = { id: doc.id, ...data };
      }
    });
    
    if (existingChat) {
      return existingChat.id;
    }
    
    // Create new chat
    const chatDoc = await addDoc(chatsCollectionRef, {
      participants: [user1Uid, user2Uid],
      helpId,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    });
    
    return chatDoc.id;
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    throw error;
  }
}

/**
 * Send a message in a chat
 * @param {string} chatId - Chat document ID
 * @param {string} senderUid - Sender's UID
 * @param {string} message - Message content
 * @returns {Promise<void>}
 */
export async function sendMessage(chatId, senderUid, message) {
  try {
    await addDoc(messagesCollectionRef, {
      chatId,
      senderUid,
      message,
      createdAt: serverTimestamp(),
      read: false
    });
    
    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: message,
      lastMessageAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Listen to messages in a chat
 * @param {string} chatId - Chat document ID
 * @param {function} callback - Callback function to handle messages
 * @returns {function} - Unsubscribe function
 */
export function listenToMessages(chatId, callback) {
  const q = query(
    messagesCollectionRef,
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
}

/**
 * Get user's chats
 * @param {string} userUid - User's UID
 * @param {function} callback - Callback function to handle chats
 * @returns {function} - Unsubscribe function
 */
export function listenToUserChats(userUid, callback) {
  const q = query(
    chatsCollectionRef,
    where('participants', 'array-contains', userUid),
    orderBy('lastMessageAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(chats);
  });
}

export default {
  createOrGetChat,
  sendMessage,
  listenToMessages,
  listenToUserChats
};