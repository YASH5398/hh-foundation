import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Shared Firestore utilities to reduce code duplication
 */

/**
 * Get document by ID
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export const getDocumentById = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update document field
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update result
 */
export const updateDocumentField = async (collectionName, docId, updates) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update document with merge
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @param {boolean} merge - Whether to merge with existing data
 * @returns {Promise<Object>} Operation result
 */
export const setDocument = async (collectionName, docId, data, merge = true) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date()
    }, { merge });
    return { success: true };
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Query documents with filters
 * @param {string} collectionName - Firestore collection name
 * @param {Array} conditions - Array of where conditions [[field, operator, value], ...]
 * @param {Array} orderByFields - Array of order by fields [[field, direction], ...]
 * @param {number} limitCount - Maximum number of documents to return
 * @returns {Promise<Array>} Array of documents
 */
export const queryDocuments = async (collectionName, conditions = [], orderByFields = [], limitCount = null) => {
  try {
    let q = collection(db, collectionName);

    // Add where conditions
    conditions.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator, value));
    });

    // Add order by
    orderByFields.forEach(([field, direction = 'asc']) => {
      q = query(q, orderBy(field, direction));
    });

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates
 * @param {string} collectionName - Firestore collection name
 * @param {Array} conditions - Array of where conditions
 * @param {Array} orderByFields - Array of order by fields
 * @param {function} callback - Callback function for updates
 * @param {number} limitCount - Maximum number of documents
 * @returns {function} Unsubscribe function
 */
export const subscribeToCollection = (collectionName, conditions = [], orderByFields = [], callback, limitCount = null) => {
  try {
    let q = collection(db, collectionName);

    // Add where conditions
    conditions.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator, value));
    });

    // Add order by
    orderByFields.forEach(([field, direction = 'asc']) => {
      q = query(q, orderBy(field, direction));
    });

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(documents);
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      callback([]);
    });
  } catch (error) {
    console.error(`Error setting up subscription for ${collectionName}:`, error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Get users by level with pagination
 * @param {string} level - User level to filter by
 * @param {number} limitCount - Number of users to return
 * @returns {Promise<Array>} Array of users
 */
export const getUsersByLevel = async (level, limitCount = 10) => {
  return queryDocuments('users', [
    ['level', '==', level],
    ['isActivated', '==', true]
  ], [['referralCount', 'desc']], limitCount);
};

/**
 * Search users by name
 * @param {string} searchTerm - Search term
 * @param {number} limitCount - Number of results to return
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsersByName = async (searchTerm, limitCount = 10) => {
  return queryDocuments('users', [
    ['fullName', '>=', searchTerm],
    ['fullName', '<=', searchTerm + '\uf8ff']
  ], [], limitCount);
};

/**
 * Get top referrers
 * @param {number} limitCount - Number of users to return
 * @returns {Promise<Array>} Array of top referrers
 */
export const getTopReferrers = async (limitCount = 10) => {
  return queryDocuments('users', [
    ['isActivated', '==', true]
  ], [['referralCount', 'desc']], limitCount);
};
