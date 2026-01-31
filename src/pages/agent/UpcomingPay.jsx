import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiUser, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const UpcomingPay = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const LEVEL_AMOUNTS = {
    star: 600,
    silver: 1200,
    gold: 2400,
    platinum: 4800,
    diamond: 9600
  };

  const LEVEL_PAYMENTS = {
    star: { total: 3, amount: 600 },
    silver: { total: 9, amount: 1200 },
    gold: { total: 27, amount: 2400 },
    platinum: { total: 81, amount: 4800 },
    diamond: { total: 243, amount: 9600 }
  };

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a User ID');
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', userId.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('User not found');
        setUserData(null);
        setAnalysis(null);
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };
      setUserData(user);

      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('senderUid', '==', user.id)
      );
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      const sendHelpRecords = sendHelpSnapshot.docs.map(doc => doc.data());

      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('receiverUid', '==', user.id)
      );
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      const receiveHelpRecords = receiveHelpSnapshot.docs.map(doc => doc.data());

      const lastReceivedQuery = query(
        collection(db, 'receiveHelp'),
        where('receiverUid', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const lastReceivedSnapshot = await getDocs(lastReceivedQuery);
      const lastReceived = lastReceivedSnapshot.docs[0]?.data();

      const lastSentQuery = query(
        collection(db, 'sendHelp'),
        where('senderUid', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const lastSentSnapshot = await getDocs(lastSentQuery);
      const lastSent = lastSentSnapshot.docs[0]?.data();

      const analysisResult = analyzePaymentStatus(user, sendHelpRecords, receiveHelpRecords);
      setAnalysis({
        ...analysisResult,
        totalReceived: receiveHelpRecords.filter(r => r.status === 'verified').length,
        totalSent: sendHelpRecords.filter(s => s.status === 'verified').length,
        lastReceivedDate: lastReceived?.createdAt,
        lastSentDate: lastSent?.createdAt
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const analyzePaymentStatus = (user, sendHelp, receiveHelp) => {
    if (!user) {
      return {
        isEligible: false,
        nextPaymentAmount: 0,
        expectedCount: 0,
        totalExpected: 0,
        unlockCondition: 'User data not available',
        blockingReasons: ['User data missing'],
        actionRequired: ['Contact admin - user data incomplete'],
        error: true
      };
    }

    const level = (user.levelStatus || 'star').toLowerCase();
    const levelConfig = LEVEL_PAYMENTS[level];

    if (!levelConfig) {
      return {
        isEligible: false,
        nextPaymentAmount: 0,
        expectedCount: 0,
        totalExpected: 0,
        unlockCondition: 'Level configuration not available',
        blockingReasons: [`Invalid level: ${level}`],
        actionRequired: ['Contact admin - level configuration missing'],
        error: true
      };
    }

    const verifiedReceived = Array.isArray(receiveHelp) ? receiveHelp.filter(r => r?.status === 'verified').length : 0;
    const verifiedSent = Array.isArray(sendHelp) ? sendHelp.filter(s => s?.status === 'verified').length : 0;
    const pendingSent = Array.isArray(sendHelp) ? sendHelp.filter(s => s?.status === 'pending').length : 0;

    const nextPaymentAmount = levelConfig.amount || 0;
    const expectedCount = verifiedReceived + 1;
    const totalExpected = levelConfig.total || 0;

    let isEligible = false;
    let blockingReasons = [];
    let actionRequired = [];

    if (user.isBlocked === true) {
      blockingReasons.push('Account is blocked by admin');
      actionRequired.push('Contact admin to unblock account');
    }

    if (user.isOnHold === true) {
      blockingReasons.push('Account is on hold');
      actionRequired.push('Receiving blocked until admin approval');
    }

    if (user.isReceivingHeld === true) {
      blockingReasons.push('Receiving is held');
      actionRequired.push('Contact admin to release receiving hold');
    }

    if (pendingSent > 0) {
      blockingReasons.push(`${pendingSent} pending upline payment(s)`);
      actionRequired.push(`User must complete ${pendingSent} pending upline payment(s)`);
    }

    const levelOrder = ['star', 'silver', 'gold', 'platinum', 'diamond'];
    const currentLevelIndex = levelOrder.indexOf(level);
    const nextLevel = currentLevelIndex >= 0 && currentLevelIndex < levelOrder.length - 1 
      ? levelOrder[currentLevelIndex + 1] 
      : null;
    
    if (verifiedReceived >= totalExpected && nextLevel) {
      const upgradeAmount = LEVEL_AMOUNTS[nextLevel] || 0;
      blockingReasons.push(`Upgrade to ${nextLevel} pending`);
      actionRequired.push(`User must complete ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} upgrade ₹${upgradeAmount}`);
    }

    if (verifiedReceived >= totalExpected && !nextLevel) {
      blockingReasons.push('Maximum payments received for current level');
      actionRequired.push('User has completed all payments for Diamond level');
    }

    if (blockingReasons.length === 0 && verifiedReceived < totalExpected) {
      isEligible = true;
      actionRequired.push('Nothing pending – payment will arrive automatically');
    }

    const unlockCondition = verifiedReceived < totalExpected
      ? `Complete ${verifiedSent} of ${totalExpected} payments at ${level} level`
      : nextLevel
      ? `Upgrade to ${nextLevel} level`
      : 'All payments completed';

    return {
      isEligible,
      nextPaymentAmount,
      expectedCount,
      totalExpected,
      unlockCondition,
      blockingReasons,
      actionRequired,
      error: false
    };
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium">Active</span>;
    }
    if (status === 'Blocked') {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium">Blocked</span>;
    }
    if (status === 'On Hold') {
      return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium">On Hold</span>;
    }
    return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-sm font-medium">{status}</span>;
  };

  const getEligibilityBadge = (isEligible) => {
    if (isEligible) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <FiCheckCircle className="w-6 h-6" />
          <span className="text-lg font-semibold">Yes</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-red-400">
        <FiXCircle className="w-6 h-6" />
        <span className="text-lg font-semibold">No</span>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  const getAccountStatus = (user) => {
    if (!user) return 'Unknown';
    if (user.isBlocked === true) return 'Blocked';
    if (user.isOnHold === true) return 'On Hold';
    return 'Active';
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Upcoming Payment Tracker</h1>
          <p className="text-slate-400 mt-1">Search user to analyze payment status</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter User ID"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <FiSearch /> {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {userData && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {analysis.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <FiAlertCircle /> Unable to Calculate Upcoming Payment
                </h2>
                <p className="text-red-300 mb-2">Reason: {analysis.blockingReasons?.[0] || 'Unknown error'}</p>
                <p className="text-red-200 text-sm">Action: {analysis.actionRequired?.[0] || 'Contact admin'}</p>
              </div>
            )}

            {!analysis.error && (
              <>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUser /> User Basic Info
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">User Name</p>
                      <p className="text-white font-medium text-lg">{userData.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">User ID</p>
                      <p className="text-white font-medium text-lg">{userData.userId}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Current Level</p>
                      <p className="text-white font-medium text-lg capitalize">{userData.levelStatus || 'Star'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Account Status</p>
                      <div className="mt-1">{getStatusBadge(getAccountStatus(userData))}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Upcoming Payment Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Is user eligible for next payment?</p>
                      {getEligibilityBadge(analysis.isEligible)}
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Next Payment Amount</p>
                      <p className="text-white font-bold text-2xl">₹{analysis.nextPaymentAmount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Expected Payment Count</p>
                      <p className="text-white font-medium text-lg">{analysis.expectedCount} of {analysis.totalExpected}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Expected Unlock Condition</p>
                      <p className="text-white font-medium">{analysis.unlockCondition}</p>
                    </div>
                  </div>
                </div>

                {analysis.blockingReasons && analysis.blockingReasons.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <FiAlertCircle /> Payment Blocked - Reasons
                    </h2>
                    <ul className="space-y-2">
                      {analysis.blockingReasons.map((reason, index) => (
                        <li key={index} className="text-red-300 flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`rounded-xl border p-6 ${
                  analysis.isEligible
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                    analysis.isEligible ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    <FiCheckCircle /> Action Required
                  </h2>
                  <ul className="space-y-2">
                    {analysis.actionRequired && analysis.actionRequired.map((action, index) => (
                      <li key={index} className={`flex items-start gap-2 font-medium ${
                        analysis.isEligible ? 'text-green-300' : 'text-yellow-300'
                      }`}>
                        <span className={analysis.isEligible ? 'text-green-400' : 'text-yellow-400'}>→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">History Snapshot</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Help Received</p>
                      <p className="text-white font-bold text-2xl">{analysis.totalReceived || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Total Help Sent</p>
                      <p className="text-white font-bold text-2xl">{analysis.totalSent || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Last Received Date</p>
                      <p className="text-white font-medium">{formatDate(analysis.lastReceivedDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Last Sent Date</p>
                      <p className="text-white font-medium">{formatDate(analysis.lastSentDate)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {!userData && !loading && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
            <FiSearch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Enter a User ID to view payment analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingPay;
