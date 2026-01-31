import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiHome, FiFileText, FiMessageSquare, FiBarChart2,
    FiUsers, FiCreditCard, FiShield, FiLogOut, FiSettings,
    FiUnlock, FiActivity
} from 'react-icons/fi';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { useAgentChatRequests } from '../../hooks/useAgentChatRequests';
import { getProfileImageUrl } from '../../utils/profileUtils';

const AgentSidebar = ({ profile }) => {
    const location = useLocation();
    const { isAdmin, logout } = useAgentAuth();
    const { pendingRequests } = useAgentChatRequests(profile?.role === 'agent');

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/agent-login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

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

    const isActivePath = (itemPath, currentPath) => {
        if (itemPath === '/agent-dashboard') return currentPath === '/agent-dashboard' || currentPath === '/agent-dashboard/';
        return currentPath.startsWith(itemPath);
    };

    return (
        <>
            <div className="h-20 flex items-center px-8 border-b border-slate-800/50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <FiShield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Agent OS
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navigationItems.filter(item => {
                    if (item.adminOnly) return isAdmin === true;
                    return true;
                }).map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path, location.pathname);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center">
                                <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={getProfileImageUrl(profile)}
                                alt="Agent"
                                className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{profile?.fullName || 'Agent'}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.role || 'Staff'}</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgentSidebar;
