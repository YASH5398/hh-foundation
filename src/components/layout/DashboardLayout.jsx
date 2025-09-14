import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu, FiX, FiHome, FiSend, FiDownload, FiCalendar, FiBarChart2, FiUsers, FiKey, FiHelpCircle, FiLogOut, FiBell, FiUser
} from 'react-icons/fi';
import Icon from '@mdi/react';
import { mdiBell, mdiAccount, mdiLogout } from '@mdi/js';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import clsx from 'clsx';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const user = currentUser || {};

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on mobile route change
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Close sidebar on Escape key
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSidebarOpen]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return;
    
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      
      if (sidebar && !sidebar.contains(e.target) && 
          hamburger && !hamburger.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  const handleLogout = useCallback(async () => {
      await logout();
      navigate('/login');
  }, [logout, navigate]);

  const handleSupport = useCallback(() => {
    navigate('/dashboard/support');
  }, [navigate]);

  // Sidebar menu click handler
  const handleMenuClick = (to) => {
    if (to === 'logout') {
      handleLogout();
    } else {
      navigate(to);
      // Auto-close on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="w-full">
      <div className="min-h-screen bg-white w-full flex">
        {/* Sidebar (reusable component) */}
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
                { name: 'Used E-PINs', route: '/epin/used' },
                { name: 'Request E-PIN', route: '/epin/request' },
                { name: 'Transfer E-PIN', route: '/epin/transfer' },
                { name: 'E-PIN History', route: '/epin/history' },
              ],
            },
            { name: 'Support', icon: FiHelpCircle, route: '/dashboard/support' },
            { name: 'Complete Tasks', icon: FiCalendar, route: '/dashboard/tasks' },
            { name: 'Earn Free E-PIN', icon: null, route: '/dashboard/earn-epin', emoji: '🎁' },
            { name: 'Profile Settings', icon: FiUser, route: '/dashboard/profile-settings' },
          ]}
          logoutRoute="/login"
        />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center px-4">
          <div className="relative">
            <button
              id="hamburger"
              onClick={toggleSidebar}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              className="text-gray-700 w-10 h-10 flex items-center justify-center bg-transparent border-none shadow-none focus:outline-none focus:ring-0 active:outline-none active:ring-0"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu size={24} />
            </button>
            {/* Desktop Tooltip */}
            {!isMobile && showTooltip && (
              <div className="absolute top-12 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {isSidebarOpen ? 'Close Menu' : 'Open Menu'}
                <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            )}
          </div>
          <h1 className="ml-4 text-xl font-bold text-blue-800 select-none">Helping Hands Foundation</h1>
          <div className="ml-auto flex items-center space-x-4">
            <NotificationDropdown />
            <UserMenu user={user} onLogout={handleLogout} showEmail={true} />
          </div>
        </header>
          <main className="transition-all duration-300 ease-in-out pt-16 px-4 pb-8 flex-1">
            <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        </div>
      </div>
    </div>
  );
};

// UserMenu component for avatar, email, and dropdown
function UserMenu({ user, onLogout, showEmail }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';
  const avatarUrl = user?.profileImage || user?.photoURL;
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className={`flex items-center space-x-2 focus:outline-none group ${showEmail ? 'px-1 py-1' : ''}`}
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold uppercase group-hover:ring-2 group-hover:ring-blue-400 transition">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>
        {showEmail && user?.email && (
          <span className="hidden md:block text-sm text-gray-700 font-medium">
            {user.email}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-44 bg-white shadow-xl rounded-md py-2 z-50">
                  <button
                    onClick={() => {
              navigate('/dashboard/profile-settings');
              setShowDropdown(false);
                    }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                  >
            <Icon path={mdiAccount} size={0.8} className="text-gray-600" />
            Profile
                  </button>
          <button
            onClick={() => {
              onLogout();
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
          >
            <Icon path={mdiLogout} size={0.8} className="text-gray-600" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;