import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * Shared authentication utilities to reduce code duplication
 * across AuthContext and AgentAuthContext
 */

/**
 * Get user profile from Firestore
 * @param {string} uid - User UID
 * @returns {Promise<Object|null>} User profile data or null if document doesn't exist
 * @throws {Error} Throws error on Firestore permission-denied or network errors
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;

  try {
    console.log('🔍 getUserProfile: Fetching profile for uid:', uid);
    console.log('🔍 getUserProfile: Firebase project:', db.app.options.projectId);
    console.log('🔍 getUserProfile: Firebase auth domain:', db.app.options.authDomain);
    
    const userDoc = doc(db, 'users', uid);
    const snapshot = await getDoc(userDoc);
    
    console.log('🔍 getUserProfile: Document exists?', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = { id: snapshot.id, ...snapshot.data() };
      console.log('🔍 getUserProfile: Profile data -', {
        uid: data.uid,
        email: data.email,
        role: data.role,
        fullName: data.fullName
      });
      return data;
    } else {
      console.log('🔍 getUserProfile: Document does not exist for uid:', uid);
      return null;
    }
  } catch (error) {
    console.error('🔍 getUserProfile: Error fetching profile -', {
      uid,
      code: error.code,
      message: error.message,
      projectId: db.app.options.projectId
    });
    // Rethrow error so caller can distinguish from "document doesn't exist"
    throw error;
  }
};

/**
 * Check if user has admin role (from Firestore)
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} True if user is admin
 */
export const checkAdminRole = async (user) => {
  if (!user) return false;

  try {
    console.log('🔍 checkAdminRole: Checking admin role for uid:', user.uid);
    console.log('🔍 checkAdminRole: Firebase project:', db.app.options.projectId);
    
    // CRITICAL: Check Firestore role field, not custom claims
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const isAdmin = userData.role === 'admin';
      console.log('🔍 checkAdminRole: User role:', userData.role, '| isAdmin:', isAdmin);
      return isAdmin;
    }
    console.log('🔍 checkAdminRole: User document does not exist');
    return false;
  } catch (error) {
    console.error('🔍 checkAdminRole: Error checking admin role -', {
      uid: user.uid,
      code: error.code,
      message: error.message
    });
    return false;
  }
};

/**
 * Check if user has agent role
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} True if user is agent
 */
export const checkAgentRole = async (user) => {
  if (!user) return false;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === 'agent' || userData.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking agent role:', error);
    return false;
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Auth result
 */
export const signInWithEmailPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message, errorCode: error.code };
  }
};

/**
 * Sign out current user
 * @returns {Promise<Object>} Sign out result
 */
export const signOutUser = async () => {
  try {
    console.log("🔍 SIGNOUT: ===== FIREBASE SIGNOUT START =====");
    console.log("🔍 SIGNOUT: Auth instance:", !!auth);
    console.log("🔍 SIGNOUT: Current Firebase user before signOut:", auth.currentUser?.uid);
    console.log("🔍 SIGNOUT: Current Firebase user email:", auth.currentUser?.email);

    // CRITICAL: Clear any cached auth data BEFORE signOut
    if (typeof window !== 'undefined') {
      console.log("🔍 SIGNOUT: Clearing Firebase auth persistence...");

      // Clear Firebase auth localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase:authUser') || key.includes('firebase:host') || key.includes('firebaseLocalStorage'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log("🔍 SIGNOUT: Removed localStorage key:", key);
      });
    }

    // CRITICAL: Call Firebase signOut
    await signOut(auth);

    console.log("🔍 SIGNOUT: Firebase signOut completed successfully");
    console.log("🔍 SIGNOUT: Firebase currentUser after signOut:", auth.currentUser?.uid);

    // Double-check that signOut actually worked
    if (auth.currentUser) {
      console.error("🔍 SIGNOUT: ❌ CRITICAL ERROR - Firebase user still exists after signOut!");
      console.error("🔍 SIGNOUT: This should never happen. Auth state corruption detected.");
      return { success: false, error: "SignOut failed - user still authenticated" };
    } else {
      console.log("🔍 SIGNOUT: ✅ Confirmed - Firebase user is null after signOut");
    }

    // Additional check: Ensure no auth persistence data remains
    if (typeof window !== 'undefined') {
      let hasAuthData = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('firebase:authUser')) {
          console.warn("🔍 SIGNOUT: ⚠️ Auth data still exists in localStorage:", key);
          hasAuthData = true;
        }
      }

      if (!hasAuthData) {
        console.log("🔍 SIGNOUT: ✅ Confirmed - No Firebase auth data in localStorage");
      }
    }

    console.log("🔍 SIGNOUT: ===== FIREBASE SIGNOUT COMPLETE =====");
    return { success: true };
  } catch (error) {
    console.error('🔍 SIGNOUT: ❌ FIREBASE SIGNOUT FAILED:', error);
    console.error('🔍 SIGNOUT: Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create new user account
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
export const createUserAccount = async (userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email.toLowerCase(),
      userData.password
    );

    // Generate user ID
    const userId = `HHF${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Create user document
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      userId: userId,
      email: userData.email.toLowerCase(),
      fullName: userData.fullName,
      phone: userData.phone,
      whatsapp: userData.whatsapp,
      sponsorId: userData.sponsorId,
      epin: userData.epin,
      paymentMethod: userData.paymentMethod,
      phonepeNumber: userData.phonepeNumber,
      googlepayNumber: userData.googlepayNumber,
      upiId: userData.upiId,
      accountHolder: userData.accountHolder,
      accountNumber: userData.accountNumber,
      ifscCode: userData.ifscCode,
      createdAt: serverTimestamp(),
      role: "user",
      isActivated: false,
      totalEarnings: 0,
      referralCount: 0,
      helpReceived: 0,
      totalReceived: 0,
      totalSent: 0
    });

    return { success: true, userId: userId, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message, errorCode: error.code };
  }
};

/**
 * Get formatted Firebase error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} Human-readable error message
 */
export const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
};
