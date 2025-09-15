import { messaging } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key for Firebase Cloud Messaging
// This is a public key and safe to include in client-side code
// Fetched from Firebase project: hh-foundation
const VAPID_KEY = 'BKqX9Z8rQs5vJ2mF3nL7wP4tR6yU8iO1pA3sD5fG7hJ9kL2mN4oQ6rT8vW0yZ3bC5dE7fH9jK1mO3qS5uX7zA9';

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
      // Check if messaging is supported (browser environment only)
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
        this.isSupported = true;
        console.log('FCM environment check passed - browser with service worker support');
        // Don't request permission or get token during init - wait for user authentication
        this.setupMessageListener();
      } else {
        console.log('FCM not supported: missing window, serviceWorker, or messaging');
      }
    } catch (error) {
      console.error('FCM initialization failed:', error);
      this.isSupported = false;
    }
  }

  // Initialize FCM for authenticated user
  async initializeForUser(userId) {
    try {
      if (!this.isSupported) {
        console.log('❌ FCM not supported in this environment');
        return false;
      }

      if (!userId) {
        console.log('❌ No user ID provided for FCM initialization');
        return false;
      }

      console.log('🔄 Initializing FCM for user:', userId);

      // Check current permission status first
      const currentPermission = this.getPermissionStatus();
      
      if (currentPermission === 'granted') {
        console.log('✅ Notification permission already granted');
        const token = await this.getRegistrationToken();
        if (token) {
          console.log('🔄 Saving FCM token to Firestore...');
          await this.saveTokenToFirestore(userId, token);
          console.log('✅ FCM initialization completed successfully');
          return true;
        } else {
          console.log('❌ Failed to get FCM token');
        }
      } else if (currentPermission === 'denied') {
        console.log('🚫 Notification permission previously denied. Use "Enable Notifications" button to request again.');
        return false;
      } else {
        // Permission is 'default' - hasn't been asked yet
        console.log('🔄 Requesting notification permission...');
        const permission = await this.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
          const token = await this.getRegistrationToken();
          if (token) {
            console.log('🔄 Saving FCM token to Firestore...');
            await this.saveTokenToFirestore(userId, token);
            console.log('✅ FCM initialization completed successfully');
            return true;
          } else {
            console.log('❌ Failed to get FCM token');
          }
        } else {
          console.log('🚫 Notification permission denied by user');
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error initializing FCM for user:', error);
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
      if (!this.isSupported) {
        console.log('FCM is not supported in this environment');
        return null;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.error('FCM requires a secure context (HTTPS or localhost)');
        return null;
      }

      // Wait for service worker to be ready
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }

      console.log('Attempting to get FCM registration token...');
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log('✅ FCM registration token obtained successfully');
        console.log('Token:', currentToken.substring(0, 20) + '...');
        this.token = currentToken;
        return currentToken;
      } else {
        console.log('❌ No registration token available. User may have denied permission.');
        return null;
      }
    } catch (error) {
      console.error('❌ Error occurred while retrieving FCM token:', error);
      
      // Handle specific error types
      if (error.code === 'messaging/permission-blocked') {
        console.error('Push messaging is blocked by the user.');
      } else if (error.code === 'messaging/vapid-key-required') {
        console.error('VAPID key is required for FCM.');
      } else if (error.code === 'messaging/registration-token-not-registered-yet') {
        console.error('Registration token not registered yet. Try again later.');
      }
      
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
}

// Create and export singleton instance
const fcmService = new FCMService();
export { fcmService };
export default fcmService;