import React, { useState } from 'react';
import { forceReceiverAssignment } from '../../services/adminService';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiCheckCircle, FiAlertTriangle, FiSettings } from 'react-icons/fi';

const ForceReceiverAssignment = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setMessage('Please enter a valid User ID');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await forceReceiverAssignment(userId.trim());
      
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        setUserId(''); // Clear the input on success
        console.log('Force Receiver Assignment successful:', result.userData);
      } else {
        setMessage(result.message);
        setMessageType('error');
        console.error('Force Receiver Assignment failed:', result.message);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
      console.error('Force Receiver Assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2 flex items-center">
          <FiSettings className="mr-3 text-blue-400" />
          Force Receiver Assignment
        </h1>
        <p className="text-slate-400 text-sm md:text-base">Make a user eligible to receive help by updating their account status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 shadow-xl p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <FiUser className="mr-2 text-green-400" />
              User Activation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-slate-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (message) clearMessage();
                  }}
                  placeholder="Enter User ID to activate"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !userId.trim()}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 touch-manipulation shadow-lg ${
                  loading || !userId.trim()
                    ? 'bg-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-green-600 hover:bg-green-500 shadow-green-500/25'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiCheckCircle className="mr-2" />
                    Make Eligible
                  </div>
                )}
              </motion.button>
            </form>

            {/* Message Display */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 p-4 rounded-lg border flex items-center justify-between ${
                    messageType === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center">
                    {messageType === 'success' ? (
                      <FiCheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    ) : (
                      <FiAlertTriangle className="w-5 h-5 mr-3 text-red-400" />
                    )}
                    <span className="text-sm">{message}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={clearMessage}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Information Panel */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <FiAlertTriangle className="mr-2 text-yellow-400" />
              What This Action Does
            </h3>

            <div className="space-y-3">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600">
                <div className="text-sm">
                  <code className="text-blue-400 font-mono">isActivated</code>
                  <span className="text-slate-400 ml-2">→</span>
                  <span className="text-green-400 font-semibold ml-2">true</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600">
                <div className="text-sm">
                  <code className="text-blue-400 font-mono">isOnHold</code>
                  <span className="text-slate-400 ml-2">→</span>
                  <span className="text-red-400 font-semibold ml-2">false</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600">
                <div className="text-sm">
                  <code className="text-blue-400 font-mono">isReceivingHeld</code>
                  <span className="text-slate-400 ml-2">→</span>
                  <span className="text-red-400 font-semibold ml-2">false</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600">
                <div className="text-sm">
                  <code className="text-blue-400 font-mono">helpVisibility</code>
                  <span className="text-slate-400 ml-2">→</span>
                  <span className="text-green-400 font-semibold ml-2">true</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600">
                <div className="text-sm">
                  <code className="text-blue-400 font-mono">kycDetails.levelStatus</code>
                  <span className="text-slate-400 ml-2">→</span>
                  <span className="text-green-400 font-semibold ml-2">"active"</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start">
                <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">⚠️ Admin Action Required</p>
                  <p className="text-yellow-400">This action permanently modifies user account status. Use with caution.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceReceiverAssignment;