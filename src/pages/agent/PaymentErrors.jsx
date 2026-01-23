import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiDollarSign, FiAlertTriangle, FiCreditCard, FiXCircle, FiCheckCircle, FiClock, FiUser, FiCalendar, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatDate';

const PaymentErrors = () => {
  const [paymentErrors, setPaymentErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved, failed
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    failed: 0,
    totalAmount: 0
  });

  useEffect(() => {
    // Real-time listener for payment errors
    const errorsQuery = query(
      collection(db, 'paymentErrors'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(errorsQuery, (snapshot) => {
      const errorsData = [];
      let totalAmount = 0;
      let pending = 0;
      let resolved = 0;
      let failed = 0;

      snapshot.forEach((doc) => {
        const errorData = { id: doc.id, ...doc.data() };
        errorsData.push(errorData);
        
        totalAmount += errorData.amount || 0;
        
        switch (errorData.status?.toLowerCase()) {
          case 'pending': pending++; break;
          case 'resolved': resolved++; break;
          case 'failed': failed++; break;
        }
      });

      setPaymentErrors(errorsData);
      setStats({
        total: errorsData.length,
        pending,
        resolved,
        failed,
        totalAmount
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching payment errors:', error);
      toast.error('Failed to load payment errors');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredErrors = paymentErrors.filter(error => {
    if (filter !== 'all' && error.status?.toLowerCase() !== filter) return false;
    if (errorTypeFilter !== 'all' && error.errorType !== errorTypeFilter) return false;
    return true;
  });

  const updateErrorStatus = async (errorId, newStatus) => {
    try {
      await updateDoc(doc(db, 'paymentErrors', errorId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'resolved' && { resolvedAt: new Date() })
      });
      toast.success(`Payment error marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment error:', error);
      toast.error('Failed to update payment error status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4" />;
      case 'failed': return <FiXCircle className="w-4 h-4" />;
      default: return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

  const getErrorTypeColor = (errorType) => {
    switch (errorType) {
      case 'card_declined': return 'bg-red-100 text-red-800';
      case 'insufficient_funds': return 'bg-orange-100 text-orange-800';
      case 'expired_card': return 'bg-yellow-100 text-yellow-800';
      case 'invalid_card': return 'bg-red-100 text-red-800';
      case 'network_error': return 'bg-blue-100 text-blue-800';
      case 'processing_error': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatErrorType = (errorType) => {
    return errorType?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown';
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const uniqueErrorTypes = [...new Set(paymentErrors.map(error => error.errorType).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment errors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Errors</h1>
          <p className="text-gray-600">Track and resolve payment-related issues</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiAlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <FiXCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Type</label>
                  <select
                    value={errorTypeFilter}
                    onChange={(e) => setErrorTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    {uniqueErrorTypes.map(type => (
                      <option key={type} value={type}>{formatErrorType(type)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiFilter className="w-4 h-4 mr-1" />
                Showing {filteredErrors.length} of {stats.total} errors
              </div>
            </div>
          </div>
        </div>

        {/* Errors List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-12">
                <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment errors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'No payment errors to display.' : `No ${filter} payment errors found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <div key={error.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            Payment Error #{error.transactionId || error.id}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(error.status)}`}>
                            {getStatusIcon(error.status)}
                            <span className="ml-1">{error.status?.toUpperCase() || 'UNKNOWN'}</span>
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getErrorTypeColor(error.errorType)}`}>
                            {formatErrorType(error.errorType)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(error.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">User</p>
                            <p className="text-sm text-gray-900">{error.userName || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500">{error.userEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Payment Method</p>
                            <p className="text-sm text-gray-900">
                              {error.paymentMethod || 'Unknown'}
                              {error.cardLast4 && ` ****${error.cardLast4}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Date</p>
                            <p className="text-sm text-gray-900">{formatDate(error.createdAt)}</p>
                          </div>
                        </div>

                        {error.errorMessage && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-600">Error Message</p>
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error.errorMessage}</p>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <FiUser className="w-4 h-4 mr-1" />
                            <span>User ID: {error.userId}</span>
                          </div>
                          <div className="flex items-center">
                            <FiCreditCard className="w-4 h-4 mr-1" />
                            <span>Gateway: {error.paymentGateway || 'Unknown'}</span>
                          </div>
                          {error.retryCount > 0 && (
                            <div className="flex items-center">
                              <FiRefreshCw className="w-4 h-4 mr-1" />
                              <span>Retries: {error.retryCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {error.status === 'pending' && (
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => updateErrorStatus(error.id, 'resolved')}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FiCheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => updateErrorStatus(error.id, 'failed')}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiXCircle className="w-4 h-4 mr-2" />
                          Mark Failed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentErrors;