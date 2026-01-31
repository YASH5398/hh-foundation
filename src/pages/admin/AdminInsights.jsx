import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, User, CreditCard, FileText, Ban, TrendingUp, Wallet, Coins, ArrowDownCircle, ArrowUpCircle, Users, ShieldAlert } from 'lucide-react';
import { updateUserStatus } from '../../services/adminService';
import { showToast } from '../../components/ui/Toast';

const ICONS = {
  joins: <User className="text-blue-500 w-7 h-7" />, // New Joins
  payments: <CreditCard className="text-green-500 w-7 h-7" />, // Payments Received
  testimonials: <FileText className="text-indigo-500 w-7 h-7" />, // Testimonials
  blocked: <Ban className="text-red-500 w-7 h-7" />, // Blocked Users
  upgrades: <TrendingUp className="text-yellow-500 w-7 h-7" />, // Upgrades
  epinReq: <Wallet className="text-pink-500 w-7 h-7" />, // E-PIN Requested
  epinWallet: <Coins className="text-orange-500 w-7 h-7" />, // E-PIN In Wallet
  sendHelp: <ArrowUpCircle className="text-green-600 w-7 h-7" />, // Send Help
  receiveHelp: <ArrowDownCircle className="text-blue-600 w-7 h-7" />, // Receive Help
};

const ALERTS = [
  { key: 'fakeUtr', icon: <AlertTriangle className="text-yellow-600 w-6 h-6" />, label: 'Fake UTR Detected' },
  { key: 'dupRef', icon: <Users className="text-pink-600 w-6 h-6" />, label: 'Duplicate Referrals' },
  { key: 'pendingScreens', icon: <FileText className="text-indigo-600 w-6 h-6" />, label: 'Screenshot Pending Verifications' },
  { key: 'suspicious', icon: <ShieldAlert className="text-red-600 w-6 h-6" />, label: 'Suspicious Activities' },
  { key: 'multiIds', icon: <User className="text-orange-600 w-6 h-6" />, label: 'Multiple IDs on Same Device' },
];

const cardMotion = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, type: 'spring' },
};

const AdminInsights = () => {
  const [metrics, setMetrics] = useState({
    joins: 0, payments: 0, testimonials: 0, blocked: 0, upgrades: 0, epinReq: 0, epinWallet: 0, sendHelp: 0, receiveHelp: 0
  });
  const [alerts, setAlerts] = useState({
    fakeUtr: 0, dupRef: 0, pendingScreens: 0, suspicious: 0, multiIds: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertDetail, setAlertDetail] = useState(null);
  const [users, setUsers] = useState([]);
  const [alertUsers, setAlertUsers] = useState({});
  const [blockLoading, setBlockLoading] = useState({});
  const [confirmBlock, setConfirmBlock] = useState({ open: false, user: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Starting Admin Insights data fetch...');

        // 24h window
        const now = Timestamp.now();
        const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

        // Users
        console.log('Fetching users...');
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('Users fetched:', users.length);
        // New Joins (24h)
        const joins = users.filter(u => u.createdAt && u.createdAt.toDate && u.createdAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        // Blocked Users
        const blocked = users.filter(u => u.isBlocked).length;
        // Upgrades Done (24h)
        const upgrades = users.filter(u => u.levelStatusChangedAt && u.levelStatusChangedAt.toDate && u.levelStatusChangedAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        // E-PIN In Wallet
        const epinWallet = users.reduce((sum, u) => sum + (Array.isArray(u.epins) ? u.epins.length : 0), 0);
        // Duplicate Referrals (same phone/whatsapp/ip)
        const phoneMap = {}, waMap = {}, ipMap = {}, multiIdsMap = {}, suspicious = [];
        users.forEach(u => {
          if (u.phone) phoneMap[u.phone] = (phoneMap[u.phone] || 0) + 1;
          if (u.whatsapp) waMap[u.whatsapp] = (waMap[u.whatsapp] || 0) + 1;
          if (u.ipAddress) ipMap[u.ipAddress] = (ipMap[u.ipAddress] || 0) + 1;
          if (u.deviceToken) multiIdsMap[u.deviceToken] = (multiIdsMap[u.deviceToken] || 0) + 1;
        });
        const dupRef = Object.values(phoneMap).filter(v => v > 1).length + Object.values(waMap).filter(v => v > 1).length + Object.values(ipMap).filter(v => v > 1).length;
        const multiIds = Object.values(multiIdsMap).filter(v => v > 1).length;
        // Testimonials
        console.log('Fetching testimonials...');
        const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
        const testimonials = testimonialsSnap.size;
        console.log('Testimonials fetched:', testimonials);

        // E-PIN Requests
        console.log('Fetching epin requests...');
        const epinReqSnap = await getDocs(collection(db, 'epinRequests'));
        const epinReq = epinReqSnap.size;
        console.log('Epin requests fetched:', epinReq);

        // SendHelp
        console.log('Fetching sendHelp data...');
        const sendHelpSnap = await getDocs(collection(db, 'sendHelp'));
        let sendHelp = 0;
        sendHelpSnap.forEach(d => {
          const amount = d.data().amount || 0;
          sendHelp += amount;
        });
        console.log('SendHelp total amount:', sendHelp);

        // ReceiveHelp
        console.log('Fetching receiveHelp data...');
        const receiveHelpSnap = await getDocs(collection(db, 'receiveHelp'));
        let receiveHelp = 0, payments = 0;
        receiveHelpSnap.forEach(d => {
          const amount = d.data().amount || 0;
          receiveHelp += amount;
          if (d.data().status === 'received') payments += amount;
        });
        console.log('ReceiveHelp total amount:', receiveHelp, 'Payments:', payments);
        // Fake UTR
        const utrSnap = await getDocs(collection(db, 'utrChecker'));
        const utrMap = {};
        utrSnap.forEach(d => {
          const utr = d.data().utr;
          if (utr) utrMap[utr] = (utrMap[utr] || 0) + 1;
        });
        const fakeUtr = Object.values(utrMap).filter(v => v > 1).length;
        // Screenshot Pending
        const sendHelpPending = sendHelpSnap.docs.filter(d => d.data().screenshotUrl && !d.data().screenshotVerified).length;
        // Suspicious
        const suspiciousCount = suspicious.length;

        console.log('Setting metrics and alerts...');
        setMetrics({ joins, payments, testimonials, blocked, upgrades, epinReq, epinWallet, sendHelp, receiveHelp });
        setAlerts({ fakeUtr, dupRef, pendingScreens: sendHelpPending, suspicious: suspiciousCount, multiIds });
        setUsers(users); // Save all users for alert details

        console.log('Admin Insights data fetch completed successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Admin Insights data:', error);

        if (error.code === 'permission-denied') {
          showToast('Permission Denied: Access restricted to Admins.', 'error');
        } else {
          showToast('Failed to load insights data', 'error');
        }

        setLoading(false);
        // Set default values on error
        setMetrics({ joins: 0, payments: 0, testimonials: 0, blocked: 0, upgrades: 0, epinReq: 0, epinWallet: 0, sendHelp: 0, receiveHelp: 0 });
        setAlerts({ fakeUtr: 0, dupRef: 0, pendingScreens: 0, suspicious: 0, multiIds: 0 });
      }
    };
    fetchData();
  }, []);

  // Helper: get affected users for each alert
  const getAlertUsers = (key) => {
    if (!users.length) return [];
    if (key === 'fakeUtr') {
      // Find users with duplicate UTRs in sendHelp
      // For demo, just return all users with isFakeUtr flag or similar logic
      return users.filter(u => u.isFakeUtr);
    }
    if (key === 'dupRef') {
      // Users with duplicate phone/whatsapp/ip
      const phoneMap = {}, waMap = {}, ipMap = {};
      users.forEach(u => {
        if (u.phone) phoneMap[u.phone] = (phoneMap[u.phone] || []).concat(u);
        if (u.whatsapp) waMap[u.whatsapp] = (waMap[u.whatsapp] || []).concat(u);
        if (u.ipAddress) ipMap[u.ipAddress] = (ipMap[u.ipAddress] || []).concat(u);
      });
      const dups = [];
      Object.values(phoneMap).forEach(arr => { if (arr.length > 1) dups.push(...arr); });
      Object.values(waMap).forEach(arr => { if (arr.length > 1) dups.push(...arr); });
      Object.values(ipMap).forEach(arr => { if (arr.length > 1) dups.push(...arr); });
      // Remove duplicates by id
      return Array.from(new Map(dups.map(u => [u.id, u])).values());
    }
    if (key === 'pendingScreens') {
      // Users with pending screenshot verifications in sendHelp
      // For demo, just return users with isPendingScreenshot flag
      return users.filter(u => u.isPendingScreenshot);
    }
    if (key === 'suspicious') {
      // Suspicious users
      return users.filter(u => u.isAutoBlocked); // Only auto-blocked, not by name
    }
    if (key === 'multiIds') {
      // Users with same deviceToken
      const deviceMap = {};
      users.forEach(u => {
        if (u.deviceToken) deviceMap[u.deviceToken] = (deviceMap[u.deviceToken] || []).concat(u);
      });
      const dups = [];
      Object.values(deviceMap).forEach(arr => { if (arr.length > 1) dups.push(...arr); });
      return Array.from(new Map(dups.map(u => [u.id, u])).values());
    }
    return [];
  };

  // Block user handler
  const handleBlockUser = async (user) => {
    setBlockLoading(prev => ({ ...prev, [user.id]: true }));
    const res = await updateUserStatus(user.id, 'isBlocked', true);
    if (res.success) {
      showToast('User blocked successfully', 'success');
      // Remove user from alert list
      setAlertUsers(prev => ({ ...prev, [alertDetail]: prev[alertDetail].filter(u => u.id !== user.id) }));
    } else {
      showToast('Failed to block user', 'error');
    }
    setBlockLoading(prev => ({ ...prev, [user.id]: false }));
    setConfirmBlock({ open: false, user: null });
  };

  // When alertDetail changes, update alertUsers
  useEffect(() => {
    if (alertDetail) {
      setAlertUsers(prev => ({ ...prev, [alertDetail]: getAlertUsers(alertDetail) }));
    }
  }, [alertDetail, users]);

  const alertDetailsList = {
    fakeUtr: 'List of UTRs used by multiple users (placeholder)',
    dupRef: 'List of duplicate referrals (placeholder)',
    pendingScreens: 'List of pending screenshot verifications (placeholder)',
    suspicious: 'List of suspicious users (placeholder)',
    multiIds: 'List of accounts with same device or IP (placeholder)',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <span role="img" aria-label="Admin Insights" className="text-2xl">📊</span>
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Insights Dashboard
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Monitor key metrics and security alerts in real-time</p>
        </div>
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {Object.entries({
            joins: 'New Joins (24h)',
            payments: 'Payments Received (₹)',
            testimonials: 'Testimonials Submitted',
            blocked: 'Blocked Users',
            upgrades: 'Upgrades Done (24h)',
            epinReq: 'E-PIN Requested',
            epinWallet: 'E-PIN In Wallet',
            sendHelp: 'Send Help (₹)',
            receiveHelp: 'Receive Help (₹)',
          }).map(([key, label], i) => (
            <motion.div
              key={key}
              {...cardMotion}
              transition={{ ...cardMotion.transition, delay: i * 0.08 }}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center min-h-[160px] border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group"
            >
              <div className="mb-4 p-3 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl group-hover:from-slate-600/50 group-hover:to-slate-700/50 transition-all duration-300">
                {ICONS[key]}
              </div>
              <div className="text-3xl font-bold text-white mb-3 text-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse bg-slate-600 rounded h-8 w-16"></div>
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    {key === 'sendHelp' || key === 'receiveHelp' || key === 'payments'
                      ? `₹${metrics[key]?.toLocaleString() || 0}`
                      : metrics[key]?.toLocaleString() || 0
                    }
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400 font-medium text-center leading-tight px-2">{label}</div>
            </motion.div>
          ))}
        </div>
        {/* Security Alerts */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <AlertTriangle className="text-white w-6 h-6" />
              </div>
              Security Alerts
            </h2>
            <p className="text-slate-400">Monitor potential security threats and suspicious activities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {ALERTS.map(alert => (
              <motion.button
                key={alert.key}
                {...cardMotion}
                transition={{ ...cardMotion.transition, delay: 0.2 + ALERTS.indexOf(alert) * 0.08 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col items-center border border-slate-700/50 hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-orange-900/20 hover:to-red-900/20 group"
                onClick={() => setAlertDetail(alert.key)}
              >
                <div className="mb-4 p-3 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl group-hover:from-orange-900/30 group-hover:to-red-900/30 transition-all duration-300">{alert.icon}</div>
                <div className="text-sm font-semibold text-white mb-3 text-center leading-tight px-2">{alert.label}</div>
                <div className="text-3xl font-bold text-orange-400">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse bg-slate-600 rounded h-8 w-8"></div>
                    </div>
                  ) : (
                    alerts[alert.key] || 0
                  )}
                </div>
              </motion.button>
            ))}
          </div>
          {/* Alert Details Modal (expanded) */}
          {alertDetail && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-4 sm:p-6 lg:p-8 max-w-7xl w-full max-h-[95vh] overflow-hidden relative">
                <div className="absolute top-4 right-4 z-50">
                  <button
                    className="rounded-full bg-slate-700 hover:bg-slate-600 shadow-lg border border-slate-600 text-xl text-slate-400 hover:text-white focus:text-white focus:outline-none transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-110"
                    aria-label="Close"
                    onClick={() => setAlertDetail(null)}
                  >
                    &times;
                  </button>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      {ALERTS.find(a => a.key === alertDetail)?.icon}
                    </div>
                    {ALERTS.find(a => a.key === alertDetail)?.label}
                  </h3>
                  <p className="text-slate-400">{alertDetailsList[alertDetail]}</p>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                  <table className="min-w-full text-sm text-left border border-slate-700 bg-slate-800/50 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                        <th className="px-4 py-3 font-semibold">User ID</th>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">Reason</th>
                        <th className="px-4 py-3 font-semibold">Join Date</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(alertUsers[alertDetail] || []).length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-8 text-slate-400 bg-slate-900/30">No affected users found.</td></tr>
                      ) : (alertUsers[alertDetail] || []).map(user => (
                        <tr key={user.id} className="border-b border-slate-700/50 last:border-0 bg-slate-900/20 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-300">{user.userId}</td>
                          <td className="px-4 py-3 text-white font-medium">{user.fullName}</td>
                          <td className="px-4 py-3 text-slate-300">{user.email}</td>
                          <td className="px-4 py-3 text-slate-300">{user.phone}</td>
                          <td className="px-4 py-3 text-orange-400">{alertDetail === 'fakeUtr' ? 'Duplicate UTR' : alertDetail === 'dupRef' ? 'Duplicate Referral' : alertDetail === 'pendingScreens' ? 'Pending Screenshot' : alertDetail === 'suspicious' ? 'Suspicious' : 'Multiple IDs'}</td>
                          <td className="px-4 py-3 text-slate-400">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            {user.isBlocked ? <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-900/50 text-red-300 border border-red-700 rounded-full text-xs font-medium"><Ban className="w-4 h-4" /> Blocked</span> : <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/50 text-green-300 border border-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-4 h-4" /> Active</span>}
                          </td>
                          <td className="px-4 py-3">
                            {!user.isBlocked && (
                              <button
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all duration-200 hover:shadow-lg hover:scale-105"
                                disabled={blockLoading[user.id]}
                                onClick={() => setConfirmBlock({ open: true, user })}
                              >
                                {blockLoading[user.id] ? 'Blocking...' : 'Block User'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Block confirmation dialog */}
              {confirmBlock.open && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-6 max-w-sm w-full relative">
                    <button className="absolute top-3 right-3 text-xl text-slate-400 hover:text-white transition-colors" onClick={() => setConfirmBlock({ open: false, user: null })}>&times;</button>
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-white mb-2">Block User?</h4>
                      <p className="text-slate-300 leading-relaxed">Are you sure you want to block <span className="font-semibold text-orange-400">{confirmBlock.user?.fullName}</span>?</p>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium transition-all duration-200"
                        onClick={() => setConfirmBlock({ open: false, user: null })}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
                        onClick={() => handleBlockUser(confirmBlock.user)}
                        disabled={blockLoading[confirmBlock.user?.id]}
                      >
                        Yes, Block
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInsights;