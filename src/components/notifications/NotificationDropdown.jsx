import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import {
  FiBell, FiX, FiTrash2, FiCheckCircle,
  FiAlertTriangle, FiDollarSign,
  FiShield, FiInfo, FiCheck
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

// Utility for conditional classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleDropdown,
    closeDropdown
  } = useNotifications();

  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, closeDropdown]);

  // Helper: Get Icon & Colors
  const getIconData = (type, title = '', category = '') => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('payment') || titleLower.includes('₹') || category === 'payment') {
      return { icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    }
    if (titleLower.includes('warning') || titleLower.includes('alert') || category === 'warning') {
      return { icon: FiAlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' };
    }
    if (titleLower.includes('security') || titleLower.includes('blocked')) {
      return { icon: FiShield, color: 'text-rose-600', bg: 'bg-rose-50' };
    }
    if (titleLower.includes('success') || titleLower.includes('completed')) {
      return { icon: FiCheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
    if (type === 'system') {
      return { icon: FiInfo, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    }

    return { icon: FiBell, color: 'text-slate-600', bg: 'bg-slate-100' };
  };

  // Filter Logic
  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (filter === 'payment') {
      filtered = filtered.filter(n => n.title?.toLowerCase().includes('payment') || n.category === 'payment');
    } else if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    }
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative font-sans">
      {/* --- Trigger Button --- */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDropdown}
        className={cn(
          "relative p-2.5 rounded-xl transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-100",
          isDropdownOpen
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </motion.button>

      {/* --- Dropdown Panel --- */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Mobile Backdrop - blocks interaction with rest of page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-slate-900/30 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none"
              onClick={closeDropdown}
            />

            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                // Mobile: Fixed position centered on screen
                "fixed top-20 left-4 right-4 z-[100]",
                // Desktop: Absolute position relative to parent
                "md:absolute md:top-full md:right-0 md:left-auto md:w-[400px] md:mt-3"
              )}
            >
              <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden border border-slate-100 max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="px-5 pt-5 pb-3 bg-white/50 backdrop-blur-xl z-10 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Notifications</h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        You have <span className="text-blue-600 font-bold">{unreadCount}</span> unread messages
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Mark all as read"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={closeDropdown}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Segmented Tabs */}
                  <div className="p-1 bg-slate-100 rounded-xl flex gap-1 relative z-0">
                    {['all', 'unread', 'payment'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { setFilter(tab); setActiveTab(tab); }}
                        className={cn(
                          "flex-1 relative py-2 text-xs font-semibold capitalize rounded-lg transition-all duration-200 z-10 outline-none",
                          activeTab === tab ? "text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-600"
                        )}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">{tab}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Container - Scrollable area */}
                <div className="overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar bg-slate-50/50 flex-1 min-h-[100px]">
                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                      <span className="text-xs font-medium text-slate-400">Loading updates...</span>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 px-6 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBell className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-slate-800 font-semibold mb-1">All caught up!</h3>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                        No new notifications. We'll notify you when something important happens.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <AnimatePresence initial={false}>
                        {filteredNotifications.slice(0, 20).map((notification) => {
                          const { icon: Icon, color, bg } = getIconData(notification.type, notification.title, notification.category);

                          return (
                            <motion.div
                              key={notification.id}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.3 }}
                              onClick={() => !notification.isRead && markAsRead(notification.id)}
                              className={cn(
                                "group relative px-5 py-4 cursor-pointer transition-all duration-200 active:bg-slate-50",
                                !notification.isRead ? "bg-white" : "bg-slate-50/30 hover:bg-white"
                              )}
                            >
                              {/* Unread Indicator Line */}
                              {!notification.isRead && (
                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
                              )}

                              <div className="flex gap-3.5">
                                {/* Icon */}
                                <div className={cn("flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5", bg, color)}>
                                  <Icon className="w-4.5 h-4.5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      "text-sm leading-snug truncate pr-6",
                                      !notification.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"
                                    )}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex-shrink-0">
                                      {notification.timestamp ? formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) : 'Now'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>

                              {/* Delete Action - Always visible on mobile tap, hover on desktop */}
                              <div className="absolute right-2 top-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                  className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 p-2 text-center flex-shrink-0">
                  <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide py-2 w-full">
                    View All Activity
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Removed 'jsx' attribute to fix React warning.
         Standard CSS style tag works fine in React.
      */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;