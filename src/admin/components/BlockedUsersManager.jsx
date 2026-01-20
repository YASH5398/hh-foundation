import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { unblockUser } from '../../services/helpService';
import { listenToAllSupportTickets } from '../../services/supportService';
import { formatDate } from '../../utils/formatDate';
import {
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Unlock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BlockedUsersManager = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockReason, setUnblockReason] = useState('');
  const [unblocking, setUnblocking] = useState(false);
  const [filter, setFilter] = useState('all'); // all, system_blocked, manual_blocked

  // Listen to blocked users
  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      where('isBlocked', '==', true),
      orderBy('blockedAt', 'desc')
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlockedUsers(users);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to blocked users:', error);
      setLoading(false);
    });

    return unsubscribeUsers;
  }, []);

  // Listen to support tickets
  useEffect(() => {
    const unsubscribeTickets = listenToAllSupportTickets((tickets) => {
      setSupportTickets(tickets.filter(ticket =>
        ticket.category === 'block_resolution' || ticket.reason.includes('blocked')
      ));
    });

    return unsubscribeTickets;
  }, []);

  const handleUnblockUser = async () => {
    if (!selectedUser || !unblockReason.trim()) {
      toast.error('Please provide a reason for unblocking');
      return;
    }

    setUnblocking(true);

    try {
      const result = await unblockUser(selectedUser.id, 'admin_uid_placeholder'); // TODO: Get actual admin UID

      if (result.success) {
        toast.success('User unblocked successfully');

        // Close modal and reset state
        setShowUnblockModal(false);
        setSelectedUser(null);
        setUnblockReason('');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    } finally {
      setUnblocking(false);
    }
  };


  const getBlockType = (user) => {
    if (user.blockedBySystem) {
      return { type: 'system', label: 'System Block', color: 'bg-red-100 text-red-800' };
    }
    return { type: 'manual', label: 'Manual Block', color: 'bg-orange-100 text-orange-800' };
  };

  const getUserSupportTickets = (userId) => {
    return supportTickets.filter(ticket => ticket.userUid === userId);
  };

  const filteredUsers = blockedUsers.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'system_blocked') return user.blockedBySystem === true;
    if (filter === 'manual_blocked') return !user.blockedBySystem;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Blocked Users Management</h2>
              <p className="text-gray-600">Manage users blocked due to payment deadline violations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-red-50 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{blockedUsers.length}</div>
              <div className="text-sm text-red-600">Blocked Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({blockedUsers.length})
            </button>
            <button
              onClick={() => setFilter('system_blocked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'system_blocked'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              System Blocked ({blockedUsers.filter(u => u.blockedBySystem).length})
            </button>
            <button
              onClick={() => setFilter('manual_blocked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'manual_blocked'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Manual Blocked ({blockedUsers.filter(u => !u.blockedBySystem).length})
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Blocked Users</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No blocked users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const blockType = getBlockType(user);
              const userTickets = getUserSupportTickets(user.id);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.fullName || user.displayName}</h4>
                        <p className="text-sm text-gray-600">{user.userId} • {user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${blockType.color}`}>
                            <Shield className="w-3 h-3" />
                            {blockType.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            Blocked: {formatDate(user.blockedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Support Tickets Count */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        {userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUnblockModal(true);
                          }}
                          className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Unblock
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Block Reason */}
                  {user.blockReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Block Reason:</strong> {user.blockReason}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && !showUnblockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.fullName || selectedUser.displayName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.userId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Level</label>
                    <p className="text-gray-900">{selectedUser.level || 'Star'}</p>
                  </div>
                </div>

                {/* Block Information */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Block Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Block Reason:</strong> {selectedUser.blockReason}</p>
                    <p><strong>Blocked At:</strong> {formatDate(selectedUser.blockedAt)}</p>
                    <p><strong>Block Type:</strong> {selectedUser.blockedBySystem ? 'System Auto-Block' : 'Manual Block'}</p>
                    {selectedUser.blockedHelpId && (
                      <p><strong>Related Help ID:</strong> {selectedUser.blockedHelpId}</p>
                    )}
                  </div>
                </div>

                {/* Support Tickets */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Support Tickets</h4>
                  {getUserSupportTickets(selectedUser.id).length === 0 ? (
                    <p className="text-gray-500">No support tickets found</p>
                  ) : (
                    <div className="space-y-2">
                      {getUserSupportTickets(selectedUser.id).map((ticket) => (
                        <div key={ticket.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{ticket.reason}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unblock Modal */}
      <AnimatePresence>
        {showUnblockModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUnblockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Unlock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Unblock User</h3>
                    <p className="text-sm text-gray-600">Restore user access</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to unblock <strong>{selectedUser.fullName || selectedUser.displayName}</strong>?
                  </p>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for unblocking *
                    </label>
                    <textarea
                      value={unblockReason}
                      onChange={(e) => setUnblockReason(e.target.value)}
                      placeholder="Explain why this user should be unblocked..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnblockModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnblockUser}
                    disabled={unblocking || !unblockReason.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {unblocking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Unblocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        Unblock User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockedUsersManager;
