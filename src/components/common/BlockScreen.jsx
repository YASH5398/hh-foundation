import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, AlertTriangle, MessageCircle, Ticket, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createSupportTicket } from '../../services/supportService';

const BlockScreen = () => {
  const { user, blockReason, blockedAt, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const formatBlockTime = (timestamp) => {
    if (!timestamp) return 'Unknown';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleRaiseTicket = async () => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ticketData = {
        reason: 'Account blocked - deadline expired',
        blockReason: blockReason,
        description: `My account was blocked at ${formatBlockTime(blockedAt)}. Reason: ${blockReason}. Please review and unblock my account.`,
        relatedHelpId: userProfile?.blockedHelpId,
        priority: 'high',
        category: 'block_resolution',
        attachments: []
      };

      const result = await createSupportTicket(user, ticketData);
      if (result.success) {
        setTicketSubmitted(true);
      } else {
        alert('Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChatSupport = () => {
    navigate('/support/live-chat', {
      state: {
        reason: 'account_blocked',
        blockReason,
        blockedAt,
        blockedHelpId: userProfile?.blockedHelpId
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Account Blocked</h1>
                <p className="text-red-100 text-sm">Access temporarily restricted</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {/* Main Warning */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Account Has Been Blocked
              </h2>
              <p className="text-gray-600 text-lg">
                Payment was not completed within the 24-hour deadline
              </p>
            </div>

            {/* Block Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Blocked At</p>
                    <p className="text-base text-gray-900">{formatBlockTime(blockedAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Reason</p>
                    <p className="text-base text-gray-900 break-words">{blockReason}</p>
                  </div>
                </div>

                {userProfile?.blockedHelpId && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Related Help ID</p>
                      <p className="text-base text-gray-900 font-mono">{userProfile.blockedHelpId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notice</h3>
                  <div className="text-amber-800 space-y-2">
                    <p>• Your account remains blocked until reviewed by our support team</p>
                    <p>• After approval, you'll receive a new help assignment with a fresh 24-hour countdown</p>
                    <p>• The expired assignment will not be available again</p>
                    <p>• Please submit a ticket below to request account review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {!ticketSubmitted ? (
                <button
                  onClick={handleRaiseTicket}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  <Ticket className="w-6 h-6" />
                  {isSubmitting ? 'Submitting Ticket...' : 'Raise Support Ticket'}
                </button>
              ) : (
                <div className="w-full bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3">
                  <Ticket className="w-6 h-6" />
                  Ticket Submitted Successfully
                </div>
              )}

              <button
                onClick={handleChatSupport}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Chat with Support Agent
              </button>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need immediate assistance? Our support team is here to help you resolve this issue.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">24-Hour Payment Policy</h3>
            <p className="text-gray-600">
              All help assignments must be completed within 24 hours of assignment.
              This ensures fair distribution and maintains trust in our community.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BlockScreen;
