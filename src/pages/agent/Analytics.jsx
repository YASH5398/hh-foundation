import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiTrendingUp, FiUsers, FiDollarSign, FiAlertTriangle, FiMessageSquare, FiCheckCircle, FiClock, FiActivity, FiBarChart2, FiPieChart } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [analytics, setAnalytics] = useState({
    users: {
      total: 0,
      active: 0,
      newThisWeek: 0,
      growth: 0
    },
    supportTickets: {
      total: 0,
      pending: 0,
      resolved: 0,
      avgResolutionTime: 0
    },
    payments: {
      totalRevenue: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      errorRate: 0
    },
    epins: {
      totalValidated: 0,
      validEpins: 0,
      invalidEpins: 0,
      validationRate: 0
    },
    notifications: {
      total: 0,
      read: 0,
      unread: 0,
      readRate: 0
    },
    chats: {
      totalConversations: 0,
      activeChats: 0,
      avgResponseTime: 0,
      messagesCount: 0
    }
  });
  const [chartData, setChartData] = useState({
    userGrowth: [],
    ticketTrends: [],
    paymentTrends: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch Users Analytics
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeUsers = usersData.filter(user => user.status === 'active').length;
      const newUsers = usersData.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= startDate;
      }).length;

      // Fetch Support Tickets Analytics
      const ticketsSnapshot = await getDocs(collection(db, 'supportTickets'));
      const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const pendingTickets = ticketsData.filter(ticket => ticket.status === 'pending').length;
      const resolvedTickets = ticketsData.filter(ticket => ticket.status === 'resolved').length;
      
      // Calculate average resolution time
      const resolvedTicketsWithTime = ticketsData.filter(ticket => 
        ticket.status === 'resolved' && ticket.resolvedAt && ticket.createdAt
      );
      const avgResolutionTime = resolvedTicketsWithTime.length > 0 
        ? resolvedTicketsWithTime.reduce((acc, ticket) => {
            const created = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
            const resolved = ticket.resolvedAt.toDate ? ticket.resolvedAt.toDate() : new Date(ticket.resolvedAt);
            return acc + (resolved - created);
          }, 0) / resolvedTicketsWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Fetch Payment Errors Analytics
      const paymentErrorsSnapshot = await getDocs(collection(db, 'paymentErrors'));
      const paymentErrorsData = paymentErrorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalRevenue = paymentErrorsData.reduce((acc, payment) => acc + (payment.amount || 0), 0);
      const successfulTransactions = paymentErrorsData.filter(payment => payment.status === 'resolved').length;
      const failedTransactions = paymentErrorsData.filter(payment => payment.status === 'failed').length;
      const errorRate = paymentErrorsData.length > 0 
        ? (failedTransactions / paymentErrorsData.length) * 100 
        : 0;

      // Fetch E-PINs Analytics
      const epinsSnapshot = await getDocs(collection(db, 'epins'));
      const epinsData = epinsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const validEpins = epinsData.filter(epin => epin.isValid === true).length;
      const invalidEpins = epinsData.filter(epin => epin.isValid === false).length;
      const validationRate = epinsData.length > 0 
        ? (validEpins / epinsData.length) * 100 
        : 0;

      // Fetch Notifications Analytics
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const readNotifications = notificationsData.filter(notification => notification.read === true).length;
      const unreadNotifications = notificationsData.filter(notification => notification.read === false).length;
      const readRate = notificationsData.length > 0 
        ? (readNotifications / notificationsData.length) * 100 
        : 0;

      // Fetch Chats Analytics
      const chatsSnapshot = await getDocs(collection(db, 'agentChats'));
      const chatsData = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeChats = chatsData.filter(chat => chat.status === 'active').length;
      const totalMessages = chatsData.reduce((acc, chat) => acc + (chat.messageCount || 0), 0);

      // Calculate previous period for growth comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      const prevEndDate = new Date(startDate);
      
      const prevNewUsers = usersData.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= prevStartDate && createdAt < prevEndDate;
      }).length;
      
      const userGrowth = prevNewUsers > 0 
        ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 
        : newUsers > 0 ? 100 : 0;

      // Generate chart data for trends
      const userGrowthData = generateTrendData(usersData, days, 'createdAt');
      const ticketTrendsData = generateTrendData(ticketsData, days, 'createdAt');
      const paymentTrendsData = generateTrendData(paymentErrorsData, days, 'createdAt');

      setAnalytics({
        users: {
          total: usersData.length,
          active: activeUsers,
          newThisWeek: newUsers,
          growth: userGrowth
        },
        supportTickets: {
          total: ticketsData.length,
          pending: pendingTickets,
          resolved: resolvedTickets,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
        },
        payments: {
          totalRevenue,
          successfulTransactions,
          failedTransactions,
          errorRate: Math.round(errorRate * 10) / 10
        },
        epins: {
          totalValidated: epinsData.length,
          validEpins,
          invalidEpins,
          validationRate: Math.round(validationRate * 10) / 10
        },
        notifications: {
          total: notificationsData.length,
          read: readNotifications,
          unread: unreadNotifications,
          readRate: Math.round(readRate * 10) / 10
        },
        chats: {
          totalConversations: chatsData.length,
          activeChats,
          avgResponseTime: 0, // Would need message timestamps to calculate
          messagesCount: totalMessages
        }
      });

      setChartData({
        userGrowth: userGrowthData,
        ticketTrends: ticketTrendsData,
        paymentTrends: paymentTrendsData
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (data, days, dateField) => {
    const trends = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data.filter(item => {
        const itemDate = item[dateField]?.toDate ? item[dateField].toDate() : new Date(item[dateField]);
        return itemDate.toISOString().split('T')[0] === dateStr;
      }).length;
      
      trends.push({ date: dateStr, count });
    }
    
    return trends;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights and performance metrics</p>
            </div>
            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.users.total}</p>
              </div>
              <FiUsers className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active: {analytics.users.active}</span>
              <span className={`font-medium ${analytics.users.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(analytics.users.growth)}
              </span>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.supportTickets.total}</p>
              </div>
              <FiMessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pending: {analytics.supportTickets.pending}</span>
              <span className="text-gray-600">Avg: {analytics.supportTickets.avgResolutionTime}h</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.payments.totalRevenue)}</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Success: {analytics.payments.successfulTransactions}</span>
              <span className="text-red-600">Error: {analytics.payments.errorRate}%</span>
            </div>
          </div>

          {/* E-PIN Validation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">E-PIN Validations</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.epins.totalValidated}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Valid: {analytics.epins.validEpins}</span>
              <span className="text-green-600">{analytics.epins.validationRate}%</span>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
              <FiTrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-1">
              {chartData.userGrowth.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-8 min-h-[4px]"
                    style={{ height: `${Math.max((data.count / Math.max(...chartData.userGrowth.map(d => d.count), 1)) * 200, 4)}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                    {new Date(data.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Support Tickets Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Support Tickets Trend</h3>
              <FiBarChart2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-1">
              {chartData.ticketTrends.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-green-500 rounded-t w-8 min-h-[4px]"
                    style={{ height: `${Math.max((data.count / Math.max(...chartData.ticketTrends.map(d => d.count), 1)) * 200, 4)}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                    {new Date(data.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notifications Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <FiActivity className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{analytics.notifications.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Read</span>
                <span className="font-semibold text-green-600">{analytics.notifications.read}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unread</span>
                <span className="font-semibold text-red-600">{analytics.notifications.unread}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Read Rate</span>
                <span className="font-semibold">{analytics.notifications.readRate}%</span>
              </div>
            </div>
          </div>

          {/* Chat Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Agent Chats</h3>
              <FiMessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Conversations</span>
                <span className="font-semibold">{analytics.chats.totalConversations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Chats</span>
                <span className="font-semibold text-green-600">{analytics.chats.activeChats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Messages</span>
                <span className="font-semibold">{analytics.chats.messagesCount}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Avg per Chat</span>
                <span className="font-semibold">
                  {analytics.chats.totalConversations > 0 
                    ? Math.round(analytics.chats.messagesCount / analytics.chats.totalConversations)
                    : 0}
                </span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <FiPieChart className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Success Rate</span>
                <span className="font-semibold text-green-600">
                  {analytics.payments.totalRevenue > 0 
                    ? (100 - analytics.payments.errorRate).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">E-PIN Validation Rate</span>
                <span className="font-semibold text-blue-600">{analytics.epins.validationRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket Resolution Rate</span>
                <span className="font-semibold text-purple-600">
                  {analytics.supportTickets.total > 0 
                    ? ((analytics.supportTickets.resolved / analytics.supportTickets.total) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Overall Health</span>
                <span className="font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;