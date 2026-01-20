import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiPackage, FiGift, FiCheck, FiX, FiAlertCircle, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatDate';

const EpinHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchHistory = async () => {
      try {
        const historyQuery = query(
          collection(db, 'epinRequests'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(historyQuery);
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching E-PIN history:', error);
        toast.error('Failed to load E-PIN history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.uid]);

  const getStatusConfig = (status) => {
    const configs = {
      approved: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: FiCheck,
        label: 'Approved'
      },
      pending: {
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: FiClock,
        label: 'Pending'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: FiX,
        label: 'Rejected'
      },
      default: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: FiAlertCircle,
        label: 'Unknown'
      }
    };
    return configs[status] || configs.default;
  };


  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading E-PIN history...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Back</span>
        </button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-3"
          >
            E-PIN History
          </motion.h1>
          <p className="text-gray-600 text-lg">Track your E-PIN request history</p>
        </div>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mr-4">
                <FiClock className="text-indigo-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Request History</h2>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-500 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No History Found</h3>
              <p className="text-gray-500">You haven't made any E-PIN requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-gray-500" />
                          <span>Date</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <FiPackage className="text-gray-500" />
                          <span>Count</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <FiGift className="text-gray-500" />
                          <span>Free E-PINs</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.map((item, index) => {
                      const statusConfig = getStatusConfig(item.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50/50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(item.createdAt, { includeTime: true })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-bold text-indigo-600">
                                {item.totalEpins || item.paidEpins || 'N/A'}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">E-PINs</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-bold text-emerald-600">
                                {item.freeEpins || 0}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">Free</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {history.map((item, index) => {
                  const statusConfig = getStatusConfig(item.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(item.createdAt)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <FiPackage className="text-indigo-500 text-sm" />
                          <div>
                            <div className="text-xs text-gray-500">Count</div>
                            <div className="text-sm font-bold text-indigo-600">
                              {item.totalEpins || item.paidEpins || 'N/A'} E-PINs
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FiGift className="text-emerald-500 text-sm" />
                          <div>
                            <div className="text-xs text-gray-500">Free E-PINs</div>
                            <div className="text-sm font-bold text-emerald-600">
                              {item.freeEpins || 0} Free
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Summary Stats */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total Requests</h3>
                  <p className="text-emerald-100 text-sm">All time</p>
                </div>
                <div className="text-3xl font-bold">{history.length}</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Approved</h3>
                  <p className="text-indigo-100 text-sm">Successful requests</p>
                </div>
                <div className="text-3xl font-bold">
                  {history.filter(item => item.status === 'approved').length}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Pending</h3>
                  <p className="text-amber-100 text-sm">Awaiting approval</p>
                </div>
                <div className="text-3xl font-bold">
                  {history.filter(item => item.status === 'pending').length}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default EpinHistory;