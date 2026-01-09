import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

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
  const [authLoading, setAuthLoading] = useState(false);

  // 🔹 Login
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
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
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🔹 Signup
  const signup = async (email, password, fullName, phone, whatsapp, sponsorId, epin, paymentMethod, phonepeNumber, googlepayNumber, upiId, accountHolder, accountNumber, ifscCode) => {
    setAuthLoading(true);
    try {
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
      setUserProfile(null);
      toast.success("Logged out successfully");
      setAuthLoading(false);
      return { success: true };
    } catch (error) {
      setAuthLoading(false);
      toast.error("Failed to logout.");
      return { success: false, error: error.message };
    }
  };

  // 🔹 Listen Auth State (NO Firestore access - prevents permission-denied logs)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setClaimsLoading(false);
    });

    return unsubscribe;
  }, []);

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
      }
    };

    fetchProfile();
  }, [user]);

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
    loading: loading || claimsLoading,
    authLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};