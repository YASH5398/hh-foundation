import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, X, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AgentChatRequestPopup = ({ request, onClose, currentAgent }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!request || !currentAgent) return;

    setIsAccepting(true);
    try {
      // Update the chat request
      const requestRef = doc(db, 'agentChatRequests', request.id);
      await updateDoc(requestRef, {
        status: 'accepted',
        assignedAgentId: currentAgent.uid,
        assignedAgentName: currentAgent.displayName || currentAgent.email,
        acceptedAt: serverTimestamp()
      });

      // Create the chat room
      const chatRoomRef = doc(db, 'agentChats', request.id);
      await setDoc(chatRoomRef, {
        requestId: request.id,
        userId: request.userId,
        userName: request.userName,
        agentId: currentAgent.uid,
        agentName: currentAgent.displayName || currentAgent.email,
        status: 'active',
        createdAt: serverTimestamp(),
        startedAt: serverTimestamp()
      });

      // Add initial agent welcome message
      await addDoc(collection(db, 'agentChats', request.id, 'messages'), {
        senderUid: currentAgent.uid,
        senderType: 'agent',
        senderName: currentAgent.displayName || currentAgent.email,
        text: `Hi ${request.userName}! I'm ${currentAgent.displayName || currentAgent.email}. How can I help you today?`,
        timestamp: serverTimestamp()
      });

      toast.success('Chat accepted! Opening chat window...');
      onClose();

      // Navigate to agent chat page with the chat ID
      navigate(`/agent-dashboard/agent-chat?chatId=${request.id}`);

    } catch (error) {
      console.error('Error accepting chat request:', error);
      toast.error('Failed to accept chat request');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    // For now, just close the popup
    // In a real implementation, you might want to mark it as declined
    onClose();
  };

  if (!request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">New Chat Request</h3>
                  <p className="text-blue-100 text-sm">Live Support Request</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{request.userName}</h4>
                  <p className="text-blue-100 text-sm">New Customer</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-blue-100 mb-1">Message:</p>
                <p className="text-white font-medium">{request.firstMessage}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              {isAccepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Accept Chat</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDecline}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Decline</span>
            </motion.button>

            <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Please respond quickly</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentChatRequestPopup;
