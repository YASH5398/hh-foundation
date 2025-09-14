import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiPlus, FiFilter, FiSearch, FiTrash2, FiEdit3, 
  FiUser, FiUsers, FiSettings, FiClock, FiCheck, FiX 
} from 'react-icons/fi';
import { notificationService } from '../../services/notificationService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    isRead: '',
    search: ''
  });
  
  // Create notification form state
  const [newNotification, setNewNotification] = useState({
    selectedUsers: [],
    title: '',
    message: '',
    type: 'admin'
  });

  // Fetch all notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToAllNotifications(
      (notificationsList) => {
        setNotifications(notificationsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [filters]);

  // Fetch users for notification creation
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message || newNotification.selectedUsers.length === 0) {
      toast.error('Please fill all fields and select at least one user');
      return;
    }

    try {
      setLoading(true);
      
      if (newNotification.selectedUsers.includes('all')) {
        // Send to all users
        const allUserIds = users.map(user => user.uid);
        await notificationService.createBulkNotifications(allUserIds, {
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          sentBy: 'admin'
        });
      } else {
        // Send to selected users
        await notificationService.createBulkNotifications(newNotification.selectedUsers, {
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          sentBy: 'admin'
        });
      }

      toast.success('Notifications sent successfully!');
      setShowCreateModal(false);
      setNewNotification({
        selectedUsers: [],
        title: '',
        message: '',
        type: 'admin'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationService.deleteNotification(notificationId);
        toast.success('Notification deleted successfully');
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'admin':
        return <FiUser className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <FiSettings className="w-4 h-4 text-green-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         notification.message.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-2 sm:space-x-3">
              <FiBell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span>Notification Manager</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Manage and send notifications to users</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-700 transition-colors w-full sm:w-auto touch-manipulation"
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Create Notification</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">All Types</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>
            
            <select
              value={filters.isRead}
              onChange={(e) => handleFilterChange('isRead', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">All Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
          
          <div className="relative flex-1 sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">Create your first notification to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.type === 'admin' 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {notification.type}
                        </span>
                        {notification.isRead ? (
                          <FiCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiUser className="w-3 h-3" />
                          <span>User ID: {notification.uid}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Sent by: {notification.sentBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Recipients
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newNotification.selectedUsers.includes('all')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification(prev => ({
                              ...prev,
                              selectedUsers: ['all']
                            }));
                          } else {
                            setNewNotification(prev => ({
                              ...prev,
                              selectedUsers: []
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-blue-600">All Users</span>
                    </label>
                    
                    {!newNotification.selectedUsers.includes('all') && users.map(user => (
                      <label key={user.uid} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newNotification.selectedUsers.includes(user.uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUsers: [...prev.selectedUsers, user.uid]
                              }));
                            } else {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUsers: prev.selectedUsers.filter(id => id !== user.uid)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{user.fullName || user.email || user.uid}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Notification Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Type
                  </label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter notification title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter notification message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateNotification}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManager;