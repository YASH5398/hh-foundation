import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

const levelsCollectionRef = collection(db, 'levels');

export const getLevels = (callback) => {
  const unsubscribe = onSnapshot(levelsCollectionRef, (snapshot) => {
    const levels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(levels);
  });
  return unsubscribe;
};

export const updateLevel = async (id, levelData, currentUser) => {
  try {
  const levelDoc = doc(db, 'levels', id);
  await setDoc(levelDoc, {
    ...levelData,
      uid: currentUser?.uid || '',
      updatedAt: serverTimestamp(),
  }, { merge: true });
    return { success: true, message: 'Level updated successfully' };
  } catch (error) {
    console.error('Error updating level:', error);
    return { success: false, message: error.message };
  }
};