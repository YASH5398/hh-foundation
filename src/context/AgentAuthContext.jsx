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
  const { user, isAdmin: globalIsAdmin, logout: authLogout } = useAuth();
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

  // Sync with AuthContext and verify agent role
  useEffect(() => {
    let isMounted = true;

    const syncAndVerify = async () => {
      // 1. If no root user, cleanup and stop loading
      if (!user) {
        if (isMounted) {
          setCurrentUser(null);
          setIsAgent(false);
          setLoading(false);
        }
        return;
      }

      // 2. We have a user, perform agent verify before stopping loading
      try {
        const isAgentUser = await checkAgentRole(user);
        if (isMounted) {
          setIsAgent(isAgentUser);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('🔍 AGENT AUTH: Error verifying agent role:', error);
        if (isMounted) setIsAgent(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncAndVerify();
    return () => { isMounted = false; };
  }, [user]);

  const value = {
    currentUser,
    isAgent,
    isAdmin: globalIsAdmin,
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