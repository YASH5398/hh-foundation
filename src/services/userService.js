import { db } from '../config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp, Timestamp, increment } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const usersCollectionRef = collection(db, 'users');

export const getUsers = (onUpdate = () => {}, onError = () => {}) => {
  const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    onUpdate(users, null);
  }, onError);

  return unsubscribe;
};

export const getUserById = async (id) => {
  try {
  const userDoc = doc(db, 'users', id);
  const data = await getDoc(userDoc);
    if (data.exists()) {
      return { success: true, data: { ...data.data(), id: data.id } };
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
  const userDoc = doc(db, 'users', id);
  await setDoc(userDoc, {
    ...userData,
      uid: id,
      updatedAt: new Date(),
  }, { merge: true });
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: error.message };
  }
};

export const updateUserField = async (id, field, value) => {
  try {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, {
      [field]: value,
      updatedAt: new Date(),
    });
    return { success: true, message: 'User field updated successfully' };
  } catch (error) {
    console.error('Error updating user field:', error);
    return { success: false, message: error.message };
  }
};

export const getUsersByLevel = async (level, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('level', '==', level),
      where('isActivated', '==', true),
      orderBy('referralCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting users by level:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const searchUsers = async (searchTerm) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('fullName', '>=', searchTerm),
      where('fullName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, message: error.message, data: [] };
  }
};

export const getTopReferrers = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isActivated', '==', true),
      orderBy('referralCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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

export async function updateSocialTask(uid, taskKey) {
  const userUid = auth.currentUser?.uid;
  if (!userUid || (uid && uid !== userUid)) {
    console.warn('User not authenticated or UID mismatch. Aborting task update.');
    return;
      }
  if (!taskKey) return;
  const ref = doc(db, 'tasks', userUid);
  try {
    await updateDoc(ref, {
      [taskKey]: true,
      [`taskDetails.${taskKey}`]: Timestamp.now(),
      taskScore: increment(1),
    });
  } catch (error) {
    if (error.code === 'not-found' || error.code === 'not-found' || error.message?.includes('No document to update')) {
      // If document does not exist, create it
      await setDoc(ref, {
        [taskKey]: true,
        [`taskDetails.${taskKey}`]: Timestamp.now(),
        taskScore: 1,
        completedAt: null,
      }, { merge: true });
    } else {
      console.error('Failed to update task:', error);
      throw error;
    }
  }
}

export async function updateTelegramTask() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || !currentUser.uid) {
        console.warn('User not logged in yet. Aborting telegram task update.');
        return resolve();
      }
      const uid = currentUser.uid;
      console.log('Updating telegram task for UID:', uid);
      const ref = doc(db, 'tasks', uid);
      try {
        await updateDoc(ref, {
          telegram: true,
          taskScore: increment(1),
          'taskDetails.telegram': Timestamp.now(),
        });
        resolve();
      } catch (err) {
        console.error('Failed to update telegram task:', err);
        reject(err);
      }
    });
  });
}