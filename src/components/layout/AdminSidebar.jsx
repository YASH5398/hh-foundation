import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdLock, MdHelp, MdTrendingUp, MdGroup, MdLogout, MdAssignment, MdCreditCard, MdSupport, MdPersonAdd } from 'react-icons/md';
import { HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { Bell, Users } from 'lucide-react';

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
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('admin-sidebar-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'admin-sidebar-animations';
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { logout, userClaims, claimsLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userClaims && userClaims.admin === true;
  const sidebarRef = useRef(null);
  
  console.log('AdminSidebar - userClaims:', userClaims, 'isAdmin:', isAdmin, 'claimsLoading:', claimsLoading);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSidebarOpen, setIsSidebarOpen]);

  // Show loading state while claims are being fetched
  if (claimsLoading) {
    return (
      <div className="fixed inset-y-0 left-0 z-30 w-64 h-screen bg-gradient-to-br from-violet-900/90 via-purple-800/85 to-indigo-900/90 backdrop-blur-2xl border-r border-white/30 shadow-2xl text-white flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.95) 35%, rgba(147, 51, 234, 0.95) 65%, rgba(219, 39, 119, 0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not admin, show access denied message instead of returning null
  if (!isAdmin) {
    return (
      <div className="fixed inset-y-0 left-0 z-30 w-64 h-screen bg-gradient-to-br from-red-900/90 via-red-700/85 to-red-600/90 backdrop-blur-2xl border-r border-white/30 shadow-2xl text-white flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.85) 50%, rgba(153, 27, 27, 0.9) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}>
        <div className="text-center p-6">
          <p className="text-lg font-bold mb-3">Access Denied</p>
          <p className="text-sm opacity-90 mb-4">Admin privileges required</p>
          <button 
            onClick={() => navigate('/admin/login')}
            className="px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 hover:scale-105 transition-all duration-300 text-sm font-semibold border border-white/20"
          >
            Login as Admin
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };
  const menuItems = [
    { name: 'Dashboard', icon: MdDashboard, route: '/admin/dashboard' },
    { name: 'User & Transaction Safety Hub', icon: null, route: '/admin/safety-hub', emoji: '🛡️' },
    { name: 'User Manager', icon: MdPeople, route: '/admin/users' },
    { name: 'Make Agent', icon: MdPersonAdd, route: '/admin/make-agent' },
    { name: 'E-PIN Manager', icon: MdLock, route: '/admin/epin-manager' },
    { name: 'User E-PIN Request', icon: MdAssignment, route: '/admin/epin-requests' },
    { name: 'Help Manager', icon: MdHelp, route: '/admin/help-manager' },
    { name: 'Send Help Manager', icon: MdCreditCard, route: '/admin/sendhelp-manager' },
    { name: 'Support Manager', icon: MdSupport, route: '/admin/support-manager' },
    { name: 'Force Receiver Assignment', icon: MdAssignment, route: '/admin/force-assignment' },
    { name: 'Level Manager', icon: MdTrendingUp, route: '/admin/level-manager' },
    { name: 'Team Viewer', icon: MdGroup, route: '/admin/team-viewer' },
    { name: 'Manage Help Assignments', icon: Users, route: '/admin/manage-assignments' },
    ...(isAdmin ? [
      { name: 'Admin Insights', icon: null, route: '/admin/insights', emoji: '📊' },
      { name: 'Testimonials', icon: null, route: '/admin/testimonials', emoji: '🎬' },
    ] : []),
    { name: 'Notifications', icon: Bell, route: '/admin/notifications' },
    { name: 'Document Manager', icon: null, route: '/admin/documents', emoji: '📄' },
  ];

  return (
    <div
      ref={sidebarRef}
      id="admin-sidebar"
      className={`fixed inset-y-0 left-0 z-30 w-64 lg:w-64 h-screen max-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-xl bg-opacity-90 border-r border-white/30 shadow-2xl text-white transform transition-all duration-500 ease-out overflow-y-auto rounded-r-xl
        ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:translate-x-0 lg:opacity-100 lg:static lg:inset-0`}
      style={{ 
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(124, 58, 237, 0.9) 25%, rgba(147, 51, 234, 0.85) 50%, rgba(79, 70, 229, 0.9) 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-center justify-between h-20 shadow-xl px-6 border-b border-white/20 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl sticky top-0 z-10">
        <h1 className="text-xl font-black bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent tracking-wide drop-shadow-2xl">Admin Panel</h1>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-gray-200 hover:text-white hover:bg-white/20 hover:scale-110 focus:outline-none lg:hidden transition-all duration-300 rounded-xl p-2"
          aria-label="Close menu"
        >
          <HiX className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col py-6 space-y-3 px-3 min-h-0">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.route}
            className={({ isActive }) =>
              `flex items-center px-5 py-4 rounded-2xl transition-all duration-300 text-base font-semibold border border-transparent group relative overflow-hidden animate-fade-in-up
              ${isActive && item.name === 'E-PIN Manager' 
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-gray-900 shadow-2xl font-bold ring-2 ring-amber-300/50 border-amber-200 scale-105' 
                : isActive 
                ? 'bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-cyan-500/80 text-white shadow-2xl border-cyan-300/50 scale-105' 
                : 'hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 hover:border-white/20 hover:shadow-2xl hover:scale-105 hover:backdrop-blur-sm text-gray-100 hover:text-white'
              }
              `
            }
            style={{ 
              animationDelay: `${index * 50}ms`,
              ...(({ isActive }) => item.name === 'E-PIN Manager' && isActive ? { boxShadow: '0 0 20px 4px rgba(251, 191, 36, 0.4)' } : {})
            }}
            onClick={() => setIsSidebarOpen(false)}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {item.emoji ? (
              <span className="mr-4 text-2xl group-hover:scale-125 transition-transform duration-300 relative z-10" role="img" aria-label={item.name}>{item.emoji}</span>
            ) : item.materialIcon ? (
              <span className="material-icons mr-4 text-2xl group-hover:scale-125 transition-transform duration-300 relative z-10">{item.materialIcon}</span>
            ) : item.icon ? (
              <item.icon className={`w-7 h-7 mr-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10 ${item.name === 'E-PIN Manager' ? 'text-yellow-600 drop-shadow-lg' : ''}`} />
            ) : null}
            <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-6 pt-4 sticky bottom-0 bg-gradient-to-t from-violet-900/95 via-purple-800/90 to-transparent backdrop-blur-xl">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-5 py-4 rounded-2xl transition-all duration-300 bg-gradient-to-r from-red-600/80 via-red-500/80 to-pink-600/80 hover:from-red-700 hover:via-red-600 hover:to-pink-700 hover:scale-105 text-white font-bold shadow-2xl border border-white/20 hover:border-white/40 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <MdLogout className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300 relative z-10" />
          <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;