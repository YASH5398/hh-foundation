const { db } = require('../firebase/firebaseAdmin.js');

const sendHelpCollectionRef = db.collection('sendHelp');
const receiveHelpCollectionRef = db.collection('receiveHelp');
const helpHistoryCollectionRef = db.collection('helpHistory');

const getSendHelpRequests = (callback) => {
  const unsubscribe = sendHelpCollectionRef.onSnapshot((snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(requests);
  });
  return unsubscribe;
};

const getReceiveHelpRequests = async () => {
  const data = await receiveHelpCollectionRef.get();
  return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const updateSendHelpRequest = async (id, requestData, currentUser) => {
  try {
    const requestDoc = db.collection('sendHelp').doc(id);
    await requestDoc.set({
      ...requestData,
      senderId: currentUser?.uid || '',
      senderUserId: currentUser?.userId || '',
      updatedAt: db.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, message: 'Send help request updated successfully' };
  } catch (error) {
    console.error('Error updating send help request:', error);
    return { success: false, message: error.message };
  }
};

const updateReceiveHelpRequest = async (id, requestData, currentUser) => {
  try {
    const requestDoc = db.collection('receiveHelp').doc(id);
    await requestDoc.set({
      ...requestData,
      receiverId: currentUser?.uid || '',
      receiverUserId: currentUser?.userId || '',
      updatedAt: db.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, message: 'Receive help request updated successfully' };
  } catch (error) {
    console.error('Error updating receive help request:', error);
    return { success: false, message: error.message };
  }
};

const deleteSendHelpRequest = async (id) => {
  try {
    const requestDoc = db.collection('sendHelp').doc(id);
    await requestDoc.delete();
    return { success: true, message: 'Send help request deleted successfully' };
  } catch (error) {
    console.error('Error deleting send help request:', error);
    return { success: false, message: error.message };
  }
};

const deleteReceiveHelpRequest = async (id) => {
  try {
    const requestDoc = db.collection('receiveHelp').doc(id);
    await requestDoc.delete();
    return { success: true, message: 'Receive help request deleted successfully' };
  } catch (error) {
    console.error('Error deleting receive help request:', error);
    return { success: false, message: error.message };
  }
};

const getHelpHistory = async () => {
  try {
    const data = await helpHistoryCollectionRef.get();
    return {
      success: true,
      data: data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    };
  } catch (error) {
    console.error('Error getting help history:', error);
    return { success: false, message: error.message, data: [] };
  }
};

const addHelpHistoryEntry = async (entryData, currentUser) => {
  try {
    await helpHistoryCollectionRef.add({
      ...entryData,
      userId: currentUser?.uid || '',
      userUserId: currentUser?.userId || '',
      createdAt: db.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Help history entry added successfully' };
  } catch (error) {
    console.error('Error adding help history entry:', error);
    return { success: false, message: error.message };
  }
};

const updateHelpHistoryEntry = async (id, entryData) => {
  try {
    const entryDoc = db.collection('helpHistory').doc(id);
    await entryDoc.update({
      ...entryData,
      updatedAt: db.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Help history entry updated successfully' };
  } catch (error) {
    console.error('Error updating help history entry:', error);
    return { success: false, message: error.message };
  }
};

const deleteHelpHistoryEntry = async (id) => {
  try {
    const entryDoc = db.collection('helpHistory').doc(id);
    await entryDoc.delete();
    return { success: true, message: 'Help history entry deleted successfully' };
  } catch (error) {
    console.error('Error deleting help history entry:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  getSendHelpRequests,
  getReceiveHelpRequests,
  updateSendHelpRequest,
  updateReceiveHelpRequest,
  deleteSendHelpRequest,
  deleteReceiveHelpRequest,
  getHelpHistory,
  addHelpHistoryEntry,
  updateHelpHistoryEntry,
  deleteHelpHistoryEntry,
}; 