import { db } from '../config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, serverTimestamp, Timestamp, increment, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDocumentById, updateDocumentField, setDocument, queryDocuments } from '../utils/firestoreUtils';

const usersCollectionRef = collection(db, 'users');

export const getUsers = (onUpdate = () => {}, onError = () => {}) => {
  // Add basic filtering to prevent unfiltered access
  const q = query(usersCollectionRef, where('isActivated', '!=', null));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    onUpdate(users, null);
  }, onError);

  return unsubscribe;
};

export const getUserById = async (id) => {
  try {
    const userData = await getDocumentById('users', id);
    if (userData) {
      return { success: true, data: userData };
    } else {
      return { success: false, message: 'User not found', data: null };
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return { success: false, message: error.message, data: null };
  }
};

export const getUserByUserId = async (userId) => {
  try {
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { success: true, data: { ...doc.data(), id: doc.id } };
    } else {
      return { success: false, message: 'User not found', data: null };
    }
  } catch (error) {
    console.error('Error getting user by userId:', error);
    return { success: false, message: error.message, data: null };
  }
};

export const updateUser = async (id, userData) => {
  try {
    const result = await setDocument('users', id, { ...userData, uid: id }, true);
    return result.success ? { success: true, message: 'User updated successfully' } : result;
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: error.message };
  }
};

export const updateUserField = async (id, field, value) => {
  try {
    const result = await updateDocumentField('users', id, { [field]: value });
    return result.success ? { success: true, message: 'User field updated successfully' } : result;
  } catch (error) {
    console.error('Error updating user field:', error);
    return { success: false, message: error.message };
  }
};

export const getUsersByLevel = async (level, limitCount = 10) => {
  try {
    const users = await queryDocuments('users', [
      ['level', '==', level],
      ['isActivated', '==', true]
    ], [['referralCount', 'desc']], limitCount);
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting users by level:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const searchUsers = async (searchTerm) => {
  try {
    const users = await queryDocuments('users', [
      ['fullName', '>=', searchTerm],
      ['fullName', '<=', searchTerm + '\uf8ff']
    ], [], 10);
    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const getTopReferrers = async (limitCount = 10) => {
  try {
    const users = await queryDocuments('users', [
      ['isActivated', '==', true]
    ], [['referralCount', 'desc']], limitCount);
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting top referrers:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const deleteUser = async (id) => {
  const userDoc = doc(db, 'users', id);
  await deleteDoc(userDoc);
};

export async function getSocialTasks(uid) {
  if (!uid) {
    console.error('User not authenticated yet. Aborting getSocialTasks.');
    return null;
  }
  const ref = doc(db, 'socialTasks', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Firestore security rule (reference):
// match /socialTasks/{userId} {
//   allow write: if request.auth.uid == userId;
// }

export async function updateSocialTask(uid, taskKey, username = '') {
  const userUid = auth.currentUser?.uid;
  if (!userUid || (uid && uid !== userUid)) {
    console.warn('User not authenticated or UID mismatch. Aborting task update.');
    return;
  }
  if (!taskKey) return;
  const ref = doc(db, 'socialTasks', userUid);
  try {
    await updateDoc(ref, {
      uid: userUid,
      [taskKey]: true,
      [`taskDetails.${taskKey}`]: Timestamp.now(),
      [`usernames.${taskKey}`]: username,
      taskScore: increment(1),
      completedAt: Timestamp.now(),
    });
  } catch (error) {
    if (error.code === 'not-found' || error.message?.includes('No document to update')) {
      // If document does not exist, create it
      await setDoc(ref, {
        uid: userUid,
        [taskKey]: true,
        [`taskDetails.${taskKey}`]: Timestamp.now(),
        [`usernames.${taskKey}`]: username,
        taskScore: 1,
        completedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      console.error('Failed to update task:', error);
      throw error;
    }
  }
}

export async function updateTelegramTask() {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    console.warn('User not logged in. Aborting telegram task update.');
    return;
  }

  const uid = currentUser.uid;
  console.log('Updating telegram task for UID:', uid);
  const ref = doc(db, 'socialTasks', uid);
  try {
    await updateDoc(ref, {
      uid: uid,
      telegram: true,
      taskScore: increment(1),
      'taskDetails.telegram': Timestamp.now(),
      completedAt: Timestamp.now(),
    });
  } catch (err) {
    if (err.code === 'not-found') {
      try {
        await setDoc(ref, {
          uid: uid,
          telegram: true,
          taskScore: 1,
          'taskDetails.telegram': Timestamp.now(),
          completedAt: Timestamp.now(),
        }, { merge: true });
      } catch (createErr) {
        console.error('Failed to create telegram task document:', createErr);
        throw createErr;
      }
    } else {
      console.error('Failed to update telegram task:', err);
      throw err;
    }
  }
}