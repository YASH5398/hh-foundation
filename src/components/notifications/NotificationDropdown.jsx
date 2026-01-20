import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import {
<<<<<<< HEAD
  FiBell, FiX, FiTrash2, FiClock, FiUser, FiInbox,
  FiCheck, FiAlertTriangle, FiDollarSign, FiTrendingUp,
  FiUsers, FiStar, FiShield, FiMessageSquare, FiFilter, FiTool
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
=======
  FiBell, FiX, FiTrash2, FiClock, FiUser, FiSettings, FiInbox,
  FiCheck, FiAlertTriangle, FiDollarSign, FiTrendingUp,
  FiUsers, FiStar, FiShield, FiMessageSquare, FiFilter
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import NotificationSettings from './NotificationSettings';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    markAsRead,
    deleteNotification,
    toggleDropdown,
    closeDropdown
  } = useNotifications();

  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all'); // all, unread, payment, system, admin
  const [searchTerm, setSearchTerm] = useState('');
<<<<<<< HEAD
=======
  const [showSettings, setShowSettings] = useState(false);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  const getNotificationIcon = (type, title = '', category = '') => {
    // Enhanced icon selection based on type, title, and category
    if (title.includes('Payment') || title.includes('₹') || category === 'payment') {
      return <FiDollarSign className="w-4 h-4 text-green-500" />;
    }
    if (title.includes('Level') || title.includes('Upgrade') || category === 'upgrade') {
      return <FiTrendingUp className="w-4 h-4 text-purple-500" />;
    }
    if (title.includes('Referral') || title.includes('Join') || category === 'referral') {
      return <FiUsers className="w-4 h-4 text-blue-500" />;
    }
    if (title.includes('Help') || title.includes('Assignment') || category === 'help') {
      return <FiCheck className="w-4 h-4 text-emerald-500" />;
    }
    if (title.includes('E-PIN') || title.includes('Testimonial') || category === 'epin') {
      return <FiStar className="w-4 h-4 text-yellow-500" />;
    }
    if (title.includes('Support') || title.includes('Ticket') || category === 'support') {
      return <FiMessageSquare className="w-4 h-4 text-orange-500" />;
    }
    if (title.includes('Blocked') || title.includes('Security') || category === 'security') {
      return <FiShield className="w-4 h-4 text-red-500" />;
    }
    if (title.includes('Alert') || title.includes('Warning') || category === 'warning') {
      return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    switch (type) {
      case 'admin':
        return <FiUser className="w-4 h-4 text-blue-500" />;
      case 'system':
<<<<<<< HEAD
        return <FiTool className="w-4 h-4 text-indigo-500" />;
=======
        return <FiSettings className="w-4 h-4 text-indigo-500" />;
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      case 'activity':
        return <FiTrendingUp className="w-4 h-4 text-emerald-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationStyling = (type, title, isRead, priority = 'medium') => {
    // Priority-based styling
    const priorityStyles = {
      high: {
        border: 'border-l-4 border-l-red-500',
        shadow: 'shadow-red-100',
        glow: 'hover:shadow-red-200'
      },
      medium: {
        border: 'border-l-4 border-l-blue-500',
        shadow: 'shadow-blue-100',
        glow: 'hover:shadow-blue-200'
      },
      low: {
        border: '',
        shadow: 'shadow-gray-100',
        glow: 'hover:shadow-gray-200'
      }
    };

    const priorityStyle = priorityStyles[priority] || priorityStyles.medium;

    if (isRead) {
      return {
        bg: 'bg-gray-50/80',
        border: 'border-gray-200/60',
        shadow: priorityStyle.shadow,
        glow: priorityStyle.glow,
        opacity: 'opacity-75'
      };
    }

    // Category-based styling
    if (title.includes('Payment') || title.includes('₹')) {
      return {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: 'border-green-200',
        shadow: 'shadow-green-100',
        glow: 'hover:shadow-green-200'
      };
    }
    if (title.includes('Level') || title.includes('Upgrade')) {
      return {
        bg: 'bg-gradient-to-r from-purple-50 to-violet-50',
        border: 'border-purple-200',
        shadow: 'shadow-purple-100',
        glow: 'hover:shadow-purple-200'
      };
    }
    if (title.includes('Referral') || title.includes('Join')) {
      return {
        bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
        border: 'border-blue-200',
        shadow: 'shadow-blue-100',
        glow: 'hover:shadow-blue-200'
      };
    }
    if (title.includes('E-PIN') || title.includes('Testimonial')) {
      return {
        bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        border: 'border-yellow-200',
        shadow: 'shadow-yellow-100',
        glow: 'hover:shadow-yellow-200'
      };
    }
    if (title.includes('Alert') || title.includes('Warning')) {
      return {
        bg: 'bg-gradient-to-r from-red-50 to-pink-50',
        border: 'border-red-200',
        shadow: 'shadow-red-100',
        glow: 'hover:shadow-red-200'
      };
    }

    // Type-based fallback
    switch (type) {
      case 'admin':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          shadow: 'shadow-blue-100',
          glow: 'hover:shadow-blue-200'
        };
      case 'system':
        return {
          bg: 'bg-gradient-to-r from-indigo-50 to-purple-50',
          border: 'border-indigo-200',
          shadow: 'shadow-indigo-100',
          glow: 'hover:shadow-indigo-200'
        };
      case 'activity':
        return {
          bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
          border: 'border-emerald-200',
          shadow: 'shadow-emerald-100',
          glow: 'hover:shadow-emerald-200'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          shadow: 'shadow-gray-100',
          glow: 'hover:shadow-gray-200'
        };
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // Filter notifications based on current filter
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply type filter
    if (filter === 'payment') {
      filtered = filtered.filter(n => n.title?.includes('Payment') || n.title?.includes('₹') || n.category === 'payment');
    } else if (filter === 'admin') {
      filtered = filtered.filter(n => n.type === 'admin');
    }
    // 'all' filter shows all notifications (no filtering needed)

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();



  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDropdown}
        className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
<<<<<<< HEAD
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[9998] md:hidden"
              onClick={closeDropdown}
            />

            {/* Notification Panel */}
            <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
=======
          <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -20, scale: 0.9, transformOrigin: 'top right' }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.4
        }}
        className="
fixed
<<<<<<< HEAD
inset-0
z-[9999]
p-4
top-[10vh]

sm:absolute
sm:inset-auto
=======
top-16
left-1/2
-translate-x-1/2
w-[calc(100vw-24px)]
max-w-[340px]
px-3
z-[9999]

sm:absolute
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
sm:top-full
sm:right-0
sm:left-auto
sm:translate-x-0
<<<<<<< HEAD
sm:flex-none
sm:items-start
sm:justify-start
sm:w-96
sm:p-0
"
      >
        {/* Enhanced Glassmorphism Container */}
        <div className="bg-white/98 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 w-[90vw] max-w-[340px] max-h-[80vh] md:max-h-none md:w-auto md:max-w-none">
=======
sm:w-96
sm:px-0
"
      >
        {/* Enhanced Glassmorphism Container */}
        <div className="bg-white/98 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
          {/* Enhanced Header with Search */}
          <div className="px-6 py-5 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/60 via-white to-purple-50/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <FiBell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
<<<<<<< HEAD
              <div className="flex items-center">
=======
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  title="Notification Settings"
                >
                  <FiSettings className="w-4 h-4 text-gray-500" />
                </motion.button>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                <button
                  onClick={closeDropdown}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/70 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200"
                />
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 p-1 bg-gray-100/60 rounded-xl">
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'payment', label: '💰 Payments', count: notifications.filter(n => n.title?.includes('Payment') || n.title?.includes('₹') || n.category === 'payment').length },
                  { key: 'admin', label: '👤 Admin', count: notifications.filter(n => n.type === 'admin').length }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      filter === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    {label} {count > 0 && `(${count})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Notifications List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/60 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/60">
            {loading ? (
              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
                />
                <p className="text-gray-500 text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <FiInbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-gray-500 font-medium mb-1">
                    {searchTerm ? 'No matching notifications' : 'All caught up!'}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {searchTerm ? 'Try adjusting your search or filters' : 'No new notifications'}
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/60">
                <AnimatePresence>
                  {filteredNotifications.slice(0, 15).map((notification, index) => {
                    const styling = getNotificationStyling(
                      notification.type,
                      notification.title,
                      notification.isRead,
                      notification.priority || 'medium'
                    );

                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{
                          delay: index * 0.03,
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          p-4 cursor-pointer transition-all duration-300 relative group
                          ${styling.bg} ${styling.border} ${styling.shadow} ${styling.opacity}
                          hover:${styling.glow} hover:shadow-lg
                          border-r-0 border-l-0 border-t-0 border-b-1
                        `}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Enhanced Notification Icon */}
                          <div className="flex-shrink-0 mt-1">
                            <div className={`
                              p-2 rounded-xl transition-all duration-200
                              ${notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'}
                            `}>
                              {getNotificationIcon(notification.type, notification.title, notification.category)}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-3">
                                <h4 className={`
                                  text-sm font-semibold leading-tight mb-1 line-clamp-2
                                  ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}
                                `}>
                                  {notification.title}
                                </h4>
                                <p className={`
                                  text-sm leading-relaxed line-clamp-2 mb-3
                                  ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}
                                `}>
                                  {notification.message}
                                </p>

                                {/* Enhanced Metadata */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                                    <div className="flex items-center space-x-1">
                                      <FiClock className="w-3 h-3" />
                                      <span>
                                        {notification.timestamp ?
                                          formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) :
                                          'Just now'
                                        }
                                      </span>
                                    </div>
                                    {notification.category && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                                        {notification.category}
                                      </span>
                                    )}
                                  </div>

                                  {/* Priority Indicator */}
                                  {notification.priority === 'high' && !notification.isRead && (
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="w-2 h-2 bg-red-500 rounded-full"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Enhanced Delete Button */}
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                className="
                                  opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50
                                  rounded-xl transition-all duration-200 text-red-400 hover:text-red-600
                                "
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Unread Indicator */}
                        {!notification.isRead && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute left-4 top-6 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          {filteredNotifications.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50/60 to-blue-50/60 border-t border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </div>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        // Mark all as read functionality would go here
                        // This would need to be added to the NotificationContext
                      }}
                      className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                    >
                      Mark all read
                    </motion.button>
                  )}
                  <button
                    onClick={closeDropdown}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          </motion.div>
<<<<<<< HEAD
          </>
        )}
      </AnimatePresence>

=======
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    </div>
  );
};

export default NotificationDropdown;