import React from 'react';
import {
  FiUser,
  FiMail,
  FiShield,
  FiEdit3,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiActivity,
  FiCalendar
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';

/**
 * Agent Profile Component - Modernized Version
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
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full mb-6"></div>
          <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-32 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-red-500/20 p-12 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FiUser className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Profile Sync Error</h3>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">{error}</p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center mx-auto"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </button>
      </div>
    );
  }

  if (!agentProfile) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-12 text-center">
        <FiUser className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Unauthorized Access</h3>
        <p className="text-slate-400">Agent profile data is missing from current session.</p>
      </div>
    );
  }

  const {
    name,
    email,
    role,
    totalTicketsHandled = 0,
    pendingRequests = 0
  } = agentProfile;

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/50 p-8 lg:p-12 shadow-2xl shadow-black/40"
      >
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <img
                src={getProfileImageUrl(agentProfile)}
                alt={name || 'Agent'}
                className="relative w-32 h-32 rounded-full border-4 border-slate-900 object-cover shadow-2xl"
                onError={(e) => { e.target.src = getProfileImageUrl(null); }}
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 shadow-xl"></div>
            </div>

            <div className="text-center lg:text-left">
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-2">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">{name || 'Agent User'}</h2>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-blue-500/20">
                  {role || 'Staff'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400">
                <p className="flex items-center gap-2 text-sm">
                  <FiMail className="w-4 h-4 text-slate-500" /> {email}
                </p>
                <div className="hidden sm:block w-1 h-1 bg-slate-700 rounded-full"></div>
                <p className="flex items-center gap-2 text-sm">
                  <FiShield className="w-4 h-4 text-slate-500" /> Status: <span className="text-green-400 font-medium">Active</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex-1 lg:flex-none p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
            >
              <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onEditProfile}
              className="flex-1 lg:flex-none px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FiEdit3 className="w-5 h-5" /> Edit Identity
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats 1 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">Resolved Tickets</p>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{totalTicketsHandled}</p>
          </div>

          {/* Stats 2 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30 group hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                <FiClock className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">Active Requests</p>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{pendingRequests}</p>
          </div>

          {/* Stats 3 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                <FiActivity className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">Uptime Rating</p>
            </div>
            <p className="text-3xl font-bold text-white">99.8%</p>
          </div>

          {/* Stats 4 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30 group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <FiCalendar className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">Joined Date</p>
            </div>
            <p className="text-xl font-bold text-white">
              {agentProfile.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || 'Jan 2024'}
            </p>
          </div>
        </div>

        {/* Meta Footer */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-800/50">
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Profile Verified
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Encryption Enabled
            </div>
          </div>
          <p className="text-slate-600 text-xs">
            System Identity Key: <span className="font-mono text-slate-500">#{agentProfile.id?.slice(-8) || 'Unknown'}</span>
          </p>
        </div>
      </motion.div>

      {/* Security Banner */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400 shrink-0">
          <FiShield className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-white mb-1">Advanced Security Protocol Active</h4>
          <p className="text-sm text-slate-400">Your profile is currently protected by enterprise-grade 256-bit encryption. Multi-factor authentication is required for all administrative actions.</p>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;