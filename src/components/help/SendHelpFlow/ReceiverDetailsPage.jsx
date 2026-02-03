import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMessageCircle, FiChevronRight, FiArrowLeft, FiCopy, FiCheck, FiUser } from 'react-icons/fi';
import { getProfileImageUrl } from '../../../utils/profileUtils';
import { toast } from 'react-hot-toast';
import StepIndicator from './StepIndicator';

/**
 * ReceiverDetailsPage - Step 1 of Send Help Flow
 * Modern mobile-first design with horizontal stepper
 */
const ReceiverDetailsPage = ({ receiver, amount = 300, onProceed, onBack, isProceding = false }) => {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!receiver) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-slate-600">Loading receiver information...</p>
        </div>
      </motion.div>
    );
  }

  const getInitials = (name) => {
    return (name || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicator */}
        <StepIndicator currentStep={1} totalSteps={4} />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          {/* Receiver Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-2xl bg-white flex items-center justify-center mb-4 border-4 border-white/20"
                >
                  <img
                    src={receiver.profileImage || '/assets/helping-hands-logo.png'}
                    alt={receiver.fullName || receiver.name || 'Receiver'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/helping-hands-logo.png';
                      e.target.onerror = null;
                    }}
                  />
                </motion.div>

                {/* Name */}
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
                  {receiver.fullName || receiver.name || 'Unknown'}
                </h2>

                {/* User ID Pill */}
                <button
                  onClick={() => copyToClipboard(receiver.userId, 'userId')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all"
                >
                  <FiUser className="w-4 h-4" />
                  <span className="text-sm font-mono font-semibold">{receiver.userId}</span>
                  {copiedField === 'userId' ? (
                    <FiCheck className="w-4 h-4 text-green-300" />
                  ) : (
                    <FiCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount Section */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-slate-200">
              <div className="text-center">
                <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-2">
                  Amount to Send
                </p>
                <p className="text-5xl md:text-6xl font-bold text-slate-900 mb-2">
                  ₹{amount}
                </p>
                <p className="text-sm text-slate-600">
                  Platform activation fee
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                Contact Information
              </h3>

              {/* Phone */}
              {receiver.phone && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => copyToClipboard(receiver.phone, 'phone')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FiPhone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                      <p className="text-base font-bold text-slate-900 truncate">{receiver.phone}</p>
                    </div>
                  </div>
                  {copiedField === 'phone' ? (
                    <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </motion.button>
              )}

              {/* Email */}
              {receiver.email && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  onClick={() => copyToClipboard(receiver.email, 'email')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <FiMail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                      <p className="text-base font-bold text-slate-900 truncate">{receiver.email}</p>
                    </div>
                  </div>
                  {copiedField === 'email' ? (
                    <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </motion.button>
              )}

              {/* WhatsApp */}
              {receiver.whatsapp && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => copyToClipboard(receiver.whatsapp, 'whatsapp')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <FiMessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase">WhatsApp</p>
                      <p className="text-base font-bold text-slate-900 truncate">{receiver.whatsapp}</p>
                    </div>
                  </div>
                  {copiedField === 'whatsapp' ? (
                    <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </motion.button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: isProceding ? 1 : 0.98 }}
                  whileTap={{ scale: isProceding ? 1 : 0.95 }}
                  onClick={onBack}
                  disabled={isProceding}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: isProceding ? 1 : 1.02 }}
                  whileTap={{ scale: isProceding ? 1 : 0.98 }}
                  onClick={onProceed}
                  disabled={isProceding}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <FiChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                ℹ
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm mb-1">Next Steps</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Review payment methods, complete the transaction, and upload proof for instant activation.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReceiverDetailsPage;
