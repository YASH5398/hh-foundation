import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate, Routes, Route, Outlet } from 'react-router-dom';
import { 
  FiHome, FiFileText, FiDollarSign, FiMessageSquare, FiBarChart2, 
  FiBook, FiTool, FiUsers, FiBell, FiCreditCard, FiShield, 
  FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiSettings,
  FiChevronDown, FiChevronRight, FiAlertTriangle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import { toast } from 'react-hot-toast';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import AgentProfile from '../../components/agent/AgentProfile';
import AgentDashboardOverview from '../../components/agent/AgentDashboardOverview';
import { getProfileImageUrl } from '../../utils/profileUtils';

const AgentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAgentAuth();
  const { profile, loading: profileLoading } = useAgentProfile();
  
  // Define user for backward compatibility and null safety
  const user = currentUser || null;

  // Check if we're on the main dashboard route
  const isMainDashboard = location.pathname === '/agent-dashboard' || location.pathname === '/agent-dashboard/';

  // Define closeSidebar function
  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Show loading state if profile is still loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      path: '/agent-dashboard',
      badge: null
    },
    {
      id: 'support-tickets',
      label: 'Support Tickets',
      icon: FiFileText,
      path: '/agent-dashboard/support-tickets',
      badge: null
    },
    {
      id: 'payment-verification',
      label: 'Payment Verification',
      icon: FiDollarSign,
      path: '/agent-dashboard/payment-verification',
      badge: null
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: FiMessageSquare,
      path: '/agent-dashboard/communication',
      badge: null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FiBarChart2,
      path: '/agent-dashboard/analytics',
      badge: null
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: FiBook,
      path: '/agent-dashboard/knowledge-base',
      badge: null
    },
    {
      id: 'debug-tools',
      label: 'Debug Tools',
      icon: FiTool,
      path: '/agent-dashboard/debug-tools',
      badge: null
    },
    {
      id: 'agent-chat',
      label: 'Agent Chat',
      icon: FiMessageSquare,
      path: '/agent-dashboard/agent-chat',
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      path: '/agent-dashboard/notifications',
      badge: null
    },
    {
      id: 'payment-errors',
      label: 'Payment Errors',
      icon: FiCreditCard,
      path: '/agent-dashboard/payment-errors',
      badge: null
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: FiUsers,
      path: '/agent-dashboard/user-management',
      badge: null
    },
    {
      id: 'epin-checker',
      label: 'EPIN Checker',
      icon: FiCreditCard,
      path: '/agent-dashboard/epin-checker',
      badge: null
    },
    {
      id: 'user-bug-checker',
      label: 'User Bug Checker',
      icon: FiShield,
      path: '/agent-dashboard/user-bug-checker',
      badge: null
    },
    {
      id: 'suspicious-activity',
      label: 'Suspicious Activity',
      icon: FiAlertTriangle,
      path: '/agent-dashboard/suspicious-activity',
      badge: null
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/agent/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%'
        }}
        className="fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiShield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Agent Panel</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src={getProfileImageUrl(profile)}
              alt={profile?.fullName || 'Agent'}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.target.src = getProfileImageUrl(null); // Fallback to default
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || user?.email || currentUser?.email || 'Agent'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.role || 'Agent'}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              
              {/* Search */}
              <div className="hidden sm:block">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                >
                  <img
                    src={getProfileImageUrl(profile)}
                    alt={profile?.fullName || 'Agent'}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = getProfileImageUrl(null); // Fallback to default
                    }}
                  />
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                    >
                      <div className="py-1">
                        <Link
                          to="/agent-dashboard/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiUser className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                        <Link
                          to="/agent-dashboard/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiSettings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <FiLogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <ErrorBoundary>
            {isMainDashboard ? (
              <AgentDashboardOverview />
            ) : (
              <Outlet />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};



export default AgentDashboard;