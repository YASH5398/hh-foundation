import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import soundService from '../services/soundService';
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
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled);

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
    
    // Track previous notification count to detect new notifications
    let previousUnreadCount = 0;

    const unsubscribe = notificationService.subscribeToUserNotifications(
      user.uid,
      (notificationsList) => {
        console.log('NotificationContext: Received notifications update:', notificationsList.length);

        // Check for new unread notifications and play sounds
        const currentUnreadCount = notificationsList.filter(n => !n.isRead).length;
        if (currentUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
          // Find new unread notifications
          const newUnreadNotifications = notificationsList
            .filter(n => !n.isRead)
            .slice(0, currentUnreadCount - previousUnreadCount);

          // Play sound for the most recent new notification
          if (newUnreadNotifications.length > 0) {
            const latestNotification = newUnreadNotifications[0];
            soundService.playSoundForNotification(latestNotification);
          }
        }
        previousUnreadCount = currentUnreadCount;

        setNotifications(notificationsList);
        console.log('NotificationContext: Unread count:', currentUnreadCount);
        setUnreadCount(currentUnreadCount);
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

  // Sound settings
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundService.setEnabled(newState);
  };

  const testSound = async (type = 'default', priority = 'medium') => {
    return await soundService.testSound(type, priority);
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
    sendActivityNotification,
    // Sound settings
    soundEnabled,
    toggleSound,
    testSound,
    availableSoundTypes: soundService.getAvailableSoundTypes()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;