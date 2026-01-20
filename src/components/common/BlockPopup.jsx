import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, MessageCircle, Clock, ExternalLink } from 'lucide-react';

const BlockPopup = ({ blockReason, blockedAt, blockedHelpId, onClose }) => {
  const navigate = useNavigate();

  const formatBlockTime = (timestamp) => {
    if (!timestamp) return 'Unknown';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleContactSupport = () => {
    navigate('/support', {
      state: {
        reason: 'account_blocked',
        blockReason: blockReason,
        blockedAt: blockedAt,
        blockedHelpId: blockedHelpId,
        message: `My account was blocked at ${formatBlockTime(blockedAt)}. Reason: ${blockReason}. Help ID: ${blockedHelpId || 'N/A'}. Please help me resolve this issue.`
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Account Blocked</h2>
              <p className="text-red-100 text-sm">Access temporarily restricted</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Account Has Been Blocked
            </h3>
            <p className="text-gray-600 text-sm">
              Due to a policy violation, your account access has been temporarily restricted.
            </p>
          </div>

          {/* Block Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Blocked At</p>
                  <p className="text-sm text-gray-900">{formatBlockTime(blockedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reason</p>
                  <p className="text-sm text-gray-900 break-words">{blockReason}</p>
                </div>
              </div>

              {blockedHelpId && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Related Help ID</p>
                    <p className="text-sm text-gray-900 font-mono">{blockedHelpId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">What to do next?</h4>
                <p className="text-sm text-blue-800">
                  Contact our support team to resolve this issue. Provide details about your situation and we'll help you get back to using the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleContactSupport}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            )}
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your account will remain blocked until the issue is resolved by our support team.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BlockPopup;

