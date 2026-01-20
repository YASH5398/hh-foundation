import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import fcmService from '../../services/fcmService';
import { toast } from 'react-hot-toast';

const NotificationPermissionPopup = () => {
<<<<<<< HEAD
  const { user, isAdmin, userClaims } = useAuth();
=======
  const { user, userClaims } = useAuth();
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const [showPopup, setShowPopup] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');

  useEffect(() => {
    // Don't show popup for admin/system users
<<<<<<< HEAD
    if (!user || isAdmin || userClaims?.agent || userClaims?.system) {
=======
    if (!user || userClaims?.admin || userClaims?.agent || userClaims?.system) {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      return;
    }

    // Check if user has already granted or denied permission
    const checkPermissionStatus = () => {
      const status = fcmService.getPermissionStatus();
      setPermissionStatus(status);
      
      // Show popup only if permission is default (not asked yet) or denied
      // and user hasn't dismissed it in this session
      const hasSeenPopup = sessionStorage.getItem('fcm-permission-popup-seen');
      
      if (status === 'default' && !hasSeenPopup) {
        // Delay showing popup by 2 seconds to not overwhelm user immediately
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    };

    checkPermissionStatus();
  }, [user, userClaims]);

  const handleAllowNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await fcmService.requestPermission();
      
      if (permission === 'granted') {
        // Get and save the FCM token
        const token = await fcmService.getRegistrationToken();
        if (token && user?.uid) {
          await fcmService.saveTokenToFirestore(user.uid, token);
          toast.success('🔔 Notifications enabled! You\'ll now receive important updates.');
        }
        setShowPopup(false);
      } else {
        toast.error('Notification permission denied. You can enable it later in your browser settings.');
        setShowPopup(false);
      }
      
      setPermissionStatus(permission);
      sessionStorage.setItem('fcm-permission-popup-seen', 'true');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    sessionStorage.setItem('fcm-permission-popup-seen', 'true');
    toast('You can enable notifications anytime from your browser settings.', {
      icon: 'ℹ️',
      duration: 4000
    });
  };

  const handleNotNow = () => {
    setShowPopup(false);
    // Don't set session storage so popup can show again later
    toast('You can enable notifications anytime from your profile settings.', {
      icon: 'ℹ️',
      duration: 4000
    });
  };

  if (!showPopup || !fcmService.isNotificationSupported()) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleDismiss()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-full">
                <FiBell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Stay Updated!</h3>
                <p className="text-blue-100 text-sm">Enable push notifications</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Get instant notifications for:
                </h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="bg-green-100 p-1 rounded-full">
                    <FiCheck className="w-3 h-3 text-green-600" />
                  </div>
                  <span>Payment confirmations & sender/receiver matches</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="bg-green-100 p-1 rounded-full">
                    <FiCheck className="w-3 h-3 text-green-600" />
                  </div>
                  <span>Level completions & leaderboard updates</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="bg-green-100 p-1 rounded-full">
                    <FiCheck className="w-3 h-3 text-green-600" />
                  </div>
                  <span>E-PIN approvals & support ticket updates</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="bg-green-100 p-1 rounded-full">
                    <FiCheck className="w-3 h-3 text-green-600" />
                  </div>
                  <span>New referrals & important announcements</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-start space-x-2">
                  <FiAlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    You can change this setting anytime in your browser or profile settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAllowNotifications}
              disabled={isRequesting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <FiBell className="w-4 h-4" />
                  <span>Allow Notifications</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleNotNow}
              className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Not Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPermissionPopup;