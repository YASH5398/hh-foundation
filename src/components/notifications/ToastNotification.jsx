import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiX, FiCheck, FiAlertTriangle, 
  FiUser, FiSettings, FiDollarSign 
} from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const ToastNotification = () => {
  const { notifications } = useNotifications();
  const [toastQueue, setToastQueue] = useState([]);
  const [displayedToasts, setDisplayedToasts] = useState([]);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Monitor for new notifications and add to toast queue
  useEffect(() => {
    if (notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      // Get new notifications (only unread ones)
      const newNotifications = notifications
        .filter(notification => !notification.isRead)
        .slice(0, notifications.length - lastNotificationCount);
      
      newNotifications.forEach(notification => {
        addToastToQueue(notification);
      });
    }
    setLastNotificationCount(notifications.length);
  }, [notifications, lastNotificationCount]);

  // Process toast queue
  useEffect(() => {
    if (toastQueue.length > 0 && displayedToasts.length < 3) {
      const nextToast = toastQueue[0];
      setDisplayedToasts(prev => [...prev, { ...nextToast, id: Date.now() + Math.random() }]);
      setToastQueue(prev => prev.slice(1));
    }
  }, [toastQueue, displayedToasts]);

  const addToastToQueue = (notification) => {
    setToastQueue(prev => [...prev, notification]);
  };

  const removeToast = (toastId) => {
    setDisplayedToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const getNotificationIcon = (type, title) => {
    // Determine icon based on type and title content
    if (title.includes('Payment') || title.includes('₹')) {
      return <FiDollarSign className="w-5 h-5 text-green-500" />;
    }
    
    switch (type) {
      case 'admin':
        return <FiUser className="w-5 h-5 text-blue-500" />;
      case 'system':
        if (title.includes('Welcome') || title.includes('✅')) {
          return <FiCheck className="w-5 h-5 text-green-500" />;
        }
        if (title.includes('❌') || title.includes('Failed')) {
          return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
        }
        if (title.includes('⚠️')) {
          return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
        }
        return <FiSettings className="w-5 h-5 text-purple-500" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getToastColor = (type, title) => {
    if (title.includes('❌') || title.includes('Failed')) {
      return 'border-red-200 bg-red-50';
    }
    if (title.includes('✅') || title.includes('Completed') || title.includes('Received')) {
      return 'border-green-200 bg-green-50';
    }
    if (title.includes('⚠️')) {
      return 'border-yellow-200 bg-yellow-50';
    }
    
    switch (type) {
      case 'admin':
        return 'border-blue-200 bg-blue-50';
      case 'system':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      <AnimatePresence>
        {displayedToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            }}
            className="pointer-events-auto"
          >
            <div className={`
              relative max-w-sm w-full rounded-2xl border-2 shadow-2xl backdrop-blur-md
              ${getToastColor(toast.type, toast.title)}
              hover:shadow-3xl transition-all duration-300
            `}>
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative p-4">
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(toast.type, toast.title)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                          {toast.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                          {toast.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`
                            px-2 py-1 text-xs rounded-full font-medium
                            ${toast.type === 'admin' 
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                            }
                          `}>
                            {toast.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(toast.timestamp || new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Close button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar for auto-dismiss */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-2xl"
                  onAnimationComplete={() => removeToast(toast.id)}
                />
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;