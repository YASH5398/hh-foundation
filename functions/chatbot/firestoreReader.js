// Firestore Reader - Secure UID-Based Reads Only
// ABSOLUTE RULE: All reads strictly filtered by authenticated user's UID
// NEVER read other users' data or admin-only fields

const admin = require('firebase-admin');

// Lazy get db to avoid initialization order issues
const getDb = () => admin.firestore();

// Read authenticated user's data only - STRICT UID FILTERING
const getUserData = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getUserData: UID is required');
    return null;
  }
  
  try {
    console.log('FirestoreReader: Reading user data for UID:', uid);
    const userDoc = await getDb().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log('FirestoreReader: User document not found for UID:', uid);
      return null;
    }
    
    const userData = userDoc.data();
    console.log('FirestoreReader: Successfully read user data for UID:', uid);
    return userData;
  } catch (error) {
    console.error('FirestoreReader.getUserData: Error reading user data for UID', uid, ':', error.message);
    return null;
  }
};

// Read user's E-PINs only - STRICT ownerUid FILTERING
const getEpinData = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getEpinData: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading E-PINs for UID:', uid);
    const epinsSnapshot = await getDb().collection('epins').where('ownerUid', '==', uid).get();
    
    const epins = epinsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('FirestoreReader: Found', epins.length, 'E-PINs for UID:', uid);
    return epins;
  } catch (error) {
    console.error('FirestoreReader.getEpinData: Error reading E-PINs for UID', uid, ':', error.message);
    return [];
  }
};

// Read user's Send Help records only - STRICT senderUid FILTERING
const getSendHelpData = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getSendHelpData: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading Send Help records for UID:', uid);
    const sendHelpSnapshot = await getDb().collection('sendHelp').where('senderUid', '==', uid).get();
    
    const sendHelpRecords = sendHelpSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('FirestoreReader: Found', sendHelpRecords.length, 'Send Help records for UID:', uid);
    return sendHelpRecords;
  } catch (error) {
    console.error('FirestoreReader.getSendHelpData: Error reading Send Help for UID', uid, ':', error.message);
    return [];
  }
};

// Read user's Receive Help records only - STRICT receiverUid FILTERING
const getReceiveHelpData = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getReceiveHelpData: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading Receive Help records for UID:', uid);
    const receiveHelpSnapshot = await getDb().collection('receiveHelp').where('receiverUid', '==', uid).get();
    
    const receiveHelpRecords = receiveHelpSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('FirestoreReader: Found', receiveHelpRecords.length, 'Receive Help records for UID:', uid);
    return receiveHelpRecords;
  } catch (error) {
    console.error('FirestoreReader.getReceiveHelpData: Error reading Receive Help for UID', uid, ':', error.message);
    return [];
  }
};

// Read user's Support Tickets only - STRICT uid FILTERING
const getSupportTickets = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getSupportTickets: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading Support Tickets for UID:', uid);
    const ticketsSnapshot = await getDb().collection('supportTickets').where('uid', '==', uid).get();
    
    const tickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('FirestoreReader: Found', tickets.length, 'Support Tickets for UID:', uid);
    return tickets;
  } catch (error) {
    console.error('FirestoreReader.getSupportTickets: Error reading Support Tickets for UID', uid, ':', error.message);
    return [];
  }
};

// Read user's Chat Sessions - STRICT uid FILTERING
const getChatSessions = async (uid) => {
  if (!uid) {
    console.error('FirestoreReader.getChatSessions: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading Chat Sessions for UID:', uid);
    const sessionsSnapshot = await getDb().collection('chatSessions').where('uid', '==', uid).get();
    
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('FirestoreReader: Found', sessions.length, 'Chat Sessions for UID:', uid);
    return sessions;
  } catch (error) {
    console.error('FirestoreReader.getChatSessions: Error reading Chat Sessions for UID', uid, ':', error.message);
    return [];
  }
};

// Read user's Chat Messages - STRICT uid FILTERING
const getChatMessages = async (uid, limit = 10) => {
  if (!uid) {
    console.error('FirestoreReader.getChatMessages: UID is required');
    return [];
  }
  
  try {
    console.log('FirestoreReader: Reading Chat Messages for UID:', uid);
    const messagesSnapshot = await getDb().collection('chatMessages')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Reverse to get chronological order
    
    console.log('FirestoreReader: Found', messages.length, 'Chat Messages for UID:', uid);
    return messages;
  } catch (error) {
    console.error('FirestoreReader.getChatMessages: Error reading Chat Messages for UID', uid, ':', error.message);
    return [];
  }
};

module.exports = {
  getUserData,
  getEpinData,
  getSendHelpData,
  getReceiveHelpData,
  getSupportTickets,
  getChatSessions,
  getChatMessages
};
