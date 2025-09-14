import { notificationService } from './notificationService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for handling automatic notification triggers
 * These are system-generated notifications based on user actions
 */
class NotificationTriggers {
  
  // Load admin UIDs for notifications
  async loadAdminUids() {
    try {
      const q = query(
        collection(db, 'users'),
        where('isAdmin', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error loading admin UIDs:', error);
      return [];
    }
  }

  /**
   * Trigger when a new user registers
   * Sends welcome notification to user and alert to admin
   */
  async onUserRegistration(userUid, userData) {
    try {
      const userName = userData.fullName || userData.email || 'User';
      return await notificationService.sendUserJoinedNotification(
        userUid, 
        userName, 
        await this.loadAdminUids()
      );
    } catch (error) {
      console.error('Error sending user registration notifications:', error);
      throw error;
    }
  }

  /**
   * Trigger when a receiver is assigned in Send Help
   * Notifies receiver, sender, and admin
   */
  async onHelpAssignment(helpData) {
    try {
      const { receiverId, senderId, amount, senderName, receiverName } = helpData;
      return await notificationService.sendSendHelpAssignmentNotification(
        senderId, 
        receiverId, 
        amount, 
        senderName, 
        receiverName
      );
    } catch (error) {
      console.error('Error sending help assignment notifications:', error);
      throw error;
    }
  }

  /**
   * Trigger when payment is completed
   * Notifies receiver, sender, and admin
   */
  async onPaymentCompleted(paymentData) {
    try {
      const { 
        receiverId, 
        senderId, 
        amount, 
        senderName, 
        receiverName, 
        transactionId,
        paymentMethod 
      } = paymentData;

      const results = [];
      
      // Notify sender
      const senderResult = await notificationService.sendPaymentConfirmationNotification(
        senderId, 
        amount, 
        'sent'
      );
      results.push(senderResult);
      
      // Notify receiver
      const receiverResult = await notificationService.sendPaymentConfirmationNotification(
        receiverId, 
        amount, 
        'received'
      );
      results.push(receiverResult);
      
      // Notify admins
      const adminUids = await this.loadAdminUids();
      for (const adminUid of adminUids) {
        const adminNotification = {
          uid: adminUid,
          userId: adminUid,
          title: '💰 Payment Completed',
          message: `Payment of ₹${amount} from ${senderName} to ${receiverName} has been completed successfully. Transaction ID: ${transactionId}`,
          type: 'system',
          sentBy: 'system',
          preventDuplicates: true
        };
        const adminResult = await notificationService.createNotification(adminNotification);
        results.push(adminResult);
      }
      
      return { success: true, results };

      console.log('Payment completion notifications sent successfully');
    } catch (error) {
      console.error('Error sending payment completion notifications:', error);
    }
  }

  /**
   * Trigger when payment fails or is rejected
   */
  async onPaymentFailed(paymentData) {
    try {
      const { receiverId, senderId, amount, senderName, receiverName, reason } = paymentData;

      // Notification to sender
      await notificationService.createNotification(senderId, {
        title: '❌ Payment Failed',
        message: `Your payment of ₹${amount} to ${receiverName} has failed. Reason: ${reason}. Please try again.`,
        type: 'system',
        sentBy: 'system'
      });

      // Notification to receiver
      await notificationService.createNotification(receiverId, {
        title: '⚠️ Expected Payment Failed',
        message: `The expected payment of ₹${amount} from ${senderName} has failed. You will be reassigned soon.`,
        type: 'system',
        sentBy: 'system'
      });

      // Notification to admin
      const adminNotification = {
        title: '❌ Payment Failed',
        message: `Payment failed: ${senderName} → ${receiverName} (₹${amount}). Reason: ${reason}`,
        type: 'system',
        sentBy: 'system'
      };

      const adminUsers = await this.getAdminUsers();
      if (adminUsers.length > 0) {
        await notificationService.createBulkNotifications(
          adminUsers.map(admin => admin.uid),
          adminNotification
        );
      }

      console.log('Payment failure notifications sent successfully');
    } catch (error) {
      console.error('Error sending payment failure notifications:', error);
    }
  }

  /**
   * Trigger for account verification status updates
   */
  async onAccountVerification(userUid, userData, isApproved) {
    try {
      const status = isApproved ? 'approved' : 'rejected';
      return await notificationService.sendBlockedStatusNotification(
        userUid,
        status,
        userData.name || 'User'
      );
    } catch (error) {
      console.error('Error sending account verification notification:', error);
      throw error;
    }
  }

  /**
   * Trigger for level upgrade notifications
   */
  async onLevelUpgrade(userUid, oldLevel, newLevel, userName) {
    try {
      return await notificationService.sendLevelUpgradeNotification(
        userUid,
        oldLevel,
        newLevel,
        userName
      );
    } catch (error) {
      console.error('Error sending level upgrade notification:', error);
      throw error;
    }
  }

  /**
   * Trigger for user blocked/unblocked status
   */
  async onUserStatusChange(userUid, status, userName) {
    try {
      return await notificationService.sendBlockedStatusNotification(
        userUid,
        status,
        userName
      );
    } catch (error) {
      console.error('Error sending user status change notification:', error);
      throw error;
    }
  }

  /**
   * Trigger for system maintenance notifications
   */
  async onSystemMaintenance(maintenanceData) {
    try {
      const { startTime, endTime, description } = maintenanceData;
      
      const notification = {
        title: '🔧 Scheduled Maintenance',
        message: `System maintenance scheduled from ${startTime} to ${endTime}. ${description}`,
        type: 'system',
        sentBy: 'system'
      };

      // Send to all users
      const allUsers = await this.getAllUsers();
      if (allUsers.length > 0) {
        await notificationService.createBulkNotifications(
          allUsers.map(user => user.uid),
          notification
        );
      }

      console.log('System maintenance notifications sent successfully');
    } catch (error) {
      console.error('Error sending system maintenance notifications:', error);
    }
  }

  /**
   * Helper method to get admin users
   */
  async getAdminUsers() {
    try {
      // This would typically query your users collection for admin role
      // Adjust based on your user role structure
      const adminUsers = [];
      
      // Example: You might have a specific admin UID or role-based system
      // For now, returning empty array - implement based on your user structure
      
      return adminUsers;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Helper method to get all users
   */
  async getAllUsers() {
    try {
      // This would typically query your users collection
      // Adjust based on your user structure
      const allUsers = [];
      
      // Example implementation - adjust based on your user collection structure
      
      return allUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  /**
   * Helper method to get user data by UID
   */
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationTriggers = new NotificationTriggers();
export default notificationTriggers;