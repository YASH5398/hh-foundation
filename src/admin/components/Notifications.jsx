import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { setNotificationRead, deleteNotification as deleteNotificationAction, bulkMarkNotificationsRead } from '../../services/notificationActions';

import { addNotification } from '../../utils/addNotification';
import {
  Bell,
  Users,
  AlertTriangle,
  MessageSquare,
  Send,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  Trash2,
  X,
  Loader2,
  User,
  Calendar
} from 'lucide-react';

const Notifications = ({ isAdmin }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSendForm, setShowSendForm] = useState(false);

  // Send notification form
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    sendToAll: false,
    userId: '',
    usePersonalization: false
  });
  const [sending, setSending] = useState(false);
  const [deliveryCount, setDeliveryCount] = useState(0);

  // Fetch all notifications with real-time updates
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const notificationList = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationList);
        setLoading(false);
      });
      return unsub;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = fetchNotifications();
    return () => unsubscribe;
  }, [isAdmin]);

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' ||
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.userId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'read' && notification.isRead) ||
      (statusFilter === 'unread' && !notification.isRead);

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics calculations
  const stats = notifications.reduce((acc, notification) => {
    acc.total++;
    if (!notification.isRead) acc.unread++;
    if (notification.type === 'admin') acc.sent++;
    if (notification.type === 'userJoin') acc.userJoins++;
    if (notification.type === 'epinRequest') acc.epinRequests++;
    return acc;
  }, { total: 0, unread: 0, sent: 0, userJoins: 0, epinRequests: 0 });

  // Action handlers
  const markAsRead = async (id) => {
    try {
      await setNotificationRead(id, true);
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAsUnread = async (id) => {
    try {
      await setNotificationRead(id, false);
      toast.success('Marked as unread');
    } catch (error) {
      console.error('Error marking as unread:', error);
      toast.error('Failed to mark as unread');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotificationAction(id);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications first');
      return;
    }

    try {
      if (action === 'markRead') {
        await bulkMarkNotificationsRead(selectedNotifications);
      }
      if (action === 'markUnread') {
        // Mark unread one-by-one (callable enforces ownership)
        await Promise.all(selectedNotifications.map(id => setNotificationRead(id, false)));
      }
      if (action === 'delete') {
        await Promise.all(selectedNotifications.map(id => deleteNotificationAction(id)));
      }

      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notifications ${action === 'delete' ? 'deleted' : action === 'markRead' ? 'marked as read' : 'marked as unread'}`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  // Send notification handlers
  const handleSendFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSendForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setSending(true);
    let count = 0;

    try {
      if (sendForm.sendToAll) {
        // Send to all users
        const usersSnap = await getDocs(collection(db, 'users'));
        const sendPromises = usersSnap.docs.map(async userDoc => {
          const userData = userDoc.data();
          const uid = userDoc.id;
          const firstName = userData.fullName ? userData.fullName.split(' ')[0] : '';

          let personalizedMessage = sendForm.message;
          if (sendForm.usePersonalization && personalizedMessage.includes('{firstName}')) {
            personalizedMessage = personalizedMessage.replace('{firstName}', firstName);
          }

          await addNotification({
            uid: uid,
            userId: userData.userId,
            title: sendForm.title,
            message: personalizedMessage,
            type: 'admin',
            isRead: false,
            sentBy: 'admin',
          });
          count++;
        });

        await Promise.all(sendPromises);
      } else if (sendForm.userId) {
        // Send to specific user
        const userSnap = await getDocs(query(collection(db, 'users'), where('userId', '==', sendForm.userId.trim())));
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          const userData = userDoc.data();
          const uid = userDoc.id;
          const firstName = userData.fullName ? userData.fullName.split(' ')[0] : '';

          let personalizedMessage = sendForm.message;
          if (sendForm.usePersonalization && personalizedMessage.includes('{firstName}')) {
            personalizedMessage = personalizedMessage.replace('{firstName}', firstName);
          }

          await addNotification({
            uid: uid,
            userId: userData.userId,
            title: sendForm.title,
            message: personalizedMessage,
            type: 'admin',
            isRead: false,
            sentBy: 'admin',
          });
          count = 1;
        } else {
          toast.error('User not found');
          setSending(false);
          return;
        }
      }

      setDeliveryCount(count);
      setSendForm({ title: '', message: '', sendToAll: false, userId: '', usePersonalization: false });
      setShowSendForm(false);
      toast.success(`Notification sent to ${count} user${count !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Get notification type icon and color
  const getNotificationTypeInfo = (type) => {
    switch (type) {
      case 'admin':
        return { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Admin' };
      case 'userJoin':
        return { icon: Users, color: 'text-green-400', bg: 'bg-green-900/20', label: 'User Join' };
      case 'epinRequest':
        return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'E-PIN Request' };
      default:
        return { icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-900/20', label: 'System' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Bell className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Notifications Management
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Manage and send notifications to users</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.total}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Notifications</h3>
            <p className="text-slate-500 text-xs mt-1">All notifications</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-300">
                <Bell className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.unread}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Unread</h3>
            <p className="text-slate-500 text-xs mt-1">Require attention</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <Send className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.sent}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Sent by Admin</h3>
            <p className="text-slate-500 text-xs mt-1">Admin notifications</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.userJoins}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">User Joins</h3>
            <p className="text-slate-500 text-xs mt-1">New registrations</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all duration-300">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.epinRequests}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">E-PIN Requests</h3>
            <p className="text-slate-500 text-xs mt-1">E-PIN requests</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="all" className="bg-slate-800 text-white">All Status</option>
                  <option value="unread" className="bg-slate-800 text-white">Unread</option>
                  <option value="read" className="bg-slate-800 text-white">Read</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="all" className="bg-slate-800 text-white">All Types</option>
                  <option value="admin" className="bg-slate-800 text-white">Admin</option>
                  <option value="userJoin" className="bg-slate-800 text-white">User Join</option>
                  <option value="epinRequest" className="bg-slate-800 text-white">E-PIN Request</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowSendForm(!showSendForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
                Send Notification
              </button>
              <button
                onClick={fetchNotifications}
                className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">
                {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('markRead')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction('markUnread')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <Clock className="w-4 h-4" />
                  Mark Unread
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Form */}
        {showSendForm && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Send className="w-6 h-6 text-blue-400" />
                Send New Notification
              </h3>
              <button
                onClick={() => setShowSendForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={sendForm.title}
                    onChange={handleSendFormChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter notification title"
                    required
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={sendForm.message}
                    onChange={handleSendFormChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Enter notification message. Use {firstName} for personalization."
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="sendToAll"
                    checked={sendForm.sendToAll}
                    onChange={handleSendFormChange}
                    className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-slate-300 font-medium">Send to all users</span>
                </label>

                {!sendForm.sendToAll && (
                  <div className="flex-1">
                    <input
                      type="text"
                      name="userId"
                      value={sendForm.userId}
                      onChange={handleSendFormChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter specific user ID"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="usePersonalization"
                    checked={sendForm.usePersonalization}
                    onChange={handleSendFormChange}
                    className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-slate-300 font-medium">Use personalization</span>
                </label>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Use {'{firstName}'} in your message to personalize notifications with the user's first name.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !sendForm.title.trim() || !sendForm.message.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Notification
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSendForm({ title: '', message: '', sendToAll: false, userId: '', usePersonalization: false })}
                  className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 font-medium rounded-xl transition-all duration-200"
                >
                  Clear
                </button>
              </div>

              {deliveryCount > 0 && (
                <div className="text-green-400 font-semibold text-center">
                  ✓ Successfully sent to {deliveryCount} user{deliveryCount !== 1 ? 's' : ''}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-slate-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 text-lg">No notifications found</p>
              <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredNotifications.map(notification => {
              const typeInfo = getNotificationTypeInfo(notification.type);
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={notification.id}
                  className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 ${
                    selectedNotifications.includes(notification.id)
                      ? 'border-blue-500/50 bg-blue-900/10'
                      : 'border-slate-700/50 hover:border-slate-600'
                  } ${!notification.isRead ? 'ring-2 ring-blue-500/20' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="w-5 h-5 mt-1 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />

                    {/* Type Icon */}
                    <div className={`p-3 rounded-xl ${typeInfo.bg} flex-shrink-0`}>
                      <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {notification.title || 'System Notification'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${typeInfo.bg} ${typeInfo.color} border border-slate-600`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                            {notification.userId && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {notification.userId}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {notification.timestamp?.toDate ? notification.timestamp.toDate().toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                            notification.isRead
                              ? 'bg-slate-700/50 text-slate-400 border border-slate-600'
                              : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          }`}>
                            {notification.isRead ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {notification.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed mb-4">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        {!notification.isRead ? (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Read
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            <Clock className="w-4 h-4" />
                            Mark Unread
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications; 