import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMessageCircle, FiChevronRight, FiArrowLeft, FiCopy, FiCheck, FiPhoneCall } from 'react-icons/fi';
import { getProfileImageUrl } from '../../../utils/profileUtils';
import { toast } from 'react-hot-toast';

/**
 * ReceiverDetailsPage - Step 1 of Send Help Flow
 * Premium mobile-first design with dark glassmorphism theme
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
        className="min-h-screen bg-zinc-100 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm">
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
              1
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Step 1</p>
              <p className="text-xs text-slate-600">Receiver Details</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase">of 4</p>
        </motion.div>

        {/* Main Receiver Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg p-8 mb-6 shadow-sm"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              className="relative mb-6"
            >
              {/* Avatar Container */}
              <div className="w-20 h-20 rounded-lg overflow-hidden shadow-sm bg-slate-200 flex items-center justify-center">
                <img
                  src={getProfileImageUrl(receiver)}
                  alt={receiver.fullName || receiver.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="text-2xl font-bold text-slate-700">${getInitials(receiver.fullName || receiver.name)}</span>`;
                  }}
                />
              </div>
            </motion.div>

            {/* Name & User ID */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{receiver.fullName || receiver.name || 'Unknown'}</h2>
              <button
                onClick={() => copyToClipboard(receiver.userId, 'userId')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 w-fit mx-auto hover:bg-slate-200 transition-colors"
              >
                <p className="text-xs text-slate-700 font-mono">{receiver.userId}</p>
                {copiedField === 'userId' ? (
                  <FiCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <FiCopy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </motion.div>
          </div>

          {/* Amount Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8 text-center"
          >
            <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-1">Amount to Send</p>
            <p className="text-4xl font-bold text-slate-900">₹{amount}</p>
            <p className="text-xs text-slate-600 mt-2">Fixed platform entry amount</p>
          </motion.div>

          {/* Contact Methods */}
          <div className="space-y-2 mb-8">
            {/* Phone */}
            {receiver.phone && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                onClick={() => copyToClipboard(receiver.phone, 'phone')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <FiPhone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs uppercase font-semibold text-slate-600">Phone</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{receiver.phone}</p>
                  </div>
                </div>
                {copiedField === 'phone' ? (
                  <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <FiCopy className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
              </motion.button>
            )}

            {/* Email */}
            {receiver.email && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => copyToClipboard(receiver.email, 'email')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <FiMail className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs uppercase font-semibold text-slate-600">Email</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{receiver.email}</p>
                  </div>
                </div>
                {copiedField === 'email' ? (
                  <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <FiCopy className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
              </motion.button>
            )}

            {/* WhatsApp */}
            {receiver.whatsapp && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                onClick={() => copyToClipboard(receiver.whatsapp, 'whatsapp')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <FiMessageCircle className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs uppercase font-semibold text-slate-600">WhatsApp</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{receiver.whatsapp}</p>
                  </div>
                </div>
                {copiedField === 'whatsapp' ? (
                  <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <FiCopy className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
              </motion.button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <motion.button
              whileHover={{ scale: isProceding ? 1 : 0.98 }}
              whileTap={{ scale: isProceding ? 1 : 0.95 }}
              onClick={onBack}
              disabled={isProceding}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: isProceding ? 1 : 1.02 }}
              whileTap={{ scale: isProceding ? 1 : 0.98 }}
              onClick={onProceed}
              disabled={isProceding}
              className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Next Step
              <FiChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg p-4 text-sm shadow-sm border border-slate-200"
        >
          <p className="font-semibold text-slate-900 mb-2">✓ Next Steps</p>
          <p className="text-xs leading-relaxed text-slate-600">
            Review receiver payment methods, complete the transaction, and upload proof for instant account activation.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReceiverDetailsPage;
