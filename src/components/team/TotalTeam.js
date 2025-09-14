import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const TotalTeam = () => {
  const [teamData, setTeamData] = useState({
    levels: {},
    totalMembers: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);

  useEffect(() => {
    const fetchTeamData = async () => {
      const user = useAuth();

      if (!user) return;

      try {
        const levels = {};
        let totalMembers = 0;
        let totalEarnings = 0;

        // Level 1 (Direct Referrals)
        const level1Query = query(
          collection(db, 'users'),
          where('sponsorId', '==', user.uid)
        );
        const level1Snapshot = await getDocs(level1Query);
        const level1Members = level1Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        levels[1] = level1Members;
        totalMembers += level1Members.length;

        // Level 2
        const level2Members = [];
        for (const member of level1Members) {
          const level2Query = query(
            collection(db, 'users'),
            where('sponsorId', '==', member.id)
          );
          const level2Snapshot = await getDocs(level2Query);
          level2Members.push(...level2Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
        levels[2] = level2Members;
        totalMembers += level2Members.length;

        // Level 3
        const level3Members = [];
        for (const member of level2Members) {
          const level3Query = query(
            collection(db, 'users'),
            where('sponsorId', '==', member.id)
          );
          const level3Snapshot = await getDocs(level3Query);
          level3Members.push(...level3Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
        levels[3] = level3Members;
        totalMembers += level3Members.length;

        // Calculate total earnings from team
        const calculateEarnings = async (members) => {
          let earnings = 0;
          for (const member of members) {
            const paymentsQuery = query(
              collection(db, 'helpHistory'),
              where('senderId', '==', member.id),
              where('receiverId', '==', user.uid)
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            earnings += paymentsSnapshot.docs.reduce(
              (sum, doc) => sum + (doc.data().amount || 0),
              0
            );
          }
          return earnings;
        };

        totalEarnings = await calculateEarnings([...level1Members, ...level2Members, ...level3Members]);

        setTeamData({ levels, totalMembers, totalEarnings });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError('Failed to load team data');
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const StatCard = ({ title, value, icon }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {typeof value === 'number' && title.includes('₹') ? `₹${value.toLocaleString()}` : value}
          </p>
        </div>
        <div className="p-3 bg-primary-50 rounded-full">
          {icon}
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
        <h1 className="text-2xl font-bold text-gray-900">Total Team</h1>
        <p className="mt-1 text-gray-600">Complete view of your downline matrix</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Team Members"
          value={teamData.totalMembers}
          icon={
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Team Earnings (₹)"
          value={teamData.totalEarnings}
          icon={
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Matrix Levels"
          value="3"
          icon={
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Level Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex space-x-4">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${selectedLevel === level
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Level {level} ({teamData.levels[level]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Team Members List */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      ) : teamData.levels[selectedLevel]?.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamData.levels[selectedLevel].map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {member.profilePic ? (
                            <img
                              src={member.profilePic}
                              alt={member.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium text-primary-600">
                              {member.name[0]}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                        {member.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.isBlocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'}`}
                      >
                        {member.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.referralCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">No members found in Level {selectedLevel}.</p>
        </div>
      )}
    </div>
  );
};

export default TotalTeam;