import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notificationService } from '../../services/notificationService';
import { toast } from 'react-hot-toast';
import { FiBell, FiSend, FiUsers, FiUser, FiTrash2, FiEye, FiFilter } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium',
    actionLink: '/dashboard',
    type: 'admin',
    target: 'all',
    selectedUsers: [],
    iconUrl: 'https://example.com/notification-icon.png'
  });
  
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users for target selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  // Fetch notification history
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const unsubscribe = notificationService.subscribeToAllNotifications(
          (notificationsList) => {
            setNotifications(notificationsList);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching notifications:', error);
            setLoading(false);
            toast.error('Failed to load notifications');
          }
        );
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up notifications listener:', error);
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.target === 'specific' && formData.selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setSending(true);
    
    try {
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        actionLink: formData.actionLink,
        type: formData.type,
        iconUrl: formData.iconUrl,
        levelStatus: 'Star',
        relatedHelpId: null,
        senderName: 'Admin Panel',
        sentBy: 'admin'
      };

      let result;
      if (formData.target === 'all') {
        // Send to all users
        const allUserIds = users.map(user => user.id);
        result = await notificationService.createBulkNotifications(allUserIds, notificationData);
        toast.success(`Notification sent to ${result.created} users successfully!`);
      } else {
        // Send to selected users
        result = await notificationService.createBulkNotifications(formData.selectedUsers, notificationData);
        toast.success(`Notification sent to ${result.created} selected users successfully!`);
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        actionLink: '/dashboard',
        type: 'admin',
        target: 'all',
        selectedUsers: [],
        iconUrl: 'https://example.com/notification-icon.png'
      });
      
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      await notificationService.deleteNotification(notificationId);
      toast.success('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
          <FiBell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Admin Notifications</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">Send notifications to users and manage notification history</p>
      </div>

      {/* Send Notification Form */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <FiSend className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Send New Notification
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="Enter notification title"
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              placeholder="Enter notification message"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Action Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Link
              </label>
              <input
                type="text"
                name="actionLink"
                value={formData.actionLink}
                onChange={handleInputChange}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="/dashboard"
              />
            </div>

            {/* Icon URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon URL
              </label>
              <input
                type="url"
                name="iconUrl"
                value={formData.iconUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                placeholder="https://example.com/notification-icon.png"
              />
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To
            </label>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={formData.target === 'all'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <FiUsers className="w-4 h-4 mr-1" />
                  <span className="text-sm sm:text-base">All Users ({users.length})</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="target"
                    value="specific"
                    checked={formData.target === 'specific'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <FiUser className="w-4 h-4 mr-1" />
                  <span className="text-sm sm:text-base">Specific Users</span>
                </label>
              </div>

              {/* User Selection */}
              {formData.target === 'specific' && (
                <div className="border border-gray-200 rounded-md p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-3">
                    Selected: {formData.selectedUsers.length} users
                  </p>
                  <div className="space-y-2">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded touch-manipulation">
                        <input
                          type="checkbox"
                          checked={formData.selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="mr-3 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{user.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 truncate">{user.userId || user.id}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-base sm:text-sm touch-manipulation"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <FiEye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Notification History
          </h2>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FiFilter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 sm:py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="admin">Admin</option>
                <option value="activity">Activity</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 sm:py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <FiBell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500 text-sm sm:text-base px-4">Try adjusting your filters or create a new notification.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{notification.message}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>Sent by: {notification.sentBy}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {notification.timestamp ? 
                          formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) :
                          'Unknown time'
                        }
                      </span>
                      {notification.actionLink && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">Action: {notification.actionLink}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 self-start sm:self-auto touch-manipulation"
                    title="Delete notification"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;