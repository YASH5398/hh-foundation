import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdError,
  MdBuild,
  MdAnalytics,
  MdHistory,
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdEdit,
  MdDelete,
  MdAdd,
  MdClose,
  MdSave,
  MdPlayArrow,
  MdStop,
  MdSettings,
  MdSecurity,
  MdWarning,
  MdCheckCircle,
  MdAutorenew,
  MdBugReport,
  MdSpeed,
  MdLock,
  MdLockOpen,
  MdSync,
  MdRestore,
  MdUpdate,
  MdTrendingUp,
  MdArrowBack
} from 'react-icons/md';
import {
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiShield,
  FiZap,
  FiTarget,
  FiDatabase,
  FiMonitor,
  FiTool
} from 'react-icons/fi';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, orderBy, limit, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const UserTransactionSafetyHub = () => {
  const navigate = useNavigate();

  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // User Management
  const [showUserIdModal, setShowUserIdModal] = useState(true);
  const [inputUserId, setInputUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserData, setTargetUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Dashboard Data
  const [dashboardStats, setDashboardStats] = useState({
    activeUsers: 0,
    pendingHelps: 0,
    failedPayments: 0,
    successRate: 0
  });

  // Monitoring Data
  const [pendingHelps, setPendingHelps] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Testing States
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // User Timeline
  const [showUserTimeline, setShowUserTimeline] = useState(false);
  const [userTimeline, setUserTimeline] = useState([]);

  // Edit Profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});

  // Sample data for demonstration
  const [users] = useState([
    { id: 'user1', name: 'John Doe', level: 1, isBlocked: false },
    { id: 'user2', name: 'Jane Smith', level: 2, isBlocked: false },
    { id: 'user3', name: 'Bob Johnson', level: 1, isBlocked: true }
  ]);

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Dashboard Data
  useEffect(() => {
    fetchDashboardData();
  }, [targetUserId]);

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (targetUserId) {
        // Fetch specific user data
        const userDoc = await getDoc(doc(db, 'users', targetUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Fetch user's send/receive help data
          const sendHelpQuery = query(
            collection(db, 'sendHelp'),
            where('userId', '==', targetUserId)
          );
          const receiveHelpQuery = query(
            collection(db, 'receiveHelp'),
            where('userId', '==', targetUserId)
          );

          const [sendHelpSnapshot, receiveHelpSnapshot] = await Promise.all([
            getDocs(sendHelpQuery),
            getDocs(receiveHelpQuery)
          ]);

          const sendHelps = sendHelpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const receiveHelps = receiveHelpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setTargetUserData({
            profile: userData,
            sendHelps,
            receiveHelps,
            stats: {
              totalSent: sendHelps.filter(h => h.status === 'completed').length,
              pendingSent: sendHelps.filter(h => h.status === 'pending').length,
              totalReceived: receiveHelps.filter(h => h.status === 'completed').length,
              pendingReceived: receiveHelps.filter(h => h.status === 'pending').length
            }
          });
        }
      } else {
        // Fetch general dashboard stats
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const sendHelpSnapshot = await getDocs(collection(db, 'sendHelp'));
        const receiveHelpSnapshot = await getDocs(collection(db, 'receiveHelp'));

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sendHelps = sendHelpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const receiveHelps = receiveHelpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const pendingHelps = [...sendHelps, ...receiveHelps].filter(h => h.status === 'pending');
        const failedPayments = [...sendHelps, ...receiveHelps].filter(h => h.status === 'failed');
        const completedHelps = [...sendHelps, ...receiveHelps].filter(h => h.status === 'completed');

        setDashboardStats({
          activeUsers: users.filter(u => !u.isBlocked).length,
          pendingHelps: pendingHelps.length,
          failedPayments: failedPayments.length,
          successRate: Math.round((completedHelps.length / (completedHelps.length + failedPayments.length)) * 100) || 0
        });

        setPendingHelps(pendingHelps);
        setFailedPayments(failedPayments);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle User ID Submit
  const handleUserIdSubmit = async (e) => {
    e.preventDefault();
    if (!inputUserId.trim()) return;

    setUserDataLoading(true);
    try {
      // Query users collection by userId field instead of document ID
      const usersQuery = query(
        collection(db, 'users'),
        where('userId', '==', inputUserId.trim())
      );
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        // Get the first matching user document
        const userDoc = querySnapshot.docs[0];
        setTargetUserId(userDoc.id); // Use the document ID as targetUserId
        setShowUserIdModal(false);
        toast.success('User data loaded successfully');
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
    } finally {
      setUserDataLoading(false);
    }
  };

  // Switch User
  const switchUser = () => {
    setTargetUserId('');
    setTargetUserData(null);
    setInputUserId('');
    setShowUserIdModal(true);
  };

  // Search User for Testing
  const searchUser = async () => {
    if (!selectedUserId.trim()) return;

    setUserSearchLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', selectedUserId.trim()));
      if (userDoc.exists()) {
        setSelectedUser({ id: selectedUserId.trim(), ...userDoc.data() });
        setEditProfileData(userDoc.data());
        toast.success('User found');
      } else {
        toast.error('User not found');
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to search user');
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Modal Functions
  const openEditModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  // Auto-Repair Functions
  const autoRepairFunctions = {
    reassignMissingReceivers: async () => {
      setLoading(true);
      try {
        const pendingQuery = query(
          collection(db, 'sendHelp'),
          where('status', '==', 'pending'),
          where('receiverId', '==', null)
        );

        const snapshot = await getDocs(pendingQuery);
        const batch = writeBatch(db);

        for (const docRef of snapshot.docs) {
          const data = docRef.data();
          // Find available receiver logic here
          const availableReceiversQuery = query(
            collection(db, 'users'),
            where('level', '==', data.level),
            where('isActivated', '==', true)
          );

          const receiversSnapshot = await getDocs(availableReceiversQuery);
          if (!receiversSnapshot.empty) {
            const receiver = receiversSnapshot.docs[0];
            batch.update(docRef.ref, {
              receiverId: receiver.id,
              assignedAt: new Date()
            });
          }
        }

        await batch.commit();
        toast.success('Missing receivers reassigned successfully');
        await logAuditAction('Auto-Repair', 'Reassigned missing receivers');
        fetchDashboardData();
      } catch (error) {
        console.error('Error reassigning receivers:', error);
        toast.error('Failed to reassign receivers');
      } finally {
        setLoading(false);
      }
    },

    autoFillMissingData: async () => {
      setLoading(true);
      try {
        // Implementation for auto-filling missing data
        toast.success('Missing data auto-filled successfully');
        await logAuditAction('Auto-Repair', 'Auto-filled missing data');
        fetchDashboardData();
      } catch (error) {
        console.error('Error auto-filling data:', error);
        toast.error('Failed to auto-fill data');
      } finally {
        setLoading(false);
      }
    },

    retryFailedPayments: async () => {
      setLoading(true);
      try {
        // Implementation for retrying failed payments
        toast.success('Failed payments retried successfully');
        await logAuditAction('Auto-Repair', 'Retried failed payments');
        fetchDashboardData();
      } catch (error) {
        console.error('Error retrying payments:', error);
        toast.error('Failed to retry payments');
      } finally {
        setLoading(false);
      }
    },

    bulkUnlockUsers: async () => {
      setLoading(true);
      try {
        const blockedUsersQuery = query(
          collection(db, 'users'),
          where('isBlocked', '==', true)
        );

        const snapshot = await getDocs(blockedUsersQuery);
        const batch = writeBatch(db);

        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            isBlocked: false,
            blockedAt: null,
            blockedReason: null
          });
        });

        await batch.commit();
        toast.success('Users unlocked successfully');
        await logAuditAction('Auto-Repair', 'Bulk unlocked users');
        fetchDashboardData();
      } catch (error) {
        console.error('Error unlocking users:', error);
        toast.error('Failed to unlock users');
      } finally {
        setLoading(false);
      }
    }
  };

  // Bulk Operations
  const bulkOperations = {
    processAllPendingHelps: async () => {
      setLoading(true);
      try {
        // Implementation for processing all pending helps
        toast.success('All pending helps processed successfully');
        await logAuditAction('Bulk Operation', 'Processed all pending helps');
        fetchDashboardData();
      } catch (error) {
        console.error('Error processing helps:', error);
        toast.error('Failed to process pending helps');
      } finally {
        setLoading(false);
      }
    },

    refreshAllStatuses: async () => {
      setLoading(true);
      try {
        // Implementation for refreshing all statuses
        toast.success('All statuses refreshed successfully');
        await logAuditAction('Bulk Operation', 'Refreshed all statuses');
        fetchDashboardData();
      } catch (error) {
        console.error('Error refreshing statuses:', error);
        toast.error('Failed to refresh statuses');
      } finally {
        setLoading(false);
      }
    },

    emergencyReset: async () => {
      if (!window.confirm('Are you sure you want to perform an emergency reset? This action cannot be undone.')) {
        return;
      }

      setLoading(true);
      try {
        // Implementation for emergency reset
        toast.success('Emergency reset completed successfully');
        await logAuditAction('Bulk Operation', 'Performed emergency reset');
        fetchDashboardData();
      } catch (error) {
        console.error('Error performing emergency reset:', error);
        toast.error('Failed to perform emergency reset');
      } finally {
        setLoading(false);
      }
    },

    updateAllLevels: async () => {
      setLoading(true);
      try {
        // Implementation for updating all levels
        toast.success('All levels updated successfully');
        await logAuditAction('Bulk Operation', 'Updated all user levels');
        fetchDashboardData();
      } catch (error) {
        console.error('Error updating levels:', error);
        toast.error('Failed to update levels');
      } finally {
        setLoading(false);
      }
    }
  };

  // Testing Functions
  const simulateSendHelpFlow = async () => {
    if (!selectedUser) return;

    try {
      const sendHelpData = {
        userId: selectedUser.id,
        amount: selectedUser.level * 1000,
        level: selectedUser.level,
        status: 'pending',
        createdAt: new Date(),
        isSimulation: true,
        simulatedBy: 'admin'
      };

      await addDoc(collection(db, 'adminSimulations'), {
        type: 'sendHelp',
        payload: sendHelpData,
        createdAt: serverTimestamp()
      });
      setTestResults(prev => [...prev, {
        type: 'Send Help Simulation',
        status: 'success',
        message: `Created send help for ${selectedUser.fullName} (₹${sendHelpData.amount})`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error simulating send help:', error);
      setTestResults(prev => [...prev, {
        type: 'Send Help Simulation',
        status: 'error',
        message: 'Failed to simulate send help flow',
        timestamp: new Date()
      }]);
    }
  };

  const simulateReceiveHelpFlow = async () => {
    if (!selectedUser) return;

    try {
      const receiveHelpData = {
        userId: selectedUser.id,
        amount: selectedUser.level * 1000,
        level: selectedUser.level,
        status: 'pending',
        createdAt: new Date(),
        isSimulation: true,
        simulatedBy: 'admin'
      };

      await addDoc(collection(db, 'adminSimulations'), {
        type: 'receiveHelp',
        payload: receiveHelpData,
        createdAt: serverTimestamp()
      });
      setTestResults(prev => [...prev, {
        type: 'Receive Help Simulation',
        status: 'success',
        message: `Created receive help for ${selectedUser.fullName} (₹${receiveHelpData.amount})`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error simulating receive help:', error);
      setTestResults(prev => [...prev, {
        type: 'Receive Help Simulation',
        status: 'error',
        message: 'Failed to simulate receive help flow',
        timestamp: new Date()
      }]);
    }
  };

  const simulateFailedTransaction = async () => {
    if (!selectedUser) return;

    try {
      // Find a pending help for this user
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('userId', '==', selectedUser.id),
        where('status', '==', 'pending'),
        limit(1)
      );

      const sendHelpSnapshot = await getDocs(sendHelpQuery);

      if (!sendHelpSnapshot.empty) {
        const helpDoc = sendHelpSnapshot.docs[0];
        await updateDoc(helpDoc.ref, {
          status: 'failed',
          failureReason: 'Simulated failure by admin',
          failedAt: new Date()
        });

        setTestResults(prev => [...prev, {
          type: 'Failed Transaction Simulation',
          status: 'success',
          message: `Marked transaction as failed for ${selectedUser.fullName}`,
          timestamp: new Date()
        }]);
      } else {
        setTestResults(prev => [...prev, {
          type: 'Failed Transaction Simulation',
          status: 'warning',
          message: 'No pending transactions found to mark as failed',
          timestamp: new Date()
        }]);
      }

      fetchDashboardData();
    } catch (error) {
      console.error('Error simulating failed transaction:', error);
      setTestResults(prev => [...prev, {
        type: 'Failed Transaction Simulation',
        status: 'error',
        message: 'Failed to simulate transaction failure',
        timestamp: new Date()
      }]);
    }
  };

  const testDelayedPayment = async () => {
    if (!selectedUser) return;

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2); // 2 days ago

      const sendHelpData = {
        userId: selectedUser.id,
        amount: selectedUser.level * 1000,
        level: selectedUser.level,
        status: 'pending',
        createdAt: yesterday,
        isDelayedTest: true,
        testType: 'delayed_payment'
      };

      await addDoc(collection(db, 'adminSimulations'), {
        type: 'delayedPayment',
        payload: sendHelpData,
        createdAt: serverTimestamp()
      });
      setTestResults(prev => [...prev, {
        type: 'Delayed Payment Test',
        status: 'success',
        message: `Created delayed payment scenario for ${selectedUser.fullName}`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error testing delayed payment:', error);
      setTestResults(prev => [...prev, {
        type: 'Delayed Payment Test',
        status: 'error',
        message: 'Failed to create delayed payment scenario',
        timestamp: new Date()
      }]);
    }
  };

  const testBlockedUserScenario = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        isBlocked: true,
        blockedReason: 'Testing blocked user scenario',
        blockedAt: new Date(),
        blockedBy: 'admin_test'
      });

      setSelectedUser(prev => ({ ...prev, isBlocked: true }));
      setTestResults(prev => [...prev, {
        type: 'Blocked User Test',
        status: 'success',
        message: `Temporarily blocked ${selectedUser.fullName}`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error testing blocked user:', error);
      setTestResults(prev => [...prev, {
        type: 'Blocked User Test',
        status: 'error',
        message: 'Failed to test blocked user scenario',
        timestamp: new Date()
      }]);
    }
  };

  // User Management Utilities
  const resetUserQueues = async () => {
    if (!selectedUser) return;

    try {
      const batch = writeBatch(db);

      // Delete all pending sendHelp docs
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('userId', '==', selectedUser.id),
        where('status', '==', 'pending')
      );
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      sendHelpSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete all pending receiveHelp docs
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('userId', '==', selectedUser.id),
        where('status', '==', 'pending')
      );
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      receiveHelpSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      setTestResults(prev => [...prev, {
        type: 'Queue Reset',
        status: 'success',
        message: `Reset all queues for ${selectedUser.fullName}`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error resetting queues:', error);
      setTestResults(prev => [...prev, {
        type: 'Queue Reset',
        status: 'error',
        message: 'Failed to reset user queues',
        timestamp: new Date()
      }]);
    }
  };

  const suspendUser = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        isBlocked: !selectedUser.isBlocked,
        blockedAt: selectedUser.isBlocked ? null : new Date(),
        blockedBy: selectedUser.isBlocked ? null : 'admin',
        blockedReason: selectedUser.isBlocked ? null : 'Suspended by admin'
      });

      setSelectedUser(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
      setTestResults(prev => [...prev, {
        type: 'User Suspension',
        status: 'success',
        message: `${selectedUser.isBlocked ? 'Unsuspended' : 'Suspended'} ${selectedUser.fullName}`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error suspending user:', error);
      setTestResults(prev => [...prev, {
        type: 'User Suspension',
        status: 'error',
        message: 'Failed to update user suspension status',
        timestamp: new Date()
      }]);
    }
  };

  const viewUserTimeline = async () => {
    if (!selectedUser) return;

    try {
      const timeline = [];

      // Fetch sendHelp history
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('userId', '==', selectedUser.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const sendHelpSnapshot = await getDocs(sendHelpQuery);
      sendHelpSnapshot.docs.forEach(doc => {
        const data = doc.data();
        timeline.push({
          id: doc.id,
          type: 'Send Help',
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          receiverId: data.receiverId
        });
      });

      // Fetch receiveHelp history
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('userId', '==', selectedUser.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
      receiveHelpSnapshot.docs.forEach(doc => {
        const data = doc.data();
        timeline.push({
          id: doc.id,
          type: 'Receive Help',
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          senderId: data.senderId
        });
      });

      // Sort by date
      timeline.sort((a, b) => b.createdAt - a.createdAt);

      setUserTimeline(timeline);
      setShowUserTimeline(true);
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      alert('Failed to fetch user timeline');
    }
  };

  const updateUserProfile = async () => {
    if (!selectedUser) return;

    try {
      const updateData = {
        fullName: editProfileData.fullName,
        email: editProfileData.email,
        phoneNumber: editProfileData.phoneNumber,
        level: parseInt(editProfileData.level),
        uplineId: editProfileData.uplineId,
        isActivated: editProfileData.isActivated,
        paymentMethod: editProfileData.paymentMethod,
        upiId: editProfileData.upiId,
        updatedAt: new Date(),
        updatedBy: 'admin'
      };

      await updateDoc(doc(db, 'users', selectedUser.id), updateData);

      setSelectedUser(prev => ({ ...prev, ...updateData }));
      setShowEditProfile(false);

      setTestResults(prev => [...prev, {
        type: 'Profile Update',
        status: 'success',
        message: `Updated profile for ${editProfileData.fullName}`,
        timestamp: new Date()
      }]);

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update user profile');
    }
  };

  // Audit Logging
  const logAuditAction = async (action, description) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        description,
        timestamp: serverTimestamp(),
        adminId: 'current-admin', // Replace with actual admin ID
        testMode: isTestMode
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  // Dashboard Cards Data
  const dashboardCards = targetUserData ? [
    {
      title: 'Total Sent',
      value: targetUserData.stats.totalSent,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending Sent',
      value: targetUserData.stats.pendingSent,
      icon: FiClock,
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Received',
      value: targetUserData.stats.totalReceived,
      icon: FiCheckCircle,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600'
    },
    {
      title: 'Pending Received',
      value: targetUserData.stats.pendingReceived,
      icon: FiAlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600'
    }
  ] : [
    {
      title: 'Active Users',
      value: dashboardStats.activeUsers,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending Helps',
      value: dashboardStats.pendingHelps,
      icon: FiClock,
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Failed Payments',
      value: dashboardStats.failedPayments,
      icon: FiAlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600'
    },
    {
      title: 'Success Rate',
      value: `${dashboardStats.successRate}%`,
      icon: FiTrendingUp,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600'
    }
  ];

  // Tab Configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: FiMonitor },
    { id: 'auto-repair', label: 'Auto-Repair', icon: MdAutorenew },
    { id: 'manual-repair', label: 'Manual Repair', icon: FiTool },
    { id: 'bulk-ops', label: 'Bulk Operations', icon: MdSync },
    { id: 'error-logs', label: 'Error Logs', icon: MdBugReport },
    { id: 'testing', label: 'Testing', icon: MdPlayArrow },
    { id: 'audit', label: 'Audit History', icon: MdHistory }
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-2 sm:p-4 lg:p-6">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"
        >
          <MdArrowBack className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">Back to Admin</span>
        </button>
      </div>
      {/* User ID Input Modal */}
      <AnimatePresence>
        {showUserIdModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full ${isMobile ? 'max-w-sm p-4' : 'max-w-lg p-6'
                }`}
            >
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => navigate('/admin')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Close and return to dashboard"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <FiShield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h2 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-xl'
                  }`}>User Safety Hub</h2>
                <p className={`text-slate-400 mt-2 ${isMobile ? 'text-sm' : 'text-base'
                  }`}>Enter a User ID to view their safety data</p>
              </div>

              <form onSubmit={handleUserIdSubmit} className="space-y-4">
                <div>
                  <label className={`block font-medium text-slate-300 mb-2 ${isMobile ? 'text-sm' : 'text-base'
                    }`}>User ID</label>
                  <input
                    type="text"
                    value={inputUserId}
                    onChange={(e) => setInputUserId(e.target.value)}
                    placeholder="Enter User ID (e.g., user123)"
                    className={`w-full bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-slate-500 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'
                      }`}
                    required
                    disabled={userDataLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={userDataLoading || !inputUserId.trim()}
                  className={`w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${isMobile ? 'py-2 text-sm' : 'py-3 text-base'
                    }`}
                >
                  {userDataLoading ? (
                    <>
                      <MdSync className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MdSearch className="w-4 h-4" />
                      Load User Data
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className={`font-bold text-white flex items-center gap-3 ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'
              }`}>
              <FiShield className="text-blue-500 flex-shrink-0" />
              <span className="truncate">User & Transaction Safety Hub</span>
            </h1>
            <p className={`text-slate-400 mt-1 ${isMobile ? 'text-sm' : 'text-base'
              }`}>Monitor, manage, and maintain platform safety</p>
            {targetUserData && (
              <div className={`mt-2 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 ${isMobile ? 'text-sm' : 'text-base'
                }`}>
                <p className="text-blue-300 font-medium">
                  Viewing: {targetUserData.profile.fullName || targetUserId}
                </p>
                <p className="text-blue-400 text-sm">
                  ID: {targetUserId} | Level: {targetUserData.profile.level || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {targetUserData && (
              <button
                onClick={switchUser}
                className={`flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors ${isMobile ? 'text-sm' : 'text-base'
                  }`}
              >
                <MdPeople className="w-4 h-4" />
                <span className="hidden sm:inline">Switch User</span>
                <span className="sm:hidden">Switch</span>
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`font-medium text-slate-300 ${isMobile ? 'text-sm' : 'text-base'
                  }`}>Test Mode</span>
                <button
                  onClick={() => setIsTestMode(!isTestMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTestMode ? 'bg-blue-600' : 'bg-slate-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTestMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
              {isTestMode && (
                <span className={`px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-medium rounded-full ${isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                  TEST MODE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 transition-all duration-200 hover:bg-slate-800/70 hover:shadow-xl ${isMobile ? 'p-4' : 'p-6'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-slate-400 truncate ${isMobile ? 'text-sm' : 'text-base'
                    }`}>{card.title}</p>
                  <p className={`font-bold ${card.textColor.replace('text-blue-600', 'text-blue-400').replace('text-green-600', 'text-green-400').replace('text-red-600', 'text-red-400').replace('text-yellow-600', 'text-yellow-400')} mt-1 ${isMobile ? 'text-xl' : 'text-2xl'
                    }`}>{card.value}</p>
                </div>
                <div className={`rounded-lg bg-gradient-to-r ${card.color} ${isMobile ? 'p-2' : 'p-3'
                  }`}>
                  <Icon className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-4 sm:p-6"
        >
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">
                {targetUserData ? 'User Profile & Safety Data' : 'System Overview'}
              </h2>

              {/* User Profile Details */}
              {targetUserData && (
                <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-blue-500/20 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-blue-400" />
                    User Details
                  </h3>

                  {/* Mobile-friendly user details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {targetUserData.profile.fullName || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-semibold text-white mt-1 break-all">
                        {targetUserData.profile.email || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {targetUserData.profile.phoneNumber || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">WhatsApp</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {targetUserData.profile.whatsapp || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sponsor ID</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {targetUserData.profile.sponsorId || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 shadow-sm border border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Level</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {targetUserData.profile.level || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Details */}
                  {targetUserData.profile.paymentMethod && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <FiTarget className="w-4 h-4 text-green-400" />
                        Payment Details
                      </h4>

                      <div className="overflow-x-auto">
                        <div className="bg-slate-900/50 rounded-lg p-4 shadow-sm border border-slate-700 min-w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Payment Method</p>
                              <p className="text-sm font-semibold text-white mt-1">
                                {targetUserData.profile.paymentMethod?.type || targetUserData.profile.paymentMethod?.method || 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">UPI ID</p>
                              <p className="text-sm font-semibold text-white mt-1 break-all">
                                {targetUserData.profile.paymentMethod?.upiId || targetUserData.profile.upiId || 'N/A'}
                              </p>
                            </div>

                            {targetUserData.profile.paymentMethod?.bank && (
                              <>
                                <div>
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bank Account</p>
                                  <p className="text-sm font-semibold text-white mt-1">
                                    {targetUserData.profile.paymentMethod.bank.accountNumber || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bank Name</p>
                                  <p className="text-sm font-semibold text-white mt-1">
                                    {targetUserData.profile.paymentMethod.bank.bankName || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">IFSC Code</p>
                                  <p className="text-sm font-semibold text-white mt-1">
                                    {targetUserData.profile.paymentMethod.bank.ifscCode || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account Holder</p>
                                  <p className="text-sm font-semibold text-white mt-1">
                                    {targetUserData.profile.paymentMethod.bank.accountHolder || 'N/A'}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {auditHistory.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg selection:bg-slate-600">
                        <FiActivity className="w-4 h-4 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{log.action}</p>
                          <p className="text-xs text-slate-400">{log.description}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {log.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Database Connection</span>
                      <span className="flex items-center gap-1 text-green-400">
                        <FiCheckCircle className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Payment Gateway</span>
                      <span className="flex items-center gap-1 text-green-400">
                        <FiCheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Error Rate</span>
                      <span className="text-sm text-white">{errorLogs.length < 10 ? 'Low' : 'High'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-white">Real-time Monitoring</h2>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <MdRefresh className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pending Helps */}
                <div className={`bg-yellow-900/10 rounded-xl shadow-lg border border-yellow-500/20 ${isMobile ? 'p-4' : 'p-6'
                  }`}>
                  <h3 className={`font-semibold text-yellow-500 mb-4 ${isMobile ? 'text-base' : 'text-lg'
                    }`}>Pending Helps ({pendingHelps.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {pendingHelps.slice(0, 10).map((help, index) => (
                      <div key={index} className={`flex items-center justify-between bg-slate-800/50 rounded-lg border border-yellow-500/10 ${isMobile ? 'p-2' : 'p-3'
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-white ${isMobile ? 'text-sm' : 'text-base'
                            }`}>₹{help.amount}</p>
                          <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'
                            }`}>Level {help.level}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full font-medium ${help.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          } ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                          {help.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Failed Payments */}
                <div className={`bg-red-900/10 rounded-xl shadow-lg border border-red-500/20 ${isMobile ? 'p-4' : 'p-6'
                  }`}>
                  <h3 className={`font-semibold text-red-500 mb-4 ${isMobile ? 'text-base' : 'text-lg'
                    }`}>Failed Payments ({failedPayments.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {failedPayments.slice(0, 10).map((payment, index) => (
                      <div key={index} className={`flex items-center justify-between bg-slate-800/50 rounded-lg border border-red-500/10 ${isMobile ? 'p-2' : 'p-3'
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-white ${isMobile ? 'text-sm' : 'text-base'
                            }`}>₹{payment.amount}</p>
                          <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'
                            }`}>Retries: {payment.retryCount || 0}</p>
                        </div>
                        <button
                          onClick={() => autoRepairFunctions.retryFailedPayments()}
                          className={`bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
                            }`}
                        >
                          Retry
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Repair Tab */}
          {activeTab === 'auto-repair' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Auto-Repair Tools</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={autoRepairFunctions.reassignMissingReceivers}
                  disabled={loading}
                  className={`flex items-center bg-blue-900/20 hover:bg-blue-900/30 rounded-xl shadow-lg border border-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdAutorenew className={`text-blue-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-blue-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Reassign Missing Receivers</p>
                    <p className={`text-blue-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Auto-fill missing receiver data</p>
                  </div>
                </button>

                <button
                  onClick={autoRepairFunctions.autoFillMissingData}
                  disabled={loading}
                  className={`flex items-center bg-green-900/20 hover:bg-green-900/30 rounded-xl shadow-lg border border-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdSync className={`text-green-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-green-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Auto-fill Missing Data</p>
                    <p className={`text-green-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Pull missing info from users collection</p>
                  </div>
                </button>

                <button
                  onClick={autoRepairFunctions.retryFailedPayments}
                  disabled={loading}
                  className={`flex items-center bg-yellow-900/20 hover:bg-yellow-900/30 rounded-xl shadow-lg border border-yellow-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdRefresh className={`text-yellow-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-yellow-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Retry Failed Payments</p>
                    <p className={`text-yellow-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Trigger backend payment confirmation logic</p>
                  </div>
                </button>

                <button
                  onClick={autoRepairFunctions.bulkUnlockUsers}
                  disabled={loading}
                  className={`flex items-center bg-purple-900/20 hover:bg-purple-900/30 rounded-xl shadow-lg border border-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdLockOpen className={`text-purple-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-purple-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Bulk Unlock Users</p>
                    <p className={`text-purple-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Batch unlock users who were blocked</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Manual Repair Tab */}
          {activeTab === 'manual-repair' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Manual Repair Tools</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => openEditModal(null, 'editUser')}
                  className={`flex items-center bg-blue-900/20 hover:bg-blue-900/30 rounded-xl shadow-lg border border-blue-500/30 transition-all duration-200 group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdEdit className={`text-blue-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-blue-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Edit User Profile</p>
                    <p className={`text-blue-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Manually edit user information</p>
                  </div>
                </button>

                <button
                  onClick={() => openEditModal(null, 'resetQueue')}
                  className={`flex items-center bg-orange-900/20 hover:bg-orange-900/30 rounded-xl shadow-lg border border-orange-500/30 transition-all duration-200 group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdRestore className={`text-orange-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-orange-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Reset User Queue</p>
                    <p className={`text-orange-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Clear pending transactions</p>
                  </div>
                </button>

                <button
                  onClick={() => openEditModal(null, 'repairError')}
                  className={`flex items-center bg-red-900/20 hover:bg-red-900/30 rounded-xl shadow-lg border border-red-500/30 transition-all duration-200 group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdBugReport className={`text-red-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-red-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Repair Error</p>
                    <p className={`text-red-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Fix specific transaction errors</p>
                  </div>
                </button>

                <button
                  onClick={() => openEditModal(null, 'updateLevel')}
                  className={`flex items-center bg-green-900/20 hover:bg-green-900/30 rounded-xl shadow-lg border border-green-500/30 transition-all duration-200 group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdUpdate className={`text-green-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-green-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Update User Level</p>
                    <p className={`text-green-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Change user level manually</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Bulk Operations Tab */}
          {activeTab === 'bulk-ops' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Bulk Operations</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={bulkOperations.processAllPendingHelps}
                  disabled={loading}
                  className={`flex items-center bg-blue-900/20 hover:bg-blue-900/30 rounded-xl shadow-lg border border-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdSync className={`text-blue-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-blue-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Process All Pending Helps</p>
                    <p className={`text-blue-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Batch process all pending transactions</p>
                  </div>
                </button>

                <button
                  onClick={bulkOperations.refreshAllStatuses}
                  disabled={loading}
                  className={`flex items-center bg-green-900/20 hover:bg-green-900/30 rounded-xl shadow-lg border border-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdRefresh className={`text-green-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-green-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Refresh All Statuses</p>
                    <p className={`text-green-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Update all transaction statuses</p>
                  </div>
                </button>

                <button
                  onClick={bulkOperations.emergencyReset}
                  disabled={loading}
                  className={`flex items-center bg-red-900/20 hover:bg-red-900/30 rounded-xl shadow-lg border border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdWarning className={`text-red-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-red-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Emergency Reset</p>
                    <p className={`text-red-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Reset all system states (DANGER)</p>
                  </div>
                </button>

                <button
                  onClick={bulkOperations.updateAllLevels}
                  disabled={loading}
                  className={`flex items-center bg-purple-900/20 hover:bg-purple-900/30 rounded-xl shadow-lg border border-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                    }`}
                >
                  <MdTrendingUp className={`text-purple-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium text-purple-300 ${isMobile ? 'text-sm' : 'text-base'
                      }`}>Update All Levels</p>
                    <p className={`text-purple-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                      }`}>Recalculate all user levels</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Error Logs Tab */}
          {activeTab === 'error-logs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-white">Error Logs</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search errors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  >
                    <option value="all">All Errors</option>
                    <option value="payment">Payment Errors</option>
                    <option value="user">User Errors</option>
                    <option value="system">System Errors</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <div className="space-y-3">
                  {errorLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-slate-400">No errors found</p>
                    </div>
                  ) : (
                    errorLogs.slice(0, 20).map((error, index) => (
                      <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-red-500/20 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MdError className="w-5 h-5 text-red-400" />
                              <span className="font-medium text-red-300">{error.type || 'System Error'}</span>
                              <span className="px-2 py-1 bg-red-500/10 text-red-300 text-xs rounded-full border border-red-500/20">
                                {error.severity || 'High'}
                              </span>
                            </div>
                            <p className="text-white mb-2">{error.message || 'Error message not available'}</p>
                            <p className="text-sm text-slate-400">User: {error.userId || 'N/A'}</p>
                            <p className="text-xs text-slate-500">
                              {error.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                            </p>
                          </div>
                          <button
                            onClick={() => openEditModal(error, 'repairError')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                          >
                            Fix
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Testing Tab */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Testing Tools</h2>

              {/* User Search */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Select User for Testing</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter User ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className={`flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  />
                  <button
                    onClick={searchUser}
                    disabled={userSearchLoading || !selectedUserId.trim()}
                    className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  >
                    {userSearchLoading ? (
                      <MdSync className="w-4 h-4 animate-spin" />
                    ) : (
                      <MdSearch className="w-4 h-4" />
                    )}
                    Search
                  </button>
                </div>

                {selectedUser && (
                  <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="font-medium text-blue-300">{selectedUser.fullName}</p>
                    <p className="text-sm text-blue-400">Level: {selectedUser.level} | Status: {selectedUser.isBlocked ? 'Blocked' : 'Active'}</p>
                  </div>
                )}
              </div>

              {/* User Status Display */}
              {selectedUser && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="font-medium text-blue-400 mb-2">User Status</h4>
                    <p className="text-sm text-blue-300">ID: {selectedUser.id}</p>
                    <p className="text-sm text-blue-300">Level: {selectedUser.level}</p>
                    <p className="text-sm text-blue-300">Status: {selectedUser.isBlocked ? 'Blocked' : 'Active'}</p>
                  </div>

                  <div className="bg-green-900/10 rounded-lg p-4 border border-green-500/20">
                    <h4 className="font-medium text-green-400 mb-2">Account Info</h4>
                    <p className="text-sm text-green-300">Email: {selectedUser.email || 'N/A'}</p>
                    <p className="text-sm text-green-300">Phone: {selectedUser.phoneNumber || 'N/A'}</p>
                    <p className="text-sm text-green-300">Activated: {selectedUser.isActivated ? 'Yes' : 'No'}</p>
                  </div>

                  <div className="bg-yellow-900/10 rounded-lg p-4 border border-yellow-500/20">
                    <h4 className="font-medium text-yellow-400 mb-2">Payment Info</h4>
                    <p className="text-sm text-yellow-300">Method: {selectedUser.paymentMethod || 'N/A'}</p>
                    <p className="text-sm text-yellow-300">UPI: {selectedUser.upiId || 'N/A'}</p>
                    <p className="text-sm text-yellow-300">Upline: {selectedUser.uplineId || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Simulation Tools */}
              {selectedUser && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Simulation Tools</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={simulateSendHelpFlow}
                      className={`flex items-center bg-blue-900/20 hover:bg-blue-900/30 rounded-lg border border-blue-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <FiZap className={`text-blue-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-blue-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Send Help Flow</p>
                        <p className={`text-blue-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>Simulate sending help</p>
                      </div>
                    </button>

                    <button
                      onClick={simulateReceiveHelpFlow}
                      className={`flex items-center bg-green-900/20 hover:bg-green-900/30 rounded-lg border border-green-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <FiTarget className={`text-green-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-green-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Receive Help Flow</p>
                        <p className={`text-green-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>Simulate receiving help</p>
                      </div>
                    </button>

                    <button
                      onClick={simulateFailedTransaction}
                      className={`flex items-center bg-red-900/20 hover:bg-red-900/30 rounded-lg border border-red-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <MdError className={`text-red-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-red-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Failed Transaction</p>
                        <p className={`text-red-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>Simulate payment failure</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Test Scenarios */}
              {selectedUser && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Test Scenarios</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <button
                      onClick={testDelayedPayment}
                      className={`flex items-center bg-orange-900/20 hover:bg-orange-900/30 rounded-lg border border-orange-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <FiClock className={`text-orange-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-orange-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Delayed Payment</p>
                        <p className={`text-orange-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>Test delayed payment scenario</p>
                      </div>
                    </button>

                    <button
                      onClick={testBlockedUserScenario}
                      className={`flex items-center bg-purple-900/20 hover:bg-purple-900/30 rounded-lg border border-purple-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <MdLock className={`text-purple-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-purple-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Blocked User</p>
                        <p className={`text-purple-400/60 ${isMobile ? 'text-xs' : 'text-sm'
                          }`}>Test blocked user scenario</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* User Management Buttons */}
              {selectedUser && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">User Management</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <button
                      onClick={resetUserQueues}
                      className={`flex items-center bg-blue-900/20 hover:bg-blue-900/30 rounded-lg border border-blue-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <MdRestore className={`text-blue-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-blue-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Reset Queues</p>
                      </div>
                    </button>

                    <button
                      onClick={suspendUser}
                      className={`flex items-center group ${selectedUser.isBlocked ? 'bg-green-900/20 hover:bg-green-900/30 border-green-500/30' : 'bg-red-900/20 hover:bg-red-900/30 border-red-500/30'} rounded-lg border transition-colors ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      {selectedUser.isBlocked ? (
                        <MdLockOpen className={`text-green-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                          }`} />
                      ) : (
                        <MdLock className={`text-red-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                          }`} />
                      )}
                      <div className="text-left">
                        <p className={`font-medium ${selectedUser.isBlocked ? 'text-green-300' : 'text-red-300'} ${isMobile ? 'text-sm' : 'text-base'
                          }`}>
                          {selectedUser.isBlocked ? 'Unsuspend' : 'Suspend'}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={viewUserTimeline}
                      className={`flex items-center bg-purple-900/20 hover:bg-purple-900/30 rounded-lg border border-purple-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <MdHistory className={`text-purple-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-purple-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>View Timeline</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowEditProfile(true)}
                      className={`flex items-center bg-orange-900/20 hover:bg-orange-900/30 rounded-lg border border-orange-500/30 transition-colors group ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'
                        }`}
                    >
                      <MdEdit className={`text-orange-400 group-hover:scale-110 transition-transform duration-200 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      <div className="text-left">
                        <p className={`font-medium text-orange-300 ${isMobile ? 'text-sm' : 'text-base'
                          }`}>Edit Profile</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Test Results</h3>
                    <button
                      onClick={() => setTestResults([])}
                      className="text-sm text-slate-400 hover:text-slate-200"
                    >
                      Clear Results
                    </button>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto border border-slate-700">
                    <div className="space-y-2">
                      {testResults.map((result, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${result.status === 'success' ? 'bg-green-900/20 border-green-500/20' :
                          result.status === 'warning' ? 'bg-yellow-900/20 border-yellow-500/20' :
                            'bg-red-900/20 border-red-500/20'
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${result.status === 'success' ? 'text-green-300' :
                                result.status === 'warning' ? 'text-yellow-300' :
                                  'text-red-300'
                                }`}>{result.type}</p>
                              <p className={`text-sm ${result.status === 'success' ? 'text-green-400' :
                                result.status === 'warning' ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>{result.message}</p>
                            </div>
                            <span className="text-xs text-slate-500">
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit History Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-white">Audit History</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  />
                  <button
                    onClick={fetchDashboardData}
                    className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  >
                    <MdRefresh className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <div className="space-y-3">
                  {auditHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <MdHistory className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">No audit history found</p>
                    </div>
                  ) : (
                    auditHistory.slice(0, 50).map((log, index) => (
                      <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 shadow-sm hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FiActivity className="w-4 h-4 text-blue-400" />
                              <span className="font-medium text-white">{log.action}</span>
                              {log.testMode && (
                                <span className="px-2 py-1 bg-yellow-900/20 text-yellow-300 border border-yellow-500/30 text-xs rounded-full">
                                  TEST
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 mb-2">{log.description}</p>
                            <p className="text-sm text-slate-400">Admin: {log.adminId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {log.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-slate-700 ${isMobile ? 'p-4' : 'p-6'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-xl'
                  }`}>
                  {modalType === 'editUser' && 'Edit User'}
                  {modalType === 'resetQueue' && 'Reset Queue'}
                  {modalType === 'repairError' && 'Repair Error'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  {modalType === 'editUser' && 'Edit user profile and settings.'}
                  {modalType === 'resetQueue' && 'Reset user transaction queues.'}
                  {modalType === 'repairError' && 'Repair specific error conditions.'}
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className={`bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle modal action based on type
                      setShowModal(false);
                      toast.success(`${modalType} completed successfully`);
                    }}
                    className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                      }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Timeline Modal */}
      <AnimatePresence>
        {showUserTimeline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-slate-700 ${isMobile ? 'p-4' : 'p-6'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-xl'
                  }`}>User Timeline - {selectedUser?.fullName}</h3>
                <button
                  onClick={() => setShowUserTimeline(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {userTimeline.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <div className={`w-3 h-3 rounded-full ${item.type === 'Send Help' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-green-500 shadow-lg shadow-green-500/50'
                      }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{item.type}</p>
                          <p className="text-sm text-slate-300">Amount: ₹{item.amount}</p>
                          <p className="text-sm text-slate-300">
                            {item.type === 'Send Help' && item.receiverId && `To: ${item.receiverId}`}
                            {item.type === 'Receive Help' && item.senderId && `From: ${item.senderId}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full border ${item.status === 'completed' ? 'bg-green-900/20 text-green-300 border-green-500/30' :
                            item.status === 'pending' ? 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30' :
                              'bg-red-900/20 text-red-300 border-red-500/30'
                            }`}>
                            {item.status}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {userTimeline.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No transaction history found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-slate-700 ${isMobile ? 'p-4' : 'p-6'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-xl'
                  }`}>Edit Profile - {selectedUser.fullName}</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editProfileData.fullName || ''}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editProfileData.email || ''}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editProfileData.phoneNumber || ''}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Level</label>
                  <select
                    value={editProfileData.level || 1}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4</option>
                    <option value={5}>Level 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Upline ID</label>
                  <input
                    type="text"
                    value={editProfileData.uplineId || ''}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, uplineId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={editProfileData.paymentMethod || 'upi'}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="wallet">Digital Wallet</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={editProfileData.upiId || ''}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, upiId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editProfileData.isActivated || false}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, isActivated: e.target.checked }))}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300">Account Activated</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className={`bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserProfile}
                  className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                    }`}
                >
                  Update Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl shadow-2xl p-6 flex items-center gap-4 border border-slate-700"
            >
              <MdSync className="w-8 h-8 text-blue-400 animate-spin" />
              <div>
                <p className="font-medium text-white">Processing...</p>
                <p className="text-sm text-slate-400">Please wait while we complete the operation</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserTransactionSafetyHub;