import React, { useState, useEffect, useMemo } from "react";
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
import PaymentJourneyMotion from '../common/PaymentJourneyMotion';

export default function ReceiveHelp() {
  const { user } = useAuth();
  const [localError, setLocalError] = useState(null); // Add local error state management
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

  // Hard safe guard: Firestore calls must run ONLY when currentUser?.uid exists
  const {
    receiveHelps,
    loading,
    confirmingId,
    error,
    confirmPayment,
    requestPaymentFromSender,
    rejectPaymentRequest
  } = useReceiveHelpFlow(user?.uid ? undefined : null); // Pass null if no user to prevent calls

  // Calculate stats from confirmed receiveHelps
  const { helpCount, totalReceived } = useMemo(() => {
    const confirmedHelps = receiveHelps.filter(help => help.status === HELP_STATUS.CONFIRMED || help.status === HELP_STATUS.FORCE_CONFIRMED);
    const count = confirmedHelps.length;
    const total = confirmedHelps.reduce((sum, help) => sum + (help.amount || 0), 0);
    return { helpCount: count, totalReceived: total };
  }, [receiveHelps]);

  // Check if help is in payment request cooldown (2 hours)
  const isInCooldown = (help) => {
    if (!help.lastPaymentRequestAt) return false;
    const lastRequestTime = help.lastPaymentRequestAt.toDate ? help.lastPaymentRequestAt.toDate() : new Date(help.lastPaymentRequestAt);
    const cooldownEndTime = new Date(lastRequestTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
    return new Date() < cooldownEndTime;
  };

  // Filter receiveHelps based on status filter
  const filteredReceiveHelps = receiveHelps.filter(help => {
    const s = normalizeStatus(help.status);
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

  // All business logic now handled by useReceiveHelpFlow hook

  // All data fetching and real-time updates handled by useReceiveHelpFlow hook

  // Check if request payment is on cooldown (2 hours)
  const isRequestOnCooldown = (helpId) => {
    const lastRequest = requestCooldowns[helpId];
    if (!lastRequest) return false;
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000); // 2 hours in milliseconds
    return lastRequest > twoHoursAgo;
  };

  // Get remaining cooldown time in minutes
  const getRemainingCooldown = (helpId) => {
    const lastRequest = requestCooldowns[helpId];
    if (!lastRequest) return 0;
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const remaining = lastRequest - twoHoursAgo;
    return Math.max(0, Math.ceil(remaining / (60 * 1000))); // Convert to minutes
  };

  // Format remaining time as HH:MM
  const formatRemainingTime = (helpId) => {
    const remainingMinutes = getRemainingCooldown(helpId);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Action handlers

  const handlePaymentAccept = (helpId) => {
    // Prevent confirmation of already confirmed helps
    const help = receiveHelps.find(h => h.id === helpId);
    if (!help) return;

    if (isConfirmedStatus(help.status)) {
      toast.error('This payment has already been confirmed.');
      return;
    }

    setSelectedHelpId(helpId);
    setShowConfirmModal(true);
  };

  const confirmPaymentReceived = async () => {
    if (!selectedHelpId) return;

    try {
      await confirmPayment(selectedHelpId);
      // Modal management handled by hook
      setShowConfirmModal(false);
      setSelectedHelpId(null);
    } catch (err) {
      console.error('Error confirming payment:', err);
      setLocalError(err.message);
    }
  };

  const handleCancelPayment = (help) => {
    setSelectedCancelHelp(help);
    setShowCancelModal(true);
  };

  const confirmCancelPayment = async () => {
    if (!selectedCancelHelp) return;

    try {
      // Use rejectPaymentRequest for payment rejection (allows re-submission)
      await rejectPaymentRequest(selectedCancelHelp.id, "Payment proof rejected by receiver");

      // Modal management
      setShowCancelModal(false);
      setSelectedCancelHelp(null);
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setLocalError(err.message);
    }
  };

  const handleViewProof = (screenshotUrl) => {
    setSelectedProof(screenshotUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setSelectedProof(null);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedHelpId(null);
  };

  // Helper function to get profile image or default avatar
  const getProfileImage = (help) => {
    return getProfileImageUrl({ profileImage: help.profileImage });
  };

  // Helper function to get first letter for default avatar
  const getFirstLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // User Countdown Component (for user profile popup)
  const UserCountdown = ({ assignedAt }) => {
    const { timeLeft, isExpired, hours, minutes, seconds, formattedTime } = useCountdown(assignedAt);

    return (
      <div className="text-center">
        {isExpired ? (
          <div className="text-red-600 font-bold text-lg mb-2">TIME EXPIRED</div>
        ) : (
          <div className="text-3xl font-mono font-bold text-red-900 bg-white px-4 py-2 rounded-lg border border-red-200 mb-2">
            {formattedTime}
          </div>
        )}
      </div>
    );
  };

  // Cooldown Countdown Component (for payment request cooldown)
  const CooldownCountdown = ({ lastRequestTime }) => {
    // Calculate cooldown end time (2 hours from last request)
    const cooldownEndTime = lastRequestTime ? new Date((lastRequestTime.toDate ? lastRequestTime.toDate() : new Date(lastRequestTime)).getTime() + (2 * 60 * 60 * 1000)) : null;

    const { timeLeft, formattedTime } = useCountdown(cooldownEndTime);

    if (!cooldownEndTime || timeLeft <= 0) return null;

    return (
      <div className="text-center mt-2">
        <div className="text-xs text-orange-600 font-medium mb-1">Next request available in:</div>
        <div className="text-lg font-mono font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
          {formattedTime}
        </div>
      </div>
    );
  };

  // Deadline Countdown Component (for main help cards)
  const DeadlineCountdown = ({ help }) => {
    const { timeLeft, isExpired, formattedTime } = useCountdown(help?.assignedAt);

    if (!help?.assignedAt || isConfirmedStatus(help.status)) return null;

    return (
      <div className="rounded-2xl p-5 border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">
            {isExpired ? 'Deadline Expired' : 'Payment Deadline'}
          </span>
        </div>

        {isExpired ? (
          <div className="text-center">
            <p className="text-red-600 font-semibold">⚠️ Deadline has expired</p>
            <p className="text-sm text-red-500 mt-1">Contact support immediately</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-blue-900 bg-white px-6 py-3 rounded-xl border border-blue-200 shadow-sm mb-2">
              {formattedTime}
            </div>
            <p className="text-xs text-blue-600">
              {timeLeft > 12 * 60 * 60 * 1000 ? 'Plenty of time remaining' :
               timeLeft > 60 * 60 * 1000 ? 'Hurry up!' : 'Final hour - Complete now!'}
            </p>
          </div>
        )}
      </div>
    );
  };


  // Helper function to get status badge configuration
  const getStatusBadge = (status) => {
    const s = normalizeStatus(status);
    let config;

    switch (s) {
      case HELP_STATUS.PAYMENT_REQUESTED:
        config = { bg: 'bg-orange-100', text: 'text-orange-800', icon: Send };
        break;
      case HELP_STATUS.PAYMENT_DONE:
        config = { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send };
        break;
      case HELP_STATUS.CONFIRMED:
      case HELP_STATUS.FORCE_CONFIRMED:
        config = { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
        break;
      case HELP_STATUS.ASSIGNED:
        config = { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
        break;
      case HELP_STATUS.CANCELLED:
        config = { bg: 'bg-red-100', text: 'text-red-800', icon: X };
        break;
      case HELP_STATUS.TIMEOUT:
        config = { bg: 'bg-red-100', text: 'text-red-800', icon: Clock };
        break;
      case HELP_STATUS.DISPUTED:
        config = { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle };
        break;
      default:
        config = { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    }

    const IconComponent = config.icon;
    const label = HELP_STATUS_LABELS[s] || s;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <IconComponent className="w-4 h-4" />
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Mobile Stats Cards */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-6"
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
                <p className="text-green-100 text-sm">Help Count</p>
                <p className="text-2xl font-bold">{helpCount}</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </motion.div>

        {/* Income Blocking Status */}
        {user && isIncomeBlocked(user) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Income Temporarily Blocked
                  </h3>
                  <p className="text-red-700 mb-4">
                    Your income has been blocked at {user?.helpReceived || 0} helps received in {user?.level || 'STAR'} level.
                    Complete the required payment below to resume receiving payments.
                  </p>

                  {(() => {
                    const requiredPayment = getRequiredPaymentForUnblock(user);
                    if (!requiredPayment) return null;

                    return requiredPayment ? (
                      <div className="bg-white rounded-xl p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-800">
                            {requiredPayment?.type === 'upgrade' ? 'Upgrade Payment Required' : 'Sponsor Payment Required'}
                          </span>
                          <span className="text-2xl font-bold text-red-600">
                            ₹{requiredPayment?.amount?.toLocaleString() || 'N/A'}
                          </span>
                        </div>

                        {requiredPayment.type === 'sponsor' && (
                          <p className="text-sm text-gray-600 mb-3">
                            Pay this amount to your sponsor/upline to unlock your remaining payments.
                          </p>
                        )}

                        {requiredPayment.type === 'upgrade' && (
                          <p className="text-sm text-gray-600 mb-3">
                            Pay this amount to upgrade to the next level and unlock your remaining payments.
                          </p>
                        )}

                        <div className="flex gap-3">
                          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Make Payment
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All', icon: DollarSign, color: 'bg-gray-100 text-gray-700', activeColor: 'bg-gray-600 text-white' },
              { value: HELP_STATUS.ASSIGNED, label: HELP_STATUS_LABELS[HELP_STATUS.ASSIGNED], icon: Clock, color: 'bg-yellow-100 text-yellow-700', activeColor: 'bg-yellow-600 text-white' },
              { value: HELP_STATUS.PAYMENT_REQUESTED, label: HELP_STATUS_LABELS[HELP_STATUS.PAYMENT_REQUESTED], icon: Send, color: 'bg-indigo-100 text-indigo-700', activeColor: 'bg-indigo-600 text-white' },
              { value: HELP_STATUS.PAYMENT_DONE, label: HELP_STATUS_LABELS[HELP_STATUS.PAYMENT_DONE], icon: Eye, color: 'bg-blue-100 text-blue-700', activeColor: 'bg-blue-600 text-white' },
              { value: HELP_STATUS.CONFIRMED, label: HELP_STATUS_LABELS[HELP_STATUS.CONFIRMED], icon: CheckCircle, color: 'bg-green-100 text-green-700', activeColor: 'bg-green-600 text-white' }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap hover:scale-105 ${
                    isActive ? filter.activeColor : filter.color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Mobile Empty State */}
        {filteredReceiveHelps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mx-4 border border-gray-200/50">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Gift className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Help Requests Yet</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                When someone sends you help, it will appear here. Share your profile to start receiving!
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">Share your HH ID with friends!</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Help Cards */}
        {filteredReceiveHelps.length > 0 && (
          <div className="space-y-4 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredReceiveHelps.map((help, index) => (
                <motion.div
                  key={help.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    layout: { duration: 0.3 }
                  }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  {/* Sender + Status Header */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedUserHelp(help);
                            setShowUserProfile(true);
                          }}
                        >
                          {getProfileImage(help) ? (
                            <img
                              src={getProfileImage(help)}
                              alt={help.senderName || help.fullName || 'Sender'}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.src = defaultImage;
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-200">
                              <span className="text-white font-bold text-xl">
                                {getFirstLetter(help.senderName || help.fullName || 'Unknown User')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1.5">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                              {help.senderName || help.fullName || 'Unknown User'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">ID: {help.senderId || help.userId || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-5">

                    {/* Amount Section */}
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Amount</div>
                        <div className="text-2xl font-bold text-gray-900 leading-tight">₹{help.amount || 300}</div>
                      </div>
                      <div className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold border shadow-sm ${
                        (help.status === HELP_STATUS.CONFIRMED || help.status === HELP_STATUS.FORCE_CONFIRMED)
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : help.status === HELP_STATUS.PAYMENT_DONE
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : help.status === HELP_STATUS.PAYMENT_REQUESTED
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {HELP_STATUS_LABELS[normalizeStatus(help.status)] || normalizeStatus(help.status)}
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    {(() => {
                      const rawPhone = help.senderMobile || help.senderPhone || help.phone;
                      const rawWhatsApp = help.senderWhatsApp || help.whatsapp || help.senderMobile || help.senderPhone || help.phone;
                      const phoneDigits = rawPhone ? String(rawPhone).replace(/[^0-9]/g, '') : '';
                      const waDigits = rawWhatsApp ? String(rawWhatsApp).replace(/[^0-9]/g, '') : '';

                      return (
                        <div className="grid grid-cols-3 gap-2">
                          <a
                            href={phoneDigits ? `tel:+91${phoneDigits}` : undefined}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold border transition-all duration-200 min-h-[44px] ${
                              phoneDigits
                                ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 active:bg-gray-100'
                                : 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                            }`}
                          >
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Call</span>
                          </a>

                          <a
                            href={waDigits ? `https://wa.me/91${waDigits}` : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold border transition-all duration-200 min-h-[44px] ${
                              waDigits
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-emerald-700'
                                : 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">WhatsApp</span>
                            {waDigits && <ExternalLink className="w-4 h-4 flex-shrink-0" />}
                          </a>

                          {/* Chat Icon Button */}
                          <button
                            onClick={() => {
                              setSelectedChatHelp(help);
                              setShowChat(true);
                            }}
                            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-blue-600 shadow-lg hover:shadow-xl"
                          >
                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                          </button>
                        </div>
                      );
                    })()}

                    {/* Deadline Countdown */}
                    <DeadlineCountdown help={help} />

                    {/* Payment Details - Show when payment_requested status */}
                    {help.status === HELP_STATUS.PAYMENT_REQUESTED && (
                      <div className="rounded-2xl p-5 border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Payment Details</span>
                        </div>

                        <div className="space-y-3">
                          {/* UTR Number */}
                          {(help.paymentDetails?.utrNumber || help.utrNumber || help.utr) && (
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">UTR / Transaction ID</div>
                              <p className="font-mono text-lg font-bold text-blue-900 break-all">
                                {help.paymentDetails?.utrNumber || help.utrNumber || help.utr}
                              </p>
                            </div>
                          )}

                          {/* Payment Method */}
                          {(help.paymentDetails?.method || help.paymentMethod) && (
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Payment Method</div>
                              <p className="font-semibold text-blue-900">
                                {help.paymentDetails?.method || help.paymentMethod}
                              </p>
                            </div>
                          )}

                          {/* Bank Details */}
                          {help.paymentDetails?.bank && (
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Bank Details</div>
                              <div className="space-y-1 text-sm">
                                {help.paymentDetails.bank.bankName && <p><span className="font-medium">Bank:</span> {help.paymentDetails.bank.bankName}</p>}
                                {help.paymentDetails.bank.accountNumber && <p><span className="font-medium">Account:</span> {help.paymentDetails.bank.accountNumber}</p>}
                                {help.paymentDetails.bank.ifscCode && <p><span className="font-medium">IFSC:</span> {help.paymentDetails.bank.ifscCode}</p>}
                                {help.paymentDetails.bank.name && <p><span className="font-medium">Name:</span> {help.paymentDetails.bank.name}</p>}
                              </div>
                            </div>
                          )}

                          {/* UPI Details */}
                          {(help.paymentDetails?.upi || help.upi) && (
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">UPI ID</div>
                              <p className="font-mono text-blue-900">
                                {help.paymentDetails?.upi || help.upi}
                              </p>
                            </div>
                          )}

                          {/* Screenshot */}
                          {help.paymentDetails?.screenshotUrl && (
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Payment Screenshot</div>
                                  <p className="text-sm text-blue-800">Available for review</p>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewProof(help.paymentDetails?.screenshotUrl)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                >
                                  View Proof
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      {/* Request Payment */}
                      {canRequestPayment(help?.status) && user?.uid === help?.receiverUid && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => requestPaymentFromSender(help.id)}
                            disabled={confirmingId === help.id || isInCooldown(help)}
                            className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm min-h-[44px] ${
                              confirmingId === help.id || isInCooldown(help)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 text-white shadow-lg'
                            }`}
                          >
                            {confirmingId === help.id ? (
                              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                            ) : (
                              <Send className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="truncate">
                              {confirmingId === help.id ? 'Requesting...' : 'Request Payment'}
                            </span>
                          </motion.button>
                          {isInCooldown(help) && (
                            <CooldownCountdown lastRequestTime={help.lastPaymentRequestAt} />
                          )}
                        </>
                      )}

                      {/* Approve Payment */}
                      {canConfirmPayment(help?.status) && !isConfirmedStatus(help.status) && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePaymentAccept(help.id)}
                            disabled={confirmingId === help.id || isIncomeBlocked(user)}
                            className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm min-h-[44px] shadow-lg ${
                              isIncomeBlocked(user)
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 text-white'
                            }`}
                          >
                            {confirmingId === help.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                            ) : isIncomeBlocked(user) ? (
                              <>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>Income Blocked</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span>Approve Payment</span>
                              </>
                            )}
                          </motion.button>
                        </>
                      )}

                      {/* Confirmed Status */}
                      {isConfirmedStatus(help.status) && (
                        <div className="w-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 py-3.5 px-4 rounded-xl font-semibold text-center flex items-center justify-center gap-2 text-sm border border-green-200 min-h-[44px]">
                          <CheckCircle className="w-5 h-5 flex-shrink-0" />
                          <span>Payment Confirmed</span>
                        </div>
                      )}

                      {/* View Proof Button - Only show when screenshot exists and payment has been submitted */}
                      {help.paymentDetails?.screenshotUrl && help.status === HELP_STATUS.PAYMENT_DONE && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewProof(help.paymentDetails?.screenshotUrl)}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 active:from-purple-700 active:to-indigo-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm min-h-[44px] shadow-lg"
                        >
                          <Eye className="w-5 h-5 flex-shrink-0" />
                          <span>View Proof</span>
                        </motion.button>
                      )}

                      {/* Reject Payment Button */}
                      {help?.status === HELP_STATUS.PAYMENT_DONE && user?.uid === help?.receiverUid && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCancelPayment(help)}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 active:from-red-700 active:to-pink-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm min-h-[44px] shadow-lg"
                        >
                          <X className="w-5 h-5 flex-shrink-0" />
                          <span>Reject Payment</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Proof Viewing Modal */}
      <AnimatePresence>
        {showProofModal && selectedProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={closeProofModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span>Payment Proof</span>
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeProofModal}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </motion.button>
              </div>
              <div className="flex-1 p-2 sm:p-4 flex items-center justify-center bg-gray-50 overflow-auto">
                <img
                  src={selectedProof}
                  alt="Payment Proof"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeConfirmModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2">
                  Payment Approval
                </h3>
                <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
                  Did you receive the payment? Please verify in your bank/UPI app before approving.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeConfirmModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    No, Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmPaymentReceived}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Yes, Received
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Payment Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2">
                  Cancel Payment Request
                </h3>
                <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
                  Are you sure you want to cancel this payment request? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    No, Keep
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmCancelPayment}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Yes, Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showUserProfile && selectedUserHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowUserProfile(false);
              setSelectedUserHelp(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {getFirstLetter(selectedUserHelp.senderName || selectedUserHelp.fullName || 'Unknown User')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedUserHelp.senderName || selectedUserHelp.fullName || 'Unknown User'}
                  </h3>
                  <p className="text-gray-600">ID: {selectedUserHelp.senderId || selectedUserHelp.userId || 'N/A'}</p>
                </div>

                {/* User Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-gray-900 font-medium">{selectedUserHelp.senderPhone || selectedUserHelp.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">WhatsApp</p>
                      <p className="text-gray-900 font-medium">{selectedUserHelp.senderWhatsApp || selectedUserHelp.whatsapp || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-gray-900 font-medium">{selectedUserHelp.senderEmail || selectedUserHelp.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* 24-Hour Countdown */}
                {selectedUserHelp.assignedAt && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-semibold text-red-800">24-hour payment countdown</h4>
                    </div>
                    <UserCountdown assignedAt={selectedUserHelp.assignedAt} />
                    <p className="text-xs text-red-700 mt-2">
                      If payment is not completed within 24 hours, the account will be blocked automatically.
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowUserProfile(false);
                    setSelectedUserHelp(null);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      {showChat && selectedChatHelp && (
        <TransactionChat
          transactionType="receiveHelp"
          transactionId={selectedChatHelp.id}
          otherUser={{
            name: selectedChatHelp.senderName || selectedChatHelp.fullName || 'Unknown User',
            profileImage: selectedChatHelp.senderProfileImage || selectedChatHelp.profileImage
          }}
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedChatHelp(null);
          }}
        />
      )}

      {/* Payment Journey Motion Icon */}
      <PaymentJourneyMotion mode="icon" user={user} />
    </div>
  );
}
