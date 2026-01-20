import React, { createContext, useContext, useState, useEffect } from 'react';
import {
<<<<<<< HEAD
  signOut,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { signInWithEmailPassword, signOutUser, checkAgentRole, getAuthErrorMessage } from '../utils/authUtils';
import { useAuth } from './AuthContext';
=======
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth, db, doc, getDoc } from '../config/firebase';
import { toast } from 'react-hot-toast';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const AgentAuthContext = createContext();

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

export const AgentAuthProvider = ({ children }) => {
<<<<<<< HEAD
  const { user, logout: authLogout } = useAuth();
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Firebase configuration diagnostic
  const checkFirebaseConfig = () => {
    const config = auth.app.options;
    console.log('🔧 Firebase Configuration Check:');
    console.log('- Project ID:', config.projectId);
    console.log('- Auth Domain:', config.authDomain);
    console.log('- API Key exists:', !!config.apiKey);
    console.log('- Phone Auth Available:', typeof signInWithPhoneNumber === 'function');

    return {
      projectId: config.projectId,
      authDomain: config.authDomain,
      hasApiKey: !!config.apiKey,
      phoneAuthAvailable: typeof signInWithPhoneNumber === 'function'
    };
  };

<<<<<<< HEAD
  // Email/Password login
  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailPassword(email, password);
      if (!result.success) {
        throw new Error(getAuthErrorMessage(result.errorCode));
      }

      const isAgentUser = await checkAgentRole(result.user);
      if (!isAgentUser) {
        await signOutUser();
        throw new Error('Access denied. Only agents can access this portal.');
      }

=======
  // Check if user is an agent
  const checkAgentRole = async (user) => {
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

  // Email/Password login
  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const isAgentUser = await checkAgentRole(result.user);
      
      if (!isAgentUser) {
        await signOut(auth);
        throw new Error('Access denied. Only agents can access this portal.');
      }
      
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      return result.user;
    } catch (error) {
      throw error;
    }
  };


  // Send OTP to phone
  const sendOTP = async (phoneNumber, recaptchaVerifier) => {
    // Validate phone number format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number');
    }

    // Ensure recaptchaVerifier is provided
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier required');
    }

    // Send OTP using Firebase v9 syntax
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    return confirmationResult;
  };

  // Verify OTP
  const verifyOTP = async (confirmationResult, otp, tempUser) => {
    // Verify OTP using Firebase v9 syntax
    const result = await confirmationResult.confirm(otp);

    // Verify phone number belongs to the same user
    if (tempUser && result.user.uid !== tempUser.uid) {
      await signOut(auth);
      throw new Error('Phone number is associated with a different account');
    }

    // Check agent role
    const isAgentUser = await checkAgentRole(result.user);
    if (!isAgentUser) {
      await signOut(auth);
      throw new Error('Access denied. Only agents can access this portal.');
    }

    setOtpVerified(true);
    return result.user;
  };

  // Logout
  const logout = async () => {
<<<<<<< HEAD
    console.log("🔍 AGENT AUTH: Agent logout called, using AuthContext logout");
    await authLogout(); // Use AuthContext logout
    setIsAgent(false);
    setOtpVerified(false);
    console.log("🔍 AGENT AUTH: Agent logout completed");
  };

  // Sync with AuthContext user state
  useEffect(() => {
    console.log("🔍 AGENT AUTH: User changed -", {
      user: !!user,
      uid: user?.uid,
      currentUser: !!currentUser
    });
    setCurrentUser(user);
    setLoading(false);
  }, [user]);

  // Check agent role after user is available
  useEffect(() => {
    if (!currentUser) {
      console.log("🔍 AGENT AUTH: No currentUser, setting isAgent to false");
=======
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAgent(false);
      setOtpVerified(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check agent role after auth is established
  useEffect(() => {
    if (!currentUser) {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      setIsAgent(false);
      return;
    }

<<<<<<< HEAD
    console.log("🔍 AGENT AUTH: Checking agent role for user:", currentUser.uid);

    const checkAndSetAgent = async () => {
      try {
        const isAgentUser = await checkAgentRole(currentUser);
        console.log("🔍 AGENT AUTH: Agent check result:", isAgentUser);
        setIsAgent(isAgentUser);
      } catch (error) {
        console.error('🔍 AGENT AUTH: Error checking agent role:', error);
        setIsAgent(false);
=======
    const checkAndSetAgent = async () => {
      const isAgentUser = await checkAgentRole(currentUser);
      if (isAgentUser) {
        setIsAgent(true);
      } else {
        setIsAgent(false);
        await signOut(auth);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      }
    };

    checkAndSetAgent();
  }, [currentUser]);

  const value = {
    currentUser,
    isAgent,
    loading,
    otpVerified,
    loginWithEmail,
    sendOTP,
    verifyOTP,
    logout,
    checkFirebaseConfig
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};