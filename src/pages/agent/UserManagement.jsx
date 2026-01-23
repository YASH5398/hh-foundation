import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiSearch, FiFilter, FiEye, FiMail, FiPhone,
  FiCalendar, FiMapPin, FiActivity, FiRefreshCw, FiDownload,
  FiUser, FiCreditCard, FiHelpCircle, FiAlertTriangle,
  FiCheckCircle, FiXCircle, FiClock, FiStar, FiTrendingUp,
  FiAlertCircle, FiSettings, FiKey, FiHeart
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, where, orderBy, limit, startAfter,
  getDocs, doc, getDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-hot-toast';
import UserProfileView from '../../components/agent/UserProfileView';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';

const UserManagement = () => {
  const { currentUser } = useAgentAuth();
  const [loading, setLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination
  const USERS_PER_PAGE = 20;

  // Remove old filter options - no longer needed for search-based interface

  // Remove automatic loading - users will only be loaded when searched

  // Search user by ID
  const searchUser = async (userId) => {
    if (!userId.trim()) {
      setSearchError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setSearchError('');
    setSearchedUser(null);
    setHasSearched(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', userId.trim()));
      
      if (userDoc.exists()) {
        const userData = {
          uid: userDoc.id,
          ...userDoc.data()
        };
        setSearchedUser(userData);
        await loadUserStats(userData.uid);
      } else {
        setSearchError('User not found with this ID');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setSearchError('Failed to search user. Please try again.');
      toast.error('Failed to search user');
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchUser(searchTerm);
  };



  const loadUserStats = async (userId) => {
    try {
      const stats = {
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0,
        totalSendHelp: 0,
        totalReceiveHelp: 0,
        successfulTransactions: 0
      };
      
      // Load support tickets
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('userId', '==', userId),
        limit(100)
      );
      
      const ticketsSnapshot = await getDocs(ticketsQuery);
      stats.totalTickets = ticketsSnapshot.size;
      
      ticketsSnapshot.docs.forEach(doc => {
        const ticket = doc.data();
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          stats.resolvedTickets++;
        } else {
          stats.pendingTickets++;
        }
      });
      
      // Load sendHelp transactions
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('userId', '==', userId),
        limit(100)
      );
      
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      stats.totalSendHelp = sendHelpSnapshot.size;
      
      sendHelpSnapshot.docs.forEach(doc => {
        const transaction = doc.data();
        if (transaction.status === 'completed' || transaction.status === 'confirmed') {
          stats.successfulTransactions++;
        }
      });
      
      // Load receiveHelp transactions
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('userId', '==', userId),
        limit(100)
      );
      
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      stats.totalReceiveHelp = receiveHelpSnapshot.size;
      
      receiveHelpSnapshot.docs.forEach(doc => {
        const transaction = doc.data();
        if (transaction.status === 'completed' || transaction.status === 'confirmed') {
          stats.successfulTransactions++;
        }
      });
      
      setUserStats(prev => ({
        ...prev,
        [userId]: stats
      }));
      
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleUserClick = async (userData) => {
    setSelectedUser(userData);
    setShowUserDetails(true);
    
    // Load user stats if not already loaded
    if (!userStats[userData.uid]) {
      await loadUserStats(userData.uid);
    }
  };

  const getStatusColor = (userData) => {
    if (userData.isSuspended) return 'red';
    if (userData.isActivated && userData.isVerified) return 'green';
    if (userData.isActivated) return 'blue';
    if (userData.isVerified) return 'yellow';
    return 'gray';
  };

  const getStatusLabel = (userData) => {
    if (userData.isSuspended) return 'Suspended';
    if (userData.isActivated && userData.isVerified) return 'Active';
    if (userData.isActivated) return 'Activated';
    if (userData.isVerified) return 'Verified';
    return 'Pending';
  };

  const getStatusIcon = (userData) => {
    if (userData.isSuspended) return <FiXCircle className="w-4 h-4" />;
    if (userData.isActivated && userData.isVerified) return <FiCheckCircle className="w-4 h-4" />;
    if (userData.isActivated) return <FiActivity className="w-4 h-4" />;
    if (userData.isVerified) return <FiCheckCircle className="w-4 h-4" />;
    return <FiClock className="w-4 h-4" />;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FiStar className="w-4 h-4 text-purple-500" />;
      case 'agent': return <FiHelpCircle className="w-4 h-4 text-blue-500" />;
      case 'user': return <FiUser className="w-4 h-4 text-gray-500" />;
      default: return <FiUser className="w-4 h-4 text-gray-500" />;
    }
  };


  const exportUsers = () => {
    try {
      if (!searchedUser) {
        toast.error('No user data to export');
        return;
      }
      
      const csvData = [searchedUser].map(userData => ({
        'User ID': userData.uid,
        'Full Name': userData.fullName || '',
        'Email': userData.email || '',
        'Phone': userData.phone || '',
        'Role': userData.role || 'user',
        'Status': getStatusLabel(userData),
        'Referral Count': userData.referralCount || 0,
        'Created At': formatDate(userData.createdAt),
        'Last Login': formatDate(userData.lastLoginAt)
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FiUsers className="w-6 h-6 text-blue-500" />
            <span>User Management</span>
          </h1>
          <p className="text-gray-600">Search for users by their User ID to view complete profiles</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="userId"
                type="text"
                placeholder="Enter User ID to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <FiRefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <FiSearch className="w-5 h-5" />
              )}
              <span>{loading ? 'Searching...' : 'Search User'}</span>
            </button>
            
            {hasSearched && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchedUser(null);
                  setSearchError('');
                  setHasSearched(false);
                }}
                className="px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          {searchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{searchError}</p>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Searching user...</p>
          </div>
        ) : searchError ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-500 font-medium">Error</p>
            <p className="text-sm text-gray-500">{searchError}</p>
          </div>
        ) : !hasSearched ? (
          <div className="p-8 text-center">
            <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Enter a User ID to search</p>
            <p className="text-sm text-gray-400">Use the search bar above to find a specific user</p>
          </div>
        ) : !searchedUser ? (
          <div className="p-8 text-center">
            <FiUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">User not found</p>
            <p className="text-sm text-gray-400">No user found with the provided ID</p>
          </div>
        ) : (
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* User Header */}
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <img
                    src={getProfileImageUrl(searchedUser)}
                    alt={searchedUser.fullName}
                    className={`${PROFILE_IMAGE_CLASSES.large}`}
                    onError={(e) => {
                      e.target.src = getProfileImageUrl(null); // Fallback to default
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {searchedUser.fullName || 'No Name'}
                  </h2>
                  <p className="text-gray-600">User ID: {searchedUser.uid}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    {/* Role Badge */}
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {getRoleIcon(searchedUser.role)}
                      <span>{searchedUser.role || 'user'}</span>
                    </div>
                    {/* Status Badge */}
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusColor(searchedUser) === 'green' ? 'bg-green-100 text-green-800' :
                      getStatusColor(searchedUser) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      getStatusColor(searchedUser) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      getStatusColor(searchedUser) === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusIcon(searchedUser)}
                      <span>{getStatusLabel(searchedUser)}</span>
                    </div>
                   </div>
                 </div>
               </div>

               {/* User Details Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Personal Information */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiUser className="w-5 h-5 mr-2" />
                     Personal Information
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Full Name</label>
                       <p className="text-gray-900">{searchedUser.fullName || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Email</label>
                       <p className="text-gray-900 break-all">{searchedUser.email || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Phone</label>
                       <p className="text-gray-900">{searchedUser.phone || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                       <p className="text-gray-900">{searchedUser.whatsapp || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Sponsor ID</label>
                       <p className="text-gray-900">{searchedUser.sponsorId || 'Not provided'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Account Information */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiSettings className="w-5 h-5 mr-2" />
                     Account Information
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">User ID</label>
                       <p className="text-gray-900 font-mono text-sm">{searchedUser.uid}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Role</label>
                       <p className="text-gray-900">{searchedUser.role || 'user'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Status</label>
                       <p className="text-gray-900">{getStatusLabel(searchedUser)}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Verified</label>
                       <p className="text-gray-900">{searchedUser.isVerified ? 'Yes' : 'No'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Activated</label>
                       <p className="text-gray-900">{searchedUser.isActivated ? 'Yes' : 'No'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Joined</label>
                       <p className="text-gray-900">{formatDate(searchedUser.createdAt)}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Last Login</label>
                       <p className="text-gray-900">{searchedUser.lastLoginAt ? formatDate(searchedUser.lastLoginAt) : 'Never'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Financial Information */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiCreditCard className="w-5 h-5 mr-2" />
                     Financial Information
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Bank Name</label>
                       <p className="text-gray-900">{searchedUser.bankName || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Account Number</label>
                       <p className="text-gray-900">{searchedUser.accountNumber || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                       <p className="text-gray-900">{searchedUser.ifscCode || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">UPI ID</label>
                       <p className="text-gray-900">{searchedUser.upiId || 'Not provided'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Payment Method</label>
                       <p className="text-gray-900">{searchedUser.paymentMethod || 'Not provided'}</p>
                     </div>
                   </div>
                 </div>

                 {/* E-PIN Information */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiKey className="w-5 h-5 mr-2" />
                     E-PIN Information
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Total E-PINs</label>
                       <p className="text-gray-900">{searchedUser.totalEpins || 0}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Used E-PINs</label>
                       <p className="text-gray-900">{searchedUser.usedEpins || 0}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Available E-PINs</label>
                       <p className="text-gray-900">{(searchedUser.totalEpins || 0) - (searchedUser.usedEpins || 0)}</p>
                     </div>
                   </div>
                 </div>

                 {/* Help Status */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiHeart className="w-5 h-5 mr-2" />
                     Help Status
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Can Send Help</label>
                       <p className="text-gray-900">{searchedUser.canSendHelp ? 'Yes' : 'No'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Can Receive Help</label>
                       <p className="text-gray-900">{searchedUser.canReceiveHelp ? 'Yes' : 'No'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Help Level</label>
                       <p className="text-gray-900">{searchedUser.helpLevel || 'Not set'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Statistics */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     <FiTrendingUp className="w-5 h-5 mr-2" />
                     Statistics
                   </h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Referral Count</label>
                       <p className="text-gray-900">{searchedUser.referralCount || 0}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Total Earnings</label>
                       <p className="text-gray-900">₹{searchedUser.totalEarnings || 0}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Total Withdrawals</label>
                       <p className="text-gray-900">₹{searchedUser.totalWithdrawals || 0}</p>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserDetails && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowUserDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {/* User Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {selectedUser.profileImage ? (
                          <img
                            src={selectedUser.profileImage}
                            alt={selectedUser.fullName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {selectedUser.fullName || 'No Name'}
                          </h3>
                          <p className="text-gray-600">{selectedUser.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(selectedUser) === 'green' ? 'bg-green-100 text-green-800' :
                              getStatusColor(selectedUser) === 'blue' ? 'bg-blue-100 text-blue-800' :
                              getStatusColor(selectedUser) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              getStatusColor(selectedUser) === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusIcon(selectedUser)}
                              <span>{getStatusLabel(selectedUser)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {getRoleIcon(selectedUser.role)}
                              <span>{selectedUser.role || 'user'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">User ID</label>
                          <p className="text-gray-900 font-mono">{selectedUser.uid}</p>
                        </div>
                        
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">Phone</label>
                          <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">WhatsApp</label>
                          <p className="text-gray-900">{selectedUser.whatsapp || 'Not provided'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">Referral Count</label>
                          <p className="text-gray-900">{selectedUser.referralCount || 0}</p>
                        </div>
                        
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">Created At</label>
                          <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                        </div>
                        
                        <div>
                          <label className="block text-gray-600 font-medium mb-1">Last Login</label>
                          <p className="text-gray-900">{formatDate(selectedUser.lastLoginAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h4>
                      
                      {userStats[selectedUser.uid] ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Support Tickets</span>
                            <span className="font-semibold">{userStats[selectedUser.uid].totalTickets}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Resolved Tickets</span>
                            <span className="font-semibold text-green-600">{userStats[selectedUser.uid].resolvedTickets}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Pending Tickets</span>
                            <span className="font-semibold text-yellow-600">{userStats[selectedUser.uid].pendingTickets}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Send Help Requests</span>
                            <span className="font-semibold">{userStats[selectedUser.uid].totalSendHelp}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Receive Help Requests</span>
                            <span className="font-semibold">{userStats[selectedUser.uid].totalReceiveHelp}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Successful Transactions</span>
                            <span className="font-semibold text-blue-600">{userStats[selectedUser.uid].successfulTransactions}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <FiRefreshCw className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-500">Loading stats...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                {(selectedUser.address || selectedUser.city || selectedUser.state || selectedUser.pincode) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Address Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedUser.address && (
                          <div>
                            <label className="block text-gray-600 font-medium mb-1">Address</label>
                            <p className="text-gray-900">{selectedUser.address}</p>
                          </div>
                        )}
                        
                        {selectedUser.city && (
                          <div>
                            <label className="block text-gray-600 font-medium mb-1">City</label>
                            <p className="text-gray-900">{selectedUser.city}</p>
                          </div>
                        )}
                        
                        {selectedUser.state && (
                          <div>
                            <label className="block text-gray-600 font-medium mb-1">State</label>
                            <p className="text-gray-900">{selectedUser.state}</p>
                          </div>
                        )}
                        
                        {selectedUser.pincode && (
                          <div>
                            <label className="block text-gray-600 font-medium mb-1">Pincode</label>
                            <p className="text-gray-900">{selectedUser.pincode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
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

export default UserManagement;