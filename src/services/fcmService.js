import { messaging } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key for Firebase Cloud Messaging
// This is a public key and safe to include in client-side code
const VAPID_KEY = 'BKqX9Z8rQs5vJ2mF3nL7wP4tR6yU8iO1pA3sD5fG7hJ9kL2mN4oQ6rT8vW0yZ3bC5dE7fH9jK1mO3qS5uX7zA9';

class FCMService {
  constructor() {
    this.token = null;
    this.isSupported = false;
    this.messageListeners = [];
    this.init();
  }

  async init() {
    try {
      // Check if messaging is supported
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
        this.isSupported = true;
        await this.requestPermission();
        this.setupMessageListener();
      }
    } catch (error) {
      console.error('FCM initialization failed:', error);
    }
  }

  // Initialize FCM for authenticated user
  async initializeForUser(userId) {
    try {
      if (!this.isSupported || !userId) {
        console.log('FCM not supported or no user ID provided');
        return false;
      }

      const permission = await this.requestPermission();
      if (permission === 'granted') {
        const token = await this.getRegistrationToken();
        if (token) {
          await this.saveTokenToFirestore(userId, token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error initializing FCM for user:', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.getRegistrationToken();
      } else {
        console.log('Notification permission denied.');
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async getRegistrationToken() {
    try {
      if (!this.isSupported) {
        console.log('FCM is not supported in this environment');
        return null;
      }

      const currentToken = await getToken(messaging);

      if (currentToken) {
        console.log('Registration token obtained:', currentToken);
        this.token = currentToken;
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
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

      // Save to both fcmTokens collection and user document
      await setDoc(doc(db, 'fcmTokens', userId), {
        token: tokenToSave,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Also update the user document with the device token
      await setDoc(doc(db, 'users', userId), {
        deviceToken: tokenToSave,
        lastTokenUpdate: new Date()
      }, { merge: true });

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
      
      // Show notification if the app is in foreground
      if (payload.notification) {
        this.showNotification(payload.notification);
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
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: 'hh-foundation-notification'
      });
    }
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

  isNotificationSupported() {
    return 'Notification' in window && this.isSupported;
  }
}

// Create and export singleton instance
const fcmService = new FCMService();
export { fcmService };
export default fcmService;