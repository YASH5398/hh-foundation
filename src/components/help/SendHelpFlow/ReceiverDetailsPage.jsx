import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiChevronRight, FiArrowLeft, FiCopy, FiCheck, FiUser } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import StepIndicator from './StepIndicator';

/**
 * ReceiverDetailsPage - Step 1 of Send Help Flow
 * Clean, professional redesign
 */
const ReceiverDetailsPage = ({ receiver, amount = 300, onProceed, onBack, isProceding = false }) => {
  const [imgError, setImgError] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!receiver) {
    return (
      <div className="w-screen h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full"
          />
          <p className="text-slate-500 font-medium animate-pulse">Establishing connection...</p>
        </div>
      </div>
    );
  }

  const nameInitial = (receiver.fullName || receiver.name || 'U').charAt(0).toUpperCase();

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <div className="flex-1 w-full max-w-md mx-auto p-5 pb-32">
        {/* Step Indicator */}
        <div className="mb-10 mt-4">
          <StepIndicator currentStep={1} totalSteps={4} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Header Card: Receiver Profile */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-20 -mt-20 opacity-60 blur-2xl group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#EC4899] flex items-center justify-center ring-4 ring-slate-50">
                  {!imgError && receiver.profileImage ? (
                    <img
                      src={receiver.profileImage}
                      alt={receiver.fullName || receiver.name}
                      className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-5xl font-black text-white drop-shadow-lg">{nameInitial}</span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                {receiver.fullName || receiver.name}
              </h2>

              <div className="flex flex-col gap-2 items-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-slate-100">
                  <FiUser className="w-3 h-3" />
                  ID: {receiver.userId}
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                  STAR LEVEL
                </div>
              </div>
            </div>
          </div>

          {/* Amount Card */}
          <div className="bg-[#0F172A] rounded-[2.5rem] p-8 text-center shadow-2xl shadow-indigo-100 relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.15),transparent_50%)]" />

            <p className="relative text-indigo-400 text-[11px] font-black uppercase tracking-[0.25em] mb-4">
              Activation Payment
            </p>

            <div className="relative flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl font-bold text-indigo-500/80 self-start mt-2">₹</span>
              <span className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                {amount}
              </span>
            </div>

            <div className="relative inline-flex items-center gap-2 px-5 py-2 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <p className="text-slate-300 text-xs font-semibold">One-time account activation</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-1 bg-indigo-600 rounded-full" />
                Contact Details
              </h4>
            </div>

            <div className="space-y-4">
              {receiver.phone && (
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white transition-all duration-300 hover:shadow-md hover:border-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <FiPhone className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                      <p className="text-sm font-bold text-slate-900">{receiver.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(receiver.phone, 'phone')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 transition-colors text-slate-300 hover:text-indigo-600"
                  >
                    {copiedField === 'phone' ? <FiCheck className="w-5 h-5 text-emerald-500" /> : <FiCopy className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {receiver.email && (
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white transition-all duration-300 hover:shadow-md hover:border-purple-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-purple-50 transition-colors">
                      <FiMail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{receiver.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(receiver.email, 'email')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-purple-50 transition-colors text-slate-300 hover:text-purple-600"
                  >
                    {copiedField === 'email' ? <FiCheck className="w-5 h-5 text-emerald-500" /> : <FiCopy className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modern Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-40">
        <div className="max-w-md mx-auto flex gap-4">
          <button
            onClick={onBack}
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-slate-500 border-2 border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>

          <button
            onClick={onProceed}
            disabled={isProceding}
            className="flex-1 h-16 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white font-black text-lg rounded-3xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50 disabled:scale-100"
          >
            {isProceding ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <FiRefreshCw className="w-6 h-6" />
              </motion.div>
            ) : (
              <>
                <span>Continue to Pay</span>
                <FiChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiverDetailsPage;
