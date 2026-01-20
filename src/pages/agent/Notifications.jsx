import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle, FiX, FiPlus, FiSend } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatDate';
import { bulkMarkNotificationsRead, deleteNotification as deleteNotificationAction, setNotificationRead } from '../../services/notificationActions';
import { createAdminNotification } from '../../services/adminNotificationActions';
=======
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle, FiX, FiPlus, FiSend } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info', // info, success, warning, error
    targetAudience: 'all' // all, agents, users
  });

  useEffect(() => {
    // Real-time listener for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = [];
      snapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    // First exclude deleted notifications
    if (notification.deleted || notification.isDeleted) return false;
    
    // Then apply the selected filter
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read && !notification.isRead;
    if (filter === 'read') return notification.read || notification.isRead;
    return true;
  });

  const markAsRead = async (notificationId) => {
    try {
<<<<<<< HEAD
      await setNotificationRead(notificationId, true);
=======
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        isRead: true,
        readAt: serverTimestamp()
      });
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
<<<<<<< HEAD
      const unreadIds = notifications
        .filter(n => !n.read && !n.isRead && !n.deleted && !n.isDeleted)
        .map(n => n.id);
      await bulkMarkNotificationsRead(unreadIds);
=======
      const unreadNotifications = notifications.filter(n => !n.read && !n.isRead && !n.deleted && !n.isDeleted);
      const promises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          isRead: true,
          readAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

<<<<<<< HEAD
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotificationAction(notificationId);
=======
  const deleteNotification = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        deleted: true,
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const createNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
<<<<<<< HEAD
      await createAdminNotification({
        targetUid: newNotification.uid || undefined,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type || 'admin',
        category: 'admin',
        priority: 'high',
        eventKey: `agent:${newNotification.type || 'admin'}:${newNotification.title}`
=======
      await addDoc(collection(db, 'notifications'), {
        ...newNotification,
        createdAt: serverTimestamp(),
        createdBy: 'agent', // In real app, get from auth context
        read: false,
        deleted: false
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      });

      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all'
      });
      setShowCreateModal(false);
      toast.success('Notification created successfully');
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="w-4 h-4" />;
      case 'warning': return <FiAlertCircle className="w-4 h-4" />;
      case 'error': return <FiX className="w-4 h-4" />;
      default: return <FiInfo className="w-4 h-4" />;
    }
  };

<<<<<<< HEAD
=======
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  const unreadCount = notifications.filter(n => !n.read && !n.isRead && !n.deleted && !n.isDeleted).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">Manage system notifications and alerts</p>
            </div>
            <div className="flex space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Create Notification
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <FiBell className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <FiAlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => (n.read || n.isRead) && !n.deleted && !n.isDeleted).length}
                </p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Notifications' },
                { key: 'unread', label: 'Unread' },
                { key: 'read', label: 'Read' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'No notifications available.' : `No ${filter} notifications found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-6 transition-all ${
                      (notification.read || notification.isRead)
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-blue-200 bg-blue-50 shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {notification.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                            <span className="ml-1">{notification.type?.toUpperCase()}</span>
                          </span>
                          {!notification.read && !notification.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{notification.message}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>{formatDate(notification.createdAt)}</span>
                          <span>Target: {notification.targetAudience}</span>
                          {notification.createdBy && (
                            <span>By: {notification.createdBy}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.read && !notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
<<<<<<< HEAD
                          onClick={() => handleDeleteNotification(notification.id)}
=======
                          onClick={() => deleteNotification(notification.id)}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                          title="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Notification
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification message"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={newNotification.targetAudience}
                      onChange={(e) => setNewNotification({ ...newNotification, targetAudience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Users</option>
                      <option value="agents">Agents Only</option>
                      <option value="users">Users Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={createNotification}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiSend className="w-4 h-4 mr-2" />
                  Create Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;