import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { FaCrown } from 'react-icons/fa';

// Placeholder for profile picture
const placeholderImageUrl = 'https://via.placeholder.com/150';

// Add helper functions for avatar color and initial
const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
];
function getColorFromName(name) {
  if (!name) return avatarColors[0];
  const code = name.charCodeAt(0);
  return avatarColors[code % avatarColors.length];
}
function getInitial(name) {
  return name && name.length > 0 ? name[0].toUpperCase() : 'U';
}

const PodiumCard = ({ user, rank, animationProps }) => {
  const rankStyles = {
    1: { accent: 'border-yellow-400', shadow: 'shadow-yellow-400/50', icon: <FaCrown className="text-yellow-400" /> },
    2: { accent: 'border-gray-400', shadow: 'shadow-gray-400/50', icon: '🥈' },
    3: { accent: 'border-orange-400', shadow: 'shadow-orange-400/50', icon: '🥉' },
  };
  const { accent, shadow, icon } = rankStyles[rank];
  const [imgError, setImgError] = React.useState(false);
  const avatarColor = getColorFromName(user.fullName || user.name);
  const initial = getInitial(user.fullName || user.name);
  return (
    <motion.div {...animationProps} className={`relative flex flex-col items-center p-4 bg-white rounded-2xl shadow-lg ${shadow} border-2 ${accent} ${rank === 1 ? 'md:scale-110' : ''}`}>
      <div className="absolute top-2 right-2 text-2xl">{icon}</div>
      <div className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center overflow-hidden ${imgError || !user.profileUrl ? avatarColor : ''}`}>
        {user.profileUrl && !imgError ? (
          <img
            src={user.profileUrl}
            alt={user.fullName || user.name}
            className="w-24 h-24 object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-4xl font-bold text-white">{initial}</span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-bold text-gray-800">{user.fullName || user.name}</h3>
      <p className="text-sm text-gray-500">{user.userId}</p>
      <p className="mt-2 text-xl font-semibold text-[#4792F1]">
        {user.referralCount.toLocaleString()} <span className="text-sm font-normal">Referrals</span>
      </p>
    </motion.div>
  );
};

const LeaderboardItem = ({ user, rank, animationProps }) => {
  const [imgError, setImgError] = React.useState(false);
  const avatarColor = getColorFromName(user.fullName || user.name);
  const initial = getInitial(user.fullName || user.name);
  return (
    <motion.div {...animationProps} className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
      <span className="text-lg font-bold text-gray-400 w-8">{rank}</span>
      <div className={`w-12 h-12 rounded-full mx-4 flex items-center justify-center overflow-hidden ${imgError || !user.profileUrl ? avatarColor : ''}`}>
        {user.profileUrl && !imgError ? (
          <img
            src={user.profileUrl}
            alt={user.fullName || user.name}
            className="w-12 h-12 object-cover"
            onError={e => { e.target.onerror = null; e.target.src = 'https://freeimage.host/i/F0D8xMN'; setImgError(true); }}
          />
        ) : (
          <img src={'https://freeimage.host/i/F0D8xMN'} alt="Default Profile" className="w-12 h-12 object-cover" />
        )}
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{user.fullName || user.name}</p>
        <p className="text-xs text-gray-500">{user.userId}</p>
      </div>
      <span className="font-semibold text-gray-700">{user.referralCount.toLocaleString()}</span>
    </motion.div>
  );
};

const LevelLeaderboard = () => {
  const { userProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile?.level) {
      setLoading(false);
      setError('Could not determine your current level.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch top 100
        const q = query(
          collection(db, "leaderboard"),
          where("level", "==", userProfile.level),
          orderBy("referralCount", "desc"),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        const top100 = querySnapshot.docs.map((doc, index) => ({ id: doc.id, rank: index + 1, ...doc.data() }));
        setLeaderboard(top100);

        // Fetch current user's rank
        const rankQuery = query(
          collection(db, "leaderboard"),
          where("level", "==", userProfile.level),
          where("referralCount", ">", userProfile.referralCount || 0)
        );
        const rankSnapshot = await getCountFromServer(rankQuery);
        const rank = rankSnapshot.data().count + 1;

        setCurrentUserData({ ...userProfile, rank });

      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const podium = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  if (loading) return <div className="text-center p-10">Loading Leaderboard...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="bg-[#f4f7fe] min-h-screen p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="bg-[#4792F1] text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">
          {userProfile.level}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-2">
          LEADERBOARD
        </h1>
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-end mb-12">
          {podium.find(u => u.rank === 2) && <PodiumCard user={podium.find(u => u.rank === 2)} rank={2} animationProps={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 } }} />}
          {podium.find(u => u.rank === 1) && <div className="md:order-first"><PodiumCard user={podium.find(u => u.rank === 1)} rank={1} animationProps={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0 } }} /></div>}
          {podium.find(u => u.rank === 3) && <PodiumCard user={podium.find(u => u.rank === 3)} rank={3} animationProps={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 } }} />}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2 max-w-4xl mx-auto">
        {others.map((user) => (
          <LeaderboardItem key={user.id} user={user} rank={user.rank} animationProps={{ initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 } }} />
        ))}
      </div>

      {/* Current User's Rank */}
      {currentUserData && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="sticky bottom-4 max-w-4xl mx-auto mt-8"
        >
          <div className="flex items-center p-4 bg-[#E0F7FA] rounded-lg shadow-xl border-2 border-cyan-500">
            <span className="text-xl font-bold text-gray-700 w-10">{currentUserData.rank}</span>
            <div className={`w-14 h-14 rounded-full mx-4 flex items-center justify-center overflow-hidden ${!currentUserData.profileUrl ? getColorFromName(currentUserData.name) : ''}`}>
              {currentUserData.profileUrl ? (
                <img
                  src={currentUserData.profileUrl}
                  alt={currentUserData.fullName || currentUserData.name}
                  className="w-14 h-14 object-cover"
                  onError={e => { e.target.onerror = null; e.target.parentNode.innerHTML = `<span class='text-2xl font-bold text-white'>${getInitial(currentUserData.fullName || currentUserData.name)}</span>`; }}
                />
              ) : (
                <span className="text-2xl font-bold text-white">{getInitial(currentUserData.fullName || currentUserData.name)}</span>
              )}
            </div>
            <div className="flex-grow">
              <p className="font-bold text-lg text-gray-900">{currentUserData.fullName || currentUserData.name} (You)</p>
              <p className="text-sm text-gray-600">{currentUserData.userId}</p>
            </div>
            <span className="text-lg font-bold text-cyan-700">{currentUserData.referralCount.toLocaleString()}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LevelLeaderboard; 