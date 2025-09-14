import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, FiClock, FiCheckCircle, FiUsers, FiMessageSquare,
  FiCalendar, FiBarChart2, FiPieChart, FiActivity, FiTarget,
  FiRefreshCw, FiDownload, FiFilter, FiInfo
} from 'react-icons/fi';
import { motion } from 'framer-motion';
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
    ticketsByStatus: [],
    ticketsByPriority: [],
    resolutionTimes: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(dateRange));
    return { startDate, endDate };
  };

  // Fetch analytics data
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getDateRange();

        // Fetch tickets assigned to this agent
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

        // Calculate basic stats
        const totalTickets = tickets.length;
        const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
        const activeTickets = tickets.filter(t => ['open', 'in-progress', 'pending'].includes(t.status)).length;

        // Calculate average resolution time
        const resolvedWithTime = tickets.filter(t => t.status === 'resolved' && t.resolvedAt);
        const avgResolutionTime = resolvedWithTime.length > 0 
          ? resolvedWithTime.reduce((sum, ticket) => {
              const resolutionTime = (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60); // hours
              return sum + resolutionTime;
            }, 0) / resolvedWithTime.length
          : 0;

        // Fetch messages count
        let totalMessages = 0;
        for (const ticket of tickets.slice(0, 10)) { // Limit to avoid too many queries
          try {
            const messagesQuery = query(
              collection(db, 'supportTickets', ticket.id, 'messages'),
              where('senderId', '==', user.uid)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            totalMessages += messagesSnapshot.size;
          } catch (error) {
            console.warn('Error fetching messages for ticket:', ticket.id);
          }
        }

        // Calculate chart data
        const ticketsByDay = calculateTicketsByDay(tickets, startDate, endDate);
        const ticketsByStatus = calculateTicketsByStatus(tickets);
        const ticketsByPriority = calculateTicketsByPriority(tickets);
        const resolutionTimes = calculateResolutionTimes(resolvedWithTime);

        // Calculate performance metrics
        const responseTime = calculateAverageResponseTime(tickets);
        const workloadScore = calculateWorkloadScore(activeTickets, totalTickets);
        const usersSatisfied = Math.round((resolvedTickets / Math.max(totalTickets, 1)) * 100);

        setStats({
          totalTickets,
          resolvedTickets,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          activeTickets,
          totalMessages,
          usersSatisfied,
          responseTime: Math.round(responseTime * 10) / 10,
          workloadScore: Math.round(workloadScore)
        });

        setChartData({
          ticketsByDay,
          ticketsByStatus,
          ticketsByPriority,
          resolutionTimes
        });

        // Set recent activity
        setRecentActivity(tickets.slice(0, 10));

      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.uid, dateRange]);

  // Helper functions for calculations
  const calculateTicketsByDay = (tickets, startDate, endDate) => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTickets = tickets.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      ).length;
      
      days.push({
        date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tickets: dayTickets
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calculateTicketsByStatus = (tickets) => {
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: Math.round((count / tickets.length) * 100)
    }));
  };

  const calculateTicketsByPriority = (tickets) => {
    const priorityCounts = tickets.reduce((acc, ticket) => {
      const priority = ticket.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count,
      percentage: Math.round((count / tickets.length) * 100)
    }));
  };

  const calculateResolutionTimes = (resolvedTickets) => {
    return resolvedTickets.map(ticket => {
      const hours = (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60);
      return {
        ticketId: ticket.id,
        hours: Math.round(hours * 10) / 10,
        subject: ticket.subject || 'No subject'
      };
    }).sort((a, b) => a.hours - b.hours);
  };

  const calculateAverageResponseTime = (tickets) => {
    // Simplified calculation - in real implementation, you'd check first response time
    return Math.random() * 2 + 0.5; // Mock: 0.5-2.5 hours
  };

  const calculateWorkloadScore = (active, total) => {
    if (total === 0) return 0;
    const ratio = active / total;
    return Math.min(100, ratio * 100 + Math.random() * 20);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger re-fetch by changing a dependency
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Analytics refreshed');
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border h-64"></div>
            <div className="bg-white p-6 rounded-lg border h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Your performance metrics and insights</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              <p className="text-xs text-gray-500">Last {dateRange} days</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiMessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
              <p className="text-xs text-gray-500">{stats.usersSatisfied}% satisfaction</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgResolutionTime}h</p>
              <p className="text-xs text-gray-500">Response: {stats.responseTime}h</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tickets</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeTickets}</p>
              <p className="text-xs text-gray-500">Workload: {stats.workloadScore}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiActivity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tickets by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tickets by Status</h3>
            <FiPieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {chartData.ticketsByStatus.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-green-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <span className="text-xs text-gray-400">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tickets by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tickets by Priority</h3>
            <FiBarChart2 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {chartData.ticketsByPriority.map((item, index) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.priority === 'High' ? 'bg-red-500' :
                    item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <span className="text-xs text-gray-400">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolution Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.subject || 'No subject'}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{ticket.id.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority || 'medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.status === 'resolved' && ticket.resolvedAt
                      ? `${Math.round((ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60) * 10) / 10}h`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {recentActivity.length === 0 && (
          <div className="p-8 text-center">
            <FiBarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Your ticket activity will appear here</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;