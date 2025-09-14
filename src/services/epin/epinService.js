import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

// Function to calculate offer based on requested quantity
const calculateOffer = (requestedQuantity) => {
  if (requestedQuantity >= 50) return 10;
  if (requestedQuantity >= 25) return 4;
  if (requestedQuantity >= 15) return 2;
  return 0;
};

// User Feature: Request E-PIN
export const requestEpin = async ({ userId, requestedQuantity, upiId, qrCodeImageUrl, proofImageUrl, transactionId }) => {
  try {
    const offerReceived = calculateOffer(requestedQuantity);
    const totalEpinToAssign = requestedQuantity + offerReceived;
    await addDoc(collection(db, 'epinRequests'), {
      userId,
      requestedQuantity,
      offerReceived,
      totalEpinToAssign,
      upiId,
      qrCodeImageUrl,
      proofImageUrl,
      transactionId,
      createdAt: serverTimestamp(),
    });
    return { success: true, message: 'E-PIN request submitted successfully!' };
  } catch (error) {
    console.error('Error requesting E-PIN:', error);
    return { success: false, message: error.message };
  }
};

// User Feature: View Assigned E-PINs
export const getAssignedEpins = async (userId) => {
  try {
    const q = query(collection(db, 'epins'), where('assignedTo', '==', userId));
    const querySnapshot = await getDocs(q);
    const epins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, epins };
  } catch (error) {
    console.error('Error fetching assigned E-PINs:', error);
    return { success: false, message: error.message };
  }
};

// User Feature: Get All E-PINs ever assigned to a user (for history)
export const getAllEpinsForUser = async (userId) => {
  try {
    const q = query(collection(db, 'epins'), where('assignedTo', '==', userId));
    const querySnapshot = await getDocs(q);
    const epins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, epins };
  } catch (error) {
    console.error('Error fetching all E-PINs for user:', error);
    return { success: false, message: error.message };
  }
};

// User Feature: Transfer E-PIN
export const transferEpin = async (epinCode, currentUserId, receiverUserId) => {
  try {
    const q = query(collection(db, 'epins'), where('epin', '==', epinCode), where('assignedTo', '==', currentUserId), where('status', '==', 'unused'));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: false, message: 'E-PIN not found, not assigned to you, or already used.' };
    }
    const epinDoc = querySnapshot.docs[0];
    await setDoc(doc(db, 'epins', epinDoc.id), {
      assignedTo: receiverUserId,
      transferredTo: receiverUserId,
      status: 'transferred',
      transferredAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, message: `E-PIN ${epinCode} transferred successfully to ${receiverUserId}!` };
  } catch (error) {
    console.error('Error transferring E-PIN:', error);
    return { success: false, message: error.message };
  }
};

// User Feature: Use E-PIN
export const useEpin = async (epinCode, userId) => {
  // This function is no longer directly used by UserEpins.jsx for 'use' functionality
  // The 'use' functionality is now part of the 'Available E-PINs' tab, but the user
  // can still copy the E-PIN and use it elsewhere. This function remains for potential
  // future direct use or other integrations.

  try {
    const q = query(collection(db, 'epins'), where('epin', '==', epinCode), where('assignedTo', '==', userId), where('status', '==', 'unused'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'E-PIN not found, not assigned to you, or already used.' };
    }

    const epinDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'epins', epinDoc.id), {
      status: 'used',
    });

    return { success: true, message: 'E-PIN used successfully! Your account is now activated.' };
  } catch (error) {
    console.error('Error using E-PIN:', error);
    return { success: false, message: error.message };
  }
};

// Admin Feature: Generate E-PINs
export const generateEpins = async (quantity) => {
  try {
    const epinsCollectionRef = collection(db, 'epins');
    const generated = [];
    for (let i = 0; i < quantity; i++) {
      const epin = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8-character alphanumeric
      await addDoc(epinsCollectionRef, {
        epin,
        status: 'unused',
        assignedTo: '',
        createdAt: serverTimestamp(),
      });
      generated.push(epin);
    }
    return { success: true, message: `${quantity} E-PINs generated successfully!`, generated };
  } catch (error) {
    console.error('Error generating E-PINs:', error);
    return { success: false, message: error.message };
  }
};

// Admin Feature: Get All E-PINs (for tracking)
export const getAllEpins = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'epins'));
    const epins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, epins };
  } catch (error) {
    console.error('Error fetching all E-PINs:', error);
    return { success: false, message: error.message };
  }
};

// Admin Feature: Delete E-PIN
export const deleteEpin = async (epinId) => {
  try {
    await deleteDoc(doc(db, 'epins', epinId));
    return { success: true, message: 'E-PIN deleted successfully!' };
  } catch (error) {
    console.error('Error deleting E-PIN:', error);
    return { success: false, message: error.message };
  }
};

// Admin Feature: Update E-PIN (for status/assignment changes)
export const updateEpin = async (epinId, updates) => {
  try {
    await updateDoc(doc(db, 'epins', epinId), updates);
    return { success: true, message: 'E-PIN updated successfully!' };
  } catch (error) {
    console.error('Error updating E-PIN:', error);
    return { success: false, message: error.message };
  }
};