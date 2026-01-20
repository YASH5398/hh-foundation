import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiShield, 
  FiEdit3, 
  FiCheckCircle, 
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';

/**
 * Agent Profile Component
 * Displays agent information, statistics, and profile management options
 */
const AgentProfile = ({ 
  agentProfile, 
  loading, 
  error, 
  refreshing, 
  onRefresh, 
  onEditProfile 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <FiUser className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!agentProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <FiUser className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Found</h3>
          <p className="text-gray-600">Agent profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  const {
    name,
    email,
    role,
    profilePicture,
    totalTicketsHandled = 0,
    pendingRequests = 0
  } = agentProfile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Agent Profile</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Refresh Profile"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onEditProfile}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiEdit3 className="w-3 h-3 mr-1" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <img
            src={getProfileImageUrl(agentProfile)}
            alt={name || 'Agent'}
            className={`${PROFILE_IMAGE_CLASSES.large} border-2 border-gray-200`}
            onError={(e) => {
              e.target.src = getProfileImageUrl(null);
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {name || 'Unknown Agent'}
          </h3>
          <div className="flex items-center text-gray-600 mt-1">
            <FiMail className="w-4 h-4 mr-2" />
            <span className="text-sm">{email || 'No email provided'}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <FiShield className="w-4 h-4 mr-2" />
            <span className="text-sm capitalize">{role || 'agent'}</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Tickets Handled */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Tickets Handled</p>
              <p className="text-2xl font-bold text-green-900">{totalTicketsHandled}</p>
            </div>
            <div className="p-2 bg-green-200 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </motion.div>

        {/* Pending Requests */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingRequests}</p>
            </div>
            <div className="p-2 bg-yellow-200 rounded-lg">
              <FiClock className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Status</p>
              <p className="text-lg font-semibold text-blue-900">Active</p>
            </div>
            <div className="p-2 bg-blue-200 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Member Since:</span>
            <span className="ml-2">
              {agentProfile.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="font-medium">Last Active:</span>
            <span className="ml-2">
              {agentProfile.lastLoginAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentProfile;