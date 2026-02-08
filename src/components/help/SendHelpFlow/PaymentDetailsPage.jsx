import React from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiChevronRight, FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';
import { SiPhonepe, SiGooglepay } from 'react-icons/si';
import { toast } from 'react-hot-toast';
import { db } from '../../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StepIndicator from './StepIndicator';

/**
 * PaymentDetailsPage - Step 2 of Send Help Flow
 * Modern mobile-first design with horizontal stepper
 */
const PaymentDetailsPage = ({ receiver, amount = 300, onConfirm, onBack, isConfirming = false }) => {
  const [copiedField, setCopiedField] = React.useState(null);
  const [receiverData, setReceiverData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);


  React.useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        setLoading(true);
        setError(false);

        const receiverUid = receiver?.id;
        if (!receiverUid) {
          setError(true);
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', receiverUid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setReceiverData(userDocSnap.data());
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiverData();
  }, [receiver, receiver?.id]);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Extract Payment Data
  const paymentMethod = receiverData?.paymentMethod || {};
  const paymentType = paymentMethod.type;

  // Helper to check if a method is valid
  const hasPaymentMethods = !!paymentType && (
    (paymentType === 'PhonePe' && paymentMethod.phonepeNumber) ||
    (paymentType === 'UPI' && paymentMethod.upiId) ||
    (paymentType === 'Google Pay' && paymentMethod.googlepayNumber) ||
    ((paymentType === 'Bank Transfer' || paymentType === 'Bank') && (receiverData?.bank?.accountNumber || paymentMethod.bankDetails?.accountNumber))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-screen h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 overflow-auto"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicator */}
        <StepIndicator currentStep={2} totalSteps={4} />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Payment Method</h2>
              <p className="text-white/80 text-sm italic font-medium">
                Send ₹{amount} for {amount === 300 ? 'Account Activation' : amount > 1500 ? 'Level Upgrade' : 'Upline/Sponsor Payment'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && (
                <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-200 animate-pulse"></div>
                  <p className="text-sm text-slate-600 font-medium">Loading payment details...</p>
                </div>
              )}

              {error && !loading && (
                <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-200 flex items-center justify-center text-2xl">
                    ⚠️
                  </div>
                  <p className="text-sm text-red-800 font-medium">Unable to load payment details</p>
                  <p className="text-xs text-red-600 mt-1">Please try again or contact support</p>
                </div>
              )}

              {!loading && !error && !hasPaymentMethods && (
                <div className="bg-amber-50 rounded-xl p-6 text-center border border-amber-200">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-200 flex items-center justify-center text-2xl">
                    ℹ️
                  </div>
                  <p className="text-sm text-amber-800 font-medium">Receiver payment details not available</p>
                  <p className="text-xs text-amber-600 mt-1">Please contact the receiver directly</p>
                </div>
              )}

              {/* Specific Payment Method Display */}
              {!loading && !error && hasPaymentMethods && (
                <div className="space-y-6">

                  {/* PhonePe Display */}
                  {paymentType === 'PhonePe' && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <SiPhonepe className="w-3 h-3" /> PhonePe Number
                          </p>
                          <p className="text-2xl md:text-3xl font-mono font-bold text-slate-900 break-all">
                            {paymentMethod.phonepeNumber}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentMethod.phonepeNumber, 'phonepe')}
                          className="flex-shrink-0 p-3 bg-white hover:bg-purple-50 rounded-xl transition-all shadow-sm border border-purple-100"
                        >
                          {copiedField === 'phonepe' ? (
                            <FiCheck className="w-6 h-6 text-green-600" />
                          ) : (
                            <FiCopy className="w-6 h-6 text-purple-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-purple-700 italic font-medium">Please open PhonePe and pay ₹{amount} to this number</p>
                    </div>
                  )}

                  {/* UPI Display */}
                  {paymentType === 'UPI' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FiSmartphone className="w-3 h-3" /> UPI ID
                          </p>
                          <p className="text-2xl md:text-3xl font-mono font-bold text-slate-900 break-all">
                            {paymentMethod.upiId}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentMethod.upiId, 'upi')}
                          className="flex-shrink-0 p-3 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-blue-100"
                        >
                          {copiedField === 'upi' ? (
                            <FiCheck className="w-6 h-6 text-green-600" />
                          ) : (
                            <FiCopy className="w-6 h-6 text-blue-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 italic font-medium">Copy ID and pay using any UPI app (PhonePe, GPay, etc.)</p>
                    </div>
                  )}

                  {/* Google Pay Display */}
                  {paymentType === 'Google Pay' && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border-2 border-green-200">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <SiGooglepay className="w-6 h-3" /> Google Pay Number
                          </p>
                          <p className="text-2xl md:text-3xl font-mono font-bold text-slate-900 break-all">
                            {paymentMethod.googlepayNumber}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentMethod.googlepayNumber, 'gpay')}
                          className="flex-shrink-0 p-3 bg-white hover:bg-green-50 rounded-xl transition-all shadow-sm border border-green-100"
                        >
                          {copiedField === 'gpay' ? (
                            <FiCheck className="w-6 h-6 text-green-600" />
                          ) : (
                            <FiCopy className="w-6 h-6 text-green-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-green-700 italic font-medium">Open Google Pay and pay ₹{amount} to this number</p>
                    </div>
                  )}

                  {/* Bank Transfer Display */}
                  {(paymentType === 'Bank Transfer' || paymentType === 'Bank') && (
                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-6 border-2 border-slate-200">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-1 border-b border-slate-200 pb-2">
                        Bank Account Details
                      </p>

                      <div className="space-y-4">
                        {[
                          { label: 'Account Holder', value: receiverData?.bank?.name || paymentMethod.bankDetails?.name },
                          { label: 'Account Number', value: receiverData?.bank?.accountNumber || paymentMethod.bankDetails?.accountNumber, copy: true },
                          { label: 'Bank Name', value: receiverData?.bank?.bankName || paymentMethod.bankDetails?.bankName },
                          { label: 'IFSC Code', value: receiverData?.bank?.ifscCode || paymentMethod.bankDetails?.ifscCode, copy: true }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</p>
                              <p className="text-base font-bold text-slate-800">{item.value || 'N/A'}</p>
                            </div>
                            {item.copy && item.value && (
                              <button
                                onClick={() => copyToClipboard(item.value, item.label)}
                                className="p-1.5 hover:bg-white rounded-md transition-colors"
                              >
                                {copiedField === item.label ? (
                                  <FiCheck className="w-4 h-4 text-green-600" />
                                ) : (
                                  <FiCopy className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: isConfirming ? 1 : 0.98 }}
                  whileTap={{ scale: isConfirming ? 1 : 0.95 }}
                  onClick={onBack}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                  whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                  onClick={onConfirm}
                  disabled={isConfirming || !hasPaymentMethods}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>I Have Paid</span>
                  {!isConfirming && <FiChevronRight className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                ℹ
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm mb-1">Important</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  After completing the payment, you'll need to upload a screenshot as proof in the next step.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentDetailsPage;
