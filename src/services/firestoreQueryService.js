import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Safe Firestore Query Service
 * Provides validation and authentication guards for all Firestore operations
 */
class FirestoreQueryService {
  /**
   * Ensures user is authenticated before any Firestore operation
   * @throws {Error} If user is not authenticated
   */
  _requireAuth() {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to perform database operations');
    }
    return auth.currentUser;
  }

  /**
   * Validates query parameters to prevent Firestore errors
   * @param {Array} conditions - Array of where conditions
   * @returns {Array} Validated conditions
   */
  _validateQueryConditions(conditions) {
    if (!Array.isArray(conditions)) {
      throw new Error('Query conditions must be an array');
    }

    const validatedConditions = [];

    for (const condition of conditions) {
      if (!Array.isArray(condition) || condition.length !== 3) {
        console.warn('Invalid condition format, skipping:', condition);
        continue;
      }

      const [field, operator, value] = condition;

      // Check for undefined values
      if (value === undefined || value === null) {
        console.warn(`Skipping condition with undefined/null value: ${field} ${operator} ${value}`);
        continue;
      }

      // Check for empty arrays in array operations
      if ((operator === 'in' || operator === 'array-contains-any') && Array.isArray(value) && value.length === 0) {
        console.warn(`Skipping condition with empty array: ${field} ${operator} []`);
        continue;
      }

      // Check for invalid array operations
      if (operator === 'in' && Array.isArray(value) && value.length > 10) {
        console.warn(`'in' operator supports maximum 10 values, truncating: ${field}`);
        validatedConditions.push([field, operator, value.slice(0, 10)]);
        continue;
      }

      validatedConditions.push(condition);
    }

    return validatedConditions;
  }

  /**
   * Validates orderBy parameters
   * @param {Array} orderByFields - Array of order by fields
   * @returns {Array} Validated orderBy fields
   */
  _validateOrderBy(orderByFields) {
    if (!Array.isArray(orderByFields)) {
      return [];
    }

    return orderByFields.filter(field => {
      if (!Array.isArray(field) || field.length < 1) {
        console.warn('Invalid orderBy format, skipping:', field);
        return false;
      }
      return true;
    });
  }

  /**
   * Logs query details for debugging
   * @param {string} operation - Operation type
   * @param {string} collectionName - Collection name
   * @param {Object} params - Query parameters
   */
  _logQuery(operation, collectionName, params = {}) {
    console.log(`Firestore ${operation}:`, {
      collection: collectionName,
      user: auth.currentUser?.uid,
      timestamp: new Date().toISOString(),
      ...params
    });
  }

  /**
   * Safe query with validation and authentication
   * @param {string} collectionName - Collection name
   * @param {Array} conditions - Where conditions
   * @param {Array} orderByFields - Order by fields
   * @param {number} limitCount - Limit count
   * @returns {Promise<Array>} Query results
   */
  async safeQuery(collectionName, conditions = [], orderByFields = [], limitCount = null) {
    this._requireAuth();

    try {
      const validatedConditions = this._validateQueryConditions(conditions);
      const validatedOrderBy = this._validateOrderBy(orderByFields);

      this._logQuery('query', collectionName, {
        conditions: validatedConditions,
        orderBy: validatedOrderBy,
        limit: limitCount
      });

      let q = collection(db, collectionName);

      // Add where conditions
      for (const [field, operator, value] of validatedConditions) {
        q = query(q, where(field, operator, value));
      }

      // Add order by
      for (const [field, direction = 'asc'] of validatedOrderBy) {
        q = query(q, orderBy(field, direction));
      }

      // Add limit
      if (limitCount && limitCount > 0) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Query completed: ${results.length} documents returned`);
      return results;

    } catch (error) {
      console.error('Firestore query error:', {
        collection: collectionName,
        conditions,
        orderBy: orderByFields,
        limit: limitCount,
        error: error.message,
        code: error.code,
        user: auth.currentUser?.uid
      });

      // Provide user-friendly error messages
      if (error.code === 'failed-precondition') {
        throw new Error('Database index required for this query. Please contact support.');
      } else if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to access this data.');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Invalid query parameters provided.');
      } else {
        throw new Error(`Database query failed: ${error.message}`);
      }
    }
  }

  /**
   * Safe real-time listener with cleanup tracking
   * @param {string} collectionName - Collection name
   * @param {Array} conditions - Where conditions
   * @param {Array} orderByFields - Order by fields
   * @param {Function} callback - Callback function
   * @param {number} limitCount - Limit count
   * @returns {Function} Unsubscribe function
   */
  setupSafeListener(collectionName, conditions = [], orderByFields = [], callback, limitCount = null) {
    this._requireAuth();

    try {
      const validatedConditions = this._validateQueryConditions(conditions);
      const validatedOrderBy = this._validateOrderBy(orderByFields);

      this._logQuery('listener', collectionName, {
        conditions: validatedConditions,
        orderBy: validatedOrderBy,
        limit: limitCount
      });

      let q = collection(db, collectionName);

      // Add where conditions
      for (const [field, operator, value] of validatedConditions) {
        q = query(q, where(field, operator, value));
      }

      // Add order by
      for (const [field, direction = 'asc'] of validatedOrderBy) {
        q = query(q, orderBy(field, direction));
      }

      // Add limit
      if (limitCount && limitCount > 0) {
        q = query(q, limit(limitCount));
      }

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log(`Listener update: ${documents.length} documents`);
          callback(documents);
        },
        (error) => {
          console.error('Firestore listener error:', {
            collection: collectionName,
            conditions: validatedConditions,
            error: error.message,
            code: error.code,
            user: auth.currentUser?.uid
          });
          
          // Call callback with empty array and error info
          callback([], error);
        }
      );

      // Track listener for cleanup
      this._trackListener(unsubscribe);
      return unsubscribe;

    } catch (error) {
      console.error('Error setting up Firestore listener:', {
        collection: collectionName,
        conditions,
        error: error.message
      });
      
      // Return no-op function
      return () => {};
    }
  }

  /**
   * Safe document retrieval
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @returns {Promise<Object|null>} Document data or null
   */
  async safeGetDocument(collectionName, docId) {
    this._requireAuth();

    if (!docId) {
      throw new Error('Document ID is required');
    }

    try {
      this._logQuery('getDoc', collectionName, { docId });

      const docRef = doc(db, collectionName, docId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      } else {
        console.log(`Document not found: ${collectionName}/${docId}`);
        return null;
      }

    } catch (error) {
      console.error('Error getting document:', {
        collection: collectionName,
        docId,
        error: error.message,
        code: error.code,
        user: auth.currentUser?.uid
      });

      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to access this document.');
      } else {
        throw new Error(`Failed to retrieve document: ${error.message}`);
      }
    }
  }

  /**
   * Safe document creation/update
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID (optional for auto-generated)
   * @param {Object} data - Document data
   * @param {boolean} merge - Whether to merge with existing data
   * @returns {Promise<string>} Document ID
   */
  async safeSetDocument(collectionName, docId, data, merge = true) {
    this._requireAuth();

    if (!data || typeof data !== 'object') {
      throw new Error('Document data must be a valid object');
    }

    try {
      const timestamp = serverTimestamp();
      const documentData = {
        ...data,
        updatedAt: timestamp,
        ...(docId ? {} : { createdAt: timestamp })
      };

      if (docId) {
        // Update existing document
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, documentData, { merge });
        
        this._logQuery('setDoc', collectionName, { docId, merge });
        return docId;
      } else {
        // Create new document with auto-generated ID
        documentData.createdAt = timestamp;
        const docRef = await addDoc(collection(db, collectionName), documentData);
        
        this._logQuery('addDoc', collectionName, { docId: docRef.id });
        return docRef.id;
      }

    } catch (error) {
      console.error('Error setting document:', {
        collection: collectionName,
        docId,
        error: error.message,
        code: error.code,
        user: auth.currentUser?.uid
      });

      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to modify this document.');
      } else {
        throw new Error(`Failed to save document: ${error.message}`);
      }
    }
  }

  /**
   * Safe document update
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async safeUpdateDocument(collectionName, docId, updates) {
    this._requireAuth();

    if (!docId) {
      throw new Error('Document ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a valid object');
    }

    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      this._logQuery('updateDoc', collectionName, { docId, updates: Object.keys(updates) });

    } catch (error) {
      console.error('Error updating document:', {
        collection: collectionName,
        docId,
        updates: Object.keys(updates),
        error: error.message,
        code: error.code,
        user: auth.currentUser?.uid
      });

      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to modify this document.');
      } else if (error.code === 'not-found') {
        throw new Error('Document not found.');
      } else {
        throw new Error(`Failed to update document: ${error.message}`);
      }
    }
  }

  /**
   * Track active listeners for cleanup
   */
  _activeListeners = new Set();

  _trackListener(unsubscribe) {
    this._activeListeners.add(unsubscribe);
  }

  /**
   * Cleanup all active listeners
   * Call this when component unmounts or user logs out
   */
  cleanupAllListeners() {
    console.log(`Cleaning up ${this._activeListeners.size} Firestore listeners`);
    
    for (const unsubscribe of this._activeListeners) {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error cleaning up listener:', error);
      }
    }
    
    this._activeListeners.clear();
  }

  /**
   * Validate query parameters before execution
   * @param {Array} params - Query parameters
   * @returns {boolean} True if valid
   */
  validateQueryParams(params) {
    if (!Array.isArray(params)) {
      return false;
    }

    for (const param of params) {
      if (param === undefined || param === null) {
        return false;
      }
      
      if (Array.isArray(param) && param.length === 0) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const firestoreQueryService = new FirestoreQueryService();
export default firestoreQueryService;