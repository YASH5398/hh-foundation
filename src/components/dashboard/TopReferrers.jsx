import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCrown, FaFire, FaStar } from 'react-icons/fa';

const TopReferrers = () => {
  const [topReferrers, setTopReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopReferrers = async () => {
      try {
        setLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('referralCount', 'desc'),
          limit(3)
        );

        const querySnapshot = await getDocs(q);
        const users = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          users.push({
            id: doc.id,
            fullName: userData.fullName || 'Anonymous User',
            userId: userData.userId || 'N/A',
            photoURL: userData.photoURL || '',
            referralCount: userData.referralCount || 0,
            totalReceived: userData.totalReceived || 0,
            ...userData
          });
        });

        setTopReferrers(users);
        console.log('✅ Top referrers fetched:', users);
      } catch (err) {
        console.error('❌ Error fetching top referrers:', err);
        setError('Failed to load top referrers');
      } finally {
        setLoading(false);
      }
    };

    fetchTopReferrers();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-24 sm:h-32 px-4">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading top referrers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center text-red-600 p-4">
        <p className="text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  if (topReferrers.length === 0) {
    return (
      <div className="w-full text-center text-gray-600 p-6 sm:p-8">
        <FaStar className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-4 text-gray-400" />
        <p className="text-base sm:text-lg">No top referrers to display yet.</p>
        <p className="text-sm mt-2">Start inviting!</p>
      </div>
    );
  }

  // 3D Glass Card Redesign for Top 3
  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">🏆 Top 3 Referrers</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {topReferrers.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 p-4 sm:p-6 flex flex-col justify-between min-h-[180px] sm:min-h-[200px]"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200" alt={user.fullName} />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 text-white font-bold flex items-center justify-center rounded-full text-lg sm:text-2xl">
                  {user.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">{user.fullName}</h3>
                <p className="text-xs text-gray-500">{user.userId || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex justify-between items-center">
              {/* Badge */}
              {index === 0 && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">🥇 Top Referrer</span>
              )}
              {index === 1 && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">🥈 Active Leader</span>
              )}
              {index === 2 && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800">🥉 Rising Star</span>
              )}
              {/* Referral count */}
              <span className="text-xs sm:text-sm font-bold text-gray-700">{user.referralCount} Referrals</span>
            </div>
            {/* Removed Total Earnings line */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopReferrers; 