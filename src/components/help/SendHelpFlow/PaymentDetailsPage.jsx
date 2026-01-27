import React from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiChevronRight, FiArrowLeft, FiCopy, FiCheck, FiSmartphone, FiHome } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { db } from '../../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * PaymentDetailsPage - Step 2 of Send Help Flow (Modern Mobile-First Design)
 * Card-style payment method buttons with receiver details
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
  }, [receiver?.id]);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPhonePe = receiverData?.paymentMethod?.type === 'PhonePe';
  const phonepeNumber = receiverData?.paymentMethod?.phonepeNumber;
  const hasPaymentMethods = isPhonePe && phonepeNumber;

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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm"
            >
              2
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Step 2</p>
              <p className="text-xs text-slate-600">Payment Methods</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase">of 4</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-8 mb-6"
        >
          {/* Header */}
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Methods</h2>
          <p className="text-slate-600 text-sm mb-6">Send ₹{amount}</p>

          {loading && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center border border-slate-200">
              <p className="text-sm text-slate-600">Loading payment details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center border border-slate-200">
              <p className="text-sm text-slate-600">Unable to load payment details</p>
            </div>
          )}

          {!loading && !error && !hasPaymentMethods && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center border border-slate-200">
              <p className="text-sm text-slate-600">Receiver payment details not available</p>
            </div>
          )}

          {/* PhonePe Payment Method */}
          {isPhonePe && phonepeNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">PhonePe</h3>
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 font-semibold mb-1">PhonePe Number</p>
                    <p className="text-sm font-mono font-semibold text-slate-900 break-all">{phonepeNumber}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(phonepeNumber, 'phonepe')}
                    className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'phonepe' ? (
                      <FiCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <FiCopy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <motion.button
              whileHover={{ scale: isConfirming ? 1 : 1.02 }}
              whileTap={{ scale: isConfirming ? 1 : 0.98 }}
              onClick={onConfirm}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
