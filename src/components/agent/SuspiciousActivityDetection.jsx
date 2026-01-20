import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiUser, FiClock, FiDollarSign, FiActivity,
  FiEye, FiFilter, FiRefreshCw, FiDownload, FiSearch,
  FiCalendar, FiTrendingUp, FiAlertCircle, FiShield
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, getDoc, Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
<<<<<<< HEAD
import { formatDate } from '../../utils/formatDate';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const SuspiciousActivityDetection = () => {
  const [loading, setLoading] = useState(false);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [filters, setFilters] = useState({
    activityType: 'all',
    riskLevel: 'all',
    dateRange: '7d'
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Activity types for filtering
  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'multiple_logins', label: 'Multiple Logins' },
    { value: 'rapid_transactions', label: 'Rapid Transactions' },
    { value: 'unusual_patterns', label: 'Unusual Patterns' },
    { value: 'account_changes', label: 'Account Changes' },
    { value: 'suspicious_referrals', label: 'Suspicious Referrals' }
  ];

  // Risk levels
  const riskLevels = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'high', label: 'High Risk', color: 'red' },
    { value: 'medium', label: 'Medium Risk', color: 'yellow' },
    { value: 'low', label: 'Low Risk', color: 'green' }
  ];

  // Date range options
  const dateRanges = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  // Load suspicious activities
  const loadSuspiciousActivities = async () => {
    setLoading(true);
    try {
      const activities = [];
      
      // Get date range
      const now = new Date();
      const daysBack = parseInt(filters.dateRange.replace('d', ''));
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Detect multiple logins from different locations
      await detectMultipleLogins(activities, startDate);
      
      // Detect rapid transactions
      await detectRapidTransactions(activities, startDate);
      
      // Detect unusual patterns
      await detectUnusualPatterns(activities, startDate);
      
      // Detect suspicious account changes
      await detectAccountChanges(activities, startDate);
      
      // Detect suspicious referral patterns
      await detectSuspiciousReferrals(activities, startDate);

      // Filter activities based on selected filters
      const filteredActivities = filterActivities(activities);
      
      // Sort by risk level and timestamp
      filteredActivities.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return b.timestamp.toDate() - a.timestamp.toDate();
      });

      setSuspiciousActivities(filteredActivities);
    } catch (error) {
      console.error('Error loading suspicious activities:', error);
      toast.error('Failed to load suspicious activities');
    } finally {
      setLoading(false);
    }
  };

  // Detect multiple logins from different locations
  const detectMultipleLogins = async (activities, startDate) => {
    try {
      // This would typically check login logs
      // For now, we'll simulate detection logic
      const usersQuery = query(
        collection(db, 'users'),
        where('lastLoginAt', '>=', Timestamp.fromDate(startDate))
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // Simulate detection of multiple logins
        if (userData.loginCount && userData.loginCount > 10) {
          activities.push({
            id: `login_${doc.id}_${Date.now()}`,
            type: 'multiple_logins',
            userId: doc.id,
            userName: userData.fullName || 'Unknown User',
            userEmail: userData.email,
            riskLevel: 'medium',
            description: `User has logged in ${userData.loginCount} times in the selected period`,
            timestamp: userData.lastLoginAt || Timestamp.now(),
            details: {
              loginCount: userData.loginCount,
              lastLogin: userData.lastLoginAt
            }
          });
        }
      });
    } catch (error) {
      console.error('Error detecting multiple logins:', error);
    }
  };

  // Detect rapid transactions
  const detectRapidTransactions = async (activities, startDate) => {
    try {
      // Check sendHelp transactions
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );
      
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      const userTransactions = {};
      
      sendHelpSnapshot.forEach(doc => {
        const data = doc.data();
        const userId = data.senderId;
        
        if (!userTransactions[userId]) {
          userTransactions[userId] = [];
        }
        
        userTransactions[userId].push({
          timestamp: data.createdAt,
          amount: data.amount,
          type: 'sendHelp'
        });
      });
      
      // Analyze transaction patterns
      for (const [userId, transactions] of Object.entries(userTransactions)) {
        if (transactions.length >= 5) {
          // Check if transactions are within a short time frame
          const sortedTransactions = transactions.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
          const firstTransaction = sortedTransactions[0].timestamp.toDate();
          const lastTransaction = sortedTransactions[sortedTransactions.length - 1].timestamp.toDate();
          const timeDiff = (lastTransaction - firstTransaction) / (1000 * 60 * 60); // hours
          
          if (timeDiff < 24 && transactions.length >= 5) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            activities.push({
              id: `rapid_trans_${userId}_${Date.now()}`,
              type: 'rapid_transactions',
              userId: userId,
              userName: userData.fullName || 'Unknown User',
              userEmail: userData.email,
              riskLevel: 'high',
              description: `User made ${transactions.length} transactions within ${Math.round(timeDiff)} hours`,
              timestamp: Timestamp.fromDate(lastTransaction),
              details: {
                transactionCount: transactions.length,
                timeFrame: `${Math.round(timeDiff)} hours`,
                totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting rapid transactions:', error);
    }
  };

  // Detect unusual patterns
  const detectUnusualPatterns = async (activities, startDate) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        
        // Detect users with unusual referral patterns
        if (userData.referralCount && userData.referralCount > 20) {
          activities.push({
            id: `unusual_${doc.id}_${Date.now()}`,
            type: 'unusual_patterns',
            userId: doc.id,
            userName: userData.fullName || 'Unknown User',
            userEmail: userData.email,
            riskLevel: 'medium',
            description: `User has an unusually high number of referrals (${userData.referralCount})`,
            timestamp: userData.createdAt || Timestamp.now(),
            details: {
              referralCount: userData.referralCount,
              accountAge: userData.createdAt
            }
          });
        }
        
        // Detect accounts with missing critical information
        if (!userData.phone || !userData.bankName || !userData.accountNumber) {
          activities.push({
            id: `incomplete_${doc.id}_${Date.now()}`,
            type: 'unusual_patterns',
            userId: doc.id,
            userName: userData.fullName || 'Unknown User',
            userEmail: userData.email,
            riskLevel: 'low',
            description: 'User account has incomplete profile information',
            timestamp: userData.createdAt || Timestamp.now(),
            details: {
              missingPhone: !userData.phone,
              missingBankInfo: !userData.bankName || !userData.accountNumber,
              profileCompleteness: calculateProfileCompleteness(userData)
            }
          });
        }
      });
    } catch (error) {
      console.error('Error detecting unusual patterns:', error);
    }
  };

  // Detect suspicious account changes
  const detectAccountChanges = async (activities, startDate) => {
    try {
      // This would typically check audit logs for account changes
      // For now, we'll simulate detection based on recent updates
      const usersQuery = query(
        collection(db, 'users'),
        where('updatedAt', '>=', Timestamp.fromDate(startDate))
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        
        if (userData.updatedAt && userData.createdAt) {
          const accountAge = (userData.updatedAt.toDate() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24);
          
          // Flag accounts that were updated very recently after creation
          if (accountAge < 1) {
            activities.push({
              id: `account_change_${doc.id}_${Date.now()}`,
              type: 'account_changes',
              userId: doc.id,
              userName: userData.fullName || 'Unknown User',
              userEmail: userData.email,
              riskLevel: 'medium',
              description: 'Account information was modified shortly after creation',
              timestamp: userData.updatedAt,
              details: {
                accountAge: `${Math.round(accountAge * 24)} hours`,
                lastUpdate: userData.updatedAt
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error detecting account changes:', error);
    }
  };

  // Detect suspicious referral patterns
  const detectSuspiciousReferrals = async (activities, startDate) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const sponsorCounts = {};
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.sponsorId) {
          sponsorCounts[userData.sponsorId] = (sponsorCounts[userData.sponsorId] || 0) + 1;
        }
      });
      
      // Flag sponsors with unusually high referral rates
      for (const [sponsorId, count] of Object.entries(sponsorCounts)) {
        if (count > 10) {
          const sponsorDoc = await getDoc(doc(db, 'users', sponsorId));
          const sponsorData = sponsorDoc.exists() ? sponsorDoc.data() : {};
          
          activities.push({
            id: `suspicious_referral_${sponsorId}_${Date.now()}`,
            type: 'suspicious_referrals',
            userId: sponsorId,
            userName: sponsorData.fullName || 'Unknown User',
            userEmail: sponsorData.email,
            riskLevel: 'high',
            description: `User referred ${count} new members in the selected period`,
            timestamp: Timestamp.now(),
            details: {
              referralCount: count,
              timeFrame: filters.dateRange
            }
          });
        }
      }
    } catch (error) {
      console.error('Error detecting suspicious referrals:', error);
    }
  };

  // Calculate profile completeness
  const calculateProfileCompleteness = (userData) => {
    const requiredFields = ['fullName', 'email', 'phone', 'bankName', 'accountNumber', 'ifscCode'];
    const completedFields = requiredFields.filter(field => userData[field]);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Filter activities based on current filters
  const filterActivities = (activities) => {
    return activities.filter(activity => {
      if (filters.activityType !== 'all' && activity.type !== filters.activityType) {
        return false;
      }
      if (filters.riskLevel !== 'all' && activity.riskLevel !== filters.riskLevel) {
        return false;
      }
      return true;
    });
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get activity type icon
  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'multiple_logins': return <FiUser className="w-4 h-4" />;
      case 'rapid_transactions': return <FiDollarSign className="w-4 h-4" />;
      case 'unusual_patterns': return <FiActivity className="w-4 h-4" />;
      case 'account_changes': return <FiShield className="w-4 h-4" />;
      case 'suspicious_referrals': return <FiTrendingUp className="w-4 h-4" />;
      default: return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

<<<<<<< HEAD
=======
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleString();
  };
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  // Handle activity click
  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setShowDetails(true);
  };

  // Export activities
  const exportActivities = () => {
    const csvContent = [
      ['Type', 'User', 'Email', 'Risk Level', 'Description', 'Timestamp'],
      ...suspiciousActivities.map(activity => [
        activity.type,
        activity.userName,
        activity.userEmail,
        activity.riskLevel,
        activity.description,
<<<<<<< HEAD
        formatDate(activity.timestamp, { includeTime: true })
=======
        formatDate(activity.timestamp)
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspicious_activities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load activities on component mount and filter changes
  useEffect(() => {
    loadSuspiciousActivities();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiAlertTriangle className="w-6 h-6 mr-2 text-red-500" />
            Suspicious Activity Detection
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and detect potentially suspicious user activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportActivities}
            disabled={suspiciousActivities.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadSuspiciousActivities}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Activity Type Filter */}
          <select
            value={filters.activityType}
            onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          {/* Risk Level Filter */}
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {riskLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          
          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          
          {/* Activity Count */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Found: {suspiciousActivities.length} activities</span>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Detecting suspicious activities...</p>
          </div>
        ) : suspiciousActivities.length === 0 ? (
          <div className="p-8 text-center">
            <FiShield className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">No suspicious activities detected</p>
            <p className="text-sm text-gray-400">All user activities appear normal</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {suspiciousActivities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        {getActivityTypeIcon(activity.type)}
                      </div>
                    </div>
                    
                    {/* Activity Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {activity.userName}
                        </h3>
                        
                        {/* Risk Level Badge */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(activity.riskLevel)}`}>
                          {activity.riskLevel.toUpperCase()} RISK
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{activity.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiUser className="w-4 h-4" />
                          <span>{activity.userEmail}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
<<<<<<< HEAD
                          <span>{formatDate(activity.timestamp, { includeTime: true })}</span>
=======
                          <span>{formatDate(activity.timestamp)}</span>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View Details Button */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivityClick(activity);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      <AnimatePresence>
        {showDetails && selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    {getActivityTypeIcon(selectedActivity.type)}
                    <span className="ml-2">Activity Details</span>
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">User</label>
                      <p className="text-gray-900">{selectedActivity.userName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedActivity.userEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Risk Level</label>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(selectedActivity.riskLevel)}`}>
                        {selectedActivity.riskLevel.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Detected At</label>
<<<<<<< HEAD
                      <p className="text-gray-900">{formatDate(selectedActivity.timestamp, { includeTime: true })}</p>
=======
                      <p className="text-gray-900">{formatDate(selectedActivity.timestamp)}</p>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900">{selectedActivity.description}</p>
                  </div>
                  
                  {selectedActivity.details && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Additional Details</label>
                      <div className="bg-gray-50 rounded-lg p-4 mt-2">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedActivity.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
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

export default SuspiciousActivityDetection;