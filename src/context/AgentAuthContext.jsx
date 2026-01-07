import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth, db, doc, getDoc } from '../config/firebase';
import { toast } from 'react-hot-toast';

const AgentAuthContext = createContext();

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

export const AgentAuthProvider = ({ children }) => {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAgentUser = await checkAgentRole(user);
        if (isAgentUser) {
          setCurrentUser(user);
          setIsAgent(true);
        } else {
          setCurrentUser(null);
          setIsAgent(false);
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setIsAgent(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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