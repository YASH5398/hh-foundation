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
} from
  "../utils/authUtils";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined);
  const [initialAuthLoading, setInitialAuthLoading] = useState(true); // Only for first auth check
  const [profileLoading, setProfileLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [blockedAt, setBlockedAt] = useState(null);
  const [receiveEligibility, setReceiveEligibility] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [lastFetchedUid, setLastFetchedUid] = useState(null);

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
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setInitialAuthLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsBlocked(false);
        setBlockReason(null);
        setBlockedAt(null);
        setReceiveEligibility(null);
        setIsProfileLoaded(false);
        setLastFetchedUid(null);
        setInitialAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Fetch Profile When User Changes
  useEffect(() => {
    if (!user || user.uid === lastFetchedUid) return;

    const fetchProfile = async () => {
      setProfileLoading(true);

      try {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          setUserProfile(null);
          setIsProfileLoaded(true);
          setLastFetchedUid(user.uid);
          return;
        }

        // ENSURE these exact fields are read from Firestore root per requirements
        const profileData = {
          ...profile,
          isBlocked: profile.isBlocked === true,
          isOnHold: profile.isOnHold === true,
          blockReason: profile.blockReason || null,
          isEligibleReceiver: profile.isEligibleReceiver === true,
          receiverEligibleAt: profile.receiverEligibleAt || null,
        };

        // ONE-TIME debug log after profile fetch
        console.log("PROFILE BLOCK FLAGS:", profileData.isBlocked, profileData.isOnHold, profileData.blockReason);

        setUserProfile(profileData);
        setIsProfileLoaded(true);
        setLastFetchedUid(user.uid);

        // Update individual states to match Firestore truth exactly
        const isRestricted = profileData.isBlocked === true || profileData.isOnHold === true;
        setIsBlocked(isRestricted);
        setBlockReason(profileData.blockReason || null);
        setBlockedAt(profileData.blockedAt || null);

      } catch (error) {
        console.error("fetchProfile failed:", error);
        setUserProfile(undefined);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid, lastFetchedUid]);

  // 🔹 Refresh Profile Manually (FORCE SYNC)
  const refreshUserProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    console.log("🔄 AUTH CONTEXT: Manually refreshing profile for " + user.uid);

    try {
      const profile = await getUserProfile(user.uid);
      if (!profile) return null;

      const profileData = {
        ...profile,
        isBlocked: profile.isBlocked === true,
        isOnHold: profile.isOnHold === true,
        blockReason: profile.blockReason || null,
        isEligibleReceiver: profile.isEligibleReceiver === true,
        receiverEligibleAt: profile.receiverEligibleAt || null,
      };

      console.log("PROFILE BLOCK FLAGS (REFRESH):", profileData.isBlocked, profileData.isOnHold, profileData.blockReason);

      setUserProfile(profileData);

      const isRestricted = profileData.isBlocked === true || profileData.isOnHold === true;
      setIsBlocked(isRestricted);
      setBlockReason(profileData.blockReason || null);
      setBlockedAt(profileData.blockedAt || null);

      return profileData;
    } catch (error) {
      console.error("Refresh profile failed:", error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // 🔹 Helpers
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const result = await signInWithEmailPassword(email, password);
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
    setUser,
    userProfile,
    loading: initialAuthLoading,
    profileLoading,
    authLoading,
    isAdmin,
    isBlocked,
    blockReason,
    blockedAt,
    receiveEligibility,
    login,
    logout,
    signup,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};