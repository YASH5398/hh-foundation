import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheckCircle, FiClock, FiMessageSquare, FiFileText, FiShield, FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import {
    listenToAgentNotifications,
    markAgentNotificationAsRead,
    markAllAgentNotificationsRead,
    AGENT_NOTIF_TYPES,
    AGENT_NOTIF_PRIORITIES
} from '../../services/agentNotificationService';

const AgentNotificationsModal = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setPermissionError(false);

        const unsubscribe = listenToAgentNotifications(
            (data) => {
                setNotifications(data);
                setLoading(false);
            },
            (error) => {
                // Handle permission error gracefully
                if (error?.code === 'permission-denied') {
                    setPermissionError(true);
                }
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const getIcon = (type) => {
        switch (type) {
            case AGENT_NOTIF_TYPES.CHAT_REQUEST: return <FiMessageSquare className="w-5 h-5 text-blue-500" />;
            case AGENT_NOTIF_TYPES.TICKET: return <FiFileText className="w-5 h-5 text-purple-500" />;
            case AGENT_NOTIF_TYPES.SPAM: return <FiShield className="w-5 h-5 text-red-500" />;
            default: return <FiAlertTriangle className="w-5 h-5 text-amber-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (!isOpen) return null;

    return (
        <>
            {/* MOBILE FULL SCREEN LAYOUT (< 768px) */}
            <div className="fixed inset-0 z-[100] md:hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60"
                    onClick={onClose}
                />

                {/* Full Screen Modal */}
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-0 bg-white flex flex-col"
                    style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
                >
                    {/* Sticky Header - Mobile */}
                    <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            aria-label="Close notifications"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mark All as Read - Mobile */}
                    {unreadCount > 0 && !permissionError && (
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                            <button
                                onClick={() => markAllAgentNotificationsRead()}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all w-full justify-center"
                            >
                                <FiCheck className="w-4 h-4" />
                                Mark all as read
                            </button>
                        </div>
                    )}

                    {/* Scrollable List - Mobile */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500 font-medium">Loading notifications...</p>
                            </div>
                        ) : permissionError ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiShield className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">Access Denied</h3>
                                <p className="text-slate-500 mt-2">Unable to load notifications. Please check your permissions.</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiBell className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
                                <p className="text-slate-500">No new notifications at this time.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    onClick={() => !notif.isRead && markAgentNotificationAsRead(notif.id)}
                                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex gap-3 ${notif.isRead
                                        ? 'bg-white border-slate-100 opacity-60'
                                        : 'bg-white border-blue-100 shadow-sm'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {getIcon(notif.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <h4 className={`text-sm font-bold truncate ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 animate-pulse"></div>
                                            )}
                                        </div>
                                        <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${notif.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <FiClock className="w-3 h-3" />
                                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer - Mobile */}
                    <div className="px-4 py-4 border-t border-slate-100 bg-white flex-shrink-0 safe-area-inset-bottom">
                        <p className="text-slate-400 text-xs text-center">
                            {notifications.length} notifications
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* DESKTOP CENTERED MODAL (>= 768px) */}
            <div className="fixed inset-0 z-[100] hidden md:flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header - Desktop */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                        {unreadCount} New
                                    </span>
                                )}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium mt-0.5">Real-time alerts and security logs</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && !permissionError && (
                                <button
                                    onClick={() => markAllAgentNotificationsRead()}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    Mark all as read
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* List Content - Desktop */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500 font-medium">Loading activity feed...</p>
                            </div>
                        ) : permissionError ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiShield className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">Access Denied</h3>
                                <p className="text-slate-500 mt-2">Unable to load notifications. Please check your permissions.</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiBell className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
                                <p className="text-slate-500">No new notifications at this time.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    onClick={() => !notif.isRead && markAgentNotificationAsRead(notif.id)}
                                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex gap-5 ${notif.isRead
                                        ? 'bg-white border-slate-100 opacity-60'
                                        : 'bg-white border-blue-100 shadow-sm'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {getIcon(notif.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1 gap-4">
                                            <h4 className={`text-base font-bold truncate ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.isRead && (
                                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] flex-shrink-0 animate-pulse"></div>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed mb-3 ${notif.isRead ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                <FiClock className="w-3.5 h-3.5" />
                                                {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                                                {notif.userName && (
                                                    <span className="flex items-center gap-1 before:content-['•'] before:mr-1">
                                                        {notif.userName}
                                                    </span>
                                                )}
                                            </div>
                                            {notif.isRead && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <FiCheckCircle className="w-4 h-4" />
                                                    READ
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer - Desktop */}
                    <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            {notifications.length} Total Alerts in queue
                        </p>
                        <button
                            onClick={onClose}
                            className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-all"
                        >
                            Dismiss All
                        </button>
                    </div>
                </motion.div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                `}</style>
            </div>
        </>
    );
};

export default AgentNotificationsModal;
