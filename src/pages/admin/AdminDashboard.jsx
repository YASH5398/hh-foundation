import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, User, CreditCard, FileText, Ban, TrendingUp, Wallet, Coins, ArrowDownCircle, ArrowUpCircle, Users, ShieldAlert } from 'lucide-react';

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

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    joins: 0, payments: 0, testimonials: 0, blocked: 0, upgrades: 0, epinReq: 0, epinWallet: 0, sendHelp: 0, receiveHelp: 0
  });
  const [alerts, setAlerts] = useState({
    fakeUtr: 0, dupRef: 0, pendingScreens: 0, suspicious: 0, multiIds: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertDetail, setAlertDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 24h window
      const now = Timestamp.now();
      const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      // Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
      const testimonials = testimonialsSnap.size;
      // E-PIN Requests
      const epinReqSnap = await getDocs(collection(db, 'epinRequests'));
      const epinReq = epinReqSnap.size;
      // SendHelp
      const sendHelpSnap = await getDocs(collection(db, 'sendHelp'));
      let sendHelp = 0;
      sendHelpSnap.forEach(d => { sendHelp += d.data().amount || 0; });
      // ReceiveHelp
      const receiveHelpSnap = await getDocs(collection(db, 'receiveHelp'));
      let receiveHelp = 0, payments = 0;
      receiveHelpSnap.forEach(d => {
        receiveHelp += d.data().amount || 0;
        if (d.data().status === 'received') payments += d.data().amount || 0;
      });
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
      setMetrics({ joins, payments, testimonials, blocked, upgrades, epinReq, epinWallet, sendHelp, receiveHelp });
      setAlerts({ fakeUtr, dupRef, pendingScreens: sendHelpPending, suspicious: suspiciousCount, multiIds });
      setLoading(false);
    };
    fetchData();
  }, []);

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
        {/* Alert Details Modal (placeholder) */}
        {alertDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative">
              <button className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setAlertDetail(null)}>&times;</button>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">{ALERTS.find(a => a.key === alertDetail)?.icon} {ALERTS.find(a => a.key === alertDetail)?.label}</h3>
              <div className="text-gray-700">{alertDetailsList[alertDetail]}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 