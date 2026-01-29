import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Send,
  Eye,
  X,
  DollarSign,
  Clock,
  CheckCircle,
  ExternalLink,
  User,
  AlertCircle,
  TrendingUp,
  Users,
  Heart,
  ChevronDown,
  Check,
  Loader,
  Calendar,
  Star,
  Zap,
  Shield,
  Gift
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import defaultImage from '../../assets/default-avatar.png';
import TransactionChat from '../chat/TransactionChat';
import { getProfileImageUrl } from '../../utils/profileUtils';
import { useReceiveHelpFlow } from '../../hooks/useHelpFlow';
import { useAuth } from '../../context/AuthContext';
import { HELP_STATUS, HELP_STATUS_LABELS, normalizeStatus, canRequestPayment, canConfirmPayment, isConfirmedStatus } from '../../config/helpStatus';
import { useCountdown } from '../../hooks/useCountdown';
import { isIncomeBlocked, getRequiredPaymentForUnblock } from '../../shared/mlmCore';


// UI State Constants
const UI_STATES = {
  LOADING: 'loading',
  EMPTY: 'empty',
  PAYMENT_RECEIVED: 'payment_received',
  CONFIRMED: 'confirmed',
  ERROR: 'error'
};

function ReceiveHelpRefactored() {
  const { user } = useAuth();
  const [selectedProof, setSelectedProof] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHelpId, setSelectedHelpId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelHelp, setSelectedCancelHelp] = useState(null);
  const [requestCooldowns, setRequestCooldowns] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [selectedChatHelp, setSelectedChatHelp] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserHelp, setSelectedUserHelp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    receiveHelps,
    loading,
    confirmingId,
    error,
    confirmPayment,
    requestPaymentFromSender,
    rejectPaymentRequest
  } = useReceiveHelpFlow(user?.uid ? undefined : null);

  const { helpCount, totalReceived } = useMemo(() => {
    if (!receiveHelps?.length) return { helpCount: 0, totalReceived: 0 };

    const confirmedHelps = receiveHelps.filter(h => isConfirmedStatus(h.status));
    return {
      helpCount: confirmedHelps.length,
      totalReceived: confirmedHelps.reduce((sum, h) => sum + (h.amount || 0), 0)
    };
  }, [receiveHelps]);

  const filteredReceiveHelps = useMemo(() => {
    if (!receiveHelps) return [];
    
    return receiveHelps.filter(h => {
      const s = normalizeStatus(h.status);
      switch (statusFilter) {
        case 'all':
          return true;
        case HELP_STATUS.ASSIGNED:
        case HELP_STATUS.PAYMENT_REQUESTED:
        case HELP_STATUS.PAYMENT_DONE:
        case HELP_STATUS.CONFIRMED:
        case HELP_STATUS.DISPUTED:
        case HELP_STATUS.TIMEOUT:
        case HELP_STATUS.CANCELLED:
        case HELP_STATUS.FORCE_CONFIRMED:
          return s === statusFilter;
        default:
          return true;
      }
    });
  }, [receiveHelps, statusFilter]);

  const normalizeStatusLocal = (status) => {
    if (!status) return 'pending';
    return status.toLowerCase().trim();
  };

  const isPendingStatus = (status) => {
    const normalized = normalizeStatusLocal(status);
    return normalized === 'pending' || normalized === 'waiting';
  };

  const isPaymentDoneStatus = (status) => {
    const normalized = normalizeStatusLocal(status);
    return normalized === 'payment done' || normalized === 'payment_done' || normalized === 'paid';
  };

  const isConfirmedStatusLocal = (status) => {
    const normalized = normalizeStatusLocal(status);
    return normalized === 'confirmed' || normalized === 'complete' || normalized === 'completed';
  };

  useEffect(() => {
    if (!user?.uid) return;
    
    const loadCooldowns = async () => {
      try {
        const cooldownsFromStorage = JSON.parse(localStorage.getItem('paymentRequestCooldowns') || '{}');
        setRequestCooldowns(cooldownsFromStorage);
      } catch (error) {
        console.error('Error loading cooldowns:', error);
      }
    };
    
    loadCooldowns();
  }, [user?.uid]);

  const isRequestOnCooldown = (helpId) => {
    const lastRequest = requestCooldowns[helpId];
    if (!lastRequest) return false;
    const cooldownMs = 2 * 60 * 60 * 1000;
    return Date.now() - lastRequest < cooldownMs;
  };

  const handleRequestPayment = async (helpId) => {
    if (isRequestOnCooldown(helpId)) {
      const lastRequest = requestCooldowns[helpId];
      const remainingMs = (2 * 60 * 60 * 1000) - (Date.now() - lastRequest);
      const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
      toast.error(`Please wait ${hours} hour(s) before requesting again`);
      return;
    }

    try {
      await requestPaymentFromSender(helpId);
      const newCooldowns = {
        ...requestCooldowns,
        [helpId]: Date.now()
      };
      setRequestCooldowns(newCooldowns);
      localStorage.setItem('paymentRequestCooldowns', JSON.stringify(newCooldowns));
      toast.success('Payment request sent');
    } catch (err) {
      toast.error(err?.message || 'Failed to request payment');
    }
  };

  const getStatusBadge = (status) => {
    let displayText;
    let config;

    const normalizedStatus = (status || '').toUpperCase().trim();

    switch (normalizedStatus) {
      case 'ASSIGNED':
      case 'PAYMENT_REQUESTED':
        displayText = 'Pending';
        config = { bg: 'bg-yellow-100', text: 'text-yellow-800' };
        break;
      case 'PAYMENT_DONE':
        displayText = 'Payment Done';
        config = { bg: 'bg-blue-100', text: 'text-blue-800' };
        break;
      case 'CONFIRMED':
        displayText = 'Received';
        config = { bg: 'bg-green-100', text: 'text-green-800' };
        break;
      case 'TIMEOUT':
      case 'CANCELLED':
        displayText = 'Expired';
        config = { bg: 'bg-red-100', text: 'text-red-800' };
        break;
      default:
        displayText = 'Pending';
        config = { bg: 'bg-gray-100', text: 'text-gray-800' };
        break;
    }
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${config.bg} ${config.text}`}>
        {displayText}
      </span>
    );
  };

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Incoming Help</h3>
      <p className="text-gray-500">When someone sends you help, it will appear here</p>
    </motion.div>
  );

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-800">Error Loading Help Requests</h3>
          <p className="text-red-700">{error?.message || 'Failed to load your help requests'}</p>
        </div>
      </div>
    </motion.div>
  );

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Sign in required</h2>
          <p className="text-gray-500">Please sign in to view your help requests</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Received</p>
                <p className="text-2xl font-bold">₹{totalReceived}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Confirmed Helps</p>
                <p className="text-2xl font-bold">{helpCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All', icon: DollarSign, color: 'bg-gray-100 text-gray-700' },
              { value: HELP_STATUS.ASSIGNED, label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
              { value: HELP_STATUS.PAYMENT_REQUESTED, label: 'Payment Requested', icon: Send, color: 'bg-blue-100 text-blue-700' },
              { value: HELP_STATUS.CONFIRMED, label: 'Confirmed', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  statusFilter === filter.value
                    ? `${filter.color} ring-2 ring-offset-2`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <filter.icon className="inline-block w-4 h-4 mr-2" />
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        {loading && renderLoadingState()}
        {error && renderErrorState()}
        {!loading && !error && filteredReceiveHelps.length === 0 && renderEmptyState()}
        
        {!loading && !error && filteredReceiveHelps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredReceiveHelps.map((help, index) => {
                const whatsAppNumber = help.senderWhatsapp || help.senderPhone;
                const canChat = !!whatsAppNumber;

                return (
                  <motion.div
                    key={help.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProfileImageUrl(help.senderProfileImage) || defaultImage}
                            alt={help.senderName}
                            className="w-12 h-12 rounded-full border-2 border-white object-cover"
                          />
                          <div>
                            <h3 className="text-white font-semibold">
                              {help.senderName || help.fullName || 'Sender'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-purple-100">
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">ID: {help.senderId || help.userId || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(help.status)}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-5">
                      {/* Amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Amount</span>
                        <span className="text-2xl font-bold text-indigo-600">₹{help.amount || 0}</span>
                      </div>

                      {/* Sender Details */}
                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <h4 className="font-semibold text-gray-700">Sender Details</h4>
                        {help.senderPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium w-20">Phone:</span>
                            <span>{help.senderPhone}</span>
                          </div>
                        )}
                        {help.senderWhatsapp && help.senderWhatsapp !== help.senderPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             <span className="font-medium w-20">WhatsApp:</span>
                             <span>{help.senderWhatsapp}</span>
                          </div>
                        )}
                        {help.senderEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             <span className="font-medium w-20">Email:</span>
                             <span>{help.senderEmail}</span>
                          </div>
                        )}
                        {!help.senderPhone && !help.senderWhatsapp && !help.senderEmail && (
                            <p className="text-sm text-gray-500">Sender contact details not available.</p>
                        )}
                      </div>


                      {/* Separator */}
                      <div className="border-t border-gray-200"></div>

                      {/* Date */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {help.createdAt?.toDate?.()?.toLocaleDateString?.() ||
                           new Date(help.createdAt).toLocaleDateString?.() ||
                           'Date unavailable'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {isPaymentDoneStatus(help.status) && !isConfirmedStatusLocal(help.status) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedHelpId(help.id);
                              setShowConfirmModal(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                            disabled={confirmingId === help.id}
                          >
                            {confirmingId === help.id ? (
                              <>
                                <Loader className="inline-block w-4 h-4 mr-2 animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="inline-block w-4 h-4 mr-2" />
                                Confirm Payment
                              </>
                            )}
                          </motion.button>
                        )}

                        {isPendingStatus(help.status) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRequestPayment(help.id)}
                            disabled={isRequestOnCooldown(help.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="inline-block w-4 h-4 mr-2" />
                            Request Payment
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (!canChat) return;
                            console.log("CHAT CLICKED", help.id);
                            window.open(`https://wa.me/${whatsAppNumber}`, '_blank', 'noopener,noreferrer');
                          }}
                          disabled={!canChat}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageCircle className="inline-block w-4 h-4 mr-2" />
                          {canChat ? 'Chat' : 'Chat unavailable'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>



      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && selectedChatHelp && (
          <TransactionChat
            helpId={selectedChatHelp.id}
            otherUserName={selectedChatHelp.senderName}
            onClose={() => {
              setShowChat(false);
              setSelectedChatHelp(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirm Payment Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Payment Received</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you have received the payment from the sender?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (selectedHelpId) {
                      await confirmPayment(selectedHelpId);
                      setShowConfirmModal(false);
                      setSelectedHelpId(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReceiveHelpRefactored;
