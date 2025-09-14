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
    // Real-time listener for E-PINs
    const unsubEpins = onSnapshot(collection(db, 'epins'), (epinsSnap) => {
      const epins = epinsSnap.docs.map(doc => doc.data());
      const total = epins.length;
      const used = epins.filter(e => e.status === 'used').length;
      const unused = epins.filter(e => e.status === 'unused').length;
      setStats(prev => ({ ...prev, total, used, unused }));
    });
    // Real-time listener for E-PIN Requests
    const unsubReqs = onSnapshot(collection(db, 'epinRequests'), (epinReqSnap) => {
      const epinRequests = epinReqSnap.docs.map(doc => doc.data());
      const pending = epinRequests.filter(r => r.status === 'pending').length;
      setStats(prev => ({ ...prev, pending }));
    });
    // Real-time listener for Users (for referral/team stats)
    const unsubUsers = onSnapshot(collection(db, 'users'), (usersSnap) => {
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
  }, []);

  const onPaymentDone = () => {
    setLoadingPayment(true);
    // ...your logic here
    setTimeout(() => {
      setLoadingPayment(false);
      setShowSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {/* E-PIN Cards */}
          <div className="bg-blue-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total E-PINs</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.total}</p>
          </div>
          <div className="bg-green-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Used E-PINs</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.used}</p>
          </div>
          <div className="bg-red-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Unused E-PINs</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.unused}</p>
          </div>
          <div className="bg-orange-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Pending Requests</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.pending}</p>
          </div>
          {/* New User/Referral Cards */}
          <div className="bg-cyan-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total Referrals</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.totalReferrals}</p>
          </div>
          <div className="bg-indigo-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total Team</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.totalTeam}</p>
          </div>
          <div className="bg-teal-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Active Referrals</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.activeReferrals}</p>
          </div>
          <div className="bg-orange-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Pending Referrals</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.pendingReferrals}</p>
          </div>
          {/* Level/Rank Cards - now included in the main grid */}
          <div className="bg-blue-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Star Level</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.star}</p>
          </div>
          <div className="bg-gray-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Silver Level</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.silver}</p>
          </div>
          <div className="bg-yellow-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Gold Level</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.gold}</p>
          </div>
          <div className="bg-purple-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Platinum Level</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.platinum}</p>
          </div>
          <div className="bg-sky-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Diamond Level</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.diamond}</p>
          </div>
          {/* New 7 summary cards */}
          <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Payment Blocked Users</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.paymentBlocked}</p>
          </div>
          <div className="bg-gray-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Inactive Users (15+ days)</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.inactive15Days}</p>
          </div>
          <div className="bg-green-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Today's New Signups</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.todaysSignups}</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total Earnings Distributed</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">₹{stats.totalEarnings}</p>
          </div>
          <div className="bg-blue-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total Help Sent</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">₹{stats.totalSent}</p>
          </div>
          <div className="bg-teal-400 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Total Help Received</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">₹{stats.totalReceived}</p>
          </div>
          <div className="bg-pink-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Power Referrers (5+)</h2>
            <p className="text-2xl sm:text-3xl font-extrabold">{stats.powerReferrers}</p>
          </div>
        </div>

        {/* Ticker Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-200 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2 text-center sm:text-left">
            <span className="text-blue-600 text-3xl sm:text-4xl">📢</span>
            Ticker Management
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-blue-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Current Ticker Message</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                <p className="text-sm sm:text-base text-gray-700 italic break-words">
                  {currentTickerMessage || 'No ticker message set'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-blue-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Update Ticker Message</h3>
              <textarea
                value={tickerMessage}
                onChange={(e) => setTickerMessage(e.target.value)}
                placeholder="Enter new ticker message..."
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-sm sm:text-base"
                rows="4"
              />
              <button
                onClick={updateTickerMessage}
                disabled={tickerLoading || !tickerMessage.trim()}
                className="mt-4 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg text-sm sm:text-base touch-manipulation"
              >
                {tickerLoading ? 'Updating...' : 'Update Ticker'}
              </button>
            </div>
          </div>
        </motion.div>
        {error && (
          <motion.div
            className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-green-100 border border-green-400 shadow-xl text-center mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-3xl mb-2 text-green-600">✔</div>
            <div className="text-green-700 font-bold text-lg mb-2">{error}</div>
            <div className="text-gray-700">Help sent successfully!</div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;