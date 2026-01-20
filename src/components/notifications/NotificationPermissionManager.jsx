import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import fcmService from '../../services/fcmService';
import { toast } from 'react-hot-toast';

/**
 * Notification Permission Manager Component
 * Handles notification permissions properly without repeated error messages
 * Provides UI for enabling notifications when previously denied
 */
const NotificationPermissionManager = ({ onTokenGenerated, showUI = true }) => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Check FCM support and permission status on mount
    const checkSupport = () => {
      const supported = fcmService.isNotificationSupported();
      const permission = fcmService.getPermissionStatus();
      
      setIsSupported(supported);
      setPermissionStatus(permission);
      
      console.log('🔍 Notification support check:', {
        supported,
        permission,
        canRequest: fcmService.canRequestPermission()
      });
    };

    checkSupport();
  }, []);

  useEffect(() => {
    // Auto-initialize FCM for authenticated users with granted permission
    const autoInitialize = async () => {
      if (user && !hasInitialized && permissionStatus === 'granted' && isSupported) {
        console.log('🚀 Auto-initializing FCM for authenticated user with granted permission');
        await initializeFCM();
      }
    };

    autoInitialize();
  }, [user, permissionStatus, isSupported, hasInitialized, initializeFCM]);

  const initializeFCM = async () => {
    if (!user) {
      console.log('⚠️ No authenticated user for FCM initialization');
      return false;
    }

    if (hasInitialized) {
      console.log('ℹ️ FCM already initialized');
      return true;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Initializing FCM for user:', user.uid);
      const success = await fcmService.initializeForUser(user.uid);
      
      if (success && fcmService.token) {
        setFcmToken(fcmService.token);
        setPermissionStatus('granted');
        setHasInitialized(true);
        
        // Call callback if provided
        if (onTokenGenerated) {
          onTokenGenerated(fcmService.token);
        }
        
        if (showUI) {
          toast.success('✅ Notifications enabled successfully!');
        }
        console.log('✅ FCM initialization completed');
        return true;
      } else {
        const currentPermission = fcmService.getPermissionStatus();
        setPermissionStatus(currentPermission);
        
        if (currentPermission === 'denied') {
          console.log('🚫 FCM initialization failed: Permission denied');
        } else {
          console.log('❌ FCM initialization failed: Unknown error');
          if (showUI) {
            toast.error('❌ Failed to enable notifications');
          }
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error during FCM initialization:', error);
      if (showUI) {
        toast.error('❌ Error enabling notifications');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) {
      toast.error('Please log in first to enable notifications');
      return;
    }

    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔔 User requested to enable notifications');
      
      // Force request permission (even if previously denied)
      const permission = await fcmService.forceRequestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        // Initialize FCM after permission granted
        await initializeFCM();
      } else if (permission === 'denied') {
        toast.error('❌ Notification permission denied. You can enable it later in browser settings.');
      } else if (permission === 'not-supported') {
        toast.error('❌ Notifications are not supported in this browser');
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      toast.error('❌ Error enabling notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!isSupported) {
      return {
        text: 'Notifications not supported in this browser',
        color: 'text-gray-500',
        icon: '🚫'
      };
    }

    switch (permissionStatus) {
      case 'granted':
        return {
          text: fcmToken ? 'Notifications enabled' : 'Notifications allowed',
          color: 'text-green-600',
          icon: '✅'
        };
      case 'denied':
        return {
          text: 'Notifications blocked. Click to enable.',
          color: 'text-red-600',
          icon: '🚫'
        };
      case 'default':
        return {
          text: 'Notifications not enabled',
          color: 'text-yellow-600',
          icon: '🔔'
        };
      default:
        return {
          text: 'Checking notification status...',
          color: 'text-gray-500',
          icon: '⏳'
        };
    }
  };

  const shouldShowButton = () => {
    return isSupported && 
           user && 
           (permissionStatus === 'default' || permissionStatus === 'denied') && 
           !hasInitialized;
  };

  if (!showUI) {
    // Silent mode - just handle initialization without UI
    return null;
  }

  const status = getStatusMessage();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
            <p className={`text-sm ${status.color}`}>{status.text}</p>
          </div>
        </div>
        
        {shouldShowButton() && (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Enabling...</span>
              </div>
            ) : (
              'Enable Notifications'
            )}
          </button>
        )}
        
        {permissionStatus === 'granted' && fcmToken && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-600 font-medium">Active</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div>Permission: {permissionStatus}</div>
          <div>Supported: {isSupported ? 'Yes' : 'No'}</div>
          <div>Initialized: {hasInitialized ? 'Yes' : 'No'}</div>
          <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
          {fcmToken && <div>Token: {fcmToken.substring(0, 20)}...</div>}
        </div>
      )}
    </div>
  );
};

export default NotificationPermissionManager;