import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdLock, MdLockOpen, MdGroup, MdLogout, MdAssignment, MdCreditCard, MdPersonAdd } from 'react-icons/md';
import { HiX } from 'react-icons/hi';
import { FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield } from 'lucide-react';

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
  const { logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  console.log('AdminSidebar - isAdmin:', isAdmin, 'loading:', loading);

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

  // Show loading state while profile is being fetched
  if (loading) {
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
    { name: 'Agent Chats', icon: FiMessageSquare, route: '/admin/agent-chats' },
    { name: 'E-PIN Manager', icon: MdLock, route: '/admin/epin-manager' },
    { name: 'User E-PIN Request', icon: MdAssignment, route: '/admin/epin-requests' },

    { name: 'Send Help Manager', icon: MdCreditCard, route: '/admin/sendhelp-manager' },

    { name: 'Force Receiver Assignment', icon: MdAssignment, route: '/admin/force-assignment' },

    { name: 'Manage Help Assignments', icon: Users, route: '/admin/manage-assignments' },
    ...(isAdmin ? [
      { name: 'Admin Insights', icon: null, route: '/admin/insights', emoji: '📊' },
      { name: 'Testimonials', icon: null, route: '/admin/testimonials', emoji: '🎬' },
    ] : []),


    { name: 'Blocked Users', icon: Shield, route: '/admin/blocked-users' },
    { name: 'Unblock User', icon: MdLockOpen, route: '/admin/unblock-user' },

  ];

  return (
    <div
      ref={sidebarRef}
      id="admin-sidebar"
      className={`fixed inset-y-0 left-0 z-30 w-64 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl text-white transform transition-all duration-300 ease-out overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:translate-x-0 lg:opacity-100 lg:static lg:inset-0`}
      style={{ maxWidth: '100vw' }}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-slate-400 hover:text-white focus:outline-none lg:hidden transition-colors duration-200 rounded-lg p-1"
          aria-label="Close menu"
        >
          <HiX className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col py-4 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.route}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium group
              ${isActive
                ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`
            }
            onClick={() => setIsSidebarOpen(false)}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            {item.emoji ? (
              <span className="mr-3 text-base" role="img" aria-label={item.name}>{item.emoji}</span>
            ) : item.icon ? (
              <item.icon className="w-5 h-5 mr-3" />
            ) : null}
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/30 text-slate-300 hover:text-red-300 border border-slate-600/50 hover:border-red-500/30 mt-2"
        >
          <MdLogout className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;