import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText, FiDollarSign, FiShield, FiUsers, FiClock,
  FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiMessageSquare,
  FiRefreshCw, FiArrowRight, FiZap
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const AgentDashboardOverview = () => {
  const { currentUser } = useAgentAuth();
  const [stats, setStats] = useState({
    pendingTickets: 0,
    assignedTickets: 0,
    pendingPayments: 0,
    escalations: 0,
    activeUsers: 0,
    resolvedToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribers = [];

    // Pending Support Tickets
    const pendingTicketsQuery = query(
      collection(db, 'supportTickets'),
      where('status', '==', 'pending')
    );
    unsubscribers.push(
      onSnapshot(pendingTicketsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, pendingTickets: snapshot.size }));
      })
    );

    // Assigned Tickets
    const assignedTicketsQuery = query(
      collection(db, 'supportTickets'),
      where('agentId', '==', currentUser.uid),
      where('status', 'in', ['pending', 'in-progress'])
    );
    unsubscribers.push(
      onSnapshot(assignedTicketsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, assignedTickets: snapshot.size }));
      })
    );

    // Pending Payments
    const pendingPaymentsQuery = query(
      collection(db, 'sendHelp'),
      where('status', '==', 'Pending')
    );
    unsubscribers.push(
      onSnapshot(pendingPaymentsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, pendingPayments: snapshot.size }));
      })
    );

    // Escalations
    const escalationsQuery = query(
      collection(db, 'agentRequests'),
      where('agentId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    unsubscribers.push(
      onSnapshot(escalationsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, escalations: snapshot.size }));
      })
    );

    // Active Users
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('isActivated', '==', true)
    );
    unsubscribers.push(
      onSnapshot(activeUsersQuery, (snapshot) => {
        setStats(prev => ({ ...prev, activeUsers: snapshot.size }));
      })
    );

    // Resolved today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedTodayQuery = query(
      collection(db, 'supportTickets'),
      where('agentId', '==', currentUser.uid),
      where('status', '==', 'resolved'),
      where('updatedAt', '>=', startOfDay)
    );
    unsubscribers.push(
      onSnapshot(resolvedTodayQuery, (snapshot) => {
        setStats(prev => ({ ...prev, resolvedToday: snapshot.size }));
      })
    );

    // Activity Feed
    const recentTicketsQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    unsubscribers.push(
      onSnapshot(recentTicketsQuery, (ts) => {
        const tickets = ts.docs.map(doc => ({ id: doc.id, type: 'ticket', ...doc.data() }));
        const recentPaymentsQuery = query(collection(db, 'sendHelp'), orderBy('createdAt', 'desc'), limit(5));
        onSnapshot(recentPaymentsQuery, (ps) => {
          const payments = ps.docs.map(doc => ({ id: doc.id, type: 'payment', ...doc.data() }));
          const combined = [...tickets, ...payments]
            .sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate() : 0))
            .slice(0, 8);
          setRecentActivity(combined);
          setLoading(false);
        });
      })
    );

    setLastRefresh(new Date());
    return () => unsubscribers.forEach(u => u());
  }, [currentUser?.uid]);

  const refreshAction = () => {
    setLastRefresh(new Date());
    toast.success('System Status Updated');
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-10 bg-slate-800/50 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/20 rounded-3xl border border-slate-800 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-800/20 rounded-3xl border border-slate-800 animate-pulse"></div>
          <div className="h-96 bg-slate-800/20 rounded-3xl border border-slate-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FiZap className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Real-time Operations</span>
          </div>
          <h2 className="text-4xl font-black text-white">Console Overview</h2>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/40 p-1.5 pl-4 rounded-2xl border border-slate-800 shadow-inner">
          <span className="text-slate-500 text-xs font-mono">LATEST UPDATE: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={refreshAction}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          label="Awaiting Support"
          value={stats.pendingTickets}
          icon={FiFileText}
          color="amber"
          delay={0.1}
        />
        <StatCard
          label="My Active Tickets"
          value={stats.assignedTickets}
          icon={FiZap}
          color="blue"
          delay={0.2}
        />
        <StatCard
          label="Pending Payments"
          value={stats.pendingPayments}
          icon={FiDollarSign}
          color="emerald"
          delay={0.3}
        />
        <StatCard
          label="My Escalations"
          value={stats.escalations}
          icon={FiAlertTriangle}
          color="rose"
          delay={0.4}
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers}
          icon={FiUsers}
          color="indigo"
          delay={0.5}
        />
        <StatCard
          label="Resolved Today"
          value={stats.resolvedToday}
          icon={FiCheckCircle}
          color="emerald"
          delay={0.6}
        />
      </div>

      {/* Content Layers */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Quick Command Center */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="xl:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Active Channels</h3>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase">Priority Routing</span>
          </div>

          <div className="space-y-4">
            <ActionRow
              to="/agent-dashboard/support-tickets"
              icon={FiFileText}
              label="Support Queue"
              sub={stats.pendingTickets > 0 ? `${stats.pendingTickets} tickets need action` : "Queue is clear"}
              count={stats.pendingTickets}
              color="amber"
            />
            <ActionRow
              to="/agent-dashboard/payment-verification"
              icon={FiDollarSign}
              label="Ledger Audit"
              sub="Verify incoming help requests"
              count={stats.pendingPayments}
              color="emerald"
            />
            <ActionRow
              to="/agent-dashboard/communication"
              icon={FiMessageSquare}
              label="Global Comms"
              sub="Internal agent chat channels"
              color="indigo"
            />
          </div>
        </motion.div>

        {/* Activity Stream */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="xl:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Event Horizon</h3>
            <FiTrendingUp className="text-slate-500 w-5 h-5" />
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-4 custom-scrollbar">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <ActivityItem key={activity.id + idx} activity={activity} />
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-800/40 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <FiClock className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-500 font-medium">Monitoring status: Idle</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* --- Sub-Components for Cleanliness --- */

const StatCard = ({ label, value, icon: Icon, color, delay }) => {
  const colors = {
    blue: 'from-blue-600/20 to-blue-400/5 text-blue-400 border-blue-500/20',
    amber: 'from-amber-600/20 to-amber-400/5 text-amber-400 border-amber-500/20',
    emerald: 'from-emerald-600/20 to-emerald-400/5 text-emerald-400 border-emerald-500/20',
    rose: 'from-rose-600/20 to-rose-400/5 text-rose-400 border-rose-500/20',
    indigo: 'from-indigo-600/20 to-indigo-400/5 text-indigo-400 border-indigo-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden p-6 rounded-[2rem] border bg-gradient-to-br ${colors[color]} group transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-current/10 border border-current/20`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-white mb-1 tabular-nums">{value}</p>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{label}</p>
    </motion.div>
  );
};

const ActionRow = ({ to, icon: Icon, label, sub, count, color }) => {
  const c = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <Link to={to} className="group flex items-center p-5 bg-slate-800/30 rounded-3xl border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all">
      <div className={`p-3 rounded-2xl mr-5 ${c[color]} transition-transform group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-white font-bold group-hover:text-blue-400 transition-colors">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
      </div>
      {count > 0 ? (
        <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-blue-600/20">
          {count}
        </span>
      ) : (
        <FiArrowRight className="text-slate-700 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
      )}
    </Link>
  );
};

const ActivityItem = ({ activity }) => {
  const isTicket = activity.type === 'ticket';
  const timestamp = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date();

  return (
    <div className="group flex items-center p-4 rounded-[1.5rem] bg-slate-900/30 hover:bg-slate-800/40 border border-transparent hover:border-slate-700/30 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-lg ${isTicket ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
        {isTicket ? <FiFileText className="w-6 h-6" /> : <FiDollarSign className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-slate-200 truncate pr-4">
            {isTicket ? (activity.subject || "Support Request") : `Payment Confirmation: ₹${activity.amount || 0}`}
          </p>
          <span className="text-[10px] font-mono text-slate-600 shrink-0 uppercase tracking-tighter">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${activity.status === 'pending' || activity.status === 'Pending' ? 'text-amber-400 bg-amber-400/5 border-amber-400/20' : 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20'
            }`}>
            {activity.status}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">#{activity.id?.slice(-6).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardOverview;