import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaExchangeAlt, FaUser, FaCoins, FaQrcode, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

const TransferEpin = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recipientUserId, setRecipientUserId] = useState('');
  const [transferCount, setTransferCount] = useState(1);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);



  const pricePerEpin = 60;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
      console.log('Loading timeout reached, setting loading to false');
    }, 5000);

    const q = query(
      collection(db, 'epins'),
      where('ownerUid', '==', currentUser.uid),
      where('usedBy', '==', null)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setAvailableCount(snapshot.size);
        setLoading(false);
        clearTimeout(timeout);
        console.log('Available E-PINs loaded:', snapshot.size);
      },
      (error) => {
        console.error('Error fetching E-PINs:', error);
        setLoading(false);
        clearTimeout(timeout);
        setAvailableCount(0);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [currentUser]);

  const handleTransfer = async () => {
    if (!recipientUserId.trim() || transferCount <= 0 || transferCount > availableCount) {
      alert('Please enter valid recipient ID and transfer count');
      return;
    }

    setIsTransferring(true);
    try {
      await addDoc(collection(db, 'epinTransfers'), {
        fromUserId: currentUser.uid,
        toUserId: recipientUserId.trim(),
        count: transferCount,
        status: 'pending',
        createdAt: serverTimestamp(),
        totalValue: transferCount * pricePerEpin
      });

      setTransferSuccess(true);
      setRecipientUserId('');
      setTransferCount(1);
      setTimeout(() => setTransferSuccess(false), 3000);
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-2 py-4">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FaArrowLeft className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Back</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Transfer E-PINs</h1>
          <p className="text-gray-600">Send E-PINs to other users instantly</p>
        </div>

        {/* Available E-PINs Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl shadow-lg text-white mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Available E-PINs</h2>
              <p className="text-blue-100">Ready to transfer</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{availableCount}</div>
              <div className="text-sm text-blue-100">E-PINs</div>
            </div>
          </div>
        </motion.div>

        {/* Transfer Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-md mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FaExchangeAlt className="text-blue-600" />
            Transfer E-PINs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2" />
                Recipient User ID
              </label>
              <input
                type="text"
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                placeholder="Enter recipient's user ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCoins className="inline mr-2" />
                Number of E-PINs
              </label>
              <input
                type="number"
                min="1"
                max={availableCount}
                value={transferCount}
                onChange={(e) => setTransferCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Transfer Amount:</span>
              <span className="font-semibold">₹{(transferCount * pricePerEpin).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Available E-PINs:</span>
              <span className="font-semibold">{availableCount}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleTransfer}
              disabled={isTransferring || availableCount === 0 || !recipientUserId.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isTransferring ? 'Transferring...' : 'Transfer E-PINs'}
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <FaQrcode />
              QR Code
            </button>
          </div>

          {transferSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
            >
              <FaCheck className="text-green-600" />
              Transfer request submitted successfully!
            </motion.div>
          )}
        </motion.div>

        {/* QR Code Section */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">UPI Payment QR Code</h3>
            <div className="text-center">
              <img 
                src="https://freeimage.host/i/KIUDbUv" 
                alt="UPI QR" 
                className="w-32 h-32 mx-auto rounded-lg shadow-lg"
              />
              <p className="text-sm text-gray-500 mt-4">Scan to make UPI payment</p>
            </div>
          </motion.div>
        )}



        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 rounded-xl shadow-md"
          >
            <h4 className="font-semibold text-gray-800 mb-2">E-PIN Value</h4>
            <p className="text-2xl font-bold text-green-600">₹{pricePerEpin}</p>
            <p className="text-sm text-gray-500">Per E-PIN</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-4 rounded-xl shadow-md"
          >
            <h4 className="font-semibold text-gray-800 mb-2">Total Worth</h4>
            <p className="text-2xl font-bold text-blue-600">
              ₹{(availableCount * pricePerEpin).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Available Value</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TransferEpin;