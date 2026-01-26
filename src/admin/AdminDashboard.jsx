import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Notifications from './components/Notifications';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { SiPhonepe } from 'react-icons/si';
import { FaRegCopy, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import InsertManualSendHelpEntryButton from '../components/admin/InsertManualSendHelpEntryButton';
import { NavLink } from 'react-router-dom';

const AdminDashboard = () => {
  useEffect(() => {
    console.log('✅ AdminDashboard loaded');
  }, []);
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    pending: 0,
    totalReferrals: 0,
    totalTeam: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    star: 0,
    paymentBlocked: 0,
    inactive15Days: 0,
    todaysSignups: 0,
    totalEarnings: 0,
    totalSent: 0,
    totalReceived: 0,
    powerReferrers: 0,
  });
  const [error, setError] = useState(null);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Ticker management state
  const [tickerMessage, setTickerMessage] = useState('');
  const [currentTickerMessage, setCurrentTickerMessage] = useState('');
  const [tickerLoading, setTickerLoading] = useState(false);

  // Fetch current ticker message
  useEffect(() => {
    const fetchTickerMessage = async () => {
      try {
        const tickerRef = doc(db, 'appConfig', 'ticker');
        const tickerDoc = await getDoc(tickerRef);
        
        if (tickerDoc.exists()) {
          const data = tickerDoc.data();
          setCurrentTickerMessage(data.message || '');
          setTickerMessage(data.message || '');
        } else {
          setCurrentTickerMessage('Welcome to our platform! 🚀');
          setTickerMessage('Welcome to our platform! 🚀');
        }
      } catch (error) {
        console.error('Error fetching ticker message:', error);
        setCurrentTickerMessage('Welcome to our platform! 🚀');
        setTickerMessage('Welcome to our platform! 🚀');
      }
    };

    fetchTickerMessage();
  }, []);

  // Update ticker message
  const updateTickerMessage = async () => {
    if (!tickerMessage.trim()) {
      toast.error('Ticker message cannot be empty');
      return;
    }

    setTickerLoading(true);
    try {
      const tickerRef = doc(db, 'appConfig', 'ticker');
      await setDoc(tickerRef, {
        message: tickerMessage.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'admin'
      });
      
      setCurrentTickerMessage(tickerMessage.trim());
      toast.success('Ticker message updated successfully!');
    } catch (error) {
      console.error('Error updating ticker message:', error);
      toast.error('Failed to update ticker message');
    } finally {
      setTickerLoading(false);
    }
  };

  useEffect(() => {
    // CRITICAL: Only set up listeners if user is confirmed admin
    if (!user || !isAdmin) {
      console.log('AdminDashboard: User is not admin or not authenticated, skipping listeners');
      return;
    }

    console.log('AdminDashboard: Admin confirmed, setting up listeners');

    // Real-time listener for E-PINs
    const epinsQuery = query(collection(db, 'epins'));
    const unsubEpins = onSnapshot(epinsQuery, (epinsSnap) => {
      const epins = epinsSnap.docs.map(doc => doc.data());
      const total = epins.length;
      const used = epins.filter(e => e.status === 'used').length;
      const unused = epins.filter(e => e.status === 'unused').length;
      setStats(prev => ({ ...prev, total, used, unused }));
    });
    // Real-time listener for E-PIN Requests
    const epinReqQuery = query(collection(db, 'epinRequests'));
    const unsubReqs = onSnapshot(epinReqQuery, (epinReqSnap) => {
      const epinRequests = epinReqSnap.docs.map(doc => doc.data());
      const pending = epinRequests.filter(r => r.status === 'pending').length;
      setStats(prev => ({ ...prev, pending }));
    });
    // Real-time listener for Users (for referral/team stats)
    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (usersSnap) => {
      const users = usersSnap.docs.map(doc => doc.data());
      // Total Referrals: sum of directReferral.length or count of users with non-empty referrerId
      let totalReferrals = 0;
      let totalTeam = 0;
      let activeReferrals = 0;
      let pendingReferrals = 0;
      // Level counts
      let star = 0, silver = 0, gold = 0, platinum = 0, diamond = 0;
      // 7 new summary cards calculations
      let paymentBlocked = 0;
      let inactive15Days = 0;
      let todaysSignups = 0;
      let totalEarnings = 0;
      let totalSent = 0;
      let totalReceived = 0;
      let powerReferrers = 0;
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      users.forEach(user => {
        // Option 1: Sum directReferral.length if exists
        if (Array.isArray(user.directReferral)) {
          totalReferrals += user.directReferral.length;
        } else if (user.referrerId) {
          // Option 2: Count users with non-empty referrerId
          totalReferrals += 1;
        }
        // Total Team
        if (typeof user.totalTeam === 'number') {
          totalTeam += user.totalTeam;
        }
        // Active Referrals
        if (user.referralStatus === 'active') {
          activeReferrals += 1;
        }
        // Pending Referrals
        if (user.referralStatus === 'pending') {
          pendingReferrals += 1;
        }
        // Level counts
        switch (user.levelStatus || user.rank) {
          case 'star': star += 1; break;
          case 'silver': silver += 1; break;
          case 'gold': gold += 1; break;
          case 'platinum': platinum += 1; break;
          case 'diamond': diamond += 1; break;
          default: break;
        }
        // Payment Blocked
        if (user.paymentBlocked === true) paymentBlocked += 1;
        // Inactive 15+ days
        if (user.registrationTime && user.registrationTime.toDate) {
          const regDate = user.registrationTime.toDate();
          if (regDate < fifteenDaysAgo) inactive15Days += 1;
        }
        // Today's New Signups
        if (user.createdAt && user.createdAt.toDate) {
          const createdDate = user.createdAt.toDate();
          if (createdDate >= todayMidnight) todaysSignups += 1;
        }
        // Total Earnings
        if (typeof user.totalEarnings === 'number') totalEarnings += user.totalEarnings;
        // Total Help Sent
        if (typeof user.totalSent === 'number') totalSent += user.totalSent;
        // Total Help Received
        if (typeof user.totalReceived === 'number') totalReceived += user.totalReceived;
        // Power Referrers
        if (typeof user.referralCount === 'number' && user.referralCount >= 5) powerReferrers += 1;
      });
      setStats(prev => ({
        ...prev,
        totalReferrals,
        totalTeam,
        activeReferrals,
        pendingReferrals,
        star,
        silver,
        gold,
        platinum,
        diamond,
        paymentBlocked,
        inactive15Days,
        todaysSignups,
        totalEarnings,
        totalSent,
        totalReceived,
        powerReferrers,
      }));
    });
    return () => {
      unsubEpins();
      unsubReqs();
      unsubUsers();
    };
  }, [user, isAdmin]);

  const onPaymentDone = () => {
    setLoadingPayment(true);
    // ...your logic here
    setTimeout(() => {
      setLoadingPayment(false);
      setShowSuccess(true);
    }, 2000);
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon, prefix = '', subtitle, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-slate-800/60"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
          <div className="text-2xl font-bold text-white">
            {prefix}{value?.toLocaleString() || 0}
          </div>
          {subtitle && (
            <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-slate-500 text-lg">{icon}</div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Platform metrics and management overview</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {/* E-PIN Metrics */}
            <StatCard
              title="Total E-PINs"
              value={stats.total}
              icon="🎫"
              delay={0.1}
            />
            <StatCard
              title="Used E-PINs"
              value={stats.used}
              icon="✅"
              delay={0.15}
            />
            <StatCard
              title="Unused E-PINs"
              value={stats.unused}
              icon="📦"
              delay={0.2}
            />
            <StatCard
              title="Pending Requests"
              value={stats.pending}
              icon="⏳"
              delay={0.25}
            />

            {/* User & Referral Metrics */}
            <StatCard
              title="Total Referrals"
              value={stats.totalReferrals}
              icon="👥"
              delay={0.3}
            />
            <StatCard
              title="Total Team"
              value={stats.totalTeam}
              icon="🌐"
              delay={0.35}
            />
            <StatCard
              title="Active Referrals"
              value={stats.activeReferrals}
              icon="🔄"
              delay={0.4}
            />
            <StatCard
              title="Pending Referrals"
              value={stats.pendingReferrals}
              icon="⏳"
              delay={0.45}
            />

            {/* Level Metrics */}
            <StatCard
              title="Star Level"
              value={stats.star}
              icon="⭐"
              delay={0.5}
            />
            <StatCard
              title="Silver Level"
              value={stats.silver}
              icon="🥈"
              delay={0.55}
            />
            <StatCard
              title="Gold Level"
              value={stats.gold}
              icon="🥇"
              delay={0.6}
            />
            <StatCard
              title="Platinum Level"
              value={stats.platinum}
              icon="💎"
              delay={0.65}
            />
            <StatCard
              title="Diamond Level"
              value={stats.diamond}
              icon="💠"
              delay={0.7}
            />

            {/* System Metrics */}
            <StatCard
              title="Payment Blocked"
              value={stats.paymentBlocked}
              icon="🚫"
              subtitle="Users with restrictions"
              delay={0.75}
            />
            <StatCard
              title="Inactive Users"
              value={stats.inactive15Days}
              icon="😴"
              subtitle="15+ days inactive"
              delay={0.8}
            />
            <StatCard
              title="Today's Signups"
              value={stats.todaysSignups}
              icon="📈"
              subtitle="New registrations"
              delay={0.85}
            />
            <StatCard
              title="Total Earnings"
              value={stats.totalEarnings}
              icon="💰"
              prefix="₹"
              subtitle="Distributed"
              delay={0.9}
            />
            <StatCard
              title="Help Sent"
              value={stats.totalSent}
              icon="📤"
              prefix="₹"
              subtitle="Total amount"
              delay={0.95}
            />
            <StatCard
              title="Help Received"
              value={stats.totalReceived}
              icon="📥"
              prefix="₹"
              subtitle="Total amount"
              delay={1.0}
            />
            <StatCard
              title="Power Referrers"
              value={stats.powerReferrers}
              icon="👑"
              subtitle="5+ referrals"
              delay={1.05}
            />
          </div>

          {/* Ticker Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">📢</div>
              <div>
                <h2 className="text-xl font-semibold text-white">Ticker Management</h2>
                <p className="text-slate-400 text-sm">Update platform announcement message</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Current Message</h3>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-slate-200 text-sm">
                    {currentTickerMessage || 'No ticker message set'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Update Message</h3>
                <textarea
                  value={tickerMessage}
                  onChange={(e) => setTickerMessage(e.target.value)}
                  placeholder="Enter new ticker message..."
                  className="w-full p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-slate-200 placeholder-slate-400 text-sm"
                  rows="4"
                />
                <button
                  onClick={updateTickerMessage}
                  disabled={tickerLoading || !tickerMessage.trim()}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {tickerLoading ? 'Updating...' : 'Update Ticker'}
                </button>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 max-w-md mx-auto text-center"
            >
              <div className="text-green-400 text-lg mb-2">✅</div>
              <div className="text-green-300 font-medium text-sm">{error}</div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;