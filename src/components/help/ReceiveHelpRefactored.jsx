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
import { useNavigate } from 'react-router-dom';
import defaultImage from '../../assets/default-avatar.png';
import { getProfileImageUrl } from '../../utils/profileUtils';
import { useReceiveHelpFlow } from '../../hooks/useHelpFlow';
import { useAuth } from '../../context/AuthContext';
import CountdownTimer from '../common/CountdownTimer';
import { HELP_STATUS, HELP_STATUS_LABELS, normalizeStatus, isActiveStatus, canRequestPayment, canConfirmPayment, isConfirmedStatus } from '../../config/helpStatus';
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
  const navigate = useNavigate();
  const [selectedProof, setSelectedProof] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHelpId, setSelectedHelpId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelHelp, setSelectedCancelHelp] = useState(null);
  const [optimisticCooldowns, setOptimisticCooldowns] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserHelp, setSelectedUserHelp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Timer for countdown updates
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCooldownStatus = (help) => {
    if (!help) return { active: false, remaining: 0 };

    let lastRequestTime = 0;

    // Check optimistic state for instant feedback
    if (optimisticCooldowns[help.id]) {
      lastRequestTime = optimisticCooldowns[help.id];
    } else if (help.lastPaymentRequestAt) {
      // Handle Firestore Timestamp or Date or millis
      if (typeof help.lastPaymentRequestAt.toDate === 'function') {
        lastRequestTime = help.lastPaymentRequestAt.toDate().getTime();
      } else if (help.lastPaymentRequestAt instanceof Date) {
        lastRequestTime = help.lastPaymentRequestAt.getTime();
      } else {
        lastRequestTime = Number(help.lastPaymentRequestAt) || 0;
      }
    }

    if (!lastRequestTime) return { active: false, remaining: 0 };

    const COOLDOWN_DURATION = 2 * 60 * 60 * 1000; // 2 hours
    const elapsed = currentTime - lastRequestTime;
    const remaining = COOLDOWN_DURATION - elapsed;

    return {
      active: remaining > 0,
      remaining: Math.max(0, remaining)
    };
  };

  const formatCountdown = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleRequestPayment = async (helpId) => {
    // 1. Immediate Success Feedback
    toast.success("Payment request sent successfully.");

    // 2. Immediate Button Disable (Optimistic Update)
    setOptimisticCooldowns(prev => ({
      ...prev,
      [helpId]: Date.now()
    }));

    // 3. Trigger Backend Action
    try {
      await requestPaymentFromSender(helpId);
    } catch (err) {
      console.error("Background payment request failed:", err);
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
              { value: HELP_STATUS.CONFIRMED, label: 'Confirmed', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${statusFilter === filter.value
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

                      {/* Payment Proof Section */}
                      {normalizeStatus(help.status) === HELP_STATUS.PAYMENT_DONE && (
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            Payment Proof
                          </h4>

                          {help.payment?.utr && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium w-20">UTR No:</span>
                              <span className="font-mono bg-green-50 text-green-700 px-3 py-1.5 rounded-lg select-all border border-green-100 font-bold">
                                {help.payment.utr}
                              </span>
                            </div>
                          )}

                          {help.payment?.screenshotUrl && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-2">Transaction Screenshot:</p>
                              <div
                                className="relative group cursor-zoom-in overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 w-full h-48"
                                onClick={() => setFullscreenImage(help.payment.screenshotUrl)}
                              >
                                <img
                                  src={help.payment.screenshotUrl}
                                  alt="Payment Proof"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                  <div className="bg-white/90 p-3 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Eye className="w-6 h-6 text-indigo-600" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}


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

                      {/* 24-Hour Countdown Timer */}
                      {(normalizeStatus(help.status) !== HELP_STATUS.CONFIRMED && normalizeStatus(help.status) !== HELP_STATUS.FORCE_CONFIRMED && help.createdAt) && (
                        <div className="mt-2 text-left">
                          <CountdownTimer
                            targetDate={new Date((help.createdAt?.toDate?.() || new Date(help.createdAt)).getTime() + 24 * 60 * 60 * 1000)}
                            label="Sender Deadline"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-3 pt-4">
                        {(() => {
                          const status = normalizeStatus(help.status);

                          // 1. TERMINAL STATES - No actions
                          if (!isActiveStatus(status)) {
                            const isConfirmed = isConfirmedStatus(status) || status === HELP_STATUS.FORCE_CONFIRMED;
                            return (
                              <div className={`w-full text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isConfirmed ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                {isConfirmed ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                {HELP_STATUS_LABELS[status] || 'Completed'}
                              </div>
                            );
                          }

                          // 2. PAYMENT DONE - Show Confirm / Reject
                          if (status === HELP_STATUS.PAYMENT_DONE) {
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setSelectedHelpId(help.id);
                                    setShowConfirmModal(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-200 flex flex-col items-center justify-center"
                                >
                                  <Check className="w-5 h-5 mb-1" />
                                  <span className="text-xs">Confirm</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setRejectId(help.id);
                                    setShowRejectModal(true);
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-all border border-red-100 flex flex-col items-center justify-center"
                                >
                                  <X className="w-5 h-5 mb-1" />
                                  <span className="text-xs">Reject</span>
                                </motion.button>
                              </div>
                            );
                          }

                          // 3. PAYMENT REQUESTED - Waiting state
                          if (status === HELP_STATUS.PAYMENT_REQUESTED) {
                            return (
                              <div className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-blue-100 animate-pulse">
                                <Clock className="w-5 h-5" />
                                Waiting for Proof
                              </div>
                            );
                          }

                          // 4. ASSIGNED - Request Payment
                          const { active: isCooldown, remaining } = getCooldownStatus(help);
                          return (
                            <motion.button
                              whileHover={!isCooldown ? { scale: 1.02 } : {}}
                              whileTap={!isCooldown ? { scale: 0.98 } : {}}
                              onClick={() => !isCooldown && handleRequestPayment(help.id)}
                              disabled={isCooldown}
                              className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${isCooldown
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                }`}
                            >
                              {isCooldown ? (
                                <>
                                  <Clock className="w-4 h-4" />
                                  Ready in {formatCountdown(remaining)}
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4" />
                                  Request Payment
                                </>
                              )}
                            </motion.button>
                          );
                        })()}

                        <button
                          type="button"
                          className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/dashboard/chat/${help.id}`);
                          }}
                        >
                          <MessageCircle className="inline-block w-4 h-4 mr-2" />
                          Chat
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>



      {/* Confirm Payment Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-green-600 p-6 text-center">
                <CheckCircle className="w-16 h-16 text-white/50 mx-auto mb-2" />
                <h2 className="text-2xl font-black text-white">Payment Received?</h2>
              </div>
              <div className="p-8">
                <p className="text-gray-600 text-center mb-8 leading-relaxed">
                  Only confirm if you have verified the amount in your <span className="font-bold text-gray-900 text-lg">Bank/UPI App</span>. This action is irreversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
                  >
                    Not Yet
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (selectedHelpId) {
                        setIsSubmitting(true);
                        try {
                          await confirmPayment(selectedHelpId);
                          setShowConfirmModal(false);
                          setSelectedHelpId(null);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Yes, Received!'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Payment Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!isSubmitting) setShowRejectModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-600 p-6 text-center">
                <AlertCircle className="w-16 h-16 text-white/50 mx-auto mb-2" />
                <h2 className="text-2xl font-black text-white">Reject Request</h2>
              </div>
              <div className="p-8">
                <p className="text-gray-600 text-center mb-6 text-sm">
                  Please provide a reason for rejecting this payment proof.
                </p>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Example: UTR number is fake or amount not received..."
                  className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl mb-6 focus:border-red-500 focus:ring-0 transition-colors resize-none text-gray-700"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!rejectReason.trim() || isSubmitting}
                    onClick={async () => {
                      if (rejectId && rejectReason.trim()) {
                        setIsSubmitting(true);
                        try {
                          await rejectPaymentRequest(rejectId, rejectReason);
                          setShowRejectModal(false);
                          setRejectId(null);
                          setRejectReason('');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Reject Proof'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenImage}
              alt="Payment Proof Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReceiveHelpRefactored;
