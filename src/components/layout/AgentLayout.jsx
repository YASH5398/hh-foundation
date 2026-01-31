import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate, Outlet } from 'react-router-dom';
import {
    FiMenu, FiChevronDown, FiSearch, FiBell, FiActivity, FiHome, FiFileText, FiMessageSquare,
    FiBarChart2, FiUsers, FiCreditCard, FiShield, FiSettings, FiUnlock, FiLogOut
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import { useAgentChatRequests } from '../../hooks/useAgentChatRequests';
import AgentSidebar from './AgentSidebar';
import { getProfileImageUrl } from '../../utils/profileUtils';
import ErrorBoundary from '../common/ErrorBoundary';
import AgentNotificationBell from './AgentNotificationBell';

const AgentLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, isAdmin, logout } = useAgentAuth();
    const { profile, loading: profileLoading } = useAgentProfile();
    const { pendingRequests } = useAgentChatRequests(profile?.role === 'agent' || currentUser?.role === 'agent');

    const closeSidebar = () => setSidebarOpen(false);

    useEffect(() => { closeSidebar(); }, [location.pathname]);
    useEffect(() => {
        const handleClickOutside = () => setProfileDropdownOpen(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const navigationItems = [
        { id: 'dashboard', label: 'Overview', icon: FiHome, path: '/agent-dashboard' },
        { id: 'support-tickets', label: 'Support Tickets', icon: FiFileText, path: '/agent-dashboard/support-tickets' },
        { id: 'communication', label: 'Inbox', icon: FiMessageSquare, path: '/agent-dashboard/communication' },
        { id: 'agent-chat', label: 'Live Chat', icon: FiMessageSquare, path: '/agent-dashboard/agent-chat', badge: pendingRequests.length > 0 ? pendingRequests.length : null },
        { id: 'user-help-tracker', label: 'User Help Tracker', icon: FiActivity, path: '/agent-dashboard/user-help-tracker' },
        { id: 'upcoming-pay', label: 'Upcoming Pay', icon: FiCreditCard, path: '/agent-dashboard/upcoming-pay' },
        { id: 'spam-monitor', label: 'Spam Monitor', icon: FiShield, path: '/agent-dashboard/spam-monitor' },
        { id: 'analytics', label: 'Analytics', icon: FiBarChart2, path: '/agent-dashboard/analytics' },
        { id: 'user-management', label: 'Users', icon: FiUsers, path: '/agent-dashboard/user-management' },
        { id: 'epin-checker', label: 'EPIN Tools', icon: FiCreditCard, path: '/agent-dashboard/epin-checker' },
        { id: 'level-leakage', label: 'Level Leakage', icon: FiActivity, path: '/agent-dashboard/level-leakage' },
        { id: 'unblock-user', label: 'Unblock User', icon: FiUnlock, path: '/agent-dashboard/unblock-user' },
        { id: 'settings', label: 'Settings', icon: FiSettings, path: '/agent-dashboard/settings' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/agent-login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActivePath = (itemPath, currentPath) => {
        if (itemPath === '/agent-dashboard') return currentPath === '/agent-dashboard' || currentPath === '/agent-dashboard/';
        return currentPath.startsWith(itemPath);
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-6 text-slate-400 font-medium tracking-wide">Initializing Terminal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="flex h-screen overflow-hidden relative z-10">
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                            onClick={closeSidebar}
                        />
                    )}
                </AnimatePresence>

                {/* Desktop Sidebar (Fixed) */}
                <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/50 h-full">
                    <AgentSidebar
                        profile={profile}
                    />
                </aside>

                {/* Mobile Sidebar (Drawer) */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col lg:hidden"
                        >
                            <AgentSidebar
                                profile={profile}
                            />
                        </motion.aside>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col min-w-0 bg-[#020617]/50 relative">
                    <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center lg:hidden">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 -ml-2 text-slate-400 hover:text-white"
                            >
                                <FiMenu className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-white">
                                {navigationItems.find(i => isActivePath(i.path, location.pathname))?.label || 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="relative hidden md:block">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Global Search..."
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 transition-all outline-none w-64 placeholder:text-slate-600"
                                />
                            </div>

                            <AgentNotificationBell />

                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }}
                                    className="flex items-center p-1 px-2 space-x-2 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800/40 transition-all"
                                >
                                    <img src={getProfileImageUrl(profile)} alt="User" className="w-8 h-8 rounded-lg object-cover" />
                                    <FiChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {profileDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 origin-top-right backdrop-blur-xl"
                                        >
                                            <Link to="/agent-dashboard/profile" className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                                                <FiUsers className="w-4 h-4 mr-3 text-blue-400" /> My Profile
                                            </Link>
                                            <Link to="/agent-dashboard/settings" className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                                                <FiSettings className="w-4 h-4 mr-3 text-indigo-400" /> Account Settings
                                            </Link>
                                            <div className="h-px bg-slate-800 my-1 mx-2"></div>
                                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                                <FiLogOut className="w-4 h-4 mr-3" /> Log Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10">
                        <div className="max-w-7xl mx-auto">
                            <ErrorBoundary>
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                >
                                    <Outlet />
                                </motion.div>
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
        </div>
    );
};

export default AgentLayout;
