import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';
import '../../index.css';

const getInitial = (name) => (name && name.length > 0 ? name[0].toUpperCase() : '?');

// Helper to show only first two words of a name
const getDisplayName = (name) => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? words.slice(0, 2).join(' ') : name;
};

// Function to calculate total earnings from receiveHelp collection
const calculateTotalEarnings = (receiveHelps) => {
  return receiveHelps
    .filter(help => help.status === 'success' || help.confirmedByReceiver)
    .reduce((total, help) => total + (help.amount || 300), 0);
};

const PodiumCard = ({ user, rank, earnings }) => {
  const podiumConfig = {
    1: {
      size: 'w-32 h-32 text-6xl',
      height: 'h-48',
      glow: 'shadow-[0_0_40px_8px_rgba(251,191,36,0.4)]',
      border: 'border-4 border-yellow-400',
      bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      textColor: 'text-yellow-800',
      crown: '👑',
      delay: 0.1
    },
    2: {
      size: 'w-24 h-24 text-4xl',
      height: 'h-40',
      glow: 'shadow-[0_0_20px_4px_rgba(192,192,192,0.3)]',
      border: 'border-3 border-gray-400',
      bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
      textColor: 'text-gray-700',
      crown: '🥈',
      delay: 0.2
    },
    3: {
      size: 'w-20 h-20 text-3xl',
      height: 'h-36',
      glow: 'shadow-[0_0_16px_3px_rgba(205,127,50,0.3)]',
      border: 'border-3 border-orange-500',
      bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      textColor: 'text-orange-800',
      crown: '🥉',
      delay: 0.3
    }
  };

  const config = podiumConfig[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: config.delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className={`flex flex-col items-center ${config.height} justify-end`}
    >
      {/* Crown */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: config.delay + 0.3 }}
        className="text-4xl mb-2"
      >
        {config.crown}
      </motion.div>

      {/* Profile Image/Initial */}
      <div className={`${config.size} ${config.border} ${config.glow} rounded-full flex items-center justify-center mb-3 relative overflow-hidden`}>
      <img
        src={getProfileImageUrl(user)}
        alt={user.fullName}
        className={`w-full h-full ${PROFILE_IMAGE_CLASSES.base}`}
        onError={(e) => {
          e.target.src = getProfileImageUrl(null); // Fallback to default
        }}
      />
      </div>

      {/* User Info */}
      <div className="text-center mb-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: config.delay + 0.4 }}
          className="font-bold text-gray-900 text-lg leading-tight"
        >
          {getDisplayName(user.fullName) || 'Unknown User'}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: config.delay + 0.5 }}
          className="text-sm text-gray-600 font-mono"
        >
          {user.userId}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: config.delay + 0.6 }}
          className="text-sm text-blue-600 font-semibold mt-1"
        >
          {user.referralCount || 0} referrals
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: config.delay + 0.7 }}
          className="text-sm text-green-600 font-bold mt-1"
        >
          ₹{earnings.toLocaleString()}
        </motion.div>
      </div>

      {/* Rank Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: config.delay + 0.8, type: "spring" }}
        className={`${config.bg} ${config.textColor} px-3 py-1 rounded-full text-sm font-bold shadow-lg`}
      >
        Rank #{rank}
      </motion.div>
    </motion.div>
  );
};

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [userEarnings, setUserEarnings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // BLOCKER: No Firestore call without auth.currentUser
    if (!auth.currentUser) {
      console.log("Leaderboard: No auth.currentUser - skipping fetch");
      setLoading(false);
      setError("Please log in to view leaderboard");
      return;
    }

    async function fetchLeaderboard() {
      console.log("Leaderboard fetch start");
      setLoading(true);
      setError(false);

      try {
        // Try ordered query first, fallback to unordered if index missing
        let data = [];
        try {
          const q = query(
            collection(db, 'users'),
            orderBy("totalEarnings", "desc"),
            limit(100)
          );
          const snapshot = await getDocs(q);
          data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexError) {
          console.warn("Index not available, fetching all users and sorting client-side:", indexError);
          // Fallback: fetch all users and sort client-side
          const q = query(collection(db, 'users'));
          const snapshot = await getDocs(q);
          const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Sort by totalEarnings and take top 100
          data = allUsers
            .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
            .slice(0, 100);
        }

        console.log("Leaderboard fetched users:", data.length);

        setUsers(data);

        // Use totalEarnings from user data directly
        const earningsMap = {};
        data.forEach(user => {
          earningsMap[user.id] = user.totalEarnings || 0;
        });

        setUserEarnings(earningsMap);

      } catch (e) {
        console.error("Leaderboard fetch error:", e);
        if (e.code === 'permission-denied') {
          setError("You don't have permission to view the leaderboard. Please contact support.");
        } else {
          setError("Failed to load leaderboard. Please try again.");
        }
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const podium = users.slice(0, 3);
  const rest = users.slice(3, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-white flex flex-col items-center px-2 pt-4 sm:pt-8">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Leaderboard</h1>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-white flex flex-col items-center px-2 pt-4 sm:pt-8">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Leaderboard</h1>
        <div className="flex justify-center items-center min-h-[30vh]">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl flex items-center gap-2">
            <span className="text-3xl">❌</span>
            <span className="font-bold">Failed to load leaderboard. Please try again later.</span>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-white flex flex-col items-center px-2 pt-4 sm:pt-8">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Leaderboard</h1>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Users Yet</h2>
            <p className="text-gray-600">The leaderboard will appear once users start participating.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-white flex flex-col items-center px-2 pt-4 sm:pt-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold text-center text-blue-900 mb-8"
      >
        🏆 Leaderboard
      </motion.h1>

      {/* 3D Podium Layout */}
      <div className="w-full max-w-6xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-row items-end justify-center gap-4 md:gap-8 px-4"
        >
            {/* 2nd Place (left) */}
          <div className="flex-1 flex justify-center">
            {podium[1] && (
              <PodiumCard 
                user={podium[1]} 
                rank={2} 
                earnings={userEarnings[podium[1].id] || 0}
              />
            )}
            </div>

          {/* 1st Place (center, elevated) */}
          <div className="flex-1 flex justify-center">
            {podium[0] && (
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: -20 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <PodiumCard 
                  user={podium[0]} 
                  rank={1} 
                  earnings={userEarnings[podium[0].id] || 0}
                />
              </motion.div>
            )}
            </div>

            {/* 3rd Place (right) */}
          <div className="flex-1 flex justify-center">
            {podium[2] && (
              <PodiumCard 
                user={podium[2]} 
                rank={3} 
                earnings={userEarnings[podium[2].id] || 0}
              />
            )}
          </div>
        </motion.div>
      </div>

          {/* Remaining users (4-100) */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-2xl font-bold text-gray-800 mb-6 text-center"
        >
          Top Performers
        </motion.h2>
        
            <AnimatePresence>
              {rest.map((user, idx) => (
                <motion.div
                  key={user.id}
              className="bg-white shadow-lg hover:shadow-xl border-l-4 border-blue-400 rounded-xl p-4 mb-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, delay: (idx * 0.05) + 1.2 }}
              whileHover={{ 
                x: 5,
                transition: { duration: 0.2 }
              }}
            >
              {/* Rank and Profile */}
              <div className="flex items-center gap-4">
                <span className="text-blue-500 font-bold text-base w-10 text-center">
                  #{idx + 4}
                </span>
                {/* Profile Image */}
                <div className={`${PROFILE_IMAGE_CLASSES.small} border-2 border-blue-200 shadow-md`}>
                  <img
                    src={getProfileImageUrl(user)}
                    alt={user.fullName}
                    className={`w-full h-full ${PROFILE_IMAGE_CLASSES.base}`}
                    onError={(e) => {
                      e.target.src = getProfileImageUrl(null); // Fallback to default
                    }}
                  />
                </div>
                {/* User Info */}
                  <div className="flex-1 min-w-0">
                  <div className="text-gray-800 font-semibold text-base truncate">
                    {getDisplayName(user.fullName) || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {user.userId}
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Referrals</div>
                  <div className="text-base font-bold text-blue-600">
                    {user.referralCount || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Earnings</div>
                  <div className="text-base font-bold text-green-600">
                    ₹{(userEarnings[user.id] || 0).toLocaleString()}
                  </div>
                </div>
              </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
    </div>
  );
};

export default Leaderboard;