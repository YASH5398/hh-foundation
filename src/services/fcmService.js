import { messaging } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key for Firebase Cloud Messaging
// This is a public key and safe to include in client-side code
// To get the actual VAPID key:
// 1. Go to: https://console.firebase.google.com/project/hh-foundation/settings/cloudmessaging/web
// 2. Navigate to "Web Push certificates" tab
// 3. Click "Generate key pair" if no key exists, or copy the existing key
// 4. Replace the VAPID_KEY value below with the actual key from Firebase Console
const VAPID_KEY = process.env.REACT_APP_VAPID_KEY || 'BKqX9Z8rQs5vJ2mF3nL7wP4tR6yU8iO1pA3sD5fG7hJ9kL2mN4oQ6rT8vW0yZ3bC5dE7fH9jK1mO3qS5uX7zA9';

// Note: The above VAPID key is a placeholder. To fix the 401 Unauthorized error:
// 1. Go to Firebase Console: https://console.firebase.google.com/project/hh-foundation/settings/cloudmessaging/web
// 2. Navigate to "Web Push certificates" tab
// 3. Click "Generate key pair" if no key exists, or copy the existing key
// 4. Replace the VAPID_KEY value above with the actual key from Firebase Console

// Firebase Configuration (automatically fetched from src/config/firebase.js)
// Project ID: hh-foundation
// Messaging Sender ID: 310213307250
// App ID: 1:310213307250:web:bcd588790c923ddbdb0beb

class FCMService {
  constructor() {
    this.token = null;
    this.isSupported = false;
    this.messageListeners = [];
    this.init();
  }

  async init() {
    try {
      // SAFE GUARD: Check if messaging is supported (browser environment only)
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
        this.isSupported = true;
        console.log('FCM: Environment check passed');
        // Don't request permission or get token during init - wait for user authentication
        this.setupMessageListener();
      } else {
        console.log('FCM: Not supported in this environment');
        this.isSupported = false;
      }
    } catch (error) {
      // SAFE GUARD: Never let FCM init errors propagate
      console.log('FCM: Initialization skipped due to error');
      this.isSupported = false;
    }
  }

  // Initialize FCM for authenticated user - SAFE, NON-BLOCKING
  async initializeForUser(userId) {
    // SAFE GUARD: Wrap entire function in try/catch - NEVER throw errors
    try {
      // SAFE GUARD: Skip if FCM not supported
      if (!this.isSupported) {
        console.log('FCM skipped: not supported in this environment');
        return false;
      }

      // SAFE GUARD: Skip if no user ID
      if (!userId) {
        console.log('FCM skipped: no user ID provided');
        return false;
      }

      // SAFE GUARD: Skip if VAPID key is missing or invalid
      if (!VAPID_KEY || VAPID_KEY.includes('placeholder') || VAPID_KEY.length < 80) {
        console.log('FCM skipped: VAPID key not configured');
        return false;
      }

      // SAFE GUARD: Check notification permission - don't block if not granted
      const currentPermission = this.getPermissionStatus();
      
      if (currentPermission !== 'granted') {
        console.log('FCM skipped: notification permission not granted (status:', currentPermission, ')');
        return false;
      }

      console.log('FCM: Initializing for user:', userId);

      // Get token safely - this will return null on any error
      const token = await this.getRegistrationToken();
      
      if (token) {
        // Save token to Firestore (also wrapped in try/catch internally)
        await this.saveTokenToFirestore(userId, token);
        console.log('FCM: Initialization completed successfully');
        return true;
      } else {
        console.log('FCM: Token not available, skipping');
        return false;
      }
    } catch (error) {
      // SAFE GUARD: Catch ALL errors - FCM should NEVER block app functionality
      console.log('FCM initialization skipped due to error:', error?.message || error);
      return false;
    }
  }

  async requestPermission() {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('🚫 Notifications not supported in this browser');
        return 'not-supported';
      }

      // Check current permission status
      const currentPermission = Notification.permission;
      
      if (currentPermission === 'granted') {
        console.log('✅ Notification permission already granted');
        return currentPermission;
      }
      
      if (currentPermission === 'denied') {
        console.log('🚫 Notification permission previously denied');
        return currentPermission;
      }

      // Only request permission if it's 'default' (not asked yet)
      console.log('🔄 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
      } else {
        console.log('🚫 Notification permission denied');
      }
      
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async getRegistrationToken() {
    try {
      // SAFE GUARD: Return null immediately if FCM is not supported
      if (!this.isSupported) {
        console.log('FCM is not supported in this environment');
        return null;
      }

      // SAFE GUARD: Check if messaging object exists
      if (!messaging) {
        console.log('FCM messaging not initialized');
        return null;
      }

      // SAFE GUARD: Check if we're in a secure context (HTTPS or localhost)
      if (typeof window === 'undefined' || !window.isSecureContext) {
        console.log('FCM requires a secure context (HTTPS or localhost)');
        return null;
      }

      // SAFE GUARD: Check notification permission first
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.log('FCM skipped: Notification permission not granted');
        return null;
      }

      // SAFE GUARD: Check if VAPID key is properly configured
      if (!VAPID_KEY || VAPID_KEY.includes('placeholder') || VAPID_KEY.length < 80) {
        console.log('FCM skipped: VAPID key not properly configured');
        return null;
      }

      // Wait for service worker to be ready (with timeout)
      if ('serviceWorker' in navigator) {
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 5000))
          ]);
        } catch (swError) {
          console.log('FCM skipped: Service worker not ready');
          return null;
        }
      }

      console.log('Attempting to get FCM registration token...');
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log('✅ FCM registration token obtained successfully');
        this.token = currentToken;
        return currentToken;
      } else {
        console.log('FCM: No registration token available');
        return null;
      }
    } catch (error) {
      // SAFE GUARD: Catch ALL errors and return null - never throw
      console.log('FCM token retrieval skipped due to error:', error?.message || error);
      return null;
    }
  }

  async saveTokenToFirestore(userId, token = null) {
    try {
      const tokenToSave = token || this.token;
      if (!tokenToSave || !userId) {
        console.log('No token or userId available to save');
        return false;
      }

      // Save to fcmTokens collection for backend compatibility
      await setDoc(doc(db, 'fcmTokens', userId), {
        token: tokenToSave,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('FCM token saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
      return false;
    }
  }

  async removeTokenFromFirestore(userId) {
    try {
      if (!userId) {
        console.log('No userId provided to remove token');
        return false;
      }

      // Remove from fcmTokens collection
      await deleteDoc(doc(db, 'fcmTokens', userId));
      console.log('FCM token removed from Firestore');
      return true;
    } catch (error) {
      console.error('Error removing FCM token from Firestore:', error);
      return false;
    }
  }

  setupMessageListener() {
    if (!this.isSupported) return;

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show both browser notification and in-app toast
      if (payload.notification) {
        // Show browser notification
        this.showNotification(payload.notification);
        
        // Show in-app toast notification using react-hot-toast
        this.showInAppNotification(payload.notification, payload.data);
      }

      // Call all registered message listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    });
  }

  showNotification(notification) {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: 'hh-foundation-notification',
        requireInteraction: true
      });
      
      // Auto close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  }

  showInAppNotification(notification, data = {}) {
    // Import toast dynamically to avoid circular dependencies
    import('react-hot-toast').then(({ default: toast }) => {
      const toastOptions = {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          maxWidth: '400px'
        },
        icon: '🔔'
      };
      
      // Determine toast type based on notification category or data
      const category = data?.category || 'info';
      
      switch (category) {
        case 'payment':
        case 'reward':
        case 'achievement':
          toast.success(`${notification.title}\n${notification.body}`, {
            ...toastOptions,
            icon: '🎉'
          });
          break;
        case 'reminder':
        case 'warning':
          toast.error(`${notification.title}\n${notification.body}`, {
            ...toastOptions,
            icon: '⚠️'
          });
          break;
        case 'support':
        case 'update':
          toast(`${notification.title}\n${notification.body}`, {
            ...toastOptions,
            icon: '💬'
          });
          break;
        default:
          toast(`${notification.title}\n${notification.body}`, toastOptions);
      }
    }).catch(error => {
      console.error('Error showing in-app notification:', error);
    });
  }

  addMessageListener(callback) {
    if (typeof callback === 'function') {
      this.messageListeners.push(callback);
    }
  }

  removeMessageListener(callback) {
    const index = this.messageListeners.indexOf(callback);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  async getUserTokens(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const tokens = [];
      const q = query(
        collection(db, 'fcmTokens'),
        where('userId', 'in', userIds)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.token) {
          tokens.push({
            userId: data.userId,
            token: data.token
          });
        }
      });

      return tokens;
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  async getAllTokens() {
    try {
      const tokens = [];
      const querySnapshot = await getDocs(collection(db, 'fcmTokens'));
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.token) {
          tokens.push({
            userId: data.userId,
            token: data.token
          });
        }
      });

      return tokens;
    } catch (error) {
      console.error('Error getting all tokens:', error);
      return [];
    }
  }

  subscribeToNotifications(userId, callback) {
    if (!userId || typeof callback !== 'function') {
      console.error('Invalid userId or callback for notification subscription');
      return null;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(notifications);
    }, (error) => {
      console.error('Error in notification subscription:', error);
    });
  }

  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }

  // Force request permission (for "Enable Notifications" button)
  async forceRequestPermission() {
    try {
      if (!('Notification' in window)) {
        console.log('🚫 Notifications not supported in this browser');
        return 'not-supported';
      }

      console.log('🔄 Force requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
      } else {
        console.log('🚫 Notification permission denied');
      }
      
      return permission;
    } catch (error) {
      console.error('❌ Error force requesting notification permission:', error);
      return 'denied';
    }
  }

  // Check if we can request permission (not permanently denied)
  canRequestPermission() {
    const permission = this.getPermissionStatus();
    return permission === 'default' || permission === 'granted';
  }

  isNotificationSupported() {
    return 'Notification' in window && this.isSupported;
  }

  // Send notification to a specific user
  async sendNotificationToUser(userId, notificationData) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('❌ Cannot send notifications from server environment');
        return false;
      }

      // Use the backend API to send the notification
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Push notification sent successfully:', result);
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to send push notification:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  // Chat-specific notification methods
  async sendChatNotification(receiverId, senderName, messageText, chatId) {
    try {
      const notificationData = {
        title: `New message from ${senderName}`,
        body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        icon: '/icons/chat-icon.png',
        badge: '/icons/badge-icon.png',
        tag: `chat-${chatId}`,
        data: {
          type: 'chat',
          chatId: chatId,
          senderId: senderName,
          url: `/chat/${chatId}`
        },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/icons/reply-icon.png'
          },
          {
            action: 'view',
            title: 'View Chat',
            icon: '/icons/view-icon.png'
          }
        ]
      };

      return await this.sendNotificationToUser(receiverId, notificationData);
    } catch (error) {
      console.error('❌ Error sending chat notification:', error);
      return false;
    }
  }

  setupChatNotificationHandlers() {
    // Handle notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          const { chatId, action } = event.data;
          
          if (action === 'reply') {
            // Open quick reply interface
            this.handleQuickReply(chatId);
          } else if (action === 'view' || !action) {
            // Navigate to chat
            window.location.href = `/chat/${chatId}`;
          }
        }
      });
    }

    // Handle foreground message reception
    this.addMessageListener((payload) => {
      if (payload.data && payload.data.type === 'chat') {
        // Show in-app notification for chat messages
        this.showChatInAppNotification(payload);
      }
    });
  }

  showChatInAppNotification(payload) {
    const { title, body, data } = payload.notification || {};
    const chatData = payload.data || {};

    // Create in-app notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50 transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">${title || 'New Message'}</p>
          <p class="text-sm text-gray-500 truncate">${body || ''}</p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    // Add click handler to navigate to chat
    notification.addEventListener('click', () => {
      if (chatData.chatId) {
        window.location.href = `/chat/${chatData.chatId}`;
      }
      notification.remove();
    });

    // Add to DOM and animate in
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  handleQuickReply(chatId) {
    // Create quick reply modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Reply</h3>
        <textarea 
          id="quick-reply-text" 
          class="w-full p-3 border border-gray-300 rounded-lg resize-none" 
          rows="3" 
          placeholder="Type your message..."
        ></textarea>
        <div class="flex justify-end space-x-3 mt-4">
          <button 
            onclick="this.closest('.fixed').remove()" 
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button 
            onclick="window.fcmService.sendQuickReply('${chatId}', document.getElementById('quick-reply-text').value); this.closest('.fixed').remove()" 
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('quick-reply-text').focus();
  }

  async sendQuickReply(chatId, message) {
    try {
      // This would integrate with your chat service
      console.log('Sending quick reply to chat:', chatId, message);
      // You would call your chat service here
      // await chatService.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error sending quick reply:', error);
    }
  }
}

// Create and export singleton instance
const fcmService = new FCMService();
export { fcmService };
export default fcmService;