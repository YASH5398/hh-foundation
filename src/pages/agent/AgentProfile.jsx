import React from 'react';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import AgentProfileComponent from '../../components/agent/AgentProfile';
import { toast } from 'react-hot-toast';

/**
 * Agent Profile Page
 * Displays the agent's profile information with data fetching
 */
const AgentProfile = () => {
  const { profile, loading, error, refreshProfile } = useAgentProfile();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Profile refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile or open modal
    toast.info('Edit profile functionality coming soon');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Profile</h1>
        <p className="text-gray-600 mt-1">Manage your agent profile and settings</p>
      </div>
      
      <AgentProfileComponent
        agentProfile={profile}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEditProfile={handleEditProfile}
      />
    </div>
  );
};

export default AgentProfile;