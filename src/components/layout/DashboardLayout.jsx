import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiSend,
  FiCalendar,
  FiDownload,
  FiBarChart2,
  FiUsers,
  FiKey,
  FiHelpCircle,
  FiUser,
  FiMenu,
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import UserMenu from '../common/UserMenu';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Sidebar open by default on desktop
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        menuItems={[
          { name: 'Dashboard', icon: FiHome, route: '/dashboard' },
          { name: 'Send Help', icon: FiSend, route: '/dashboard/send-help' },
          { name: 'Upcoming Payment', icon: FiCalendar, route: '/dashboard/upcoming-payment' },
          { name: 'Receive Help', icon: FiDownload, route: '/dashboard/receive-help' },
          { name: 'Leaderboard', icon: FiBarChart2, route: '/dashboard/leaderboard' },
          { name: 'Direct Referrals', icon: FiUsers, route: '/dashboard/direct-referral' },
          {
            name: 'E-PIN',
            icon: FiKey,
            submenu: [
              { name: 'Request E-PIN', route: '/dashboard/epins/request' },
              { name: 'Transfer E-PIN', route: '/dashboard/epins/transfer' },
              { name: 'E-PIN History', route: '/dashboard/epins/history' },
            ],
          },
          {
            name: 'Support',
            icon: FiHelpCircle,
            submenu: [
              { name: 'AI Chatbot', route: '/dashboard/support/chatbot' },
              { name: 'Live Agent', route: '/dashboard/support/live-agent' },
              { name: 'Support Tickets', route: '/dashboard/support/tickets' },
            ],
          },
          { name: 'Complete Tasks', icon: FiCalendar, route: '/dashboard/tasks' },
          { name: 'Earn Free E-PIN', icon: null, route: '/dashboard/earn-epin', emoji: '🎁' },
          { name: 'Profile Settings', icon: FiUser, route: '/dashboard/profile-settings' },
        ]}
        logoutRoute="/login"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50">
        <div className="w-full h-full flex items-center px-4">
          <div className="relative">
            <button
              id="hamburger"
              onClick={toggleSidebar}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              className="text-gray-700 w-10 h-10 flex items-center justify-center bg-transparent border-none shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md transition-all duration-200 hover:bg-gray-100"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu size={24} />
            </button>
            {/* Tooltip (desktop only) */}
            {!isMobile && showTooltip && (
              <div className="absolute top-12 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {isSidebarOpen ? 'Close Menu' : 'Open Menu'}
                <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            )}
          </div>
          <h1 className="ml-4 text-lg sm:text-xl font-bold text-blue-800 select-none truncate flex-1">
            Helping Hands Foundation
          </h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationDropdown />
            <UserMenu user={user} onLogout={handleLogout} showEmail={!isMobile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out pt-16 min-h-screen ${
          !isMobile && isSidebarOpen ? 'ml-64 w-[calc(100vw-16rem)]' : 'ml-0 w-full'
        }`}
      >
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;