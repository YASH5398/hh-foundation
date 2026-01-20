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
  // Example data (matches requested spec)
  const packages = [
    { total: 5, paid: 5, free: 0, price: 300 },
    { total: 11, paid: 10, free: 1, price: 600 },
    { total: 17, paid: 15, free: 2, price: 900 },
    { total: 29, paid: 25, free: 4, price: 1500 },
    { total: 60, paid: 50, free: 10, price: 3000 },
    { total: 130, paid: 100, free: 30, price: 6000 }
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

  const handleBuyNow = (pkg) => {
    setSelectedPackage(pkg);
    navigate('/dashboard/epins/payment', { state: { selectedPackage: pkg } });
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
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-6">
=======
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
            <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">Loading E-PIN requests...</p>
=======
            <p className="text-gray-600 mt-4 font-medium">Loading E-PIN requests...</p>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
          </motion.div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-10">
=======
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-10">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
<<<<<<< HEAD
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Select E-PIN Package
          </h1>
          <p className="mt-3 text-gray-700 dark:text-gray-200">
            Cost per E-PIN: <span className="font-semibold text-gray-900 dark:text-white">₹60</span> | Processing time: <span className="font-semibold text-gray-900 dark:text-white">5–30 minutes</span>
=======
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Select E-PIN Package
          </h1>
          <p className="mt-3 text-gray-600">
            Cost per E-PIN: <span className="font-semibold">₹60</span> | Processing time: <span className="font-semibold">5–30 minutes</span>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
          </p>
        </motion.div>

        {/* Packages Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {packages.map((pkg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group h-full"
            >
              {/* Gradient border card */}
              <div className="relative h-full p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-fuchsia-500/40">
<<<<<<< HEAD
                <div className="h-full rounded-2xl bg-white dark:bg-gray-900 shadow-[0_6px_24px_rgba(16,24,40,0.06)] group-hover:shadow-[0_10px_28px_rgba(16,24,40,0.12)] transition-shadow duration-300">
=======
                <div className="h-full rounded-2xl bg-white shadow-[0_6px_24px_rgba(16,24,40,0.06)] group-hover:shadow-[0_10px_28px_rgba(16,24,40,0.12)] transition-shadow duration-300">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                  <div className="p-6 flex flex-col h-full">
                    {/* Top: totals */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
<<<<<<< HEAD
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                          {pkg.total}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total E-PINs</div>
                      </div>
                      {pkg.free > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
=======
                        <div className="text-4xl font-extrabold text-gray-900 leading-none">
                          {pkg.total}
                        </div>
                        <div className="text-sm text-gray-500">Total E-PINs</div>
                      </div>
                      {pkg.free > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                          <FiGift className="w-3.5 h-3.5" /> FREE
                        </span>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
<<<<<<< HEAD
                      <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/40 p-3 text-center">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Paid E-PINs</div>
                        <div className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{pkg.paid}</div>
                      </div>
                      <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/40 p-3 text-center">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Free E-PINs</div>
                        <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{pkg.free}</div>
=======
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-center">
                        <div className="text-xs text-gray-600">Paid E-PINs</div>
                        <div className="text-lg font-semibold text-indigo-700">{pkg.paid}</div>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                        <div className="text-xs text-gray-600">Free E-PINs</div>
                        <div className="text-lg font-semibold text-emerald-700">{pkg.free}</div>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
<<<<<<< HEAD
                      <div className="text-xs text-gray-600 dark:text-gray-300">Total Price</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
=======
                      <div className="text-xs text-gray-600">Total Price</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                        ₹{(pkg.price ?? pkg.paid * pricePerEpin).toLocaleString()}
                      </div>
                    </div>

                    {/* Buy Button */}
                    <div className="mt-auto">
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBuyNow(pkg)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-semibold py-3 shadow-md hover:shadow-lg transition-all"
                      >
                        <FiCreditCard className="w-4 h-4" /> Buy Now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RequestEpin;