import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';

/**
 * PaymentDoneConfirmation Component
 * Dialog asking "Are you sure you have completed the payment?"
 */
const PaymentDoneConfirmation = ({ isOpen, onConfirm, onCancel, isLoading = false, receiver }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onCancel} />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Icon */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 px-6 py-8 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <FiAlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Payment Confirmation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you have <strong>completed the payment</strong> of <strong>₹300</strong> to <strong>{receiver?.name || 'the receiver'}</strong>?
            </p>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Important:</strong> You will need to upload a payment screenshot and transaction ID in the next step. Make sure you have this information ready.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 py-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Confirm'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PaymentDoneConfirmation;
