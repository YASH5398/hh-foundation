import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLoader, FiMessageCircle } from 'react-icons/fi';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

/**
 * WaitingForConfirmationPage - Step 4 of Send Help Flow
 * Wait for receiver to confirm payment
 * Real-time listener for status change to "Confirmed"
 */
const WaitingForConfirmationPage = ({ transactionId, receiver, helpData, onConfirmed, setShowChat }) => {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  const unsubRef = React.useRef(null);

  // Set up real-time listener
  useEffect(() => {
    if (!transactionId) return;

    // Listen to sendHelp document for status changes
    unsubRef.current = onSnapshot(
      doc(db, 'sendHelp', transactionId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Check if status has been updated to Confirmed or ForceConfirmed
          if (data.status === 'Confirmed' || data.status === 'ForceConfirmed') {
            setIsConfirmed(true);
            if (onConfirmed) {
              onConfirmed(data);
            }
          }
        }
      },
      (error) => {
        console.error('Error listening to help document:', error);
      }
    );

    return () => {
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch (_) {}
      }
    };
  }, [transactionId, onConfirmed]);

  // Timer for elapsed time
  useEffect(() => {
    if (isConfirmed) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConfirmed]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 flex items-center justify-center"
      >
        <div className="w-full max-w-md">
          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
            >
              <FiCheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-green-100 text-green-800">
                <FiCheckCircle className="w-4 h-4" />
                Payment Confirmed
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Success!</h2>
              <p className="text-gray-600">
                The receiver has confirmed your payment. Your account is now fully activated!
              </p>
            </div>

            {/* Receiver Info */}
            {receiver && (
              <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
                <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-3">Payment Sent To</p>
                <div className="flex items-center gap-3">
                  <img
                    src={receiver.profileImage || '/images/default-avatar.png'}
                    alt={receiver.fullName || receiver.name}
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  <div>
                    <p className="font-bold text-gray-900">{receiver.fullName || receiver.name}</p>
                    <p className="text-sm text-gray-600">ID: {receiver.userId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-900">
              <p className="font-semibold mb-2">✅ What's Next:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your account is now fully activated</li>
                <li>You can start receiving help</li>
                <li>You can receive income from your network</li>
              </ul>
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Continue
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Waiting Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">4</span>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Waiting Confirmation</span>
            <span className="text-xs text-gray-500 ml-auto">Step 4 of 4</span>
          </div>

          {/* Animated Loading Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center"
            >
              <FiLoader className="w-10 h-10 text-indigo-600" />
            </motion.div>
          </div>

          {/* Status Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Confirmation</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been submitted successfully. The receiver will verify and confirm it shortly.
            </p>

            {/* Elapsed Time */}
            <div className="text-sm text-gray-500 mb-4">
              Waiting since: {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Receiver Info */}
          {receiver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-indigo-50 rounded-xl p-4 mb-8 border border-indigo-200"
            >
              <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-3">Receiver</p>
              <div className="flex items-center gap-3">
                <img
                  src={receiver.profileImage || '/images/default-avatar.png'}
                  alt={receiver.fullName || receiver.name}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
                <div>
                  <p className="font-bold text-gray-900">{receiver.fullName || receiver.name}</p>
                  <p className="text-sm text-gray-600">ID: {receiver.userId}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-900"
          >
            <p className="font-semibold mb-2">⏳ What's Happening:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>The receiver is verifying your payment</li>
              <li>Once confirmed, your account activates instantly</li>
              <li>This usually takes a few minutes</li>
            </ul>
          </motion.div>

          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat?.(true)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <FiMessageCircle className="w-4 h-4" />
            Chat with Receiver
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaitingForConfirmationPage;
