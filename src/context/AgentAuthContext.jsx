import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
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

  // Setup reCAPTCHA for phone verification
  const setupRecaptcha = (containerId) => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
      
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  };

  // Send OTP to phone
  const sendOTP = async (phoneNumber) => {
    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  // Verify OTP and complete login
  const verifyOTP = async (confirmationResult, otp, tempUser) => {
    try {
      const result = await confirmationResult.confirm(otp);
      
      // Link the phone credential with the email user
      if (tempUser && result.user.uid !== tempUser.uid) {
        // If phone number belongs to different user, we need to handle this
        await signOut(auth);
        throw new Error('Phone number is associated with a different account');
      }
      
      const isAgentUser = await checkAgentRole(result.user);
      if (!isAgentUser) {
        await signOut(auth);
        throw new Error('Access denied. Only agents can access this portal.');
      }
      
      setOtpVerified(true);
      return result.user;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
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
    setupRecaptcha
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};