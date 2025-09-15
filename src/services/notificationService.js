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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotificationData, createAdminNotificationData, createActivityNotificationData, cleanNotificationData } from '../utils/createNotificationData';

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
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate notification:', error);
      return false;
    }
  }

  // Create a new notification with standardized structure
  async createNotification(notificationData) {
    try {
      // Validate that the notification data follows the standard structure
      if (!notificationData.title || !notificationData.message || !notificationData.uid || !notificationData.userId) {
        throw new Error('Missing required fields: title, message, uid, userId');
      }

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

      // Clean the notification data to remove undefined fields
      const cleanedData = cleanNotificationData(notificationData);
      
      // Remove preventDuplicates from the data before saving
      const { preventDuplicates, ...finalData } = cleanedData;

      const docRef = await addDoc(this.notificationsRef, finalData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user data by userId
  async getUserData(userId) {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) {
        return null;
      }
      
      const userData = snapshot.docs[0].data();
      return {
        uid: snapshot.docs[0].id,
        userId: userData.userId,
        ...userData
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Send notification to all users
  async sendToAllUsers(notificationData) {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        return { success: true, created: 0, message: 'No users found' };
      }
      
      const batch = writeBatch(db);
      let created = 0;
      
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const uid = userDoc.id;
        const userId = userData.userId;
        
        if (uid && userId) {
          const notification = createAdminNotificationData({
            ...notificationData,
            uid,
            userId
          });
          
          const notificationRef = doc(this.notificationsRef);
          batch.set(notificationRef, notification);
          created++;
        }
      });
      
      if (created > 0) {
        await batch.commit();
      }
      
      return { success: true, created };
    } catch (error) {
      console.error('Error sending to all users:', error);
      throw error;
    }
  }

  // Send notification to users with specific role
  async sendToRole(targetRole, notificationData) {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', targetRole)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        console.log(`No users found with role: ${targetRole}`);
        return { success: true, created: 0, message: `No users found with role: ${targetRole}` };
      }
      
      const batch = writeBatch(db);
      let created = 0;
      
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const uid = userDoc.id;
        const userId = userData.userId;
        
        if (uid && userId) {
          const notification = createAdminNotificationData({
            ...notificationData,
            uid,
            userId
          });
          
          const notificationRef = doc(this.notificationsRef);
          batch.set(notificationRef, notification);
          created++;
        }
      });
      
      if (created > 0) {
        await batch.commit();
      }
      
      return { success: true, created };
    } catch (error) {
      console.error('Error sending to role:', error);
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
            createdAt: serverTimestamp(),
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
      
      // Query for notifications where uid == uid
      const userQuery = query(
        collection(db, 'notifications'),
        where('uid', '==', uid),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'desc')
      );

      // Subscribe to user notifications
      const unsubscribe = onSnapshot(userQuery, (snapshot) => {
        console.log('User notifications updated:', snapshot.docs.length);
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date for compatibility
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate() || null
        }));
        callback(notifications);
      }, errorCallback);

      // Return unsubscribe function
      return () => {
        console.log('Unsubscribing from notification listener for user:', uid);
        unsubscribe();
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
        isRead: true,
        readAt: Timestamp.now()
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
      const readTimestamp = Timestamp.now();
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          isRead: true,
          readAt: readTimestamp
        });
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

  // Soft delete notification
  async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, {
        isDeleted: true
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // System notification triggers
  async sendWelcomeNotification(uid, userId, userName) {
    try {
      const notificationData = createActivityNotificationData({
        title: '🎉 Welcome to HH Foundation!',
        message: `Welcome ${userName}! Your account has been successfully created. Start exploring our platform and connect with the community.`,
        uid,
        userId,
        category: 'welcome',
        relatedAction: 'user_registration',
        preventDuplicates: true
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending welcome notification:', error);
      throw error;
    }
  }

  async sendHelpAssignmentNotification(receiverUid, receiverUserId, senderName, amount, helpId = null) {
    try {
      const notificationData = createActivityNotificationData({
        title: '💰 New Help Assignment',
        message: `You have been assigned to receive help of ₹${amount} from ${senderName}. Check your dashboard for details.`,
        uid: receiverUid,
        userId: receiverUserId,
        category: 'help',
        relatedAction: 'receive_help',
        relatedHelpId: helpId,
        actionLink: '/dashboard',
        preventDuplicates: false // Allow multiple assignments
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending help assignment notification:', error);
      throw error;
    }
  }

  async sendPaymentConfirmationNotification(uid, userId, amount, type = 'received', helpId = null) {
    try {
      const title = type === 'received' ? '✅ Payment Received' : '📤 Payment Sent';
      const message = type === 'received' 
        ? `Payment of ₹${amount} has been confirmed and received successfully.`
        : `Your payment of ₹${amount} has been sent and confirmed.`;
      
      const notificationData = createActivityNotificationData({
        title,
        message,
        uid,
        userId,
        category: 'payment',
        relatedAction: type === 'received' ? 'payment_received' : 'payment_sent',
        relatedHelpId: helpId,
        actionLink: '/dashboard',
        preventDuplicates: false // Allow multiple payment notifications
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
      throw error;
    }
  }

  async sendAdminNotification(uid, userId, title, message, actionLink = null, preventDuplicates = true) {
    try {
      const notificationData = createAdminNotificationData({
        title,
        message,
        uid,
        userId,
        actionLink,
        preventDuplicates
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  }

  // Activity-based notification methods
  async sendUserJoinedNotification(uid, userId, userName, referrerName, newUserId = null) {
    try {
      const notificationData = createActivityNotificationData({
        title: '👥 New User Joined',
        message: `${userName} has joined through your referral link. Welcome them to the community!`,
        uid,
        userId,
        category: 'referral',
        relatedAction: 'referral_join',
        relatedUserId: newUserId,
        actionLink: '/dashboard',
        preventDuplicates: false // Allow multiple referral notifications
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending user joined notification:', error);
      throw error;
    }
  }

  async sendLevelUpgradeNotification(uid, userId, newLevel, oldLevel) {
    try {
      const notificationData = createActivityNotificationData({
        title: '🎉 Level Upgrade!',
        message: `Congratulations! You have been upgraded from Level ${oldLevel} to Level ${newLevel}. Enjoy your new benefits!`,
        uid,
        userId,
        category: 'upgrade',
        relatedAction: 'level_upgrade',
        levelStatus: newLevel,
        actionLink: '/dashboard',
        preventDuplicates: true // Prevent duplicate level notifications
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending level upgrade notification:', error);
      throw error;
    }
  }

  async sendBlockedStatusNotification(uid, userId, isBlocked, reason = '') {
    try {
      const title = isBlocked ? '🚫 Account Blocked' : '✅ Account Unblocked';
      const message = isBlocked 
        ? `Your account has been blocked. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`
        : 'Your account has been unblocked. You can now access all features.';
      
      const notificationData = createAdminNotificationData({
        title,
        message,
        uid,
        userId,
        actionLink: '/dashboard',
        preventDuplicates: false // Allow status change notifications
      });
      
      return this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending blocked status notification:', error);
      throw error;
    }
  }

  async sendSendHelpAssignmentNotification(senderUid, senderUserId, receiverUid, receiverUserId, amount, senderName, receiverName, helpId = null) {
    try {
      const results = [];
      
      // Notify receiver
      const receiverResult = await this.sendHelpAssignmentNotification(receiverUid, receiverUserId, senderName, amount, helpId);
      results.push(receiverResult);
      
      // Notify sender
      const senderNotificationData = createActivityNotificationData({
        title: '📤 Help Assignment Created',
        message: `You have been assigned to send help of ₹${amount} to ${receiverName}. Please complete the payment as instructed.`,
        uid: senderUid,
        userId: senderUserId,
        category: 'help',
        relatedAction: 'send_help',
        relatedHelpId: helpId,
        actionLink: '/dashboard',
        preventDuplicates: false
      });
      const senderResult = await this.createNotification(senderNotificationData);
      results.push(senderResult);
      
      return { success: true, results };
    } catch (error) {
      console.error('Error sending help assignment notifications:', error);
      throw error;
    }
  }

  // Broadcast notification to all users or specific role
  async broadcastNotification(title, message, targetRole = null, actionLink = null) {
    try {
      if (targetRole) {
        return this.sendToRole(targetRole, title, message, actionLink);
      } else {
        return this.sendToAllUsers(title, message, actionLink);
      }
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
    const q = query(
      notificationsRef, 
      where('isDeleted', '==', false),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    return onSnapshot(q, 
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
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

// Create the service instance
const notificationService = new NotificationService();

// Add methods to the service object
notificationService.subscribeToAllNotifications = subscribeToAllNotifications;

export { notificationService };
export default notificationService;