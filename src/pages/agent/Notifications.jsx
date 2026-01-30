import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle, FiX, FiPlus, FiSend, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../../utils/formatDate';
import { bulkMarkNotificationsRead, deleteNotification as deleteNotificationAction, setNotificationRead } from '../../services/notificationActions';
import { createAdminNotification } from '../../services/adminNotificationActions';

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
      await setNotificationRead(notificationId, true);
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read && !n.isRead && !n.deleted && !n.isDeleted)
        .map(n => n.id);
      await bulkMarkNotificationsRead(unreadIds);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotificationAction(notificationId);
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
      await createAdminNotification({
        targetUid: newNotification.uid || undefined,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type || 'admin',
        category: 'admin',
        priority: 'high',
        eventKey: `agent:${newNotification.type || 'admin'}:${newNotification.title}`
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

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: FiCheckCircle };
      case 'warning': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: FiAlertCircle };
      case 'error': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: FiX };
      default: return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: FiInfo };
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.isRead && !n.deleted && !n.isDeleted).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FiBell className="w-6 h-6 text-blue-500/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
              <FiBell className="w-5 h-5 text-indigo-400" />
            </span>
            System Alerts
          </h1>
          <p className="text-slate-400 mt-1 ml-1 text-sm font-medium">Broadcasts and system-wide notifications</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            New Broadcast
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Alerts</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><FiBell className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-white">{notifications.length}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Unread</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><FiAlertCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-white">{unreadCount}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Archived</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><FiCheckCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-white">
            {notifications.filter(n => (n.read || n.isRead) && !n.deleted && !n.isDeleted).length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800/50 overflow-x-auto">
        <FiFilter className="text-slate-500 w-4 h-4 mr-2" />
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: 'Unread Only' },
          { key: 'read', label: 'Archived' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === tab.key
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-slate-900/50 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiBell className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-slate-300 font-bold">No notifications found</h3>
              <p className="text-slate-500 text-sm mt-1">System status is quiet.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification) => {
              const styles = getTypeStyles(notification.type);
              const Icon = styles.icon;
              const isUnread = !notification.read && !notification.isRead;

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative overflow-hidden rounded-2xl border transition-all ${isUnread
                      ? 'bg-slate-800/40 border-slate-700/50 shadow-lg'
                      : 'bg-slate-900/20 border-slate-800/50 opacity-75 hover:opacity-100'
                    }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`}></div>

                  <div className="p-5 flex gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${styles.bg} ${styles.text} border ${styles.border}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-sm font-bold truncate ${isUnread ? 'text-white' : 'text-slate-400'}`}>
                              {notification.title}
                            </h3>
                            {isUnread && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                New
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border}`}>
                              {notification.type || 'INFO'}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${isUnread ? 'text-slate-300' : 'text-slate-500'}`}>
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isUnread && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-2 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium mt-3 pt-3 border-t border-slate-800/50">
                        <span className="uppercase tracking-wider">Target: {notification.targetAudience}</span>
                        {notification.createdBy && (
                          <span className="uppercase tracking-wider border-l border-slate-800 pl-4">By: {notification.createdBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Create Notification Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FiPlus className="text-blue-500" />
                  Compose Broadcast
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Message Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                    placeholder="Enter short, descriptive title..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium resize-none"
                    placeholder="Enter detailed notification message..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Alert Level
                    </label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="error">Error (Red)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Audience
                    </label>
                    <select
                      value={newNotification.targetAudience}
                      onChange={(e) => setNewNotification({ ...newNotification, targetAudience: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">All Users</option>
                      <option value="agents">Agents Only</option>
                      <option value="users">Users Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createNotification}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                >
                  <FiSend className="w-4 h-4" />
                  Broadcast Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;