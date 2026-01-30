import React, { useState } from 'react';
import {
  FiUsers, FiSearch, FiUser, FiCreditCard, FiActivity, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiClock, FiStar, FiHeart, FiTrendingUp,
  FiMail, FiPhone, FiKey, FiShield, FiExternalLink, FiDownload, FiMapPin, FiGlobe,
  FiDollarSign, FiAlertTriangle, FiFlag
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-hot-toast';
import { getProfileImageUrl } from '../../utils/profileUtils';

const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const loadUserStats = async (uid) => {
    try {
      const stats = {
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0,
        totalSendHelp: 0,
        totalReceiveHelp: 0,
        successfulTransactions: 0
      };

      const ticketsQuery = query(collection(db, 'supportTickets'), where('userId', '==', uid), limit(100));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      stats.totalTickets = ticketsSnapshot.size;
      ticketsSnapshot.docs.forEach(doc => {
        const ticket = doc.data();
        if (ticket.status === 'resolved' || ticket.status === 'closed') stats.resolvedTickets++;
        else stats.pendingTickets++;
      });

      const sendHelpQuery = query(collection(db, 'sendHelp'), where('userId', '==', uid), limit(100));
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      stats.totalSendHelp = sendHelpSnapshot.size;
      sendHelpSnapshot.docs.forEach(doc => {
        if (['completed', 'confirmed'].includes(doc.data().status)) stats.successfulTransactions++;
      });

      const receiveHelpQuery = query(collection(db, 'receiveHelp'), where('userId', '==', uid), limit(100));
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      stats.totalReceiveHelp = receiveHelpSnapshot.size;

      setUserStats(stats);
    } catch (error) {
      console.error('Stats Error:', error);
    }
  };

  const searchUser = async (e) => {
    e.preventDefault();
    const inputId = searchTerm.trim();
    if (!inputId) {
      setSearchError('Enter a valid User ID');
      return;
    }

    setLoading(true);
    setSearchError('');
    setSearchedUser(null);
    setHasSearched(true);
    setUserStats(null);

    try {
      // FIX: Query by public 'userId' field instead of document ID and use exact match
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', inputId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Use the first match (User IDs should be unique)
        const userDoc = querySnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() };
        setSearchedUser(userData);
        await loadUserStats(userData.uid); // Pass the document ID (uid) for related collections
      } else {
        setSearchError('Operational record not found for this ID.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Encrypted channel failed. Check your link.');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ user }) => {
    const isSuspended = user.isSuspended;
    const isActive = user.isActivated;
    const isBlocked = user.isBlocked;

    if (isSuspended || isBlocked) {
      return (
        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-red-500/10 border-red-500/20 text-red-500">
          <FiXCircle /> Suspended
        </div>
      );
    }
    if (isActive) {
      return (
        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
          <FiCheckCircle /> Active
        </div>
      );
    }
    return (
      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-amber-500/10 border-amber-500/20 text-amber-500">
        <FiClock /> Pending
      </div>
    );
  };

  const exportUsers = () => {
    try {
      if (!searchedUser) {
        toast.error('No user data to export');
        return;
      }

      // Simple CSV export logic
      const data = [
        ['User ID', searchedUser.userId],
        ['Name', searchedUser.fullName],
        ['Email', searchedUser.email],
        ['Phone', searchedUser.phone],
        ['Level', searchedUser.levelStatus || 1],
        ['Earnings', searchedUser.totalEarnings || 0],
        ['Joined', formatDate(searchedUser.createdAt)]
      ];

      const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `user_export_${searchedUser.userId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('User record exported');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Search */}
      <section className="relative py-12 px-8 rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FiUsers className="w-64 h-64" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Intel Repository</h1>
          <p className="text-slate-400 mb-8 font-medium">Search the global user database by Unique ID (e.g. HHFxxxxx) to retrieve secure profiles and operational history.</p>

          <form onSubmit={searchUser} className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 blur-xl group-focus-within:bg-blue-600/30 transition-all opacity-0 group-focus-within:opacity-100"></div>
            <div className="relative flex gap-3 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner">
              <div className="flex-1 flex items-center px-4 gap-3">
                <FiSearch className="text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter User ID (Exact Match)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40 disabled:opacity-50"
              >
                {loading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                Decrypt
              </button>
            </div>
          </form>
          {searchError && <p className="mt-4 text-red-500 text-sm font-bold flex items-center gap-2 px-2"><FiXCircle /> {searchError}</p>}
        </div>
      </section>

      {/* Results Workspace */}
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 opacity-30"
          >
            <FiUsers className="w-24 h-24 mx-auto mb-6" />
            <p className="text-xl font-bold text-white uppercase tracking-widest">Awaiting Input Parameters</p>
          </motion.div>
        ) : loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 gap-6"
          >
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-blue-400 font-black animate-pulse uppercase tracking-[0.3em]">Querying Mainframe...</p>
          </motion.div>
        ) : searchedUser ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header / Banner */}
            <div className="h-48 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 relative">
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
            </div>

            <div className="px-8 pb-12 -mt-20 relative">
              <div className="flex flex-col lg:flex-row items-end gap-6 mb-10">
                <div className="relative group">
                  <img
                    src={getProfileImageUrl(searchedUser)}
                    alt="Profile"
                    className="w-32 h-32 rounded-[2rem] border-4 border-slate-900 shadow-2xl object-cover bg-slate-800"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-slate-900 p-1.5 rounded-full">
                    <StatusBadge user={searchedUser} />
                  </div>
                </div>
                <div className="flex-1 mb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-black text-white tracking-tight">{searchedUser.fullName || 'Unknown'}</h2>
                    <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono text-blue-400 border border-slate-700">{searchedUser.userId || 'NO_ID'}</span>
                  </div>
                  <p className="text-slate-400 font-mono text-sm flex items-center gap-4">
                    <span className="flex items-center gap-2"><FiMail className="w-4 h-4" /> {searchedUser.email}</span>
                    <span className="flex items-center gap-2"><FiDollarSign className="w-4 h-4" /> Earnings: ₹{searchedUser.totalEarnings || 0}</span>
                  </p>
                </div>
                <div className="flex gap-3 mb-2">
                  <button onClick={exportUsers} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700">
                    <FiDownload />
                  </button>
                  <button onClick={() => setHasSearched(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-colors border border-slate-700">
                    Clear Search
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Info */}
                <div className="space-y-6">
                  {/* Flags / Status */}
                  <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiFlag /> Account Flags
                    </h3>
                    <div className="space-y-3">
                      <FlagRow label="Activated" status={searchedUser.isActivated} success />
                      <FlagRow label="Verified" status={searchedUser.isVerified} success />
                      <FlagRow label="Suspended" status={searchedUser.isSuspended} danger />
                      <FlagRow label="Blocked" status={searchedUser.isBlocked} danger />
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiUser /> Personal Dossier
                    </h3>
                    <div className="space-y-4">
                      <InfoRow label="Internal UID" value={searchedUser.uid} copy />
                      <InfoRow label="Phone" value={searchedUser.phone || 'N/A'} />
                      <InfoRow label="WhatsApp" value={searchedUser.whatsapp || 'N/A'} />
                      <InfoRow label="Gender" value={searchedUser.gender || 'N/A'} />
                      <InfoRow label="Joined" value={formatDate(searchedUser.createdAt)} />
                    </div>
                  </div>

                  {(searchedUser.bank || searchedUser.upi) && (
                    <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FiCreditCard /> Financial KYC
                      </h3>
                      <div className="space-y-6">
                        {searchedUser.bank && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-600 uppercase">Bank Details</p>
                            <InfoRow label="Bank" value={searchedUser.bank.bankName} />
                            <InfoRow label="Account" value={searchedUser.bank.accountNumber} copy />
                            <InfoRow label="IFSC" value={searchedUser.bank.ifscCode} copy />
                            <InfoRow label="Holder" value={searchedUser.bank.accountHolderName} />
                          </div>
                        )}
                        {searchedUser.upi && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-600 uppercase">UPI Details</p>
                            <InfoRow label="UPI ID" value={searchedUser.upi.upiId} copy />
                            <InfoRow label="Name" value={searchedUser.upi.upiName} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col: Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Current Level" value={`Lvl ${searchedUser.levelStatus || 1}`} icon={FiStar} color="purple" />
                    <StatCard label="Total Earnings" value={`₹${searchedUser.totalEarnings || 0}`} icon={FiDollarSign} color="emerald" />
                    <StatCard label="Referrals" value={searchedUser.referralCount || 0} icon={FiUsers} color="blue" />
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiTrendingUp /> Operational Metrics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                      <MetricRow label="Total Tickets" value={userStats?.totalTickets} />
                      <MetricRow label="Resolved Tickets" value={userStats?.resolvedTickets} color="text-emerald-400" />
                      <MetricRow label="Pending Tickets" value={userStats?.pendingTickets} color="text-amber-400" />
                      <MetricRow label="Transactions Verified" value={userStats?.successfulTransactions} color="text-blue-400" />
                      <MetricRow label="Helps Sent" value={userStats?.totalSendHelp} />
                      <MetricRow label="Helps Received" value={userStats?.totalReceiveHelp} />
                    </div>
                  </div>

                  {(searchedUser.city || searchedUser.state) && (
                    <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FiMapPin /> Location Data
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="City" value={searchedUser.city} />
                        <InfoRow label="State" value={searchedUser.state} />
                        <InfoRow label="Address" value={searchedUser.address} />
                        <InfoRow label="Pincode" value={searchedUser.pincode} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-red-400"
          >
            <FiXCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-bold uppercase tracking-widest">Search Failed</p>
            <p className="text-sm opacity-60">Target ID not found in database.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Components */
const InfoRow = ({ label, value, copy }) => (
  <div className="flex justify-between items-center group min-h-[1.5rem]">
    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-slate-300 font-mono text-sm truncate max-w-[200px] text-right">{value || '-'}</span>
      {copy && value && <FiDownload className="opacity-0 group-hover:opacity-100 text-slate-500 cursor-pointer w-3 h-3 hover:text-white" onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied'); }} />}
    </div>
  </div>
);

const FlagRow = ({ label, status, danger, success }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-slate-400 text-xs font-medium">{label}</span>
    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status
        ? (danger ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500')
        : (danger ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-slate-500')
      }`}>
      {status ? 'YES' : 'NO'}
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => {
  const c = {
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/20'
  };
  return (
    <div className={`bg-gradient-to-br ${c[color] || c.blue} border rounded-2xl p-6 relative overflow-hidden`}>
      <div className="absolute right-0 top-0 p-6 opacity-10 transform translate-x-1/2 -translate-y-1/2">
        <Icon className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black tracking-tighter text-white mb-1">{value !== undefined ? value : '-'}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
          <Icon className="w-3 h-3" /> {label}
        </p>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, color = 'text-white' }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
    <span className="text-slate-500 text-sm font-medium">{label}</span>
    <span className={`font-mono font-bold ${color}`}>{value !== undefined ? value : '-'}</span>
  </div>
);

export default UserManagement;