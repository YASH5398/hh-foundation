import React, { createContext, useContext, useEffect, useState } from "react";
<<<<<<< HEAD
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import {
  getUserProfile,
  checkAdminRole,
  signInWithEmailPassword,
  signOutUser,
  createUserAccount,
  getAuthErrorMessage
} from "../utils/authUtils";
import { getReceiveEligibility } from "../services/helpService";
=======
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userClaims, setUserClaims] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
<<<<<<< HEAD
  const [profileLoading, setProfileLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [blockedAt, setBlockedAt] = useState(null);
  const [receiveEligibility, setReceiveEligibility] = useState(null);
=======
  const [authLoading, setAuthLoading] = useState(false);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  // 🔹 Login
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
<<<<<<< HEAD
      const result = await signInWithEmailPassword(email, password);
      setAuthLoading(false);

      if (result.success) {
        const claims = await checkAdminRole(result.user);
        return { success: true, claims: { admin: claims } };
      } else {
        const errorMessage = getAuthErrorMessage(result.errorCode);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      setAuthLoading(false);
      const errorMessage = getAuthErrorMessage(error.code);
=======
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const tokenResult = await getIdTokenResult(userCredential.user, true);
      
      setAuthLoading(false);
      // Return success and claims for the UI to handle redirection
      return { success: true, claims: tokenResult.claims || {} };
    } catch (error) {
      setAuthLoading(false);
      let errorMessage = "Failed to login.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found. Please register again.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Contact support.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid.";
      } else {
        errorMessage = "Network error. Please try again.";
      }
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🔹 Signup
  const signup = async (email, password, fullName, phone, whatsapp, sponsorId, epin, paymentMethod, phonepeNumber, googlepayNumber, upiId, accountHolder, accountNumber, ifscCode) => {
    setAuthLoading(true);
    try {
<<<<<<< HEAD
      const userData = {
        email,
        password,
=======
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);

      // Immediately create Firestore user document
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

      // Generate user ID
      const userId = `HHF${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        userId: userId,
        email: email.toLowerCase(),
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        fullName,
        phone,
        whatsapp,
        sponsorId,
        epin,
        paymentMethod,
        phonepeNumber,
        googlepayNumber,
        upiId,
        accountHolder,
        accountNumber,
<<<<<<< HEAD
        ifscCode
      };

      const result = await createUserAccount(userData);
      setAuthLoading(false);

      if (result.success) {
        return { success: true, userId: result.userId };
      } else {
        const errorMessage = getAuthErrorMessage(result.errorCode);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      setAuthLoading(false);
      const errorMessage = getAuthErrorMessage(error.code);
=======
        ifscCode,
        createdAt: serverTimestamp(),
        role: "user",
        isActivated: false,
        totalEarnings: 0,
        referralCount: 0,
        helpReceived: 0,
        totalReceived: 0,
        totalSent: 0
      });

      setAuthLoading(false);
      return { success: true, userId: userId };
    } catch (error) {
      setAuthLoading(false);
      let errorMessage = "Failed to create account.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already exists. Please login instead.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else {
        errorMessage = "Network error. Please try again.";
      }
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🔹 Logout
  const logout = async () => {
<<<<<<< HEAD
    console.log("🔍 LOGOUT: ===== LOGOUT STARTED =====");
    console.log("🔍 LOGOUT: Current user before logout:", !!user, user?.uid);
    console.log("🔍 LOGOUT: Firebase auth.currentUser before logout:", auth.currentUser?.uid || 'null');

    setAuthLoading(true);

    try {
      console.log("🔍 LOGOUT: Calling Firebase signOut...");
      const result = await signOutUser();
      console.log("🔍 LOGOUT: signOutUser result:", result);

      if (result.success) {
        console.log("🔍 LOGOUT: Firebase signOut successful");
        console.log("🔍 LOGOUT: Clearing non-Firebase state (userClaims, userProfile)");
        // Clear state that doesn't depend on Firebase auth
        setUserClaims({});
        setUserProfile(null);
        // IMPORTANT: Do NOT set user to null here - let onAuthStateChanged handle it
        // This ensures Firebase is the single source of truth
      } else {
        console.log("🔍 LOGOUT: signOutUser failed:", result.error);
        setAuthLoading(false); // Reset loading state on failure
        toast.error("Failed to logout.");
        return result;
      }

      // Wait a moment for onAuthStateChanged to fire
      setTimeout(() => {
        console.log("🔍 LOGOUT: Checking if onAuthStateChanged fired...");
        console.log("🔍 LOGOUT: Current React user state:", !!user, user?.uid);
        console.log("🔍 LOGOUT: Current Firebase user:", auth.currentUser?.uid || 'null');
      }, 500);

      return result;
    } catch (error) {
      console.error("🔍 LOGOUT: Exception during logout:", error);
      setAuthLoading(false); // Reset loading state on exception
=======
    setAuthLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserClaims({});
      setUserProfile(null);
      toast.success("Logged out successfully");
      setAuthLoading(false);
      return { success: true };
    } catch (error) {
      setAuthLoading(false);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.error("Failed to logout.");
      return { success: false, error: error.message };
    }
  };

<<<<<<< HEAD
  // 🔹 TEMP DEBUG: Comprehensive Logout Verification (remove after fixing)
  const testLogout = async () => {
    console.log("🧪 LOGOUT TEST: ===== COMPREHENSIVE LOGOUT VERIFICATION =====");
    console.log("🧪 LOGOUT TEST: Pre-logout state:");
    console.log("  - React AuthContext user:", !!user, user?.uid);
    console.log("  - Firebase auth.currentUser:", !!auth.currentUser, auth.currentUser?.uid);
    console.log("  - localStorage Firebase keys:", getFirebaseLocalStorageKeys());

    function getFirebaseLocalStorageKeys() {
      if (typeof window === 'undefined') return 'N/A';
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('firebase')) {
          keys.push(key);
        }
      }
      return keys.length > 0 ? keys : 'None';
    }

    try {
      console.log("🧪 LOGOUT TEST: Executing logout...");
      const startTime = Date.now();
      const result = await logout();
      const logoutDuration = Date.now() - startTime;

      console.log("🧪 LOGOUT TEST: Logout completed in", logoutDuration, "ms");
      console.log("🧪 LOGOUT TEST: Logout result:", result);

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("🧪 LOGOUT TEST: Post-logout state (after 2s delay):");
      console.log("  - React AuthContext user:", !!user, user?.uid);
      console.log("  - Firebase auth.currentUser:", !!auth.currentUser, auth.currentUser?.uid);
      console.log("  - localStorage Firebase keys:", getFirebaseLocalStorageKeys());

      // Final verification
      const isLoggedOut = !user && !auth.currentUser;
      const noLocalStorage = getFirebaseLocalStorageKeys() === 'None';

      console.log("🧪 LOGOUT TEST: ===== VERIFICATION RESULTS =====");
      console.log("  ✅ Auth state cleared:", isLoggedOut ? "PASS" : "FAIL");
      console.log("  ✅ localStorage cleared:", noLocalStorage ? "PASS" : "FAIL");
      console.log("  📊 Overall result:", (isLoggedOut && noLocalStorage) ? "SUCCESS ✅" : "FAILURE ❌");

      if (!isLoggedOut) {
        console.error("🧪 LOGOUT TEST: ❌ CRITICAL - User still authenticated!");
        console.error("🧪 LOGOUT TEST: This indicates Firebase signOut failed or auth state listener malfunction");
      }

      if (!noLocalStorage) {
        console.warn("🧪 LOGOUT TEST: ⚠️ localStorage still contains Firebase data");
        console.warn("🧪 LOGOUT TEST: This may cause auto-relogin on page refresh");
      }

      return { success: isLoggedOut && noLocalStorage, logoutDuration, result };

    } catch (error) {
      console.error("🧪 LOGOUT TEST: Exception during test:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Listen Auth State (CRITICAL: Single source of truth for auth)
  useEffect(() => {
    console.log("🔍 AUTH CONTEXT: Setting up auth state listener");

    // Fallback timeout: Set loading to false after 10 seconds if auth state never resolves
    const fallbackTimeout = setTimeout(() => {
      console.log("🔍 AUTH CONTEXT: Fallback timeout reached - setting loading to false");
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear the fallback timeout since auth state resolved
      clearTimeout(fallbackTimeout);

      const wasLoggedIn = !!AuthContext._currentValue?.user;
      const isNowLoggedOut = !user && wasLoggedIn;

      console.log("🔍 AUTH CONTEXT: ===== AUTH STATE CHANGE =====");
      console.log("🔍 AUTH CONTEXT: Firebase user:", !!user, user?.uid);
      console.log("🔍 AUTH CONTEXT: Previous React user:", wasLoggedIn);
      console.log("🔍 AUTH CONTEXT: Is logout:", isNowLoggedOut);
      console.log("🔍 AUTH CONTEXT: Auth persistence check:", auth.app.options.authDomain);

      setUser(user);
      setLoading(false);
      setClaimsLoading(false);

      // Handle logout completion - CRITICAL: Only clear state when Firebase confirms logout
      if (isNowLoggedOut) {
        console.log("🔍 AUTH CONTEXT: 🚨 LOGOUT CONFIRMED - Clearing all auth state");
        console.log("🔍 AUTH CONTEXT: Previous user was:", wasLoggedIn);
        console.log("🔍 AUTH CONTEXT: Firebase user is now:", !!user);
        setUserClaims({});
        setUserProfile(null);
        setAuthLoading(false);
        toast.success("Logged out successfully");
        console.log("🔍 AUTH CONTEXT: All logout state cleared");

        // Force clear any cached auth data
        console.log("🔍 AUTH CONTEXT: Checking localStorage for cached auth...");
        if (typeof window !== 'undefined') {
          // Check for Firebase auth persistence
          for (let key in localStorage) {
            if (key.includes('firebase') || key.includes('auth')) {
              console.log("🔍 AUTH CONTEXT: Found auth key:", key);
            }
          }
        }

        // Verify logout was successful after a short delay
        setTimeout(() => {
          console.log("🔍 AUTH CONTEXT: Post-logout verification:");
          console.log("  - Firebase auth.currentUser:", auth.currentUser?.uid || 'null');
          console.log("  - React user state:", user?.uid || 'null');
          if (auth.currentUser || user) {
            console.error("🔍 AUTH CONTEXT: ❌ LOGOUT FAILED - Auth state still exists!");
          } else {
            console.log("🔍 AUTH CONTEXT: ✅ LOGOUT SUCCESSFUL");
          }
        }, 1000);
      } else if (user) {
        console.log("🔍 AUTH CONTEXT: ✅ User authenticated:", user.uid);
      } else {
        console.log("🔍 AUTH CONTEXT: ℹ️ No user (initial load or already logged out)");
      }

      console.log("🔍 AUTH CONTEXT: ===== AUTH STATE UPDATE COMPLETE =====");
    });

    // Cleanup function - unsubscribe from auth listener and clear timeout
    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  // 🔹 Monitor user state changes for debugging
  useEffect(() => {
    console.log("🔍 AUTH CONTEXT: User state changed to:", !!user, user?.uid);
  }, [user]);

=======
  // 🔹 Listen Auth State (NO Firestore access - prevents permission-denied logs)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setClaimsLoading(false);
    });

    return unsubscribe;
  }, []);

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  // 🔹 Fetch claims separately
  useEffect(() => {
    if (!auth.currentUser) {
      setUserClaims({});
      return;
    }

    const fetchClaims = async () => {
      try {
        setClaimsLoading(true);
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        setUserClaims(tokenResult.claims || {});
      } catch (error) {
        console.error("Error fetching claims:", error);
        setUserClaims({});
        // Don't block login for new users without claims
      } finally {
        setClaimsLoading(false);
      }
    };

    fetchClaims();
  }, [user]);

  // 🔹 Fetch User Profile (only after auth exists)
  useEffect(() => {
<<<<<<< HEAD
    console.log("🔍 AUTH CONTEXT: Profile fetch effect triggered -", {
      user: !!user,
      uid: user?.uid
    });

    if (!user) {
      console.log("🔍 AUTH CONTEXT: No user, clearing profile");
      setUserProfile(null);
      setIsBlocked(false);
      setBlockReason(null);
      setBlockedAt(null);
      setReceiveEligibility(null);
      return;
    }

    const fetchProfile = async () => {
      console.log("🔍 AUTH CONTEXT: Starting profile fetch for user:", user.uid);
      setProfileLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        console.log("🔍 AUTH CONTEXT: Profile fetch successful -", {
          profile: !!profile,
          uid: profile?.uid,
          fullName: profile?.fullName
        });
        setUserProfile(profile);

        // Server-truth eligibility (no raw flag reads)
        try {
          const eligibility = await getReceiveEligibility();
          setReceiveEligibility(eligibility);

          const blocked = eligibility?.blockType === 'isBlocked';
          setIsBlocked(blocked);
          setBlockReason(blocked ? (eligibility?.reasonCode || 'blocked') : null);
          setBlockedAt(profile?.blockedAt || null);
        } catch (e) {
          // Fail closed: if eligibility check fails, don't hard-block the UI
          setReceiveEligibility(null);
          setIsBlocked(!!(profile?.isBlocked || profile?.paymentBlocked));
          setBlockReason(profile?.blockReason || profile?.blockedReason || null);
          setBlockedAt(profile?.blockedAt || null);
        }
      } catch (error) {
        console.log("🔍 AUTH CONTEXT: Profile fetch failed -", {
          error: error.message,
          code: error.code,
          isPermissionDenied: error.code === 'permission-denied' || error.message?.includes('permission-denied')
        });
        // Handle missing profile documents gracefully (e.g., during signup before document is created)
        // Only log non-permission errors
        if (!error.message?.includes('permission-denied') && error.code !== 'permission-denied') {
          console.error("AuthContext user profile fetch error:", error);
        }
        setUserProfile(null);
        setIsBlocked(false);
        setBlockReason(null);
        setBlockedAt(null);
        setReceiveEligibility(null);
        // Don't show toast for permission errors in context
      } finally {
        setProfileLoading(false);
        console.log("🔍 AUTH CONTEXT: Profile loading completed");
=======
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        setUserProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (error) {
        console.error("AuthContext user profile fetch error:", error);
        setUserProfile(null);
        // Don't show toast for permission errors in context
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      }
    };

    fetchProfile();
  }, [user]);

<<<<<<< HEAD
  // 🔹 Derive isAdmin from custom claims (single source of truth)
  const isAdmin = userClaims?.role === 'admin';

=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  // 🔹 Context Value
  const value = {
    user,
    setUser,
    userClaims,
    userProfile,
    claimsLoading,
    login,
    logout,
    signup,
<<<<<<< HEAD
    testLogout, // TEMP: Remove after fixing logout
    loading: loading || claimsLoading || profileLoading,
    authLoading,
    // Admin status (single source of truth)
    isAdmin,
    // Blocked user status
    isBlocked,
    blockReason,
    blockedAt,
    isUserBlocked: isBlocked,
    receiveEligibility
=======
    loading: loading || claimsLoading,
    authLoading,
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};