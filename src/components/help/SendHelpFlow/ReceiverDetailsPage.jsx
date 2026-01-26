import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiMail, FiMessageCircle, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import { getProfileImageUrl } from '../../../utils/profileUtils';

/**
 * ReceiverDetailsPage - Step 1 of Send Help Flow
 * Display receiver information and amount to send
 */
const ReceiverDetailsPage = ({ receiver, amount = 300, onProceed, onBack, isProceding = false }) => {
  if (!receiver) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Loading receiver information...</p>
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            disabled={isProceding}
            className="p-2 hover:bg-white rounded-full transition-all duration-200 disabled:opacity-50"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Receiver Details</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">Step 1 of 4</div>
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Card Header */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sending Money To</h2>
          <p className="text-gray-600 mb-6">Review the receiver details</p>

          {/* Receiver Profile Section */}
          <div className="mb-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <img
                src={getProfileImageUrl(receiver)}
                alt={receiver.fullName || receiver.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/96?text=User';
                }}
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{receiver.fullName || receiver.name || 'Unknown'}</h3>
            <p className="text-sm text-gray-600 font-mono mt-1">ID: {receiver.userId}</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 mb-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6">
            {/* Phone */}
            {receiver.phone && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center mt-0.5">
                  <FiPhone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide">Phone</p>
                  <p className="text-base font-semibold text-gray-900 break-all">{receiver.phone}</p>
                </div>
              </motion.div>
            )}

            {/* Email */}
            {receiver.email && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center mt-0.5">
                  <FiMail className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide">Email</p>
                  <p className="text-base font-semibold text-gray-900 break-all">{receiver.email}</p>
                </div>
              </motion.div>
            )}

            {/* WhatsApp */}
            {receiver.whatsapp && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center mt-0.5">
                  <FiMessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide">WhatsApp</p>
                  <p className="text-base font-semibold text-gray-900 break-all">{receiver.whatsapp}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Amount Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200"
          >
            <p className="text-center text-sm text-gray-600 font-medium mb-2">Amount to Send</p>
            <p className="text-center text-4xl font-bold text-green-600">₹{amount}</p>
            <p className="text-center text-xs text-gray-500 mt-2">This is the fixed entry amount for Send Help</p>
          </motion.div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-900">
            <p className="font-semibold mb-2">📋 Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Review the payment details on next screen</li>
              <li>Complete the payment using the provided method</li>
              <li>Submit your payment proof</li>
              <li>Wait for receiver confirmation</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              disabled={isProceding}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <motion.button
              whileHover={{ scale: isProceding ? 1 : 1.02 }}
              whileTap={{ scale: isProceding ? 1 : 0.98 }}
              onClick={onProceed}
              disabled={isProceding}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Proceed to Payment
              {!isProceding && <FiChevronRight className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReceiverDetailsPage;
