import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp, FiClock, FiCheckCircle, FiUsers, FiMessageSquare,
  FiCalendar, FiBarChart2, FiPieChart, FiActivity, FiTarget,
  FiRefreshCw, FiDownload, FiFilter, FiInfo, FiZap, FiBox, FiCpu
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, onSnapshot, orderBy,
  getDocs, startAfter, limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days
  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    activeTickets: 0,
    totalMessages: 0,
    usersSatisfied: 0,
    responseTime: 0,
    workloadScore: 0
  });
  const [chartData, setChartData] = useState({
    ticketsByDay: [],
    statusBreakdown: [],
    priorityBreakdown: [],
    resolutionTimes: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(dateRange));
    return { startDate, endDate };
  };

  useEffect(() => {
    if (!user?.uid) return;
    fetchAnalytics();
  }, [user?.uid, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('agentId', '==', user.uid),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );

      const ticketsSnapshot = await getDocs(ticketsQuery);
      const tickets = ticketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate?.()
      }));

      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      const activeTickets = tickets.filter(t => ['open', 'in-progress', 'pending'].includes(t.status)).length;

      const resolvedWithTime = tickets.filter(t => t.status === 'resolved' && t.resolvedAt);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, ticket) => {
          const resolutionTime = (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60);
          return sum + resolutionTime;
        }, 0) / resolvedWithTime.length
        : 0;

      const statusBreakdown = ['pending', 'in-progress', 'resolved', 'closed'].map(status => {
        const count = tickets.filter(t => t.status === status).length;
        return { status, count, percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0 };
      });

      const priorityBreakdown = ['high', 'medium', 'low'].map(priority => {
        const count = tickets.filter(t => (t.priority || 'medium') === priority).length;
        return { priority, count, percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0 };
      });

      setStats({
        totalTickets,
        resolvedTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        activeTickets,
        totalMessages: Math.floor(totalTickets * 4.5), // Simulated for speed
        usersSatisfied: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100,
        responseTime: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
        workloadScore: totalTickets > 0 ? Math.round((activeTickets / totalTickets) * 100) : 0
      });

      setChartData({
        statusBreakdown,
        priorityBreakdown,
        ticketsByDay: [], // Mocking line chart data if needed
      });

      setRecentActivity(tickets.slice(0, 10));
    } catch (error) {
      console.error('Analytics Fetch Error:', error);
      toast.error('System telemetry failure');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Telemetry Refreshed');
  };

  const MetricCard = ({ title, value, subtext, icon: Icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-${color}-500/20 transition-all`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
          <div className="flex items-center gap-1.5 py-1">
            <FiTrendingUp className={`w-3 h-3 text-${color}-500`} />
            <p className="text-[10px] font-bold text-slate-400">{subtext}</p>
          </div>
        </div>
        <div className={`p-4 bg-slate-950/80 rounded-2xl border border-white/5 text-${color}-500 shadow-xl group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 text-center">
        <FiCpu className="w-12 h-12 text-blue-500 animate-spin mx-auto opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse text-white">Aggregating Telemetry</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Real-time agent performance nexus
          </p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white px-4 focus:outline-none"
          >
            <option value="7">Phase: 07 Units</option>
            <option value="30">Phase: 30 Units</option>
            <option value="90">Phase: 90 Units</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Volume" value={stats.totalTickets} subtext="Global interactions" icon={FiMessageSquare} color="blue" delay={0.1} />
        <MetricCard title="Efficiency Rate" value={`${stats.usersSatisfied}%`} subtext={`${stats.resolvedTickets} Resolved`} icon={FiTarget} color="emerald" delay={0.2} />
        <MetricCard title="Avg Latency" value={`${stats.avgResolutionTime}h`} subtext="From genesis to resolution" icon={FiClock} color="indigo" delay={0.3} />
        <MetricCard title="System Load" value={`${stats.workloadScore}%`} subtext={`${stats.activeTickets} Active Nodes`} icon={FiZap} color="orange" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="p-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px]"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500 border border-blue-500/20">
                <FiPieChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Status Distribution</h3>
            </div>
          </div>
          <div className="space-y-6">
            {chartData.statusBreakdown.map((item, i) => (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{item.status}</span>
                  <span className="text-[10px] font-black text-white font-mono">{Math.round(item.percentage)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.status === 'resolved' ? 'from-emerald-600 to-emerald-400' :
                        item.status === 'in-progress' ? 'from-blue-600 to-blue-400' :
                          item.status === 'pending' ? 'from-orange-600 to-orange-400' :
                            'from-slate-600 to-slate-400'
                      }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="p-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px]"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-600/10 rounded-xl text-orange-500 border border-orange-500/20">
                <FiBarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Priority Spectrum</h3>
            </div>
          </div>
          <div className="flex items-end justify-around h-48 gap-4 pt-4">
            {chartData.priorityBreakdown.map((item, i) => (
              <div key={item.priority} className="flex flex-col items-center flex-1 space-y-4 h-full justify-end">
                <div className="relative w-full flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${item.percentage || 5}%` }}
                    transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
                    className={`w-full rounded-2xl relative group bg-gradient-to-t ${item.priority === 'high' ? 'from-red-600/80 to-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                        item.priority === 'medium' ? 'from-orange-600/80 to-orange-400/80 shadow-[0_0_20px_rgba(249,115,22,0.2)]' :
                          'from-emerald-600/80 to-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      }`}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 px-2 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <p className="text-[10px] font-black text-white">{item.count} items</p>
                    </div>
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{item.priority}</p>
                  <p className="text-[9px] font-bold text-slate-500 font-mono">{Math.round(item.percentage)}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <FiActivity className="text-blue-500 w-5 h-5" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Activity Stream</h3>
          </div>
          <div className="px-3 py-1 bg-slate-950 rounded-lg border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Logs: <span className="text-white">{recentActivity.length}</span></p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descriptor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vector</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal Log</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {recentActivity.map((ticket, i) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-blue-600/5 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white uppercase group-hover:text-blue-400 transition-colors">{ticket.subject || 'UNIDENTIFIED'}</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">SIG#{ticket.id.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full relative ${ticket.status === 'resolved' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                            ticket.status === 'in-progress' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                              'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                          }`}>
                          {ticket.status !== 'resolved' && <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit"></span>}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 text-[8px] font-black rounded border uppercase tracking-widest ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          ticket.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ticket.createdAt.toLocaleDateString()}</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-1">{ticket.createdAt.toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-white font-mono">
                        {ticket.status === 'resolved' && ticket.resolvedAt
                          ? `${Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60) * 10) / 10}H`
                          : 'REALTIME'
                        }
                      </p>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {recentActivity.length === 0 && (
            <div className="p-20 text-center space-y-4 opacity-20">
              <FiBox className="w-16 h-16 mx-auto stroke-[1]" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">No Active Telemetry</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;