import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiCalendar, FiStar, FiCheckCircle, FiClock, FiXCircle, FiCreditCard } from 'react-icons/fi';
import { formatDate } from '../../utils/formatDate';

const UserProfileCard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser || !currentUser.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        } else {
          setError('User data not found.');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);


  const getStatusConfig = (userData) => {
    if (userData?.isActivated) {
      return {
        icon: FiCheckCircle,
        text: 'Active',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        dotColor: 'bg-emerald-400',
        pulse: false
      };
    } else if (userData?.status === 'blocked') {
      return {
        icon: FiXCircle,
        text: 'Blocked',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        dotColor: 'bg-red-400',
        pulse: false
      };
    } else {
      return {
        icon: FiClock,
        text: 'Pending',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        dotColor: 'bg-yellow-400',
        pulse: true
      };
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center items-center p-6 sm:p-8"
      >
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-300 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-300 rounded w-3/4"></div>
              <div className="h-4 bg-slate-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center p-6 sm:p-8"
      >
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <FiXCircle className="text-red-500 text-xl" />
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!userData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center p-6 sm:p-8"
      >
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <FiUser className="text-gray-400 text-xl" />
            <div className="text-gray-600 font-medium">No user profile data available.</div>
          </div>
        </div>
      </motion.div>
    );
  }

  const statusConfig = getStatusConfig(userData);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden mx-auto max-w-5xl"
    >
      {/* Enhanced Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-xl" />
      
      {/* Subtle animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-600/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-3">User Profile</h2>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full mx-auto shadow-lg" />
        </motion.div>

        {/* Mobile Layout: 2 fields per row */}
        <div className="block sm:hidden space-y-5">
          {/* Row 1: User ID & Name */}
          <div className="grid grid-cols-2 gap-4">
            {/* User ID */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-xl mr-2 shadow-lg">
                    <FiCreditCard className="text-white text-sm" />
                  </div>
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider">ID</p>
                </div>
                <p className="font-mono font-bold text-cyan-300 text-xs break-all leading-tight">
                  {userData.userId || 'N/A'}
                </p>
              </div>
            </motion.div>

            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-md rounded-xl mr-2 shadow-lg">
                    <FiUser className="text-white text-sm" />
                  </div>
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Name</p>
                </div>
                <p className="font-bold text-white text-sm leading-tight">
                  {userData.fullName || 'N/A'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Joining Date & Level */}
          <div className="grid grid-cols-2 gap-4">
            {/* Joining Date */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-md rounded-xl mr-2 shadow-lg">
                    <FiCalendar className="text-white text-sm" />
                  </div>
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Joined</p>
                </div>
                <p className="font-semibold text-orange-300 text-xs leading-tight">
                  {formatDate(userData.registrationTime || userData.createdAt, { format: 'long' })}
                </p>
              </div>
            </motion.div>

            {/* Level */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-xl mr-2 shadow-lg">
                    <FiStar className="text-white text-sm" />
                  </div>
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Level</p>
                </div>
                <p className="font-bold text-yellow-300 text-sm leading-tight">
                  {userData.levelStatus || 'N/A'}
                  {userData.level && (
                    <span className="text-xs text-yellow-200 ml-1">({userData.level})</span>
                  )}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Row 3: Status (full width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative ${statusConfig.bgColor} backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 ${statusConfig.bgColor} rounded-lg mr-3`}>
                  <StatusIcon className={`${statusConfig.color} text-lg`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/90 uppercase tracking-wide mb-1">Status</p>
                  <p className={`font-bold text-sm ${statusConfig.color}`}>{statusConfig.text}</p>
                </div>
              </div>
              <div className="flex items-center">
                <motion.div
                  className={`w-3 h-3 ${statusConfig.dotColor} rounded-full`}
                  animate={statusConfig.pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
                  transition={statusConfig.pulse ? { duration: 2, repeat: Infinity } : {}}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Layout: Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User ID */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white/8 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FiCreditCard className="text-white text-xl" />
                </div>
                <p className="text-sm font-bold text-white/90 uppercase tracking-wider ml-3">User ID</p>
              </div>
              <p className="font-mono font-bold text-cyan-300 text-lg break-all">
                {userData.userId || 'N/A'}
              </p>
              <p className="text-xs text-white/70 mt-2">Unique identifier</p>
            </div>
          </motion.div>

          {/* Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white/8 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-md rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FiUser className="text-white text-xl" />
                </div>
                <p className="text-sm font-bold text-white/90 uppercase tracking-wider ml-3">Name</p>
              </div>
              <p className="font-bold text-white text-lg">
                {userData.fullName || 'N/A'}
              </p>
              <p className="text-xs text-white/70 mt-2">Full name</p>
            </div>
          </motion.div>

          {/* Joining Date */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white/8 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-md rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FiCalendar className="text-white text-xl" />
                </div>
                <p className="text-sm font-bold text-white/90 uppercase tracking-wider ml-3">Joined</p>
              </div>
              <p className="font-semibold text-orange-300 text-lg">
                {formatDate(userData.registrationTime || userData.createdAt)}
              </p>
              <p className="text-xs text-white/70 mt-2">Registration date</p>
            </div>
          </motion.div>

          {/* Level */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white/8 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FiStar className="text-white text-xl" />
                </div>
                <p className="text-sm font-bold text-white/90 uppercase tracking-wider ml-3">Level</p>
              </div>
              <p className="font-bold text-yellow-300 text-lg">
                {userData.levelStatus || 'N/A'}
              </p>
              {userData.level && (
                <p className="text-sm text-yellow-200 mt-1">Level {userData.level}</p>
              )}
              <p className="text-xs text-white/70 mt-2">Current rank</p>
            </div>
          </motion.div>
        </div>

        {/* Status Section (Desktop - Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`hidden sm:block group relative ${statusConfig.bgColor} backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden mt-6`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-4 ${statusConfig.bgColor} backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <StatusIcon className={`${statusConfig.color} text-2xl`} />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-1">Account Status</p>
                <p className={`font-bold text-2xl ${statusConfig.color}`}>{statusConfig.text}</p>
                <p className="text-xs text-white/70 mt-1">
                  {statusConfig.text === 'Active' ? 'Account is fully activated' : 
                   statusConfig.text === 'Blocked' ? 'Account access restricted' : 
                   'Awaiting activation'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <motion.div
                className={`w-4 h-4 ${statusConfig.dotColor} rounded-full shadow-lg`}
                animate={statusConfig.pulse ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                transition={statusConfig.pulse ? { duration: 2, repeat: Infinity } : {}}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserProfileCard;