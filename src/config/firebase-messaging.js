import { messaging, db, doc, setDoc, getDoc, updateDoc } from './firebase.js';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
// Replace with your actual VAPID key from Firebase Console
const VAPID_KEY = process.env.REACT_APP_VAPID_KEY || 'BKqZ8rHjGp7VQJKl9XzJ8rHjGp7VQJKl9XzJ8rHjGp7VQJKl9XzJ8rHjGp7VQJKl9XzJ8rHjGp7VQJKl9XzJ8rHjGp7VQJKl9XzJ';

class FirebaseMessagingService {
  constructor() {
    this.messaging = messaging;
    this.currentToken = null;
    this.messageListeners = [];
  }

  // Request notification permission and get FCM token
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return await this.getToken();
      } else {
        console.warn('⚠️ Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return null;
    }
  }

  // Get FCM registration token
  async getToken() {
    try {
      if (!this.messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('✅ FCM Token obtained:', token);
        this.currentToken = token;
        return token;
      } else {
        console.warn('⚠️ No registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  // Save FCM token to user document in Firestore
  async storeTokenInFirestore(userId, token) {
    try {
      if (!userId || !token) {
        console.warn('⚠️ Missing userId or token for saving to database');
        return false;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        lastTokenUpdate: new Date()
      });

      console.log('✅ FCM token saved to database for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error saving FCM token to database:', error);
      return false;
    }
  }

  // Get FCM token for a specific user from Firestore
  async getUserToken(userId) {
    try {
      if (!userId) {
        console.warn('⚠️ No userId provided for token retrieval');
        return null;
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.fcmToken || null;
      } else {
        console.warn('⚠️ User document not found:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user FCM token:', error);
      return null;
    }
  }

  // Listen for foreground messages
  onForegroundMessage(callback) {
    if (!this.messaging) {
      console.warn('⚠️ Firebase Messaging not available for foreground messages');
      return () => {};
    }

    const unsubscribe = onMessage(this.messaging, (payload) => {
      console.log('📨 Received foreground message:', payload);
      
      // Show notification even when app is in foreground
      this.showNotification(payload);
      
      // Call the callback with the message payload
      if (callback && typeof callback === 'function') {
        callback(payload);
      }
    });

    this.messageListeners.push(unsubscribe);
    return unsubscribe;
  }

  // Show notification manually for foreground messages
  showNotification(payload) {
    try {
      const { notification, data } = payload;
      
      if (!notification) return;

      const notificationTitle = notification.title || 'New Message';
      const notificationOptions = {
        body: notification.body || 'You have a new message',
        icon: notification.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: 'chat-message',
        requireInteraction: true,
        data: data || {},
        actions: [
          {
            action: 'open_chat',
            title: 'Open Chat'
          },
          {
            action: 'mark_read',
            title: 'Mark as Read'
          }
        ]
      };

      // Show the notification
      if ('serviceWorker' in navigator && 'Notification' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      } else {
        new Notification(notificationTitle, notificationOptions);
      }
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  // Initialize messaging service for a user
  async initialize(userId) {
    try {
      if (!userId) {
        console.warn('⚠️ No userId provided for messaging initialization');
        return false;
      }

      // Request permission and get token
      const token = await this.requestPermission();
      
      if (token) {
        // Save token to database
        await this.storeTokenInFirestore(userId, token);
        
        // Set up foreground message listener
        this.onForegroundMessage((payload) => {
          // Handle incoming messages
          console.log('📨 New message received:', payload);
          
          // You can dispatch custom events here for your app to handle
          window.dispatchEvent(new CustomEvent('fcm-message', {
            detail: payload
          }));
        });

        console.log('✅ Firebase Messaging initialized successfully for user:', userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error initializing Firebase Messaging:', error);
      return false;
    }
  }

  // Clean up listeners
  cleanup() {
    this.messageListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.messageListeners = [];
  }

  // Get current token
  getCurrentToken() {
    return this.currentToken;
  }
}

// Create singleton instance
const messagingService = new FirebaseMessagingService();

export default messagingService;
export { FirebaseMessagingService };