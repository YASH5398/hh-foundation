import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  handleNewUserRegistration, 
  autoAssignSendHelpOnFirstVisit, 
  confirmPaymentReceived,
  debugAllPendingAssignments 
} from '../services/sendHelpService';

export const useMLMActivation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userState, setUserState] = useState(null);

  // Get current user's MLM state
  const getUserState = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      // Note: debugMLMState function was removed - implement custom debug logic if needed
      console.log('Debug function removed - implement custom logic if needed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register new user with MLM system
  const registerNewUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await handleNewUserRegistration(userData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign send help when user first visits Send Help section
  const assignSendHelp = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await autoAssignSendHelpOnFirstVisit(user.uid);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment received (for receivers)
  const confirmPayment = async (docId) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await confirmPaymentReceived(docId, user.uid);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Debug functions for admin/development
  const debugCurrentUser = async () => {
    if (!user?.uid) return;
    await getUserState();
  };

  const debugAllAssignments = async () => {
    try {
      setLoading(true);
      await debugAllPendingAssignments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign send help when component mounts if user is not activated
  useEffect(() => {
    if (user?.uid && userState?.isActivated === false) {
      // This could be called when user first visits Send Help section
      // For now, we'll just get the user state
      getUserState();
    }
  }, [user?.uid]);

  return {
    loading,
    error,
    userState,
    registerNewUser,
    assignSendHelp,
    confirmPayment,
    debugCurrentUser,
    debugAllAssignments,
    getUserState
  };
}; 