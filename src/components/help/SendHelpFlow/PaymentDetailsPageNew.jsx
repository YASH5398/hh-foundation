import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronRight, FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * PaymentDetailsPage - Step 2 of Send Help Flow (Modern Mobile-First Design)
 * Card-style payment method display with auto-selected method
 */
const PaymentDetailsPage = ({ receiver, amount = 300, onConfirm, onBack, isConfirming = false }) => {
  const [copiedField, setCopiedField] = React.useState(null);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasUPI = receiver?.paymentMethod?.upi || receiver?.paymentMethod?.gpay || receiver?.paymentMethod?.phonePe;
  const hasBank = receiver?.bank?.name || receiver?.bank?.accountNumber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          </div>
          <span className="text-xs text-gray-500">Step 2 of 4</span>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-6 border border-indigo-100 mb-6"
        >
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Details</h2>
          <p className="text-gray-600 mb-6 text-sm">Complete payment using these details</p>

          {/* UPI Section */}
          {hasUPI && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                  <span className="text-lg">📱</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">UPI Payment</h3>
              </div>

              <div className="space-y-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 border-2 border-orange-200">
                {receiver?.paymentMethod?.upi && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-xl p-4 border border-orange-200 hover:border-orange-400 transition-all hover:shadow-md"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">UPI ID</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.upi}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(receiver.paymentMethod.upi, 'upi')}
                        className="flex-shrink-0 p-2 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'upi' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {receiver?.paymentMethod?.gpay && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-4 border border-orange-200 hover:border-orange-400 transition-all hover:shadow-md"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Google Pay</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.gpay}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(receiver.paymentMethod.gpay, 'gpay')}
                        className="flex-shrink-0 p-2 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'gpay' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {receiver?.paymentMethod?.phonePe && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-xl p-4 border border-orange-200 hover:border-orange-400 transition-all hover:shadow-md"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">PhonePe</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.phonePe}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(receiver.paymentMethod.phonePe, 'phonePe')}
                        className="flex-shrink-0 p-2 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'phonePe' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Bank Transfer Section */}
          {hasBank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <span className="text-lg">🏦</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Bank Transfer</h3>
              </div>

              <div className="space-y-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                {receiver?.bank?.name && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-xl p-4 border border-blue-200"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-1">Account Name</p>
                    <p className="text-base font-bold text-gray-900">{receiver.bank.name}</p>
                  </motion.div>
                )}

                {receiver?.bank?.accountNumber && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-all hover:shadow-md"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Account Number</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.bank.accountNumber}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(receiver.bank.accountNumber, 'account')}
                        className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'account' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-blue-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {receiver?.bank?.bankName && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                    className="bg-white rounded-xl p-4 border border-blue-200"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-1">Bank</p>
                    <p className="text-base font-bold text-gray-900">{receiver.bank.bankName}</p>
                  </motion.div>
                )}

                {(receiver?.bank?.ifscCode || receiver?.bank?.ifsc) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-all hover:shadow-md"
                  >
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">IFSC Code</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.bank.ifscCode || receiver.bank.ifsc}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(receiver.bank.ifscCode || receiver.bank.ifsc, 'ifsc')}
                        className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'ifsc' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-blue-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Amount Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 mb-6 text-center"
          >
            <p className="text-xs uppercase font-semibold text-gray-600 mb-1">Send Exactly</p>
            <p className="text-4xl font-bold text-green-600">₹{amount}</p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-900"
          >
            <p className="font-semibold mb-2">⚠️ Important:</p>
            <ul className="text-xs space-y-1">
              <li>✓ Send exactly ₹{amount}</li>
              <li>✓ Note down the UTR/Transaction ID</li>
              <li>✓ You'll need it in the next step</li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: isConfirming ? 1 : 0.98 }}
              whileTap={{ scale: isConfirming ? 1 : 0.95 }}
              onClick={onBack}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: isConfirming ? 1 : 1.02 }}
              whileTap={{ scale: isConfirming ? 1 : 0.98 }}
              onClick={onConfirm}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              I Have Paid
              <FiChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentDetailsPage;
