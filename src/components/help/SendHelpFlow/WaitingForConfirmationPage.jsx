import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLoader, FiMessageCircle } from 'react-icons/fi';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import StepIndicator from './StepIndicator';

/**
 * WaitingForConfirmationPage - Step 4 of Send Help Flow
 * Modern mobile-first design with horizontal stepper
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
        console.error(String('Error listening to help document:') + " " + String(error));
      }
    );

    return () => {
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch (_) { }
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6"
      >
        <div className="w-full max-w-2xl mx-auto">
          {/* Step Indicator */}
          <StepIndicator currentStep={4} totalSteps={4} />

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FiCheckCircle className="w-16 h-16 text-white" />
                  </motion.div>
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-bold mb-3">Success!</h2>
                <p className="text-white/90 text-lg">Payment Confirmed</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status Message */}
                <div className="text-center">
                  <p className="text-slate-900 font-bold text-lg mb-2">
                    Your account is now fully activated
                  </p>
                  <p className="text-slate-600 text-sm">
                    You can now start receiving help and earning through your network
                  </p>
                </div>

                {/* Completion Steps */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <p className="text-center font-bold text-slate-900 mb-5">Activation Complete</p>
                  <div className="flex justify-between items-center gap-4">
                    {['Assigned', 'Paid', 'Confirmed'].map((step, idx) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + idx * 0.15, type: 'spring' }}
                        className="text-center flex-1"
                      >
                        <div className="w-12 h-12 mx-auto rounded-xl bg-green-600 text-white flex items-center justify-center mb-2 shadow-lg">
                          <FiCheckCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Receiver Info */}
                {receiver && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs uppercase text-slate-700 font-bold tracking-wide mb-3">
                      Payment Sent To
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={receiver.profileImage || '/images/default-avatar.png'}
                        alt={receiver.fullName || receiver.name}
                        className="w-12 h-12 rounded-xl bg-slate-200 object-cover"
                        onError={(e) => {
                          e.target.src = '/images/default-avatar.png';
                        }}
                      />
                      <div>
                        <p className="font-bold text-slate-900">{receiver.fullName || receiver.name}</p>
                        <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Actions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="font-bold text-blue-900 text-sm mb-3">✅ What's Next:</p>
                  <ul className="space-y-2 text-xs text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span>Your account is fully activated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span>You can start receiving help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span>Earn income through your network</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Continue to Dashboard</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicator */}
        <StepIndicator currentStep={4} totalSteps={4} />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          {/* Waiting Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <FiLoader className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-2">Waiting for Confirmation</h2>
              <p className="text-white/80 text-sm">Your payment has been submitted successfully!</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Elapsed Time */}
              <div className="text-center bg-slate-50 rounded-xl p-5 border border-slate-200">
                <p className="text-xs uppercase text-slate-700 font-bold mb-2">Elapsed Time</p>
                <p className="text-4xl font-bold text-slate-900 font-mono">{formatTime(elapsedSeconds)}</p>
              </div>

              {/* Progress Timeline */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="text-center font-bold text-slate-900 mb-5">Progress</p>
                <div className="space-y-4">
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
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${item.done
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-200 text-slate-900'
                          }`}
                      >
                        {item.done ? <FiCheckCircle className="w-5 h-5" /> : idx + 1}
                      </motion.div>
                      <span className={`text-sm font-semibold ${item.done ? 'text-slate-900' : 'text-slate-600'
                        }`}>
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Receiver Info */}
              {receiver && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs uppercase text-slate-700 font-bold tracking-wide mb-3">
                    Receiver Verifying Payment
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={receiver.profileImage || '/images/default-avatar.png'}
                      alt={receiver.fullName || receiver.name}
                      className="w-12 h-12 rounded-xl bg-slate-200 object-cover"
                      onError={(e) => {
                        e.target.src = '/images/default-avatar.png';
                      }}
                    />
                    <div>
                      <p className="font-bold text-slate-900">{receiver.fullName || receiver.name}</p>
                      <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-bold text-blue-900 text-sm mb-3">⏳ What's Happening:</p>
                <ul className="space-y-2 text-xs text-blue-800">
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
              </div>
            </div>

            {/* Action Button */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowChat?.(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <FiMessageCircle className="w-5 h-5" />
                <span>Chat with Receiver</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaitingForConfirmationPage;