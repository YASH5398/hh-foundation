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
      const joins = users.filter(u => u.createdAt && u.createdAt.toDate && u.createdAt.toDate() > new Date(Date.now() - 24*60*60*1000)).length;
      // Blocked Users
      const blocked = users.filter(u => u.isBlocked).length;
      // Upgrades Done (24h)
      const upgrades = users.filter(u => u.levelStatusChangedAt && u.levelStatusChangedAt.toDate && u.levelStatusChangedAt.toDate() > new Date(Date.now() - 24*60*60*1000)).length;
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
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3 text-gray-900 drop-shadow-sm">
        <span role="img" aria-label="Admin Insights" className="text-3xl">📊</span>
        Admin Insights
      </h1>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
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
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[120px] border border-gray-100"
          >
            <div className="mb-2">{ICONS[key]}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? <span className="animate-pulse text-gray-400">...</span> : metrics[key]?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 font-medium text-center">{label}</div>
          </motion.div>
        ))}
      </div>
      {/* Security Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><AlertTriangle className="text-yellow-600 w-6 h-6" /> Security Alerts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALERTS.map(alert => (
            <motion.button
              key={alert.key}
              {...cardMotion}
              transition={{ ...cardMotion.transition, delay: 0.2 + ALERTS.indexOf(alert) * 0.08 }}
              className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center border border-gray-100 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              onClick={() => setAlertDetail(alert.key)}
            >
              <div className="mb-2">{alert.icon}</div>
              <div className="text-lg font-semibold text-gray-800 mb-1">{alert.label}</div>
              <div className="text-2xl font-bold text-yellow-700">{loading ? <span className="animate-pulse text-gray-400">...</span> : alerts[alert.key]}</div>
            </motion.button>
          ))}
        </div>
        {/* Alert Details Modal (expanded) */}
        {alertDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-3xl w-full relative">
              <div className="absolute top-0 right-0 z-50 p-2">
                <button
                  className="rounded-full bg-white shadow border border-gray-200 text-3xl text-gray-400 hover:text-red-500 focus:text-red-600 focus:outline-none transition w-10 h-10 flex items-center justify-center"
                  aria-label="Close"
                  onClick={() => setAlertDetail(null)}
                >
                  &times;
                </button>
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">{ALERTS.find(a => a.key === alertDetail)?.icon} {ALERTS.find(a => a.key === alertDetail)?.label}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border border-gray-200 bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-800 border-b border-gray-200">
                      <th className="px-3 py-2">User ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Reason</th>
                      <th className="px-3 py-2">Join Date</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(alertUsers[alertDetail] || []).length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-6 text-gray-400 bg-white">No affected users found.</td></tr>
                    ) : (alertUsers[alertDetail] || []).map(user => (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50 transition">
                        <td className="px-3 py-2 font-mono text-gray-900">{user.userId}</td>
                        <td className="px-3 py-2 text-gray-900">{user.fullName}</td>
                        <td className="px-3 py-2 text-gray-900">{user.email}</td>
                        <td className="px-3 py-2 text-gray-900">{user.phone}</td>
                        <td className="px-3 py-2 text-gray-700">{alertDetail === 'fakeUtr' ? 'Duplicate UTR' : alertDetail === 'dupRef' ? 'Duplicate Referral' : alertDetail === 'pendingScreens' ? 'Pending Screenshot' : alertDetail === 'suspicious' ? 'Suspicious' : 'Multiple IDs'}</td>
                        <td className="px-3 py-2 text-gray-700">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2">
                          {user.isBlocked ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs"><Ban className="w-4 h-4" /> Blocked</span> : <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs"><CheckCircle className="w-4 h-4" /> Not Blocked</span>}
                        </td>
                        <td className="px-3 py-2">
                          {!user.isBlocked && (
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-60"
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
              <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full relative">
                  <button className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setConfirmBlock({ open: false, user: null })}>&times;</button>
                  <h4 className="text-lg font-bold mb-3">Block User?</h4>
                  <p className="mb-4 text-gray-700">Are you sure you want to block <span className="font-semibold">{confirmBlock.user?.fullName}</span>?</p>
                  <div className="flex gap-3 justify-end">
                    <button className="px-4 py-1 rounded bg-gray-200 text-gray-700" onClick={() => setConfirmBlock({ open: false, user: null })}>Cancel</button>
                    <button className="px-4 py-1 rounded bg-red-600 text-white font-bold" onClick={() => handleBlockUser(confirmBlock.user)} disabled={blockLoading[confirmBlock.user?.id]}>Yes, Block</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInsights;