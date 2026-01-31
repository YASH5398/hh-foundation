import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiSend, FiDownload, FiAlertCircle, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const UserHelpTracker = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendHelpData, setSendHelpData] = useState([]);
  const [receiveHelpData, setReceiveHelpData] = useState([]);
  const [activeTab, setActiveTab] = useState('send');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');
    setSendHelpData([]);
    setReceiveHelpData([]);
    setSearched(false);

    try {
      const userQuery = query(
        collection(db, 'users'),
        where('userId', '==', userId.trim())
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setError('Invalid User ID');
        setLoading(false);
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const userUid = userDoc.id;
      const userIdValue = userData.userId;

      const [
        sendHelpByUid,
        sendHelpById,
        receiveHelpByUid,
        receiveHelpById
      ] = await Promise.all([
        getDocs(query(collection(db, 'sendHelp'), where('senderUid', '==', userUid))),
        userIdValue ? getDocs(query(collection(db, 'sendHelp'), where('senderId', '==', userIdValue))) : Promise.resolve({ docs: [] }),
        getDocs(query(collection(db, 'receiveHelp'), where('receiverUid', '==', userUid))),
        userIdValue ? getDocs(query(collection(db, 'receiveHelp'), where('receiverId', '==', userIdValue))) : Promise.resolve({ docs: [] })
      ]);

      const sendHelpMap = new Map();
      [...sendHelpByUid.docs, ...sendHelpById.docs].forEach(doc => {
        if (!sendHelpMap.has(doc.id)) {
          sendHelpMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      const receiveHelpMap = new Map();
      [...receiveHelpByUid.docs, ...receiveHelpById.docs].forEach(doc => {
        if (!receiveHelpMap.has(doc.id)) {
          receiveHelpMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      const sendHelpResults = Array.from(sendHelpMap.values());
      const receiveHelpResults = Array.from(receiveHelpMap.values());

      setSendHelpData(sendHelpResults);
      setReceiveHelpData(receiveHelpResults);
      setSearched(true);

    } catch (err) {
      console.error('Error fetching help data:', err);
      setError('Failed to fetch data. Please check permissions or try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'ASSIGNED': 'text-yellow-400 bg-yellow-400/10',
      'PAYMENT_REQUESTED': 'text-blue-400 bg-blue-400/10',
      'PAYMENT_DONE': 'text-indigo-400 bg-indigo-400/10',
      'CONFIRMED': 'text-green-400 bg-green-400/10',
      'FORCE_CONFIRMED': 'text-green-500 bg-green-500/10',
      'REJECTED': 'text-red-400 bg-red-400/10',
      'CANCELLED': 'text-gray-400 bg-gray-400/10'
    };
    return statusColors[status] || 'text-slate-400 bg-slate-400/10';
  };

  const getStatusIcon = (status) => {
    if (status === 'CONFIRMED' || status === 'FORCE_CONFIRMED') return <FiCheckCircle />;
    if (status === 'REJECTED' || status === 'CANCELLED') return <FiAlertCircle />;
    return <FiClock />;
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-700/30">
      <span className="text-sm font-medium text-slate-400">{label}:</span>
      <span className="text-sm text-white font-semibold">{value || 'N/A'}</span>
    </div>
  );

  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    const phoneStr = String(phone);
    if (phoneStr.length < 4) return phoneStr;
    return 'XXXX' + phoneStr.slice(-4);
  };

  const maskAccount = (account) => {
    if (!account) return 'N/A';
    const accountStr = String(account);
    if (accountStr.length < 4) return accountStr;
    return 'XXXX' + accountStr.slice(-4);
  };

  const renderPaymentMethods = (paymentDetails) => {
    if (!paymentDetails) {
      return <p className="text-slate-400 text-sm">Payment method not provided</p>;
    }

    const methods = [];

    if (paymentDetails.gpay) {
      methods.push(
        <DetailRow key="gpay" label="Google Pay" value={maskPhone(paymentDetails.gpay)} />
      );
    }

    if (paymentDetails.phonePe) {
      methods.push(
        <DetailRow key="phonepe" label="PhonePe" value={maskPhone(paymentDetails.phonePe)} />
      );
    }

    if (paymentDetails.paytm) {
      methods.push(
        <DetailRow key="paytm" label="Paytm" value={maskPhone(paymentDetails.paytm)} />
      );
    }

    if (paymentDetails.upiId) {
      methods.push(
        <DetailRow key="upi" label="UPI ID" value={paymentDetails.upiId} />
      );
    }

    if (paymentDetails.bankName || paymentDetails.accountNumber) {
      methods.push(
        <div key="bank" className="space-y-2 py-2 border-b border-slate-700/30">
          <DetailRow label="Bank Name" value={paymentDetails.bankName} />
          <DetailRow label="Account Holder" value={paymentDetails.accountHolderName} />
          <DetailRow label="Account Number" value={maskAccount(paymentDetails.accountNumber)} />
          <DetailRow label="IFSC Code" value={paymentDetails.ifscCode} />
        </div>
      );
    }

    if (methods.length === 0) {
      return <p className="text-slate-400 text-sm">Payment method not provided</p>;
    }

    return <div className="space-y-1">{methods}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Help Tracker</h1>
          <p className="text-slate-400 mt-1">Track Send Help & Receive Help for any user</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Enter User ID
            </label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., HH123456"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <FiSearch className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3"
          >
            <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {searched && !error && (sendHelpData.length > 0 || receiveHelpData.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden"
        >
          <div className="flex border-b border-slate-800/50">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'send'
                  ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiSend className="w-5 h-5" />
                <span>Send Help History</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-slate-700 rounded-full">
                  {sendHelpData.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'receive'
                  ? 'text-green-400 bg-green-500/10 border-b-2 border-green-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiDownload className="w-5 h-5" />
                <span>Receive Help History</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-slate-700 rounded-full">
                  {receiveHelpData.length}
                </span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'send' && (
              <div className="space-y-4">
                {sendHelpData.length === 0 ? (
                  <div className="text-center py-12">
                    <FiSend className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No Send Help records found</p>
                  </div>
                ) : (
                  sendHelpData.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-bold text-white">Send Help Record</h3>
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="text-sm font-medium">{record.status || 'UNKNOWN'}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide">Sender Details</h4>
                          <DetailRow label="Sender Name" value={record.senderName} />
                          <DetailRow label="Sender User ID" value={record.senderId} />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wide">Receiver Details</h4>
                          <DetailRow label="Receiver Name" value={record.receiverName} />
                          <DetailRow label="Receiver User ID" value={record.receiverId} />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Transaction Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailRow label="Amount" value={`₹${record.amount?.toLocaleString() || '0'}`} />
                          <DetailRow label="Payment Requested" value={record.paymentRequested ? 'Yes' : 'No'} />
                          <DetailRow label="Confirmed By Receiver" value={record.confirmedByReceiver ? 'Yes' : 'No'} />
                          <DetailRow label="Transaction ID" value={record.id} />
                          <DetailRow label="Created Date" value={formatDate(record.createdAt || record.timestamp)} />
                          <DetailRow label="Last Updated" value={formatDate(record.updatedAt || record.lastUpdated)} />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wide">Payment Method Details</h4>
                        {renderPaymentMethods(record.paymentDetails)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'receive' && (
              <div className="space-y-4">
                {receiveHelpData.length === 0 ? (
                  <div className="text-center py-12">
                    <FiDownload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No Receive Help records found</p>
                  </div>
                ) : (
                  receiveHelpData.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-green-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-bold text-white">Receive Help Record</h3>
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="text-sm font-medium">{record.status || 'UNKNOWN'}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wide">Receiver Details</h4>
                          <DetailRow label="Receiver Name" value={record.receiverName} />
                          <DetailRow label="Receiver User ID" value={record.receiverId} />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide">Sender Details</h4>
                          <DetailRow label="Sender Name" value={record.senderName} />
                          <DetailRow label="Sender User ID" value={record.senderId} />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Transaction Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailRow label="Amount" value={`₹${record.amount?.toLocaleString() || '0'}`} />
                          <DetailRow label="Payment Requested" value={record.paymentRequested ? 'Yes' : 'No'} />
                          <DetailRow label="Confirmed By Receiver" value={record.confirmedByReceiver ? 'Yes' : 'No'} />
                          <DetailRow label="Transaction ID" value={record.id} />
                          <DetailRow label="Created Date" value={formatDate(record.createdAt || record.timestamp)} />
                          <DetailRow label="Last Updated" value={formatDate(record.updatedAt || record.lastUpdated)} />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wide">Payment Method Details</h4>
                        {renderPaymentMethods(record.paymentDetails)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {searched && !error && sendHelpData.length === 0 && receiveHelpData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-12 text-center"
        >
          <FiAlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No Send/Receive Help records found for this User ID</p>
        </motion.div>
      )}
    </div>
  );
};

export default UserHelpTracker;
