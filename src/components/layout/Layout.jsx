import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, FiHome, FiSend, FiDownload, FiCalendar, FiBarChart2, FiUsers, 
  FiKey, FiHelpCircle, FiLogOut, FiUser, FiChevronDown, FiChevronUp, FiVideo 
} from 'react-icons/fi';
import NotificationDropdown from '../notifications/NotificationDropdown';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { SendHelpProvider } from '../../context/SendHelpContext';
import FloatingChatbot from '../common/FloatingChatbot';

// Add custom CSS for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('layout-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'layout-animations';
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const menuLinks = [
  { label: 'Dashboard', icon: FiHome, to: '/dashboard' },
  { label: 'Send Help', icon: FiSend, to: '/send-help' },
  { label: 'Upcoming Payment', icon: FiCalendar, to: '/upcoming-payment' },
  { label: 'Receive Help', icon: FiDownload, to: '/receive-help' },
  { label: 'Leaderboard', icon: FiBarChart2, to: '/leaderboard' },
  { label: 'Direct Referrals', icon: FiUsers, to: '/direct-referral' },
  { label: 'E-PIN Management', icon: FiKey, to: '/epin-management' },
  { label: 'Testimonials', icon: FiVideo, to: '/testimonials' },
  { label: 'Support', icon: FiHelpCircle, to: '/support' },
  { label: 'Profile Settings', icon: FiUser, to: '/profile-settings' },
];

const epinSubmenuLinks = [
  { label: 'Request E-PIN', to: '/epin/request' },
  { label: 'Transfer E-PIN', to: '/epin/transfer' },
  { label: 'E-PIN History', to: '/epin/history' },
];



const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEpinSubmenuOpen, setIsEpinSubmenuOpen] = useState(false);


  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setIsSidebarOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSidebarOpen]);

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

  // Open E-PIN submenu if current route is E-PIN
  useEffect(() => {
    const isEpinRoute = epinSubmenuLinks.some(link => location.pathname.startsWith(link.to));
    setIsEpinSubmenuOpen(isEpinRoute);
  }, [location.pathname]);



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

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const toggleEpinSubmenu = () => setIsEpinSubmenuOpen(prev => !prev);


  return (
    <div className="w-full">
      <div className="min-h-screen bg-white w-full">
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

        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside
          id="sidebar"
          className={clsx(
            "fixed top-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-xl bg-opacity-90 border-r border-white/30 shadow-2xl text-white transition-all duration-500 ease-out z-50 rounded-r-xl",
            !isMobile && "left-0 h-[calc(100vh-4rem)] w-64",
            isMobile && "left-0 h-[calc(100vh-4rem)] w-[80%]",
            !isMobile && (isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"),
            isMobile && (isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0")
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.95) 35%, rgba(147, 51, 234, 0.95) 65%, rgba(219, 39, 119, 0.95) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <nav className="flex flex-col py-6 gap-3 h-full overflow-y-auto px-3" aria-label="Main menu">
            {menuLinks.map(({ label, icon: Icon, to }, index) => {
              const isActive = location.pathname === to;
              // E-PIN and Support menus handled separately
              if (label === 'E-PIN Management' || label === 'Support') return null;

              return (
                <button
                  key={label}
                  className={clsx(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-300 w-full text-left border border-transparent group relative overflow-hidden animate-fade-in-up",
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-gray-900 shadow-2xl font-bold ring-2 ring-amber-300/50 border-amber-200 scale-105" 
                      : "text-gray-100 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:scale-105 transition-all"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleMenuClick(to)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Icon className="w-7 h-7 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">{label}</span>
                </button>
              );
            })}

            {/* E-PIN Collapsible Menu */}
            <div className="animate-fade-in-up" style={{ animationDelay: `${(menuLinks.length - 1) * 50}ms` }}>
              <button
                className={clsx(
                  "flex items-center justify-between gap-4 px-5 py-4 rounded-2xl text-base font-semibold w-full text-left transition-all duration-300 border border-transparent group relative overflow-hidden",
                  isEpinSubmenuOpen 
                    ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl border-white/30 scale-105" 
                    : "text-gray-100 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:scale-105 transition-all"
                )}
                onClick={toggleEpinSubmenu}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <FiKey className="w-7 h-7 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300 truncate">E-PIN Management</span>
                </div>
                {isEpinSubmenuOpen ? 
                  <FiChevronUp className="w-5 h-5 transition-all duration-300 group-hover:scale-125 relative z-10" /> : 
                  <FiChevronDown className="w-5 h-5 transition-all duration-300 group-hover:scale-125 relative z-10" />
                }
              </button>
              {isEpinSubmenuOpen && (
                <div className="ml-8 mt-3 flex flex-col gap-2 animate-fade-in">
                  {epinSubmenuLinks.map(({ label, to }, subIndex) => {
                    const isActive = location.pathname === to;
                    return (
                      <button
                        key={label}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-all duration-300 border border-transparent group relative overflow-hidden",
                          isActive 
                            ? "bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-gray-900 shadow-2xl font-bold ring-2 ring-amber-300/50 border-amber-200 scale-105" 
                            : "text-gray-200 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:scale-105 transition-all"
                        )}
                        style={{ animationDelay: `${subIndex * 30}ms` }}
                        onClick={() => handleMenuClick(to)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Support Menu */}
            <div className="animate-fade-in-up" style={{ animationDelay: `${(menuLinks.length) * 50}ms` }}>
              <button
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold w-full text-left transition-all duration-300 border border-transparent group relative overflow-hidden",
                  location.pathname.startsWith('/support')
                    ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl border-white/30 scale-105" 
                    : "text-gray-100 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:scale-105 transition-all"
                )}
                onClick={() => {
                  navigate('/support');
                  if (isMobile) setIsSidebarOpen(false);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <FiHelpCircle className="w-7 h-7 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300 truncate">Support</span>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <button
                onClick={() => handleMenuClick('logout')}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold w-full transition-all duration-300 bg-gradient-to-r from-red-600/80 via-red-500/80 to-pink-600/80 hover:from-red-700 hover:via-red-600 hover:to-pink-700 hover:scale-105 text-white shadow-2xl border border-white/20 hover:border-white/40 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FiLogOut className="w-6 h-6 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300 relative z-10" />
                <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        <main
          className={clsx(
            "transition-all duration-300 ease-in-out pt-16",
            !isMobile && (isSidebarOpen ? "ml-64" : "ml-0"),
            isMobile && "ml-0"
          )}
        >
          <div className="flex-1 overflow-y-auto bg-transparent p-0 m-0 h-[calc(100vh-4rem)] w-full">
            <SendHelpProvider>
              <Outlet />
            </SendHelpProvider>
          </div>
        </main>
        
        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </div>
  );
};

export default Layout;
