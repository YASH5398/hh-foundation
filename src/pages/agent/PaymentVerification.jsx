import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiFilter, FiEye, FiCheck, FiX, FiClock, 
  FiUser, FiDollarSign, FiImage, FiDownload, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiCalendar, FiCopy
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
import UserProfileView from '../../components/agent/UserProfileView';

const PaymentVerification = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [sendHelps, setSendHelps] = useState([]);
  const [receiveHelps, setReceiveHelps] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, send, receive
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalVerified: 0,
    totalAmount: 0,
    todayCount: 0
  });

  // Fetch sendHelp data with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    const sendHelpQuery = query(
      collection(db, 'sendHelp'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(sendHelpQuery, (snapshot) => {
      const sendHelpData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'send',
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      
      setSendHelps(sendHelpData);
    }, (error) => {
      console.error('Error fetching sendHelp:', error);
      toast.error('Failed to load send help requests');
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch receiveHelp data with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    const receiveHelpQuery = query(
      collection(db, 'receiveHelp'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(receiveHelpQuery, (snapshot) => {
      const receiveHelpData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'receive',
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      
      setReceiveHelps(receiveHelpData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching receiveHelp:', error);
      toast.error('Failed to load receive help requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate stats and filter payments
  useEffect(() => {
    const allPayments = [...sendHelps, ...receiveHelps];
    
    // Calculate stats
    const pending = allPayments.filter(p => p.status === 'pending' || p.status === 'Pending');
    const verified = allPayments.filter(p => p.status === 'confirmed' || p.status === 'Confirmed');
    const totalAmount = pending.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = pending.filter(p => {
      const paymentDate = p.createdAt instanceof Date ? p.createdAt : new Date();
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    }).length;

    setStats({
      totalPending: pending.length,
      totalVerified: verified.length,
      totalAmount,
      todayCount
    });

    // Filter payments
    let filtered = allPayments;

    // Tab filter
    if (activeTab === 'send') {
      filtered = sendHelps;
    } else if (activeTab === 'receive') {
      filtered = receiveHelps;
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const status = payment.status?.toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.utrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.receiverId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.senderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount?.toString().includes(searchTerm) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [sendHelps, receiveHelps, activeTab, statusFilter, searchTerm]);

  const handleVerifyPayment = async (paymentId, paymentType, action) => {
    try {
      setVerifyingPayment(true);
      
      const collectionName = paymentType === 'send' ? 'sendHelp' : 'receiveHelp';
      const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
      
      await updateDoc(doc(db, collectionName, paymentId), {
        status: newStatus,
        verifiedBy: user.uid,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to user about payment verification
      try {
        const payment = filteredPayments.find(p => p.id === paymentId);
        const targetUserId = payment?.userId || payment?.senderId || payment?.receiverId;
        
        if (targetUserId) {
          const { sendNotification } = await import('../../context/NotificationContext');
          await sendNotification({
            title: `Payment ${action === 'confirm' ? 'Verified' : 'Rejected'}`,
            message: `Your payment of ₹${payment?.amount || 'N/A'} has been ${action === 'confirm' ? 'verified' : 'rejected'} by agent`,
            type: action === 'confirm' ? 'success' : 'error',
            priority: 'high',
            actionLink: paymentType === 'send' ? '/user/send-help' : '/user/receive-help',
            targetUserId: targetUserId
          });
        }
      } catch (notificationError) {
        console.error('Error sending payment verification notification:', notificationError);
      }
      
      toast.success(`Payment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'confirmed': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      case 'processing': return <FiRefreshCw className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
          <p className="text-gray-600">Review and verify payment transactions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredPayments.length} payments
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FiFilter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
            </div>
            <FiClock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalVerified}</p>
            </div>
            <FiCheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <FiDollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-purple-600">{stats.todayCount}</p>
            </div>
            <FiCalendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Payments', count: sendHelps.length + receiveHelps.length },
              { key: 'send', label: 'Send Help', count: sendHelps.length },
              { key: 'receive', label: 'Receive Help', count: receiveHelps.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by UTR, User ID, Amount, or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                  selectedPayment?.id === payment.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPayment(payment)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.type === 'send' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.type === 'send' ? 'Send Help' : 'Receive Help'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </h3>
                    <p className="text-xs text-gray-500">ID: {payment.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {payment.utrNumber && (
                    <div className="flex items-center justify-between">
                      <span>UTR: {payment.utrNumber}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(payment.utrNumber);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiCopy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FiUser className="w-3 h-3 mr-1" />
                      {payment.type === 'send' ? payment.senderId : payment.receiverId || payment.userId}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatTimestamp(payment.createdAt)}
                    </span>
                  </div>
                </div>
                
                {payment.status?.toLowerCase() === 'pending' && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyPayment(payment.id, payment.type, 'confirm');
                      }}
                      disabled={verifyingPayment}
                      className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="w-3 h-3 mr-1 inline" />
                      Confirm
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyPayment(payment.id, payment.type, 'reject');
                      }}
                      disabled={verifyingPayment}
                      className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <FiX className="w-3 h-3 mr-1 inline" />
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payments found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Payment Detail */}
        <div className="lg:sticky lg:top-6">
          {selectedPayment ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Payment Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedPayment.type === 'send' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedPayment.type === 'send' ? 'Send Help' : 'Receive Help'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(selectedPayment.status)}`}>
                        {getStatusIcon(selectedPayment.status)}
                        <span className="ml-1">{selectedPayment.status}</span>
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedPayment.amount)}
                    </h2>
                    <p className="text-sm text-gray-500">ID: {selectedPayment.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="p-4 space-y-4">
                {/* UTR Number */}
                {selectedPayment.utrNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{selectedPayment.utrNumber}</span>
                      <button
                        onClick={() => copyToClipboard(selectedPayment.utrNumber)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* User Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {selectedPayment.type === 'send' ? selectedPayment.senderId : selectedPayment.receiverId || selectedPayment.userId}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedUserId(selectedPayment.type === 'send' ? selectedPayment.senderId : selectedPayment.receiverId || selectedPayment.userId);
                        setShowUserProfile(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FiEye className="w-4 h-4 inline mr-1" />
                      View Profile
                    </button>
                  </div>
                </div>
                
                {/* Timestamps */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <span className="text-sm text-gray-900">{formatTimestamp(selectedPayment.createdAt)}</span>
                  </div>
                  
                  {selectedPayment.verifiedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
                      <span className="text-sm text-gray-900">{formatTimestamp(selectedPayment.verifiedAt)}</span>
                    </div>
                  )}
                </div>
                
                {/* Payment Screenshot */}
                {selectedPayment.paymentScreenshot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Screenshot</label>
                    <div className="relative">
                      <img
                        src={selectedPayment.paymentScreenshot}
                        alt="Payment Screenshot"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <a
                        href={selectedPayment.paymentScreenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                      >
                        <FiDownload className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Verification Actions */}
                {selectedPayment.status?.toLowerCase() === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment.id, selectedPayment.type, 'confirm')}
                      disabled={verifyingPayment}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {verifyingPayment ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4 mr-2" />
                          Confirm Payment
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment.id, selectedPayment.type, 'reject')}
                      disabled={verifyingPayment}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <FiX className="w-4 h-4 mr-2" />
                      Reject Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a payment to view details</p>
              <p className="text-sm text-gray-400">Click on any payment from the list to review it</p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
                <button
                  onClick={() => {
                    setShowUserProfile(false);
                    setSelectedUserId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <UserProfileView userId={selectedUserId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;