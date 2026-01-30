import React, { useState } from 'react';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import AgentProfileComponent from '../../components/agent/AgentProfile';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiUser, FiSettings } from 'react-icons/fi';

/**
 * Agent Profile Page
 * Displays the agent's profile information with data fetching
 * Modernized with Dark Theme & Glassmorphism
 */
const AgentProfile = () => {
  const { profile, loading, error, refreshProfile } = useAgentProfile();
  const [refreshing, setRefreshing] = useState(false);

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
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-blue-600/10 rounded-xl border border-blue-600/20">
              <FiUser className="w-5 h-5 text-blue-400" />
            </span>
            Agent Identity
          </h1>
          <p className="text-slate-400 mt-1 ml-1 text-sm font-medium">Manage your security clearance and personal data</p>
        </div>
      </motion.div>

      {/* Main Profile Component */}
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