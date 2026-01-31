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
  const [searchTerm, setSearchTerm] = useState('');

  // Listen to blocked users
  useEffect(() => {
    try {
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
        setBlockedUsers(users || []);
        setLoading(false);
      }, (error) => {
        console.error('Error listening to blocked users:', error);
        setBlockedUsers([]); // Fallback to empty array on error
        setLoading(false);
        toast.error('Failed to load blocked users. Check permissions.');
      });

      return unsubscribeUsers;
    } catch (err) {
      console.error('Critical error in BlockedUsersManager:', err);
      setBlockedUsers([]);
      setLoading(false);
    }
  }, []);

  // Listen to support tickets
  useEffect(() => {
    const unsubscribeTickets = listenToAllSupportTickets((tickets) => {
      setSupportTickets((tickets || []).filter(ticket =>
        ticket && (
          ticket.category === 'block_resolution' ||
          String(ticket.reason || "").toLowerCase().includes('blocked')
        )
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

  const safeUsers = Array.isArray(blockedUsers) ? blockedUsers : [];
  const q = (searchTerm || "").toLowerCase();

  const filteredUsers = safeUsers.filter(user => {
    if (!user) return false;

    // 1. Search filter
    const name = String(user.fullName || user.displayName || "").toLowerCase();
    const email = String(user.email || "").toLowerCase();
    const id = String(user.userId || "").toLowerCase();

    const matchesSearch = name.includes(q) || email.includes(q) || id.includes(q);
    if (!matchesSearch) return false;

    // 2. Category filter
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
      <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Blocked Users Management</h2>
              <p className="text-slate-400">Manage users blocked due to payment deadline violations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-red-900/20 border border-red-500/20 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{blockedUsers.length}</div>
              <div className="text-sm text-red-400/80">Blocked Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                All ({blockedUsers.length})
              </button>
              <button
                onClick={() => setFilter('system_blocked')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'system_blocked'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                System
              </button>
              <button
                onClick={() => setFilter('manual_blocked')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'manual_blocked'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Manual
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Blocked Users</h3>
        </div>

        <div className="divide-y divide-slate-700">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
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
                  className="p-6 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{user.fullName || user.displayName}</h4>
                        <p className="text-sm text-slate-400">{user.userId} • {user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${blockType.type === 'system' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                            }`}>
                            <Shield className="w-3 h-3" />
                            {blockType.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            Blocked: {formatDate(user.blockedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Support Tickets Count */}
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                        {userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUnblockModal(true);
                          }}
                          className="px-3 py-2 bg-green-900/30 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-900/50 transition-colors flex items-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Unblock
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Block Reason */}
                  {user.blockReason && (
                    <div className="mt-3 p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-300">
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Name</label>
                    <p className="text-lg font-semibold text-white">{selectedUser.fullName || selectedUser.displayName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">User ID</label>
                    <p className="text-lg font-semibold text-white">{selectedUser.userId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Level</label>
                    <p className="text-white">{selectedUser.level || 'Star'}</p>
                  </div>
                </div>

                {/* Block Information */}
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2">Block Information</h4>
                  <div className="space-y-2 text-sm text-slate-300">
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
                  <h4 className="font-semibold text-white mb-3">Support Tickets</h4>
                  {getUserSupportTickets(selectedUser.id).length === 0 ? (
                    <p className="text-slate-500">No support tickets found</p>
                  ) : (
                    <div className="space-y-2">
                      {getUserSupportTickets(selectedUser.id).map((ticket) => (
                        <div key={ticket.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{ticket.reason}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                              ticket.status === 'resolved' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                                'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                              }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{ticket.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUnblockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-900/20 rounded-full flex items-center justify-center">
                    <Unlock className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Unblock User</h3>
                    <p className="text-sm text-slate-400">Restore user access</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-slate-300 mb-3">
                    Are you sure you want to unblock <strong>{selectedUser.fullName || selectedUser.displayName}</strong>?
                  </p>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-400">
                      Reason for unblocking *
                    </label>
                    <textarea
                      value={unblockReason}
                      onChange={(e) => setUnblockReason(e.target.value)}
                      placeholder="Explain why this user should be unblocked..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnblockModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnblockUser}
                    disabled={unblocking || !unblockReason.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 transition-colors flex items-center justify-center gap-2"
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
