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
        className="min-h-screen bg-zinc-100 p-4 flex items-center justify-center"
      >
        <div className="w-full max-w-md">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                4
              </motion.div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Step 4</p>
                <p className="text-xs text-slate-600">Confirmation Complete</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase">of 4</p>
          </div>

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-8 mb-6"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-lg bg-slate-200 flex items-center justify-center relative"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiCheckCircle className="w-12 h-12 text-slate-900" />
              </motion.div>
            </motion.div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mb-4 bg-slate-100 text-slate-900"
              >
                <FiCheckCircle className="w-4 h-4" />
                Payment Confirmed
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Success!</h2>
              <p className="text-slate-600">
                Your account is now fully activated
              </p>
            </div>

            {/* Step Completion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200"
            >
              <p className="text-center font-bold text-slate-900 mb-4">Activation Complete</p>
              <div className="flex justify-between items-center">
                {['Assigned', 'Paid', 'Confirmed'].map((step, idx) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + idx * 0.2 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 + idx * 0.2, type: 'spring' }}
                      className="w-10 h-10 mx-auto rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                    </motion.div>
                    <p className="text-xs font-semibold text-slate-700">{step}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Receiver Info */}
            {receiver && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200"
              >
                <p className="text-xs uppercase text-slate-700 font-bold tracking-wide mb-3">Payment Sent To</p>
                <div className="flex items-center gap-3">
                  <img
                    src={receiver.profileImage || '/images/default-avatar.png'}
                    alt={receiver.fullName || receiver.name}
                    className="w-12 h-12 rounded-lg bg-slate-200"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  <div>
                    <p className="font-bold text-slate-900">{receiver.fullName || receiver.name}</p>
                    <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-900"
            >
              <p className="font-bold mb-3">✅ What's Next:</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-slate-900 font-bold">✓</span>
                  <span>Your account is fully activated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-900 font-bold">✓</span>
                  <span>You can start receiving help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-900 font-bold">✓</span>
                  <span>Earn income through your network</span>
                </li>
              </ul>
            </motion.div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FiCheckCircle className="w-5 h-5" />
              Continue to Dashboard
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
      className="min-h-screen bg-zinc-100 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              4
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Step 4</p>
              <p className="text-xs text-slate-600">Status Tracking</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase">of 4</p>
        </motion.div>

        {/* Waiting Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-8 mb-6"
        >
          {/* Animated Loading Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center relative"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <FiLoader className="w-10 h-10 text-slate-900" />
              </motion.div>
            </motion.div>
          </div>

          {/* Status Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Waiting for Confirmation</h2>
            <p className="text-slate-600 mb-2">
              Your payment has been submitted successfully!
            </p>
            <p className="text-sm text-slate-500">
              The receiver is verifying the payment now
            </p>
          </div>

          {/* Elapsed Time */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8 bg-slate-50 rounded-lg p-4 border border-slate-200"
          >
            <p className="text-xs uppercase text-slate-700 font-bold mb-2">Elapsed Time</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">{formatTime(elapsedSeconds)}</p>
          </motion.div>

          {/* Progress Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200"
          >
            <p className="text-center font-bold text-slate-900 mb-5">Progress</p>
            <div className="space-y-3">
              {[
                { label: 'Receiver Assigned', done: true },
                { label: 'Payment Submitted', done: true },
                { label: 'Awaiting Confirmation', done: false }
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    animate={item.done ? {} : { scale: [1, 1.1, 1] }}
                    transition={{ repeat: item.done ? 0 : Infinity, duration: 2 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      item.done
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-900'
                    }`}
                  >
                    {item.done ? <FiCheckCircle className="w-4 h-4" /> : idx + 1}
                  </motion.div>
                  <span className={`text-sm font-semibold ${
                    item.done ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Receiver Info */}
          {receiver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200"
            >
              <p className="text-xs uppercase text-slate-700 font-bold tracking-wide mb-3">Receiver Verifying Payment</p>
              <div className="flex items-center gap-3">
                <img
                  src={receiver.profileImage || '/images/default-avatar.png'}
                  alt={receiver.fullName || receiver.name}
                  className="w-12 h-12 rounded-lg bg-slate-200"
                  onError={(e) => {
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
                <div>
                  <p className="font-bold text-slate-900">{receiver.fullName || receiver.name}</p>
                  <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900"
          >
            <p className="font-bold mb-3">⏳ What's Happening:</p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                <span>The receiver is verifying your payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                <span>Once confirmed, your account activates instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                <span>This usually takes a few minutes</span>
              </li>
            </ul>
          </motion.div>

          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat?.(true)}
            className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiMessageCircle className="w-5 h-5" />
            Chat with Receiver
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaitingForConfirmationPage;
