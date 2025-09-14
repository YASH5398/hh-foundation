import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationService {
  constructor() {
    this.collectionName = 'notifications';
    this.notificationsRef = collection(db, this.collectionName);
  }

  // Generate unique notification ID
  generateNotificationId(title, message, userId) {
    const content = `${title}-${message}-${userId}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + Date.now();
  }

  // Check if notification already exists
  async checkDuplicateNotification(title, message, uid) {
    try {
      const q = query(
        this.notificationsRef,
        where('title', '==', title),
        where('message', '==', message),
        where('uid', '==', uid),
        where('isDeleted', '==', false),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate notification:', error);
      return false;
    }
  }

  // Create a new notification with duplicate prevention
  async createNotification(notificationData) {
    try {
      // Check for duplicates if preventDuplicates is enabled
      if (notificationData.preventDuplicates !== false) {
        const isDuplicate = await this.checkDuplicateNotification(
          notificationData.title,
          notificationData.message,
          notificationData.uid
        );
        
        if (isDuplicate) {
          console.log('Duplicate notification prevented:', notificationData.title);
          return { success: true, duplicate: true, message: 'Notification already exists' };
        }
      }

      const notificationId = this.generateNotificationId(
        notificationData.title,
        notificationData.message,
        notificationData.uid
      );

      const notification = {
        ...notificationData,
        notificationId,
        isRead: false,
        isDeleted: false,
        timestamp: serverTimestamp(),
        sentBy: notificationData.sentBy || 'system'
      };

      const docRef = await addDoc(this.notificationsRef, notification);
      return { success: true, id: docRef.id, notificationId };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for multiple users with duplicate prevention
  async createBulkNotifications(userIds, notificationData) {
    try {
      const batch = writeBatch(db);
      const notifications = [];
      const duplicateChecks = [];

      // Check for duplicates if prevention is enabled
      if (notificationData.preventDuplicates !== false) {
        for (const uid of userIds) {
          const isDuplicate = await this.checkDuplicateNotification(
            notificationData.title,
            notificationData.message,
            uid
          );
          duplicateChecks.push({ uid, isDuplicate });
        }
      } else {
        userIds.forEach(uid => duplicateChecks.push({ uid, isDuplicate: false }));
      }

      // Create notifications only for non-duplicates
      duplicateChecks.forEach(({ uid, isDuplicate }) => {
        if (!isDuplicate) {
          const notificationRef = doc(this.notificationsRef);
          const notificationId = this.generateNotificationId(
            notificationData.title,
            notificationData.message,
            uid
          );
          
          const notification = {
            uid,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'system',
            notificationId,
            isRead: false,
            isDeleted: false,
            timestamp: serverTimestamp(),
            sentBy: notificationData.sentBy || 'system'
          };
          batch.set(notificationRef, notification);
          notifications.push({ id: notificationRef.id, ...notification });
        }
      });

      if (notifications.length > 0) {
        await batch.commit();
      }
      
      const duplicateCount = duplicateChecks.filter(check => check.isDuplicate).length;
      return { 
        success: true, 
        notifications, 
        created: notifications.length,
        duplicates: duplicateCount
      };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Subscribe to user notifications with real-time updates
  subscribeToUserNotifications(uid, callback, errorCallback) {
    try {
      console.log('Setting up notification subscription for user:', uid);
      
      // Query for notifications where userId == uid OR userId == "all"
      const userQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', uid),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const allUsersQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', 'all'),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );

      // Subscribe to both queries and merge results
      const userNotifications = [];
      const allNotifications = [];
      let userUnsubscribe = null;
      let allUnsubscribe = null;
      
      const mergeAndCallback = () => {
        console.log('Merging notifications - User specific:', userNotifications.length, 'All users:', allNotifications.length);
        const merged = [...userNotifications, ...allNotifications]
          .sort((a, b) => (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date()));
        console.log('Total merged notifications:', merged.length);
        callback(merged);
      };

      userUnsubscribe = onSnapshot(userQuery, (snapshot) => {
        console.log('User-specific notifications updated:', snapshot.docs.length);
        userNotifications.length = 0;
        userNotifications.push(...snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })));
        mergeAndCallback();
      }, errorCallback);
      
      allUnsubscribe = onSnapshot(allUsersQuery, (snapshot) => {
        console.log('All-users notifications updated:', snapshot.docs.length);
        allNotifications.length = 0;
        allNotifications.push(...snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })));
        mergeAndCallback();
      }, errorCallback);

      // Return combined unsubscribe function
      return () => {
        console.log('Unsubscribing from notification listeners for user:', uid);
        if (userUnsubscribe) userUnsubscribe();
        if (allUnsubscribe) allUnsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      if (errorCallback) errorCallback(error);
    }
  }



  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all user notifications as read
  async markAllAsRead(uid) {
    try {
      const q = query(
        this.notificationsRef,
        where('uid', '==', uid),
        where('isRead', '==', false),
        where('isDeleted', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for user
  async getUnreadCount(uid) {
    try {
      const q = query(
        this.notificationsRef,
        where('uid', '==', uid),
        where('isRead', '==', false),
        where('isDeleted', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // System notification triggers
  async sendWelcomeNotification(uid, userName) {
    const notificationData = {
      uid,
      title: '🎉 Welcome to HH Foundation!',
      message: `Welcome ${userName}! Your account has been successfully created. Start exploring our platform and connect with the community.`,
      type: 'system',
      sentBy: 'system',
      preventDuplicates: true
    };
    
    return this.createNotification(notificationData);
  }

  async sendHelpAssignmentNotification(receiverUid, senderName, amount) {
    const notificationData = {
      uid: receiverUid,
      title: '💰 New Help Assignment',
      message: `You have been assigned to receive help of ₹${amount} from ${senderName}. Check your dashboard for details.`,
      type: 'system',
      sentBy: 'system',
      preventDuplicates: false // Allow multiple assignments
    };
    
    return this.createNotification(notificationData);
  }

  async sendPaymentConfirmationNotification(uid, amount, type = 'received') {
    const title = type === 'received' ? '✅ Payment Received' : '📤 Payment Sent';
    const message = type === 'received' 
      ? `Payment of ₹${amount} has been confirmed and received successfully.`
      : `Your payment of ₹${amount} has been sent and confirmed.`;
    
    const notificationData = {
      uid,
      title,
      message,
      type: 'system',
      sentBy: 'system',
      preventDuplicates: false // Allow multiple payment notifications
    };
    
    return this.createNotification(notificationData);
  }

  async sendAdminNotification(uid, title, message, preventDuplicates = true) {
    const notificationData = {
      uid,
      title,
      message,
      type: 'admin',
      sentBy: 'admin',
      preventDuplicates
    };
    
    return this.createNotification(notificationData);
  }

  // Activity-based notification methods
  async sendUserJoinedNotification(newUserUid, newUserName, adminUids = []) {
    try {
      const results = [];
      
      // Notify the new user
      const welcomeResult = await this.sendWelcomeNotification(newUserUid, newUserName);
      results.push(welcomeResult);
      
      // Notify admins about new user
      for (const adminUid of adminUids) {
        const adminNotification = {
          uid: adminUid,
          userId: adminUid,
          title: '👥 New User Joined',
          message: `${newUserName} has joined the platform. Welcome them to the community!`,
          type: 'system',
          sentBy: 'system',
          preventDuplicates: true
        };
        const adminResult = await this.createNotification(adminNotification);
        results.push(adminResult);
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('Error sending user joined notifications:', error);
      throw error;
    }
  }

  async sendLevelUpgradeNotification(uid, newLevel, oldLevel) {
    const notificationData = {
      uid,
      userId: uid,
      title: '🎉 Level Upgrade!',
      message: `Congratulations! You have been upgraded from Level ${oldLevel} to Level ${newLevel}. Enjoy your new benefits!`,
      type: 'system',
      sentBy: 'system',
      preventDuplicates: false // Allow multiple level upgrades
    };
    
    return this.createNotification(notificationData);
  }

  async sendBlockedStatusNotification(uid, isBlocked, reason = '') {
    const title = isBlocked ? '🚫 Account Blocked' : '✅ Account Unblocked';
    const message = isBlocked 
      ? `Your account has been blocked. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`
      : 'Your account has been unblocked. You can now access all features.';
    
    const notificationData = {
      uid,
      userId: uid,
      title,
      message,
      type: 'admin',
      sentBy: 'admin',
      preventDuplicates: false // Allow status change notifications
    };
    
    return this.createNotification(notificationData);
  }

  async sendSendHelpAssignmentNotification(senderUid, receiverUid, amount, senderName, receiverName) {
    try {
      const results = [];
      
      // Notify receiver
      const receiverResult = await this.sendHelpAssignmentNotification(receiverUid, senderName, amount);
      results.push(receiverResult);
      
      // Notify sender
      const senderNotification = {
        uid: senderUid,
        userId: senderUid,
        title: '📤 Help Assignment Created',
        message: `You have been assigned to send help of ₹${amount} to ${receiverName}. Please complete the payment as instructed.`,
        type: 'system',
        sentBy: 'system',
        preventDuplicates: false
      };
      const senderResult = await this.createNotification(senderNotification);
      results.push(senderResult);
      
      return { success: true, results };
    } catch (error) {
      console.error('Error sending help assignment notifications:', error);
      throw error;
    }
  }

  // Broadcast notification to all users
  async broadcastNotification(title, message, type = 'admin') {
    try {
      // This would require getting all user UIDs first
      // For now, we'll create a method that can be called with user list
      console.log('Broadcast notification:', { title, message, type });
      // Implementation would depend on how you want to handle broadcasting
      return { success: true, message: 'Broadcast functionality needs user list' };
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }


}

// Subscribe to all notifications (for admin panel)
const subscribeToAllNotifications = (onUpdate, onError) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, 
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(notifications);
      },
      (error) => {
        console.error('Error in notifications listener:', error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Delete notification (soft delete)
const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isDeleted: true,
      deletedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create the service instance
const notificationService = new NotificationService();

// Add methods to the service object
notificationService.subscribeToAllNotifications = subscribeToAllNotifications;
notificationService.deleteNotification = deleteNotification;

export { notificationService };
export default notificationService;