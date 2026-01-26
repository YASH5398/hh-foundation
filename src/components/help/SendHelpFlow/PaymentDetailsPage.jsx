import React from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiChevronRight, FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * PaymentDetailsPage - Step 2 of Send Help Flow
 * Display receiver payment information (UPI & Bank details)
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
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            disabled={isConfirming}
            className="p-2 hover:bg-white rounded-full transition-all duration-200 disabled:opacity-50"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">2</span>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Details</span>
            </div>
            <div className="text-xs text-gray-500">Step 2 of 4</div>
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h2>
          <p className="text-gray-600 mb-6">Send ₹{amount} using these details</p>

          {/* UPI Payment Methods */}
          {hasUPI && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">📱</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">UPI / Digital Wallet</h3>
              </div>

              <div className="space-y-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                {/* UPI ID */}
                {receiver?.paymentMethod?.upi && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">UPI ID</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.upi}
                      </p>
                      <button
                        onClick={() => copyToClipboard(receiver.paymentMethod.upi, 'upi')}
                        className="flex-shrink-0 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                        aria-label="Copy UPI"
                      >
                        {copiedField === 'upi' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Google Pay */}
                {receiver?.paymentMethod?.gpay && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Google Pay</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.gpay}
                      </p>
                      <button
                        onClick={() => copyToClipboard(receiver.paymentMethod.gpay, 'gpay')}
                        className="flex-shrink-0 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                        aria-label="Copy Google Pay"
                      >
                        {copiedField === 'gpay' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* PhonePe */}
                {receiver?.paymentMethod?.phonePe && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">PhonePe</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.paymentMethod.phonePe}
                      </p>
                      <button
                        onClick={() => copyToClipboard(receiver.paymentMethod.phonePe, 'phonePe')}
                        className="flex-shrink-0 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                        aria-label="Copy PhonePe"
                      >
                        {copiedField === 'phonePe' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-orange-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Bank Transfer */}
          {hasBank && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">🏦</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Bank Transfer</h3>
              </div>

              <div className="space-y-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                {/* Account Name */}
                {receiver?.bank?.name && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Account Name</p>
                    <p className="text-base font-bold text-gray-900">{receiver.bank.name}</p>
                  </div>
                )}

                {/* Account Number */}
                {receiver?.bank?.accountNumber && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-400 transition-colors">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Account Number</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.bank.accountNumber}
                      </p>
                      <button
                        onClick={() => copyToClipboard(receiver.bank.accountNumber, 'account')}
                        className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Copy Account Number"
                      >
                        {copiedField === 'account' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank Name */}
                {receiver?.bank?.bankName && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">Bank Name</p>
                    <p className="text-base font-bold text-gray-900">{receiver.bank.bankName}</p>
                  </div>
                )}

                {/* IFSC Code */}
                {(receiver?.bank?.ifscCode || receiver?.bank?.ifsc) && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-400 transition-colors">
                    <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide mb-2">IFSC Code</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-mono font-bold text-gray-900 break-all flex-1">
                        {receiver.bank.ifscCode || receiver.bank.ifsc}
                      </p>
                      <button
                        onClick={() => copyToClipboard(receiver.bank.ifscCode || receiver.bank.ifsc, 'ifsc')}
                        className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Copy IFSC"
                      >
                        {copiedField === 'ifsc' ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiCopy className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-900">
            <p className="font-semibold mb-2">💡 Important:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Send exactly ₹{amount}</li>
              <li>You'll need the UTR/Transaction ID for proof</li>
              <li>Take a screenshot of the confirmation</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <motion.button
              whileHover={{ scale: isConfirming ? 1 : 1.02 }}
              whileTap={{ scale: isConfirming ? 1 : 0.98 }}
              onClick={onConfirm}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              I Have Paid
              {!isConfirming && <FiChevronRight className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentDetailsPage;
