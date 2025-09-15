import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiSend, FiUsers, FiUser, FiAlertCircle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { sendNotification } from '../../../context/NotificationContext';
import { toast } from 'react-hot-toast';

const AdminNotificationForm = () => {
  const { user, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetType: 'all', // all, specific, role
    targetUserId: '',
    targetRole: 'user',
    actionLink: '',
    scheduledFor: ''
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch users for targeting
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <FiX className="w-5 h-5 text-red-600" />;
      case 'warning': return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: 'admin', // Always admin type for admin form
        priority: formData.priority,
        targetType: formData.targetType,
        actionLink: formData.actionLink.trim() || undefined,
        senderName: user?.displayName || 'Admin'
      };

      // Handle different target types
      if (formData.targetType === 'specific' && formData.targetUserId) {
        notificationData.targetUserId = formData.targetUserId;
      } else if (formData.targetType === 'role' && formData.targetRole) {
        notificationData.targetRole = formData.targetRole;
      }
      // For 'all', no additional targeting needed

      const result = await sendNotification(notificationData);
      
      if (result.success) {
        toast.success('Notification sent successfully!');
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          targetType: 'all',
          targetUserId: '',
          targetRole: 'user',
          actionLink: '',
          scheduledFor: ''
        });
        setShowPreview(false);
      } else {
        toast.error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FiBell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
          </div>
          <p className="text-gray-600 mt-2">Send notifications to users, groups, or everyone</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Form */}
          <div className="space-y-6">
            <form onSubmit={handleSendNotification} className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification title"
                  required
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification message"
                  required
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To
                </label>
                <select
                  name="targetType"
                  value={formData.targetType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="specific">Specific User</option>
                  <option value="role">By Role</option>
                </select>
              </div>

              {/* Specific User Selection */}
              {formData.targetType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    name="targetUserId"
                    value={formData.targetUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.displayName || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role Selection */}
              {formData.targetType === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">Users</option>
                    <option value="agent">Agents</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              )}

              {/* Action Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Link (Optional)
                </label>
                <input
                  type="text"
                  name="actionLink"
                  value={formData.actionLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/dashboard, /profile, etc."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  type="submit"
                  disabled={sending || !formData.title.trim() || !formData.message.trim()}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

          {/* Preview */}
          {showPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${getTypeColor(formData.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getTypeIcon(formData.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">
                      {formData.title || 'Notification Title'}
                    </h4>
                    <p className="text-gray-700 mt-1">
                      {formData.message || 'Notification message will appear here...'}
                    </p>
                    {formData.actionLink && (
                      <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View Details →
                      </button>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.priority === 'high' ? 'bg-red-100 text-red-800' :
                    formData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.priority}
                  </span>
                </div>
              </motion.div>

              {/* Target Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {formData.targetType === 'all' ? (
                    <>
                      <FiUsers className="w-4 h-4" />
                      <span>Will be sent to all users</span>
                    </>
                  ) : formData.targetType === 'specific' ? (
                    <>
                      <FiUser className="w-4 h-4" />
                      <span>Will be sent to specific user</span>
                    </>
                  ) : (
                    <>
                      <FiUsers className="w-4 h-4" />
                      <span>Will be sent to all {formData.targetRole}s</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationForm;