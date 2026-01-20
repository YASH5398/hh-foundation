import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
<<<<<<< HEAD
import {
  createNotification,
  sendToAllUsers,
  sendToRole,
  getUserData,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  deleteNotification as deleteNotificationById
} from '../services/notificationService';
=======
import notificationService from '../services/notificationService';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
=======
  const [notificationSettings, setNotificationSettings] = useState({
    playSound: true,
    sounds: {
      default: 'default',
      payment: 'payment',
      success: 'success',
      warning: 'warning',
      admin: 'admin'
    }
  });
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  // One-time fetch for user notifications
  useEffect(() => {
    if (!auth.currentUser) {
      console.log('NotificationContext: No auth.currentUser, skipping fetch');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (!user?.uid) {
      console.log('NotificationContext: No user found, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log('NotificationContext: Fetching notifications for user:', user.uid);
    setLoading(true);

    const fetchNotifications = async () => {
      try {
        const userQuery = query(
          collection(db, 'notifications'),
          where('uid', '==', user.uid),
          where('isDeleted', '==', false),
          orderBy('timestamp', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(userQuery);
        const notificationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('NotificationContext: Fetched notifications:', notificationsList.length);

        setNotifications(notificationsList);
        const currentUnreadCount = notificationsList.filter(n => !n.isRead).length;
        console.log('NotificationContext: Unread count:', currentUnreadCount);
        setUnreadCount(currentUnreadCount);
        setLoading(false);
      } catch (error) {
        console.error('NotificationContext: Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.uid]);

<<<<<<< HEAD
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
=======

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (user?.uid) {
<<<<<<< HEAD
        await markAllNotificationsAsRead(user.uid);
=======
        await notificationService.markAllAsRead(user.uid);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
<<<<<<< HEAD
      await deleteNotificationById(notificationId);
=======
      await notificationService.deleteNotification(notificationId);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
        return await sendToAllUsers({
=======
        return await notificationService.sendToAllUsers({
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
        return await sendToRole(targetRole, {
=======
        return await notificationService.sendToRole(targetRole, {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
        const userData = await getUserData(targetUserId);
=======
        const userData = await notificationService.getUserData(targetUserId);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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

<<<<<<< HEAD
        await createNotification(notificationData);
=======
        await notificationService.createNotification(notificationData);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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

<<<<<<< HEAD
      await createNotification(notificationData);
=======
      await notificationService.createNotification(notificationData);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
    availableSoundTypes: soundService.getAvailableSoundTypes()
=======
    availableSoundTypes: soundService.getAvailableSoundTypes(),
    notificationSettings
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;