import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { FiBell, FiX, FiTrash2, FiClock, FiUser, FiSettings, FiInbox } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'admin':
        return <FiUser className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <FiSettings className="w-4 h-4 text-green-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) {
      return 'bg-gray-50 border-gray-200';
    }
    
    switch (type) {
      case 'admin':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-white border-gray-200';
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
          <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="absolute top-full right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-50"
        style={{ transform: 'translateX(calc(-100% + 100%))' }}
      >
        {/* Glassmorphism Container */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiBell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeDropdown}
                className="p-1 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {loading ? (
              <div className="p-4 sm:p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 sm:p-6 text-center">
                <FiInbox className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">All caught up!</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50">
                {notifications.slice(0, 10).map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 sm:p-4 cursor-pointer hover:bg-gray-50/50 transition-colors relative group ${
                      getNotificationBgColor(notification.type, notification.isRead)
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <h4 className={`text-xs sm:text-sm font-medium leading-tight ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                              notification.isRead ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                              {notification.message.length > 80 ? `${notification.message.substring(0, 80)}...` : notification.message}
                            </p>
                            
                            {/* Timestamp and Type */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <FiClock className="w-3 h-3" />
                                <span className="text-xs">
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
                                notification.type === 'admin' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {notification.type}
                              </span>
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all duration-200 ml-1"
                          >
                            <FiTrash2 className="w-3 h-3 text-red-500" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-200/50">
              <p className="text-xs text-gray-500 text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;