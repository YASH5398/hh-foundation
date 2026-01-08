import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Generate a unique user ID for display purposes
 * @returns {string} User ID in format "HHF123456"
 */
export const generateUserId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `HHF${random}`;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true, message: 'Password is valid' };
};


/**
 * Safely get the current user's UID, waiting if necessary
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string>} The user's UID
 */
export const getCurrentUserUid = async (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    // Check if auth.currentUser is already available
    if (auth.currentUser?.uid) {
      resolve(auth.currentUser.uid);
      return;
    }

    // Wait for auth state to change
    // Remove or comment out onAuthStateChanged listeners to avoid duplicate/conflicting auth state
    // const unsubscribe = auth.onAuthStateChanged(user => {
    //   if (user?.uid) {
    //     unsubscribe();
    //     resolve(user.uid);
    //   }
    // });

    // Timeout
    setTimeout(() => {
      // unsubscribe(); // This line is no longer needed as unsubscribe is commented out
      reject(new Error('Timeout waiting for user UID'));
    }, timeout);
  });
};

/**
 * Enhanced function to wait for complete authentication state
 * @param {string} uid - Expected user UID
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<void>}
 */
export const waitForCompleteAuthState = async (uid, timeout = 20000) => {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    const checkAuth = () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        // Additional check: ensure user has a valid token
        currentUser.getIdToken(true)
          .then(() => {
            if (!resolved) {
              resolved = true;
              console.log('✅ Complete authentication confirmed:', { 
                uid: currentUser.uid, 
                email: currentUser.email,
                emailVerified: currentUser.emailVerified 
              });
              resolve();
            }
          })
          .catch(error => {
            console.error('❌ Token refresh failed:', error);
            if (!resolved) {
              resolved = true;
              reject(new Error('Failed to get valid authentication token'));
            }
          });
      }
    };

    // Check immediately
    checkAuth();

    // Set up auth state listener
    // Remove or comment out onAuthStateChanged listeners to avoid duplicate/conflicting auth state
    // const unsubscribe = auth.onAuthStateChanged(user => {
    //   if (user && user.uid === uid) {
    //     checkAuth();
    //   }
    // });

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // unsubscribe(); // This line is no longer needed as unsubscribe is commented out
        reject(new Error('Authentication timeout - user not properly authenticated'));
      }
    }, timeout);
  });
};

/**
 * Force refresh authentication token before Firestore operations
 * @param {string} uid - Expected user UID
 * @returns {Promise<void>}
 */
export const refreshAuthToken = async (uid) => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Authentication state invalid - cannot refresh token');
  }
  
  try {
    await currentUser.getIdToken(true);
    console.log('✅ Authentication token refreshed successfully');
  } catch (error) {
    console.error('❌ Failed to refresh authentication token:', error);
    throw new Error('Failed to refresh authentication token');
  }
};

/**
 * Verify authentication state before Firestore operations
 * @param {string} uid - Expected user UID
 * @returns {boolean} True if authentication state is valid
 */
export const verifyAuthState = (uid) => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Authentication state verification failed - cannot proceed with Firestore operations');
  }
  return true;
};

/**
 * Clean up Firebase Auth user if registration fails
 * @param {string} uid - User UID to delete
 * @returns {Promise<void>}
 */
export const cleanupAuthUser = async (uid) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await currentUser.delete();
      console.log('✅ Firebase Auth user deleted successfully');
    }
  } catch (error) {
    console.error('❌ Failed to delete Firebase Auth user:', error);
  }
};

/**
 * Get user-friendly error message for registration errors
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getRegistrationErrorMessage = (error) => {
  if (error.code) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'permission-denied':
        return 'Permission denied. Please check your authentication status.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.message || 'Registration failed';
    }
  } else if (error.message) {
    if (error.message.includes('Authentication timeout')) {
      return 'Authentication timeout. Please try again.';
    } else if (error.message.includes('Authentication state verification failed')) {
      return 'Authentication verification failed. Please try again.';
    } else if (error.message.includes('Authentication state lost')) {
      return 'Authentication state lost. Please try again.';
    } else {
      return error.message;
    }
  }
  
  return 'Something went wrong during registration';
};

/**
 * Check if error requires cleanup of Firebase Auth user
 * @param {Error} error - Error object
 * @returns {boolean} True if cleanup is needed
 */
export const requiresCleanup = (error) => {
  return error.code === 'permission-denied' || 
         error.code === 'unavailable' || 
         error.message?.includes('Authentication') ||
         error.message?.includes('Firestore') ||
         error.message?.includes('timeout');
}; 