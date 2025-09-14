import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { FiFileText, FiAlertTriangle, FiX, FiMenu, FiHome, FiMessageSquare, FiBell, FiDollarSign, FiUsers, FiBarChart2, FiCreditCard, FiLoader } from 'react-icons/fi';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const AgentDashboard = () => {
  const [pendingTickets, setPendingTickets] = useState(0);
  const [resolvedTickets, setResolvedTickets] = useState(0);
  const [recentTickets, setRecentTickets] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigationSidebarOpen, setNavigationSidebarOpen] = useState(false);
  const location = useLocation();

  // Check if we're on a nested route
  const isNestedRoute = location.pathname !== '/agent-dashboard';

  useEffect(() => {
    // Fetch pending tickets count
    const pendingQuery = query(
      collection(db, 'tickets'),
      where('status', '==', 'pending')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      setPendingTickets(snapshot.size);
    });

    // Fetch resolved tickets count
    const resolvedQuery = query(
      collection(db, 'tickets'),
      where('status', '==', 'resolved')
    );

    const unsubscribeResolved = onSnapshot(resolvedQuery, (snapshot) => {
      setResolvedTickets(snapshot.size);
    });

    // Fetch recent tickets
    const recentQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentTickets(tickets);
    });

    return () => {
      unsubscribePending();
      unsubscribeResolved();
      unsubscribeRecent();
    };
  }, []);

  useEffect(() => {
    // Simulate suspicious activity detection
    const detectSuspiciousActivity = () => {
      const activities = [
        {
          id: 1,
          type: 'Multiple Failed Login Attempts',
          user: 'user@example.com',
          timestamp: new Date().toLocaleString(),
          severity: 'high',
          details: 'User attempted to login 5 times with incorrect password'
        },
        {
          id: 2,
          type: 'Unusual Data Access Pattern',
          user: 'admin@company.com',
          timestamp: new Date(Date.now() - 300000).toLocaleString(),
          severity: 'medium',
          details: 'Accessed sensitive files outside normal working hours'
        },
        {
          id: 3,
          type: 'Suspicious File Download',
          user: 'employee@company.com',
          timestamp: new Date(Date.now() - 600000).toLocaleString(),
          severity: 'low',
          details: 'Downloaded large amount of data in short time period'
        }
      ];
      setSuspiciousActivities(activities);
    };

    // Run initial detection
    detectSuspiciousActivity();

    // Set up periodic detection (every 30 seconds)
    const interval = setInterval(detectSuspiciousActivity, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleActivityClick = (activity) => {
    setSidebarOpen(true);
    // Removed toast notification for instant navigation
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
      {/* Navigation Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        navigationSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Agent Panel</h1>
          <button
            onClick={() => setNavigationSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 space-y-2">
            <Link 
              to="/agent-dashboard" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiHome className="mr-3" size={20} />
              Dashboard
            </Link>
            <Link 
              to="/agent-dashboard/support-tickets" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/support-tickets' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiFileText className="mr-3" size={20} />
              Support Tickets
            </Link>
            <Link 
              to="/agent-dashboard/agent-chat" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/agent-chat' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiMessageSquare className="mr-3" size={20} />
              Agent Chat
            </Link>
            <Link 
              to="/agent-dashboard/notifications" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/notifications' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiBell className="mr-3" size={20} />
              Notifications
            </Link>
            <Link 
              to="/agent-dashboard/payment-errors" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/payment-errors' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiDollarSign className="mr-3" size={20} />
              Payment Errors
            </Link>
            <Link 
              to="/agent-dashboard/user-management" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/user-management' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiUsers className="mr-3" size={20} />
              User Management
            </Link>
            <Link 
              to="/agent-dashboard/analytics" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/analytics' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiBarChart2 className="mr-3" size={20} />
              Analytics
            </Link>
            <Link 
              to="/agent-dashboard/epin-checker" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/epin-checker' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiCreditCard className="mr-3" size={20} />
              EPIN Checker
            </Link>
            <Link 
              to="/agent-dashboard/user-bug-checker" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/agent-dashboard/user-bug-checker' 
                  ? 'text-gray-700 bg-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiAlertTriangle className="mr-3" size={20} />
              User Bug Checker
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 w-full overflow-x-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setNavigationSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 mr-4"
              >
                <FiMenu size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Agent Dashboard</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiAlertTriangle size={20} />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 w-full overflow-x-hidden">
          {isNestedRoute ? (
            <ErrorBoundary fallbackMessage="Failed to load this section. Please try refreshing or contact support if the issue persists.">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FiLoader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                  </div>
                </div>
              }>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Tickets</p>
                      <p className="text-2xl font-bold text-orange-600">{pendingTickets}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <FiFileText className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved Tickets</p>
                      <p className="text-2xl font-bold text-green-600">{resolvedTickets}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FiFileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-blue-600">1,234</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FiUsers className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">₹45,678</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FiDollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                </div>
                <div className="p-4 md:p-6">
                  {recentTickets.length > 0 ? (
                    <div className="space-y-4">
                      {recentTickets.map((ticket) => (
                        <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate">{ticket.subject || 'No Subject'}</h4>
                            <p className="text-sm text-gray-600 truncate">{ticket.description || 'No Description'}</p>
                            <p className="text-xs text-gray-500">Created: {formatDate(ticket.createdAt)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-center ${
                            getStatusColor(ticket.status)
                          }`}>
                            {ticket.status || 'Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recent tickets found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suspicious Activities */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Suspicious Activities</h3>
                </div>
                <div className="p-4 md:p-6">
                  <div className="space-y-4">
                    {suspiciousActivities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">{activity.type}</h4>
                          <p className="text-sm text-gray-600 truncate">{activity.user}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-center ${
                          getSeverityColor(activity.severity)
                        }`}>
                          {activity.severity.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Overlay for mobile navigation */}
        {navigationSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setNavigationSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar for Activity Details */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-lg transform transition-transform">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <p className="text-gray-600">Detailed information about suspicious activities will be displayed here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;