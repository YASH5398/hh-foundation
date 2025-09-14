import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiFileText, FiDollarSign, FiShield, FiUsers, FiClock, 
  FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiMessageSquare,
  FiRefreshCw
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
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

    // Assigned Tickets to current agent
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

    // Pending Payment Verifications
    const pendingPaymentsQuery = query(
      collection(db, 'sendHelp'),
      where('status', '==', 'Pending')
    );
    unsubscribers.push(
      onSnapshot(pendingPaymentsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, pendingPayments: snapshot.size }));
      })
    );

    // Agent Escalation Requests
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

    // Tickets resolved today by this agent
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedTodayQuery = query(
      collection(db, 'supportTickets'),
      where('agentId', '==', currentUser.uid),
      where('status', '==', 'resolved'),
      where('updatedAt', '>=', today)
    );
    unsubscribers.push(
      onSnapshot(resolvedTodayQuery, (snapshot) => {
        setStats(prev => ({ ...prev, resolvedToday: snapshot.size }));
      })
    );

    // Recent Activity - Recent tickets and payments
    const recentTicketsQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    unsubscribers.push(
      onSnapshot(recentTicketsQuery, (ticketsSnapshot) => {
        const tickets = ticketsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'ticket',
          title: doc.data().subject || 'Support Ticket',
          status: doc.data().status,
          timestamp: doc.data().createdAt,
          priority: doc.data().priority,
          userId: doc.data().userId
        }));

        // Get recent payments
        const recentPaymentsQuery = query(
          collection(db, 'sendHelp'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        onSnapshot(recentPaymentsQuery, (paymentsSnapshot) => {
          const payments = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            type: 'payment',
            title: `Payment Verification - ₹${doc.data().amount || 0}`,
            status: doc.data().status,
            timestamp: doc.data().createdAt,
            userId: doc.data().senderId
          }));

          // Combine and sort by timestamp
          const combined = [...tickets, ...payments]
            .sort((a, b) => {
              const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
              const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
              return bTime - aTime;
            })
            .slice(0, 8);

          setRecentActivity(combined);
          setLoading(false);
        });
      })
    );

    setLastRefresh(new Date());

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser?.uid]);

  const refreshData = () => {
    setLastRefresh(new Date());
    toast.success('Data refreshed');
  };

  const getStatusColor = (status, type) => {
    if (type === 'ticket') {
      switch (status) {
        case 'pending': return 'text-orange-600 bg-orange-100';
        case 'in-progress': return 'text-blue-600 bg-blue-100';
        case 'resolved': return 'text-green-600 bg-green-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    } else {
      switch (status) {
        case 'Pending': return 'text-yellow-600 bg-yellow-100';
        case 'Confirmed': return 'text-green-600 bg-green-100';
        case 'Rejected': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    }
  };

  const getActivityIcon = (type, status) => {
    if (type === 'ticket') {
      return status === 'resolved' ? FiCheckCircle : FiFileText;
    }
    return FiDollarSign;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refreshData}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTickets}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedTickets}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payment Verifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiShield className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Escalations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.escalations}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/agent-dashboard/support-tickets"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <FiFileText className="w-5 h-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <span className="text-blue-700 font-medium">View Support Tickets</span>
                {stats.assignedTickets > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                    {stats.assignedTickets} assigned
                  </span>
                )}
              </div>
            </Link>
            
            <Link
              to="/agent-dashboard/payment-verification"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <FiDollarSign className="w-5 h-5 text-green-600 mr-3" />
              <div className="flex-1">
                <span className="text-green-700 font-medium">Payment Verification</span>
                {stats.pendingPayments > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                    {stats.pendingPayments} pending
                  </span>
                )}
              </div>
            </Link>
            
            <Link
              to="/agent-dashboard/communication"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <FiMessageSquare className="w-5 h-5 text-purple-600 mr-3" />
              <span className="text-purple-700 font-medium">Open Communication</span>
            </Link>
            
            {stats.escalations > 0 && (
              <Link
                to="/agent-dashboard/escalations"
                className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group"
              >
                <FiShield className="w-5 h-5 text-yellow-600 mr-3" />
                <div className="flex-1">
                  <span className="text-yellow-700 font-medium">View Escalations</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                    {stats.escalations} pending
                  </span>
                </div>
              </Link>
            )}
          </div>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type, activity.status);
                return (
                  <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status, activity.type)}`}>
                          {activity.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FiClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentDashboardOverview;