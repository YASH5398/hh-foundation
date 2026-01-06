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

      // Auto-categorize notification based on content
      const categorizedData = this.categorizeNotification(notificationData);

      // Check for duplicates if preventDuplicates is enabled
      if (categorizedData.preventDuplicates !== false) {
        const isDuplicate = await this.checkDuplicateNotification(
          categorizedData.title,
          categorizedData.message,
          categorizedData.uid
        );

        if (isDuplicate) {
          console.log('Duplicate notification prevented:', categorizedData.title);
          return { success: true, duplicate: true, message: 'Notification already exists' };
        }
      }

      // Clean the notification data to remove undefined fields
      const cleanedData = cleanNotificationData(categorizedData);

      // Remove preventDuplicates from the data before saving
      const { preventDuplicates, ...finalData } = cleanedData;

      const docRef = await addDoc(this.notificationsRef, finalData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Auto-categorize notifications based on content and type
  categorizeNotification(notificationData) {
    const { title = '', message = '', type = 'system' } = notificationData;
    const content = `${title} ${message}`.toLowerCase();

    // Determine category
    let category = notificationData.category || 'general';
    let priority = notificationData.priority || 'medium';

    // Payment-related notifications
    if (content.includes('payment') || content.includes('₹') || content.includes('amount') ||
        content.includes('transaction') || content.includes('transfer')) {
      category = 'payment';
      priority = content.includes('failed') || content.includes('error') ? 'high' : 'medium';
    }

    // Level and upgrade notifications
    else if (content.includes('level') || content.includes('upgrade') || content.includes('achievement')) {
      category = 'upgrade';
      priority = 'high';
    }

    // Referral notifications
    else if (content.includes('referral') || content.includes('joined') || content.includes('network')) {
      category = 'referral';
      priority = 'medium';
    }

    // Help and assignment notifications
    else if (content.includes('help') || content.includes('assignment') || content.includes('receive') ||
             content.includes('send')) {
      category = 'help';
      priority = 'high';
    }

    // E-PIN notifications
    else if (content.includes('e-pin') || content.includes('epin') || content.includes('testimonial')) {
      category = 'epin';
      priority = content.includes('approved') ? 'high' : 'medium';
    }

    // Support notifications
    else if (content.includes('support') || content.includes('ticket') || content.includes('agent')) {
      category = 'support';
      priority = 'medium';
    }

    // Security and blocked notifications
    else if (content.includes('blocked') || content.includes('security') || content.includes('suspended')) {
      category = 'security';
      priority = 'high';
    }

    // Warning and error notifications
    else if (content.includes('alert') || content.includes('warning') || content.includes('error') ||
             content.includes('failed') || content.includes('issue')) {
      category = 'warning';
      priority = 'high';
    }

    // Success notifications
    else if (content.includes('success') || content.includes('completed') || content.includes('confirmed')) {
      category = 'success';
      priority = 'medium';
    }

    // Admin notifications
    else if (type === 'admin' || content.includes('admin') || content.includes('announcement')) {
      category = 'admin';
      priority = 'medium';
    }

    // Add metadata for grouping
    const groupKey = this.generateGroupKey(category, notificationData.relatedAction, notificationData.relatedHelpId);
    const tags = this.extractTags(content);

    return {
      ...notificationData,
      category,
      priority,
      groupKey,
      tags,
      searchableContent: content
    };
  }

  // Generate group key for notification grouping
  generateGroupKey(category, relatedAction, relatedId) {
    const parts = [category];
    if (relatedAction) parts.push(relatedAction);
    if (relatedId) parts.push(relatedId);
    return parts.join('_').toLowerCase();
  }

  // Extract tags from notification content
  extractTags(content) {
    const tags = [];
    const keywords = {
      payment: ['payment', '₹', 'amount', 'transaction', 'transfer'],
      urgent: ['urgent', 'immediate', 'asap', 'important'],
      success: ['success', 'completed', 'confirmed', 'approved'],
      error: ['error', 'failed', 'issue', 'problem']
    };

    Object.entries(keywords).forEach(([tag, words]) => {
      if (words.some(word => content.includes(word))) {
        tags.push(tag);
      }
    });

    return tags;
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
        orderBy('timestamp', 'desc'),
        limit(100) // Limit to prevent performance issues
      );

      // Subscribe to user notifications
      const unsubscribe = onSnapshot(userQuery, (snapshot) => {
        console.log('User notifications updated:', snapshot.docs.length);
        let notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date for compatibility
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate() || null
        }));

        // Apply smart grouping and prioritization
        notifications = this.processNotifications(notifications);

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

  // Process notifications for smart grouping and prioritization
  processNotifications(notifications) {
    // Group related notifications
    const groupedNotifications = this.groupNotifications(notifications);

    // Apply prioritization rules
    const prioritizedNotifications = this.applyPrioritization(groupedNotifications);

    // Sort by priority and timestamp
    return prioritizedNotifications.sort((a, b) => {
      // High priority first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;

      // Then by unread status
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;

      // Then by timestamp (newest first)
      return b.timestamp - a.timestamp;
    });
  }

  // Group similar notifications
  groupNotifications(notifications) {
    const groups = new Map();
    const processedNotifications = [];

    notifications.forEach(notification => {
      const groupKey = notification.groupKey || this.generateGroupKey(
        notification.category,
        notification.relatedAction,
        notification.relatedHelpId
      );

      if (groupKey && groups.has(groupKey)) {
        // Add to existing group
        const group = groups.get(groupKey);
        group.notifications.push(notification);
        group.count++;
        group.lastUpdated = Math.max(group.lastUpdated, notification.timestamp.getTime());

        // Update group title to show count
        if (group.count > 1) {
          group.title = `${group.originalTitle} (${group.count})`;
        }
      } else {
        // Create new group
        const group = {
          ...notification,
          originalTitle: notification.title,
          notifications: [notification],
          count: 1,
          lastUpdated: notification.timestamp.getTime(),
          isGroup: false // Will be set to true if we decide to show as group
        };
        groups.set(groupKey, group);
        processedNotifications.push(group);
      }
    });

    // Mark groups with multiple notifications
    processedNotifications.forEach(notification => {
      if (notification.count > 1) {
        notification.isGroup = true;
        notification.message = `${notification.count} similar notifications`;
      }
    });

    return processedNotifications;
  }

  // Apply prioritization rules
  applyPrioritization(notifications) {
    return notifications.map(notification => {
      let priorityScore = 0;

      // Base priority scores
      const priorityScores = { low: 0, medium: 10, high: 20 };
      priorityScore += priorityScores[notification.priority] || 0;

      // Time-based boosts (newer notifications get higher priority)
      const ageInHours = (Date.now() - notification.timestamp.getTime()) / (1000 * 60 * 60);
      if (ageInHours < 1) priorityScore += 15; // Very recent
      else if (ageInHours < 24) priorityScore += 10; // Recent
      else if (ageInHours < 168) priorityScore += 5; // This week

      // Unread notifications get boost
      if (!notification.isRead) priorityScore += 10;

      // Category-based boosts
      const categoryBoosts = {
        security: 20,
        warning: 15,
        payment: 12,
        upgrade: 10,
        help: 8
      };
      priorityScore += categoryBoosts[notification.category] || 0;

      // Tag-based boosts
      if (notification.tags?.includes('urgent')) priorityScore += 15;
      if (notification.tags?.includes('error')) priorityScore += 10;

      notification.priorityScore = priorityScore;
      return notification;
    });
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

  // Get notification categories and their descriptions
  getNotificationCategories() {
    return {
      payment: {
        label: '💰 Payments',
        description: 'Payment confirmations, transfers, and transactions',
        color: 'green',
        priority: 'high'
      },
      upgrade: {
        label: '🎯 Upgrades',
        description: 'Level upgrades, achievements, and milestones',
        color: 'purple',
        priority: 'high'
      },
      referral: {
        label: '👥 Referrals',
        description: 'New referrals and network growth',
        color: 'blue',
        priority: 'medium'
      },
      help: {
        label: '🤝 Help',
        description: 'Help assignments and support requests',
        color: 'emerald',
        priority: 'high'
      },
      epin: {
        label: '⭐ E-PINs',
        description: 'E-PIN requests, approvals, and rewards',
        color: 'yellow',
        priority: 'medium'
      },
      support: {
        label: '🎫 Support',
        description: 'Support tickets and agent communications',
        color: 'orange',
        priority: 'medium'
      },
      security: {
        label: '🛡️ Security',
        description: 'Account security and access changes',
        color: 'red',
        priority: 'high'
      },
      warning: {
        label: '⚠️ Alerts',
        description: 'Important alerts and warnings',
        color: 'yellow',
        priority: 'high'
      },
      success: {
        label: '✅ Success',
        description: 'Successful operations and confirmations',
        color: 'green',
        priority: 'medium'
      },
      admin: {
        label: '👨‍💼 Admin',
        description: 'Administrative messages and announcements',
        color: 'indigo',
        priority: 'medium'
      },
      general: {
        label: '📢 General',
        description: 'General system notifications',
        color: 'gray',
        priority: 'low'
      }
    };
  }

  // Get priority levels and their descriptions
  getPriorityLevels() {
    return {
      low: {
        label: 'Low',
        description: 'General information notifications',
        color: 'gray',
        score: 0
      },
      medium: {
        label: 'Medium',
        description: 'Important updates and information',
        color: 'blue',
        score: 10
      },
      high: {
        label: 'High',
        description: 'Critical alerts requiring immediate attention',
        color: 'red',
        score: 20
      }
    };
  }

  // Filter notifications by category
  filterByCategory(notifications, category) {
    if (!category || category === 'all') return notifications;
    return notifications.filter(notification => notification.category === category);
  }

  // Filter notifications by priority
  filterByPriority(notifications, minPriority = 'low') {
    const priorities = this.getPriorityLevels();
    const minScore = priorities[minPriority]?.score || 0;

    return notifications.filter(notification =>
      (notification.priorityScore || 0) >= minScore
    );
  }

  // Search notifications by content
  searchNotifications(notifications, searchTerm) {
    if (!searchTerm) return notifications;

    const term = searchTerm.toLowerCase();
    return notifications.filter(notification =>
      notification.title?.toLowerCase().includes(term) ||
      notification.message?.toLowerCase().includes(term) ||
      notification.searchableContent?.includes(term) ||
      notification.tags?.some(tag => tag.includes(term))
    );
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