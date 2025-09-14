import { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

const DirectReferral = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchReferrals = async () => {
      try {
        const referralsQuery = query(
          collection(db, 'users'),
          where('sponsorId', '==', auth.currentUser.uid)
        );

        // Real-time updates for referrals
        const unsubscribe = onSnapshot(referralsQuery, async (snapshot) => {
          const referralsList = [];
          let activeCount = 0;
          let blockedCount = 0;
          let totalEarnings = 0;

          for (const doc of snapshot.docs) {
            const referral = { id: doc.id, ...doc.data() };

            // Get total earnings from this referral
            const paymentsQuery = query(
              collection(db, 'helpHistory'),
              where('senderId', '==', doc.id),
              where('receiverId', '==', auth.currentUser.uid)
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const earnings = paymentsSnapshot.docs.reduce(
              (sum, doc) => sum + (doc.data().amount || 0),
              0
            );

            referral.earnings = earnings;
            totalEarnings += earnings;

            if (referral.isBlocked) {
              blockedCount++;
            } else {
              activeCount++;
            }

            referralsList.push(referral);
          }

          setReferrals(referralsList);
          setStats({
            total: referralsList.length,
            active: activeCount,
            blocked: blockedCount,
            totalEarnings
          });
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching referrals:', error);
        setError('Failed to load referrals');
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className={`text-${color}-600 text-sm font-medium`}>{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {typeof value === 'number' && title.includes('₹')
              ? `₹${value.toLocaleString()}`
              : value}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-72px)]">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Direct Referrals</h1>
        <p className="mt-1 text-gray-600">Manage and track your direct team members</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Referrals"
          value={stats.total}
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Members"
          value={stats.active}
          color="green"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Blocked Members"
          value={stats.blocked}
          color="red"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
        <StatCard
          title="Total Earnings (₹)"
          value={stats.totalEarnings}
          color="yellow"
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Referrals List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      ) : referrals.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral, index) => (
                  <motion.tr
                    key={referral.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {referral.profilePic ? (
                            <img
                              src={referral.profilePic}
                              alt={referral.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium text-primary-600">
                              {referral.name[0]}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{referral.name}</div>
                          <div className="text-sm text-gray-500">{referral.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                        {referral.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${referral.isBlocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'}`}
                      >
                        {referral.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{referral.earnings?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">You don't have any direct referrals yet.</p>
        </div>
      )}
    </div>
  );
};

export default DirectReferral;