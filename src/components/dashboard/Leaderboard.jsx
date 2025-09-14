import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Award } from 'lucide-react';
import defaultProfile from '../../public/images/default-profile.png';

const medalColors = [
  'bg-yellow-400 text-yellow-900', // Gold
  'bg-gray-300 text-gray-800',    // Silver
  'bg-orange-400 text-orange-900' // Bronze
];
const medalEmojis = ['🥇', '🥈', '🥉'];

function formatCurrency(amount) {
  if (typeof amount !== 'number') return '-';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function PodiumProfile({ user, rank }) {
  const size = rank === 1 ? 'w-20 h-20 sm:w-28 sm:h-28 text-2xl sm:text-5xl' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl';
  const glow = rank === 1 ? 'animate-pulse shadow-[0_0_32px_4px_rgba(251,191,36,0.3)]' : '';
  const medal = medalEmojis[rank - 1];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: rank * 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="mb-1 text-2xl sm:text-3xl">{medal}</div>
      {user.profileImage ? (
        <img
          src={user.profileImage}
          alt={user.fullName}
          className={`rounded-full object-cover border-4 border-white ${size} ${glow} bg-[#232345]`}
        />
      ) : (
        <div className={`flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-full ${size} ${glow}`}>{user.fullName?.[0]?.toUpperCase() || '?'}</div>
      )}
      <div className="flex flex-col items-center mt-2">
        <span className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight text-center">{user.fullName}</span>
        <span className="text-xs sm:text-sm text-gray-500 font-mono text-center">{user.userId}</span>
        <span className="flex items-center gap-1 text-gray-500 text-xs mt-1"><Users className="w-3 h-3 sm:w-4 sm:h-4" />Referrals: {user.referralCount ?? 0}</span>
        <span className="text-xs text-gray-700 mt-1">{formatCurrency(user.totalEarnings)}</span>
        <span className="text-xs text-gray-400 mt-1">{user.levelStatus || user.level || 'N/A'}</span>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(db, 'users'));
        let userList = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            referralCount: typeof data.referralCount === 'number' ? data.referralCount : 0,
            totalEarnings: typeof data.totalEarnings === 'number' ? data.totalEarnings : 0
          };
        });
        userList.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
        setUsers(userList);
      } catch (e) {
        setError('Failed to load leaderboard.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Leaderboard</h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin mb-2"></div>
          <div className="text-base sm:text-lg font-semibold text-gray-500">Loading...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mb-2" />
          <div className="text-base sm:text-lg font-semibold text-red-500">{error}</div>
        </div>
      ) : !users.length ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mb-2" />
          <div className="text-base sm:text-lg font-semibold text-gray-500">No users found.</div>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div className="flex flex-row items-end justify-center gap-2 sm:gap-3 lg:gap-8 w-full max-w-2xl mt-[-10px] sm:mt-[-20px] lg:mt-0 mb-6 sm:mb-8">
            {/* 2nd Place (left) */}
            <div className="flex-1 flex flex-col items-center">
              {users[1] && <PodiumProfile user={users[1]} rank={2} />}
            </div>
            {/* 1st Place (center, larger, slightly higher) */}
            <div className="flex-1 flex flex-col items-center mb-2 sm:mb-4 lg:mb-8">
              {users[0] && <PodiumProfile user={users[0]} rank={1} />}
            </div>
            {/* 3rd Place (right) */}
            <div className="flex-1 flex flex-col items-center">
              {users[2] && <PodiumProfile user={users[2]} rank={3} />}
            </div>
          </div>
          {/* Remaining users (4+) */}
          <div className="w-full max-w-2xl mx-auto">
            <AnimatePresence>
              {users.slice(3).map((user, idx) => (
                <motion.div
                  key={user.userId || user.id}
                  className="bg-white shadow-md hover:shadow-lg border-l-4 border-blue-400 rounded-xl p-3 sm:p-4 mb-3 flex items-center justify-between hover:bg-blue-50 transition duration-200 ease-in-out"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                >
                  <span className="text-blue-500 font-bold text-base sm:text-lg w-8 sm:w-10 text-center mr-2">{idx + 4}</span>
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.fullName}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/40 shadow mr-3 sm:mr-4"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">{user.fullName?.[0]?.toUpperCase() || '?'}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-semibold text-sm sm:text-base lg:text-lg truncate">{user.fullName || 'N/A'}</div>
                    <div className="text-xs sm:text-sm text-gray-500 font-mono">{user.userId}</div>
                    <div className="text-xs text-gray-400">{user.levelStatus || user.level || 'N/A'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[70px] sm:min-w-[90px]">
                    <div className="flex items-center gap-1 text-blue-500 text-xs sm:text-sm"><Users className="w-3 h-3 sm:w-4 sm:h-4" />{user.referralCount ?? 0}</div>
                    <div className="text-xs text-green-700 font-bold">{formatCurrency(user.totalEarnings)}</div>
                  </div>
                  <span className="ml-2 sm:ml-4 text-xs font-semibold text-blue-500">Rank #{idx + 4}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
} 