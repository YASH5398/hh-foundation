import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiClock, FiCheck, FiX, FiInfo, FiShoppingCart, FiCreditCard, FiGift } from 'react-icons/fi';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const RequestEpin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);


  // Package options
  const packages = [
    { paid: 5, free: 0, total: 5 },
    { paid: 10, free: 1, total: 11 },
    { paid: 15, free: 2, total: 17 },
    { paid: 25, free: 4, total: 29 },
    { paid: 50, free: 10, total: 60 },
    { paid: 100, free: 30, total: 130 }
  ];

  const pricePerEpin = 60;

  useEffect(() => {
    fetchRequestHistory();
  }, [user]);

  const fetchRequestHistory = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'epinRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setRequestHistory(requests);
    } catch (error) {
      console.error('Error fetching request history:', error);
      toast.error('Failed to load request history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleContinue = () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }
    navigate('/dashboard/epins/payment', { state: { selectedPackage } });
  };



  const getStatusConfig = (status) => {
    const configs = {
      approved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: FiCheck },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: FiX },
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: FiClock },
      default: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FiInfo }
    };
    return configs[status] || configs.default;
  };

  if (loadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
          {/* Package Selection */}
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 mt-4 font-medium">Loading E-PIN requests...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Request E-PINs
          </h1>
          <p className="text-gray-600 text-lg">Submit a request for new E-PINs</p>
        </motion.div>

        {/* Package Selection or Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8"
        >
          <>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-3 mr-4">
                    <FiShoppingCart className="text-indigo-600 text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Select E-PIN Package</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span>Cost per E-PIN: <span className="font-semibold">₹{pricePerEpin}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Processing time: <span className="font-semibold">5-30 minutes</span></span>
                  </div>
                </div>
              </div>

              {/* E-PIN Packages Grid - Mobile Friendly */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePackageSelect(pkg)}
                    className={`cursor-pointer p-3 sm:p-4 rounded-xl shadow-md bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:shadow-lg transition-all ${
                      selectedPackage === pkg ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{pkg.total}</div>
                      <div className="text-xs text-gray-500 mb-2">Total E-PINs</div>
                      
                      <div className="space-y-1 mb-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-green-600">{pkg.paid}</span> Paid
                        </div>
                        {pkg.free > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium text-blue-600">{pkg.free}</span> Free
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm sm:text-base font-bold text-purple-600">
                        ₹{(pkg.paid * pricePerEpin).toLocaleString()}
                      </div>
                      
                      {pkg.free > 0 && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-bold rounded-full">
                            FREE
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {selectedPackage === pkg && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1">
                        <FiCheck className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {selectedPackage && (
                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <FiCreditCard className="text-lg" />
                  <span>Continue to Payment</span>
                </motion.button>
              )}
          </>
        </motion.div>

        {/* Request History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-3 mr-4">
              <FiClock className="text-indigo-600 text-xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Request History</h3>
          </div>
          
          {requestHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-500 text-lg">No E-PIN requests found.</p>
              <p className="text-gray-400 text-sm mt-2">Your request history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requestHistory.map((request, index) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {request.createdAt?.toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div>
                            <span className="text-sm text-gray-500">E-PINs:</span>
                            <span className="ml-2 font-semibold text-gray-800">{request.totalEpins || request.requestedAmount} E-PINs</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Cost:</span>
                            <span className="ml-2 font-semibold text-gray-800">₹{request.totalAmount || request.totalCost}</span>
                          </div>
                        </div>
                        {request.utrNumber && (
                          <div>
                            <span className="text-sm text-gray-500">UTR:</span>
                            <span className="ml-2 font-mono text-gray-700">{request.utrNumber}</span>
                          </div>
                        )}
                        {request.reason && (
                          <div>
                            <span className="text-sm text-gray-500">Reason:</span>
                            <p className="text-gray-700 mt-1">{request.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RequestEpin;