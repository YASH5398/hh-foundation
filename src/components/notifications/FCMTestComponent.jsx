import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import fcmService from '../../services/fcmService';
import { toast } from 'react-hot-toast';
import NotificationPermissionManager from './NotificationPermissionManager';

/**
 * FCM Test Component - Demonstrates FCM token generation and message listening
 * This component shows how to properly use FCM after authentication
 */
const FCMTestComponent = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Check FCM support on component mount
    setIsSupported(fcmService.isNotificationSupported());
    setPermissionStatus(fcmService.getPermissionStatus());

    // Set up message listener for foreground notifications
    const handleMessage = (payload) => {
      console.log('📨 Foreground message received:', payload);
      const newMessage = {
        id: Date.now(),
        title: payload.notification?.title || 'New Message',
        body: payload.notification?.body || 'You have a new notification',
        data: payload.data || {},
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [newMessage, ...prev]);
      
      // Show toast notification
      toast.success(`📨 ${newMessage.title}: ${newMessage.body}`);
    };

    // Add message listener
    fcmService.addMessageListener(handleMessage);

    // Cleanup on unmount
    return () => {
      fcmService.removeMessageListener(handleMessage);
    };
  }, []);

  const handleGetToken = async () => {
    if (!user) {
      toast.error('Please log in first to get FCM token');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Requesting FCM token for user:', user.uid);
      const success = await fcmService.initializeForUser(user.uid);
      
      if (success && fcmService.token) {
        setFcmToken(fcmService.token);
        setPermissionStatus('granted');
        toast.success('✅ FCM token generated successfully!');
      } else {
        const currentPermission = fcmService.getPermissionStatus();
        setPermissionStatus(currentPermission);
        
        if (currentPermission === 'denied') {
          toast.error('❌ Notifications are blocked. Use the "Enable Notifications" button above.');
        } else {
          toast.error('❌ Failed to get FCM token. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      toast.error('❌ Error getting FCM token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const permission = await fcmService.forceRequestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast.success('✅ Notification permission granted!');
        // Auto-initialize FCM after permission granted
        if (user) {
          await handleGetToken();
        }
      } else if (permission === 'denied') {
        toast.error('❌ Notification permission denied');
      } else if (permission === 'not-supported') {
        toast.error('❌ Notifications not supported in this browser');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('❌ Error requesting permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenGenerated = (token) => {
    setFcmToken(token);
    setPermissionStatus('granted');
    console.log('📱 FCM token received from NotificationPermissionManager:', token.substring(0, 20) + '...');
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      toast.success('📋 Token copied to clipboard!');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    toast.success('🗑️ Messages cleared');
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h3>
        <p className="text-yellow-700">Please log in to test FCM functionality.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔔 FCM Test Component</h2>
      
      {/* Notification Permission Manager */}
      <div className="mb-6">
        <NotificationPermissionManager 
          user={user}
          onTokenGenerated={handleTokenGenerated}
          showDebugInfo={true}
        />
      </div>

      {/* Support Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📱 Browser Support</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>FCM Support: {isSupported ? '✅ Supported' : '❌ Not Supported'}</span>
          </div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${permissionStatus === 'granted' ? 'bg-green-500' : permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            <span>Permission Status: {permissionStatus}</span>
          </div>
        </div>
      </div>

      {/* Manual Action Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Manual Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRequestPermission}
            disabled={isLoading || !isSupported}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Loading...' : '🔔 Force Request Permission'}
          </button>
          
          <button
            onClick={handleGetToken}
            disabled={isLoading || !isSupported || !user}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Loading...' : '🎫 Get FCM Token'}
          </button>
          
          <button
            onClick={copyTokenToClipboard}
            disabled={!fcmToken}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📋 Copy Token
          </button>
          
          <button
            onClick={clearMessages}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🗑️ Clear Messages
          </button>
        </div>
      </div>

      {/* FCM Token Display */}
      {fcmToken && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-2 text-green-800">🎫 FCM Token</h3>
          <div className="bg-white p-3 rounded border break-all text-sm font-mono">
            {fcmToken}
          </div>
          <p className="text-sm text-green-700 mt-2">
            This token can be used to send push notifications to this device.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Testing Instructions</h4>
        <ol className="list-decimal list-inside text-blue-700 text-sm space-y-1">
          <li>Click "Request Permission" to enable notifications</li>
          <li>Click "Get FCM Token" to generate your device token</li>
          <li>Copy the token and use it to send test notifications</li>
          <li>Send a test notification from Firebase Console or backend</li>
          <li>Check the "Received Messages" section below for foreground notifications</li>
        </ol>
      </div>

      {/* Received Messages */}
      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">📨 Received Messages ({messages.length})</h3>
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Clear All
          </button>
        </div>
        
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages received yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-blue-600">
                    {message.notification?.title || 'No Title'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {message.notification?.body || 'No Body'}
                </p>
                {message.data && Object.keys(message.data).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-gray-600">Data:</span>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FCMTestComponent;