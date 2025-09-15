import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { createAdminNotificationData, createActivityNotificationData } from '../utils/createNotificationData';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Real-time listener for user notifications
  useEffect(() => {
    console.log('NotificationContext: Setting up notification listener for user:', user?.uid);
    
    if (!user?.uid) {
      console.log('NotificationContext: No user found, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log('NotificationContext: Starting notification subscription for user:', user.uid);
    setLoading(true);
    
    const unsubscribe = notificationService.subscribeToUserNotifications(
      user.uid,
      (notificationsList) => {
        console.log('NotificationContext: Received notifications update:', notificationsList.length);
        console.log('NotificationContext: Notifications data:', notificationsList);
        
        setNotifications(notificationsList);
        const unread = notificationsList.filter(n => !n.isRead).length;
        console.log('NotificationContext: Unread count:', unread);
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error('NotificationContext: Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('NotificationContext: Cleaning up notification listener for user:', user.uid);
      unsubscribe();
    };
  }, [user?.uid]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (user?.uid) {
        await notificationService.markAllAsRead(user.uid);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = async () => {
    const wasOpen = isDropdownOpen;
    setIsDropdownOpen(!isDropdownOpen);
    
    // When opening dropdown, mark all unread notifications as read
    if (!wasOpen && unreadCount > 0) {
      await markAllAsRead();
    }
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Send notification (admin only)
  const sendNotification = async ({ title, message, type, priority, targetType, targetUserId, targetRole, actionLink, senderName, ...otherData }) => {
    try {
      // Validate required fields
      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      const notificationType = type || 'admin';
      
      // Handle different target types for admin notifications
      if (targetType === 'all') {
        // Send to all users - will be handled by service
        return await notificationService.sendToAllUsers({
          title,
          message,
          type: notificationType,
          priority: priority || 'medium',
          actionLink,
          senderName: senderName || 'Admin',
          ...otherData
        });
      } else if (targetType === 'role' && targetRole) {
        // Send to specific role - will be handled by service
        return await notificationService.sendToRole(targetRole, {
          title,
          message,
          type: notificationType,
          priority: priority || 'medium',
          actionLink,
          senderName: senderName || 'Admin',
          ...otherData
        });
      } else if (targetType === 'specific' && targetUserId) {
        // Send to specific user
        const userData = await notificationService.getUserData(targetUserId);
        if (!userData) {
          throw new Error('User not found');
        }

        const notificationData = createAdminNotificationData({
          title,
          message,
          priority: priority || 'medium',
          uid: userData.uid,
          userId: userData.userId,
          actionLink,
          senderName: senderName || 'Admin',
          ...otherData
        });

        await notificationService.createNotification(notificationData);
        return { success: true };
      } else {
        throw new Error('Invalid target configuration');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  };

  // Send activity notification (system generated)
  const sendActivityNotification = async ({ title, message, uid, userId, category, relatedAction, relatedHelpId, relatedUserId, levelStatus, ...otherData }) => {
    try {
      // Validate required fields
      if (!title || !message || !uid || !userId) {
        throw new Error('Title, message, uid, and userId are required for activity notifications');
      }

      const notificationData = createActivityNotificationData({
        title,
        message,
        uid,
        userId,
        category,
        relatedAction,
        relatedHelpId,
        relatedUserId,
        levelStatus,
        ...otherData
      });

      await notificationService.createNotification(notificationData);
      return { success: true };
    } catch (error) {
      console.error('Error sending activity notification:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleDropdown,
    closeDropdown,
    sendNotification,
    sendActivityNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;