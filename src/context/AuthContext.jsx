import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import fcmService from "../services/fcmService";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userClaims, setUserClaims] = useState({});
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // 🔹 Login
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const tokenResult = await getIdTokenResult(userCredential.user, true);
      
      // Initialize FCM for the logged-in user
      try {
        await fcmService.initializeForUser(userCredential.user.uid);
        console.log('FCM initialized for user:', userCredential.user.uid);
      } catch (fcmError) {
        console.log('FCM initialization failed (non-critical):', fcmError);
      }
      
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
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🔹 Logout
  const logout = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserClaims({});
      toast.success("Logged out successfully");
      setAuthLoading(false);
      return { success: true };
    } catch (error) {
      setAuthLoading(false);
      toast.error("Failed to logout.");
      return { success: false, error: error.message };
    }
  };

  // 🔹 Listen Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setClaimsLoading(true);
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          setUserClaims(tokenResult.claims || {});

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), uid: firebaseUser.uid });
            
            // Initialize FCM for returning users (on app refresh/reload)
            try {
              await fcmService.initializeForUser(firebaseUser.uid);
              console.log('FCM initialized for returning user:', firebaseUser.uid);
            } catch (fcmError) {
              console.log('FCM initialization failed (non-critical):', fcmError);
            }
          } else {
            setUser(null); // Or handle as an error
          }
        } else {
          setUser(null);
          setUserClaims({});
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
        setUser(null);
        setUserClaims({});
      } finally {
        setLoading(false);
        setClaimsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 🔹 Live Firestore User Updates
  useEffect(() => {
    if (user?.uid) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...docSnap.data(), uid: user.uid });
          }
        },
        (error) => {
          console.error("Firestore onSnapshot error (user profile):", error);
        }
      );
      return () => unsubscribe();
    }
  }, [user?.uid]);

  // 🔹 Context Value
  const value = {
    user,
    setUser,
    userClaims,
    claimsLoading,
    login,
    logout,
    loading: loading || claimsLoading,
    authLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};