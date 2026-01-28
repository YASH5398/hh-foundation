import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAmountByLevel } from '../../utils/amountUtils';

const BADGES = ['🥇', '🥈', '🥉'];

const UpcomingPayments = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to convert level number to level name
  const getLevelName = (level) => {
    const levelMap = {
      1: 'Star',
      2: 'Silver', 
      3: 'Gold',
      4: 'Platinum',
      5: 'Diamond'
    };
    return levelMap[level] || level || 'Star';
  };

  // Function to get amount based on level (using centralized system)
  const getAmountForUser = (level) => {
    const levelName = getLevelName(level);
    return getAmountByLevel(levelName);
  };

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    // Real-time listener for top 100 activated users, sorted by referralCount desc then registrationTime asc
    const q = query(
      collection(db, 'users'),
      where('isActivated', '==', true),
      orderBy('referralCount', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      }));
      
      setUsers(userList);
      setLoading(false);
      console.log('📦 Top 100 activated users loaded:', userList.length);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setError('Failed to load users');
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <LoadingSpinner size="h-10 w-10" color="border-purple-400" />
        <div className="text-gray-600 mt-2">Loading upcoming payments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="text-red-600 text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10 px-2 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto mb-8">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-700 mb-8 text-center drop-shadow-sm tracking-tight">Upcoming Payment</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Top 100 Eligible Users</h2>
          <p className="text-gray-600">Who will receive payment next</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User ID</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Referrals</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Level</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={
                      `${currentUser?.uid === u.uid ? 'bg-purple-100 font-semibold ring-2 ring-purple-400' : ''} ` +
                      `${idx < 3 ? 'bg-blue-50' : 'hover:bg-gray-50'} ` +
                      `transition-colors`
                    }
                  >
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-lg font-semibold">
                      {idx < 3 ? (
                        <span className="text-2xl drop-shadow-md">{BADGES[idx]}</span>
                      ) : (
                        <span className="text-gray-700">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-mono text-sm sm:text-base text-blue-800 font-semibold">{u.userId}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt={u.fullName} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-blue-400" />
                        ) : (
                          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white bg-blue-500 border-2 border-blue-400">
                            {u.fullName?.[0] || '?'}
                          </span>
                        )}
                        <span className="text-gray-900 font-semibold text-sm sm:text-base">{u.fullName}</span>
                        {currentUser?.uid === u.uid && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-semibold shadow">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-center text-green-700 font-bold text-sm sm:text-base">
                      {u.referralCount || 0}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getLevelName(u.level)}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-blue-700 text-sm sm:text-base">
                      ₹{getAmountForUser(u.level)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Upcoming
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No eligible users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingPayments; 