import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { signInWithEmailPassword, signOutUser, checkAgentRole, getAuthErrorMessage } from '../utils/authUtils';
import { useAuth } from './AuthContext';

const AgentAuthContext = createContext();

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

export const AgentAuthProvider = ({ children }) => {
  const { user, logout: authLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);

  // Firebase configuration diagnostic
  const checkFirebaseConfig = () => {
    const config = auth.app.options;
    console.log('🔧 Firebase Configuration Check:');
    console.log('- Project ID:', config.projectId);
    console.log('- Auth Domain:', config.authDomain);
    console.log('- API Key exists:', !!config.apiKey);

    return {
      projectId: config.projectId,
      authDomain: config.authDomain,
      hasApiKey: !!config.apiKey
    };
  };

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

      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Send Verification Email
  const sendVerificationEmail = async (user) => {
    if (!user) throw new Error('No user provided');

    // Continue URL: Navigate back to agent login after email link click
    const actionCodeSettings = {
      url: window.location.origin + '/agent-login',
      handleCodeInApp: true,
    };

    try {
      await sendEmailVerification(user, actionCodeSettings);
      toast.success('Verification email sent!');
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait before asking for another email.');
      }
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    console.log("🔍 AGENT AUTH: Agent logout called, using AuthContext logout");
    await authLogout(); // Use AuthContext logout
    setIsAgent(false);
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
      setIsAgent(false);
      return;
    }

    console.log("🔍 AGENT AUTH: Checking agent role for user:", currentUser.uid);

    const checkAndSetAgent = async () => {
      try {
        const isAgentUser = await checkAgentRole(currentUser);
        console.log("🔍 AGENT AUTH: Agent check result:", isAgentUser);
        setIsAgent(isAgentUser);
      } catch (error) {
        console.error('🔍 AGENT AUTH: Error checking agent role:', error);
        setIsAgent(false);
      }
    };

    checkAndSetAgent();
  }, [currentUser]);

  const value = {
    currentUser,
    isAgent,
    loading,
    loginWithEmail,
    sendVerificationEmail,
    logout,
    checkFirebaseConfig
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};