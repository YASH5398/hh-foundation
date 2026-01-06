import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiHome, FiSend, FiDownload, FiCalendar, FiBarChart2, FiUsers, FiKey, FiHelpCircle, FiLogOut, FiUser } from 'react-icons/fi';
import NotificationDropdown from '../notifications/NotificationDropdown';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const menuLinks = [
  { label: 'Dashboard', icon: FiHome, to: '/dashboard' },
  { label: 'Send Help', icon: FiSend, to: '/dashboard/send-help' },
  { label: 'Upcoming Payment', icon: FiCalendar, to: '/dashboard/upcoming-payment' },
  { label: 'Receive Help', icon: FiDownload, to: '/dashboard/receive-help' },
  { label: 'Leaderboard', icon: FiBarChart2, to: '/dashboard/leaderboard' },
  { label: 'Direct Referrals', icon: FiUsers, to: '/dashboard/direct-referral' },
  { label: 'E-PIN Management', icon: FiKey, to: '/dashboard/epins/request' },
  { label: 'Support', icon: FiHelpCircle, to: '/dashboard/support' },
  { label: 'Profile Settings', icon: FiUser, to: '/dashboard/profile-settings' },
];

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change if mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Close sidebar on Esc
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setIsSidebarOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSidebarOpen]);

  // Close sidebar on click outside (mobile)
  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return;
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      if (sidebar && !sidebar.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMenuClick = (to) => {
    if (to === 'logout') handleLogout();
    else {
      navigate(to);
      if (isMobile) setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="w-full">
      <div className="min-h-screen bg-white w-full">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center px-4">
          <div className="relative">
            <button
              id="hamburger"
              onClick={toggleSidebar}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              className="text-gray-700 w-10 h-10 flex items-center justify-center bg-transparent border-none focus:outline-none"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <FiMenu size={24} />
            </button>
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
          </div>
        </header>

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          id="sidebar"
          className={clsx(
            "fixed top-16 bg-black text-white transition-transform duration-300 ease-in-out z-50",
            "h-[calc(100vh-4rem)] w-64",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col py-6 gap-2 h-full overflow-y-auto px-4">
            {menuLinks.map(({ label, icon: Icon, to }) => (
              <button
                key={label}
                className={clsx(
                  "flex items-center gap-3 px-6 py-3 rounded-lg text-base font-medium transition-colors w-full text-left",
                  location.pathname === to ? "bg-yellow-400 text-black" : "text-white hover:bg-yellow-400 hover:text-black"
                )}
                onClick={() => handleMenuClick(to)}
              >
                {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                <span>{label}</span>
              </button>
            ))}
            <button
              onClick={() => handleMenuClick('logout')}
              className="flex items-center gap-3 px-6 py-3 rounded-lg text-base font-medium bg-yellow-400 text-black hover:bg-yellow-500 w-full mt-2"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={clsx(
            "transition-all duration-300 ease-in-out pt-16",
            !isMobile ? (isSidebarOpen ? "ml-64 mr-0" : "ml-0") : "ml-0"
          )}
        >
          <div className={clsx(
            "flex-1 overflow-y-auto p-0 m-0 h-[calc(100vh-4rem)]",
            !isMobile ? (isSidebarOpen ? "w-[calc(100vw-16rem)]" : "w-full") : "w-full"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
