import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import toast from "react-hot-toast";
import {
  getUserProfile,
  signInWithEmailPassword,
  signOutUser,
  createUserAccount,
  getAuthErrorMessage
} from "../utils/authUtils";
import { getReceiveEligibility } from "../services/helpService";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [blockedAt, setBlockedAt] = useState(null);
  const [receiveEligibility, setReceiveEligibility] = useState(null);

  // 🔹 Init Auth Persistence
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Auth persistence error:", error);
      }
    };
    initAuth();
  }, []);

  // 🔹 Listen Auth State (CRITICAL: Single source of truth)
  useEffect(() => {
    console.log("🔍 AUTH CONTEXT: Setting up auth listener...");

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("🔍 AUTH STATE CHANGED:", authUser ? "LOGGED IN" : "LOGGED OUT", authUser?.uid);

      if (authUser) {
        // User logged in
        setUser(authUser);
        // Do NOT set loading=false here, wait for profile fetch
      } else {
        // User logged out
        setUser(null);
        setUserProfile(null);
        setIsBlocked(false);
        setBlockReason(null);
        setBlockedAt(null);
        setReceiveEligibility(null);
        setLoading(false); // Can stop loading if logged out
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Fetch Profile When User Changes
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      console.log("🔍 AUTH CONTEXT: Fetching profile for:", user.uid);

      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile || null); // null if doc missing

        // Fetch eligibility/block status
        try {
          const eligibility = await getReceiveEligibility();
          setReceiveEligibility(eligibility);

          if (eligibility?.blockType === 'isBlocked') {
            setIsBlocked(true);
            setBlockReason(eligibility.reasonCode);
            setBlockedAt(profile?.blockedAt || null);
          } else {
            // Check raw profile flags as fallback
            const isBlockedRaw = !!(profile?.isBlocked || profile?.isOnHold);
            setIsBlocked(isBlockedRaw);
            if (isBlockedRaw) {
              setBlockReason(profile?.blockReason || profile?.blockedReason || 'Account Locked');
              setBlockedAt(profile?.blockedAt || null);
            }
          }
        } catch (e) {
          console.warn("Eligibility check failed:", e);
          // Fallback to minimal profile block check
          setIsBlocked(!!(profile?.isBlocked || profile?.isOnHold));
        }

      } catch (error) {
        console.error("Profile fetch failed:", error);
        setUserProfile(undefined); // undefined means "error/unknown" not "missing"
      } finally {
        setProfileLoading(false);
        setLoading(false); // Global loading done
      }
    };

    fetchProfile();
  }, [user]);

  // 🔹 Helpers
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      // Persistence is already set on mount
      const result = await signInWithEmailPassword(email, password);
      // Auth listener handles state update
      return result;
    } catch (error) {
      toast.error(getAuthErrorMessage(error.code));
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await signOutUser();
      // Auth listener handles cleanup
      return { success: true };
    } catch (error) {
      toast.error("Logout failed");
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email, password, fullName, phone, whatsapp, sponsorId, epin, paymentMethod, phonepeNumber, googlepayNumber, upiId, accountHolder, accountNumber, ifscCode) => {
    setAuthLoading(true);
    try {
      const userData = {
        email, password, fullName, phone, whatsapp, sponsorId, epin, paymentMethod,
        phonepeNumber, googlepayNumber, upiId, accountHolder, accountNumber, ifscCode
      };

      const result = await createUserAccount(userData);
      // Auth listener handles state update
      return result;
    } catch (error) {
      toast.error(getAuthErrorMessage(error.code));
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const isAdmin = userProfile && userProfile.role === 'admin';

  const value = {
    user,
    setUser, // expose minimal setter if needed by edge cases
    userProfile,
    loading: loading || profileLoading, // Combined loading state
    authLoading,
    isAdmin,
    isBlocked,
    blockReason,
    blockedAt,
    receiveEligibility,
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
  // NOTE: render only children when not loading to prevent protected routes from redirecting early
};