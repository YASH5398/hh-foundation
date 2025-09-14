import { useState, useEffect } from 'react';
import { useAgentAuth } from '../context/AgentAuthContext';
import { agentService } from '../services/agentService';

/**
 * Custom hook for managing agent profile data
 * @returns {Object} Agent profile state and methods
 */
export const useAgentProfile = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser;
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch agent profile data
   */
  const fetchAgentProfile = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const profileData = await agentService.getAgentProfile(user.uid);
      
      if (profileData) {
        setAgentProfile(profileData);
      } else {
        setError('Agent profile not found');
      }
    } catch (err) {
      console.error('Error fetching agent profile:', err);
      setError(err.message || 'Failed to fetch agent profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh agent profile data
   */
  const refreshProfile = async () => {
    setRefreshing(true);
    await fetchAgentProfile();
  };

  /**
   * Update local profile data (for optimistic updates)
   * @param {Object} updates - Profile updates
   */
  const updateLocalProfile = (updates) => {
    setAgentProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchAgentProfile();
  }, [user?.uid]);

  return {
    profile: agentProfile,
    loading,
    error,
    refreshing,
    refreshProfile,
    updateLocalProfile,
    refetch: fetchAgentProfile
  };
};

export default useAgentProfile;