import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLoader } from 'react-icons/fi';
import PaymentMethodsDisplay from './PaymentMethodsDisplay';

/**
 * PaymentModal Component
 * Modal for displaying payment methods and instructions
 */
const PaymentModal = ({ isOpen, onClose, receiver, paymentDetails, onProceed, isProceedLoading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl my-8">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Send ₹300 to {receiver?.name || 'receiver'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  disabled={isProceedLoading}
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <PaymentMethodsDisplay
                  receiver={receiver}
                  paymentDetails={paymentDetails}
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={onClose}
                  disabled={isProceedLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onProceed}
                  disabled={isProceedLoading}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isProceedLoading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'I Have Paid'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
