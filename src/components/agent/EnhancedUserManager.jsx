import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiUser, FiSearch, FiEye, FiArrowLeft, FiSend, FiDownload, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, sendHelp, receiveHelp
  const [sendHelpRecords, setSendHelpRecords] = useState([]);
  const [receiveHelpRecords, setReceiveHelpRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Real-time sync for users
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filtered users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = search.toLowerCase();
      return (
        search === '' ||
        user.id?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.userId?.toLowerCase().includes(searchLower)
      );
    });
  }, [users, search]);

  // Fetch help records for selected user
  const fetchHelpRecords = async (userId) => {
    setLoadingRecords(true);
    try {
      // Fetch send help records
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      const sendHelps = sendHelpSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch receive help records
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('receiverId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      const receiveHelps = receiveHelpSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSendHelpRecords(sendHelps);
      setReceiveHelpRecords(receiveHelps);
    } catch (error) {
      console.error('Error fetching help records:', error);
      toast.error('Failed to fetch help records');
    } finally {
      setLoadingRecords(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setActiveTab('profile');
    fetchHelpRecords(user.userId || user.id);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return <FiCheck className="w-4 h-4" />;
      case 'pending':
        return <FiClock className="w-4 h-4" />;
      case 'rejected':
      case 'cancelled':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Render user profile details
  const renderUserProfile = () => {
    if (!selectedUser) return null;

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="font-mono text-gray-900">{selectedUser.userId || selectedUser.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-gray-900">{selectedUser.fullName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{selectedUser.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">{selectedUser.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">WhatsApp</label>
              <p className="text-gray-900">{selectedUser.whatsapp || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Sponsor ID</label>
              <p className="text-gray-900">{selectedUser.sponsorId || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* MLM Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">MLM Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Level Status</label>
              <p className="text-gray-900">{selectedUser.levelStatus || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Referral Count</label>
              <p className="text-gray-900">{selectedUser.referralCount || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Team</label>
              <p className="text-gray-900">{selectedUser.totalTeam || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Help Received</label>
              <p className="text-gray-900">{selectedUser.helpReceived || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Earnings</label>
              <p className="text-gray-900">₹{selectedUser.totalEarnings || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-gray-900 capitalize">{selectedUser.role || 'user'}</p>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Activation Status</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedUser.isActivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedUser.isActivated ? 'Activated' : 'Not Activated'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Block Status</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedUser.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {selectedUser.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">On Hold</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedUser.isOnHold ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {selectedUser.isOnHold ? 'On Hold' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">PhonePe</label>
              <p className="text-gray-900">{selectedUser.paymentMethod?.phonePe || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Google Pay</label>
              <p className="text-gray-900">{selectedUser.paymentMethod?.gpay || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">UPI ID</label>
              <p className="text-gray-900">{selectedUser.paymentMethod?.upiId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Bank Account</label>
              <p className="text-gray-900">
                {selectedUser.paymentMethod?.bank?.accountNumber ? 
                  `${selectedUser.paymentMethod.bank.accountNumber} (${selectedUser.paymentMethod.bank.ifsc})` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {/* KYC Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">PAN Number</label>
              <p className="text-gray-900">{selectedUser.kycDetails?.pan || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Aadhaar Number</label>
              <p className="text-gray-900">{selectedUser.kycDetails?.aadhaar || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render help records table
  const renderHelpRecords = (records, type) => {
    if (loadingRecords) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-8">
          <FiDownload className="mx-auto text-gray-400 text-4xl mb-2" />
          <p className="text-gray-500">No {type} records found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === 'Send Help' ? 'Receiver' : 'Sender'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiUser className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {type === 'Send Help' ? record.receiverName : record.senderName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {type === 'Send Help' ? record.receiverId : record.senderId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{record.amount || 300}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusIcon(record.status)}
                    <span className="ml-1 capitalize">{record.status || 'pending'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.level || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (selectedUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedUser.fullName || 'Unknown User'}
                </h2>
                <p className="text-gray-600">{selectedUser.userId || selectedUser.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab('sendHelp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sendHelp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Send Help Records
            </button>
            <button
              onClick={() => setActiveTab('receiveHelp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'receiveHelp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Receive Help Records
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderUserProfile()}
              </motion.div>
            )}
            {activeTab === 'sendHelp' && (
              <motion.div
                key="sendHelp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Help Records</h3>
                {renderHelpRecords(sendHelpRecords, 'Send Help')}
              </motion.div>
            )}
            {activeTab === 'receiveHelp' && (
              <motion.div
                key="receiveHelp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Receive Help Records</h3>
                {renderHelpRecords(receiveHelpRecords, 'Receive Help')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        <p className="text-gray-600 mt-1">View complete user profiles and help records</p>
      </div>

      {/* Search */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID, Name, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <FiUser className="mx-auto text-gray-400 text-4xl mb-2" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-50 rounded-lg p-3 lg:p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="text-blue-600 text-sm lg:text-base" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm lg:text-base truncate">
                        {user.fullName || 'Unknown User'}
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">{user.userId || user.id}</p>
                    </div>
                  </div>
                  <FiEye className="text-gray-400 flex-shrink-0" />
                </div>
                
                <div className="space-y-1 lg:space-y-2">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-500">Level:</span>
                    <span className="text-gray-900 truncate ml-2">{user.levelStatus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-500">Referrals:</span>
                    <span className="text-gray-900">{user.referralCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isBlocked ? 'bg-red-100 text-red-800' : 
                      user.isActivated ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isBlocked ? 'Blocked' : user.isActivated ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedUserManager;