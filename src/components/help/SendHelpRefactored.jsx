import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiMessageCircle, FiLoader, FiCheckCircle, FiClock, FiUpload, FiCamera, FiCreditCard, FiRefreshCw, FiAlertTriangle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoginRequired from '../auth/LoginRequired';
import TransactionChat from '../chat/TransactionChat';

import PaymentModal from './PaymentModal';
import PaymentDoneConfirmation from './PaymentDoneConfirmation';
import PaymentProofForm from './PaymentProofForm';
import SendHelpFlowContainer from './SendHelpFlow/SendHelpFlowContainer';
import { createSendHelpAssignment, getUserHelpStatus, listenToHelpStatus, submitPaymentProof, getReceiveEligibility } from '../../services/helpService';
import { HELP_STATUS, normalizeStatus } from '../../config/helpStatus';
import { normalizeLevel } from '../../utils/eligibilityUtils';
import CountdownTimer from '../common/CountdownTimer';
import { waitForAuthReady } from '../../services/authReady';
import { uploadImageResumable } from '../../services/storageUpload';
import { auth, db, doc, onSnapshot, getDoc } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// UI State Constants - Clear mapping of UI states to help statuses
const UI_STATES = {
  // Loading states
  INITIALIZING: 'initializing',
  WAITING_FOR_RECEIVER: 'waiting_for_receiver',

  // Active help states
  RECEIVER_ASSIGNED: 'receiver_assigned',

  // New 4-step full-page flow
  SEND_HELP_FLOW: 'send_help_flow',

  // Payment flow states (legacy modals)
  PAYMENT_METHODS_MODAL: 'payment_methods_modal',
  PAYMENT_DONE_CONFIRMATION: 'payment_done_confirmation',
  PAYMENT_PROOF_FORM: 'payment_proof_form',

  PAYMENT_SUBMITTED: 'payment_submitted',
  COMPLETED: 'completed',

  // Error states
  NO_RECEIVER_AVAILABLE: 'no_receiver_available',
  ALREADY_ACTIVATED: 'already_activated',
  ERROR: 'error'
};

// Map help statuses to UI states
const getUIState = (helpStatus, hasReceiver, isLoading, hasError, errorType, noReceiverAvailable) => {
  // Handle no receiver available as a valid business case (NOT an error)
  if (noReceiverAvailable || errorType === 'NO_ELIGIBLE_RECEIVER') {
    return UI_STATES.NO_RECEIVER_AVAILABLE;
  }

  // Error states (ONLY for real errors)
  if (hasError && errorType !== 'NO_ELIGIBLE_RECEIVER') {
    return UI_STATES.ERROR;
  }

  // Loading states
  if (isLoading) {
    return hasReceiver ? UI_STATES.WAITING_FOR_RECEIVER : UI_STATES.INITIALIZING;
  }

  // Help status based states
  if (helpStatus) {
    const status = normalizeStatus(helpStatus);
    switch (status) {
      case HELP_STATUS.ASSIGNED:
      case HELP_STATUS.PAYMENT_REQUESTED:
        return UI_STATES.RECEIVER_ASSIGNED;
      case HELP_STATUS.PAYMENT_DONE:
        return UI_STATES.PAYMENT_SUBMITTED;
      case HELP_STATUS.CONFIRMED:
      case HELP_STATUS.FORCE_CONFIRMED:
      case 'completed':
        return UI_STATES.COMPLETED;
      default:
        return UI_STATES.RECEIVER_ASSIGNED;
    }
  }

  // Handle already activated as a valid business case
  if (errorType === 'ALREADY_ACTIVATED' || helpStatus === 'completed' || helpStatus === 'confirmed') {
    return UI_STATES.ALREADY_ACTIVATED;
  }

  // Default state
  return hasReceiver ? UI_STATES.RECEIVER_ASSIGNED : UI_STATES.WAITING_FOR_RECEIVER;
};

// UI State Components
// Receiver Avatar Component with initials fallback
const ReceiverAvatar = ({ src, name, size = "w-14 h-14", textClass = "text-xl" }) => {
  const [imgError, setImgError] = useState(false);
  const nameInitial = (name || 'U').charAt(0).toUpperCase();

  return (
    <div className={`${size} rounded-full overflow-hidden shadow-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#EC4899] border-2 border-white ring-2 ring-slate-100`}>
      {!imgError && src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textClass} font-black text-white uppercase tracking-tight`}>{nameInitial}</span>
      )}
    </div>
  );
};

const InitializingState = () =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200/50">

    <div className="flex justify-center mb-6">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0">

          <FiLoader className="w-full h-full text-blue-500" />
        </motion.div>
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">Initializing...</h3>
    <p className="text-slate-600">Setting up your send help request</p>
  </motion.div>;


// 🔹 Global Receiver Eligibility Countdown (Optional UI - Step 6)
const GlobalEligibilityCountdown = ({ receiverEligibleAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!receiverEligibleAt) return;

    let eligibleAtMs = 0;
    if (typeof receiverEligibleAt.toMillis === 'function') eligibleAtMs = receiverEligibleAt.toMillis();
    else if (typeof receiverEligibleAt === 'number') eligibleAtMs = receiverEligibleAt;
    else if (receiverEligibleAt.seconds) eligibleAtMs = receiverEligibleAt.seconds * 1000;
    else if (receiverEligibleAt._seconds) eligibleAtMs = receiverEligibleAt._seconds * 1000;

    if (!eligibleAtMs) return;

    const deadlineMs = eligibleAtMs + (24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const diff = deadlineMs - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [receiverEligibleAt]);

  if (!receiverEligibleAt || !timeLeft) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 mt-4 animate-pulse">
      <FiClock className="w-4 h-4" />
      <span className="font-mono font-bold text-sm">Eligibility Expires: {timeLeft}</span>
    </div>
  );
};


const WaitingForReceiverState = ({ userProfile }) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200/50">

    <div className="relative mb-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto" />

      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center">

        <FiUser className="w-8 h-8 text-blue-500" />
      </motion.div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">Finding Receiver</h3>
    <p className="text-slate-600 mb-4">Matching you with the perfect receiver</p>

    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1, 2].map((i) =>
        <motion.div
          key={i}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
          className="w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>

    {userProfile?.isEligibleReceiver && (
      <GlobalEligibilityCountdown receiverEligibleAt={userProfile.receiverEligibleAt} />
    )}
  </motion.div>;


const NoReceiverAvailableState = ({ userProfile }) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200/50">

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">

      <FiClock className="w-8 h-8 text-amber-600" />
    </motion.div>
    <h2 className="text-xl font-bold text-slate-900 mb-2">No Receivers Available</h2>
    <p className="text-slate-600 leading-relaxed mb-6">
      We'll automatically match you when a receiver becomes available.
    </p>

    {userProfile?.isEligibleReceiver && (
      <div className="mb-6">
        <GlobalEligibilityCountdown receiverEligibleAt={userProfile.receiverEligibleAt} />
      </div>
    )}

    <div className="mb-6 text-sm text-slate-600 space-y-2 bg-slate-50 rounded-2xl p-5">
      <p>• New receivers join regularly</p>
      <p>• Automatic matching when available</p>
      <p>• No action needed from you</p>
    </div>
    <motion.button
      disabled={true}
      className="w-full py-4 px-6 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 cursor-not-allowed">

      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
        <FiLoader className="w-4 h-4" />
      </motion.div>
      Waiting for Receiver...
    </motion.button>
  </motion.div>;


const AlreadyActivatedState = () =>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-gradient-to-br from-white to-green-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-green-200/50">

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">

      <FiCheckCircle className="w-10 h-10 text-green-600" />
    </motion.div>

    <h2 className="text-2xl font-bold text-slate-900 mb-2">Congratulations 🎉</h2>
    <p className="text-slate-600 mb-6">Your account has been activated!</p>

    <div className="bg-white rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm text-left">
      <p className="text-sm text-slate-600 leading-relaxed">
        You have successfully completed your activation payment. You will now receive help from 3 users before you can upgrade to Silver level.
      </p>
    </div>

    <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
      <FiCheckCircle className="w-5 h-5" />
      <span>Activation Complete</span>
    </div>
  </motion.div>;


const ErrorState = ({ error, onRetry, isRetrying }) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-red-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-red-200/50">

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">

      <FiAlertTriangle className="w-8 h-8 text-red-600" />
    </motion.div>
    <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
    <p className="text-slate-600 leading-relaxed mb-6">
      {error || 'An unexpected error occurred. Please try again.'}
    </p>
    <motion.button
      whileHover={{ scale: isRetrying ? 1 : 1.02 }}
      whileTap={{ scale: isRetrying ? 1 : 0.98 }}
      onClick={onRetry}
      disabled={isRetrying}
      className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${isRetrying ?
        'bg-slate-100 text-slate-500 cursor-not-allowed' :
        'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'}`
      }>

      {isRetrying ?
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <FiLoader className="w-4 h-4" />
          </motion.div>
          Retrying...
        </> :

        <>
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </>
      }
    </motion.button>
  </motion.div>;




const ReceiverAssignedState = ({ receiver, helpStatus, helpData, onPaymentClick, showChat, setShowChat, transactionId, onExpire }) => {
  const status = normalizeStatus(helpStatus);
  const showPayButton = status === HELP_STATUS.ASSIGNED || status === HELP_STATUS.PAYMENT_REQUESTED;
  const isPaymentRequested = helpData?.paymentRequested === true;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] p-6 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">

      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40 blur-2xl" />

      {/* Payment Request Alert */}
      {isPaymentRequested &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4 rounded-3xl relative z-10">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-black text-orange-900 text-sm uppercase tracking-tight">Payment Requested</h4>
              <p className="text-xs text-orange-700 font-medium">Action required to proceed</p>
            </div>
          </div>
        </motion.div>
      }

      {/* 24-Hour Countdown Timer */}
      {helpData?.createdAt &&
        <div className="mb-6 relative z-10">
          <CountdownTimer
            targetDate={new Date(helpData.createdAt.toDate().getTime() + 24 * 60 * 60 * 1000)}
            label="Payment Deadline"
            onExpire={onExpire} />
        </div>
      }

      {/* Amount Card - High Contrast */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0F172A] rounded-[2rem] p-6 text-center mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.2),transparent_70%)]" />

        <p className="relative text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          Initial Activation
        </p>
        <div className="relative flex items-center justify-center gap-1">
          <span className="text-xl font-bold text-white/40 self-start mt-2">₹</span>
          <span className="text-6xl font-black text-white tracking-tighter">300</span>
        </div>
        <p className="relative text-slate-500 text-[10px] font-bold mt-2">Secure one-time payment</p>
      </motion.div>

      {/* Receiver Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 rounded-3xl p-5 mb-6 border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">

        <div className="flex items-center gap-4">
          <ReceiverAvatar src={receiver?.profileImage} name={receiver?.name} size="w-16 h-16" textClass="text-2xl" />
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight tracking-tight">
              {receiver?.name || 'Connecting...'}
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-md">
                STAR LEVEL
              </span>
              <span className="text-[10px] font-bold text-slate-400">ID: {receiver?.userId || '-'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="space-y-3 relative z-10">
        {showPayButton &&
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPaymentClick}
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${isPaymentRequested ?
              'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white animate-pulse shadow-orange-200' :
              'bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white shadow-indigo-100 hover:shadow-indigo-200'}`
            }>

            <FiCreditCard className="w-5 h-5" />
            {isPaymentRequested ? 'Complete Payment Now' : 'Send Help'}
          </motion.button>
        }

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowChat(true)}
          className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 border border-slate-200">

          <FiMessageCircle className="w-4 h-4 text-slate-400" />
          Chat with Receiver
        </motion.button>
      </div>

      {/* Chat Modal */}
      {transactionId &&
        <TransactionChat
          transactionType="sendHelp"
          transactionId={transactionId}
          otherUser={{
            name: receiver?.name,
            profileImage: receiver?.profileImage
          }}
          isOpen={showChat}
          onClose={() => setShowChat(false)} />
      }
    </motion.div>);
};

const PaymentSubmittedState = ({ receiver, helpData, showChat, setShowChat, transactionId }) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-lg p-8 max-w-md w-full text-center border border-blue-200/50">

    {/* Status Icon */}
    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <FiCheckCircle className="w-10 h-10 text-blue-600" />
    </div>

    {/* Status Header */}
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
        <FiClock className="w-4 h-4" />
        Pending Confirmation
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
      <p className="text-gray-600 font-semibold">Waiting for receiver confirmation</p>
    </div>

    {/* Payment Details */}
    {helpData?.paymentDetails &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 mb-6 text-left border border-slate-200 shadow-sm">

        <h4 className="font-bold text-slate-900 mb-3">Payment Details</h4>
        {helpData.paymentDetails.utrNumber &&
          <div className="mb-3">
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wide mb-1">UTR/Transaction ID</p>
            <p className="font-mono text-sm font-bold text-slate-800 break-all bg-slate-50 rounded-xl p-2">{helpData.paymentDetails.utrNumber}</p>
          </div>
        }
        {helpData.paymentDetails.screenshotUrl &&
          <div>
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wide mb-2">Screenshot</p>
            <img
              src={helpData.paymentDetails.screenshotUrl}
              alt="Payment proof"
              className="w-full h-32 object-cover rounded-2xl border border-slate-200 shadow-sm" />

          </div>
        }
      </motion.div>
    }

    {/* Receiver Info */}
    {receiver &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm">

        <p className="text-xs uppercase font-bold text-slate-600 tracking-wide mb-3">Receiver</p>
        <div className="flex items-center gap-3">
          <ReceiverAvatar src={receiver.profileImage} name={receiver.name} size="w-12 h-12" textClass="text-lg" />
          <div className="text-left">
            <p className="font-bold text-slate-900">{receiver.name}</p>
            <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </motion.div>
    }

    {/* Chat Button */}
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowChat(true)}
      className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 mb-4 border border-slate-200">

      <FiMessageCircle className="w-4 h-4" />
      Chat with Receiver
    </motion.button>

    {/* Info Message */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">

      <p className="text-sm text-blue-900 leading-relaxed">
        <strong>Next Steps:</strong> The receiver will verify your payment. Your account activates once confirmed.
      </p>
    </motion.div>

    {/* Chat Modal */}
    {transactionId &&
      <TransactionChat
        transactionType="sendHelp"
        transactionId={transactionId}
        otherUser={{
          name: receiver?.name,
          profileImage: receiver?.profileImage
        }}
        isOpen={showChat}
        onClose={() => setShowChat(false)} />

    }
  </motion.div>;


const CompletedState = ({ receiver, showNextHelp = false, onNextHelp }) =>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-gradient-to-br from-white to-green-50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-green-200/50">

    {/* Success Icon */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">

      <FiCheckCircle className="w-10 h-10 text-green-600" />
    </motion.div>

    {/* Status Header */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6">

      <h2 className="text-2xl font-bold text-slate-900 mb-2">Help Completed!</h2>
      <p className="text-slate-600">Your account is now fully activated</p>
    </motion.div>

    {/* Receiver Info */}
    {receiver &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm">

        <p className="text-xs uppercase font-bold text-slate-600 tracking-wide mb-3">Payment sent to</p>
        <div className="flex items-center gap-3">
          <ReceiverAvatar src={receiver.profileImage} name={receiver.name} size="w-12 h-12" textClass="text-lg" />
          <div className="text-left">
            <p className="font-bold text-slate-900">{receiver.name}</p>
            <p className="text-sm text-slate-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </motion.div>
    }

    {/* Success Message */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">

      <p className="text-sm text-green-900 leading-relaxed">
        <strong>Congratulations!</strong> Your account is now fully activated. Access all features and start receiving help.
      </p>
    </motion.div>

    {/* Next Help Button (if eligible) */}
    {showNextHelp &&
      <button
        onClick={onNextHelp}
        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">

        <FiUser className="w-5 h-5" />
        Send Next Help
      </button>
    }
  </motion.div>;


// Payment Form Component - REMOVED (replaced with PaymentProofForm, PaymentModal, PaymentDoneConfirmation)

// Main SendHelpRefactored Component
const SendHelpRefactored = () => {
  const { user: currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const userProfile = currentUser;

  // State management
  const [uiState, setUIState] = useState(UI_STATES.INITIALIZING);
  const [receiver, setReceiver] = useState(null);
  const [helpStatus, setHelpStatus] = useState(null);
  const [helpData, setHelpData] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRequestHelp, setPaymentRequestHelp] = useState(null);

  // Payment flow states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentProofForm, setShowPaymentProofForm] = useState(false);

  // 4-step flow state
  const [showSendHelpFlow, setShowSendHelpFlow] = useState(false);

  // Refs
  const initStartedRef = useRef(false);
  const unsubHelpRef = useRef(null);
  const hasTriggeredAutoBlock = useRef(false);

  // Helper function to update UI state based on current conditions
  const updateUIState = (status = helpStatus, hasRec = !!receiver, isLoading = false, hasErr = !!error, errType = errorType, noReceiverAvailable = false) => {
    const newState = getUIState(status, hasRec, isLoading, hasErr, errType, noReceiverAvailable);
    setUIState(newState);
  };

  // Attach help listener
  const attachHelpListener = (helpId) => {
    if (unsubHelpRef.current) {
      try {
        unsubHelpRef.current();
      } catch (_) { }
    }

    const unsub = listenToHelpStatus(helpId, (docData) => {
      if (!docData) return;

      console.log(String('🔥 SendHelp listener received data:') + " " + String({
        helpId,
        status: docData.status,
        paymentRequested: docData.paymentRequested,
        lastPaymentRequestAt: docData.lastPaymentRequestAt,
        fullData: docData
      }));

      const status = normalizeStatus(docData.status);
      const isFinalized = [HELP_STATUS.CONFIRMED, HELP_STATUS.FORCE_CONFIRMED, HELP_STATUS.COMPLETED].includes(status);

      // If help is finalized, do not update receiver details to prevent flash of receiver card
      if (isFinalized) {
        setHelpStatus(status);
        setHelpData(docData);
        setReceiver(null); // Explicitly clear receiver for finalized help
        updateUIState(status, false, false, false, 'ALREADY_ACTIVATED', false);
        return;
      }

      setHelpData(docData);
      setHelpStatus(docData.status);
      setTransactionId(helpId);
      setReceiver({
        id: docData.receiverUid,
        userId: docData.receiverId,
        name: docData.receiverName,
        phone: docData.receiverPhone,
        profileImage: docData.receiverProfileImage
      });

      // Show payment request popup if paymentRequested is true
      if (docData.paymentRequested === true) {
        console.log('🚨 Payment requested! Setting paymentRequestHelp...');
        console.log(String('🔍 Help data for popup:') + " " + String(docData));
        setPaymentRequestHelp(docData);

        // Play notification sound will be handled by useEffect
      } else if (docData.paymentRequested === false) {
        console.log('🔄 Payment request cleared, clearing paymentRequestHelp...');
        setPaymentRequestHelp(null);
      }

      // Update UI state based on new status
      updateUIState(docData.status, true, false, false, null, false);
    });

    unsubHelpRef.current = unsub;
  };

  // Initialize help assignment
  const initialize = async () => {
    if (initStartedRef.current || !auth.currentUser) return;

    initStartedRef.current = true;
    setUIState(UI_STATES.INITIALIZING);
    setError(null);
    setErrorType(null);

    try {
      // FETCH FRESH USER DATA - Do not rely on context or cache
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Check for existing help
      const statusResult = await getUserHelpStatus(auth.currentUser.uid);

      // HARD GUARD: If user is already activated according to document flags
      const userLevel = normalizeLevel({ level: userData?.level || userData?.levelStatus });
      if (statusResult.isAlreadyActivated || (userLevel === 'Star' && userData?.starSendHelpDone === true)) {
        console.log('[SendHelp] User already activated detected via statusResult, aborting');
        setErrorType('ALREADY_ACTIVATED');
        setReceiver(null);
        setTransactionId(null);
        setHelpData(null);
        updateUIState(null, false, false, false, 'ALREADY_ACTIVATED', false);
        return;
      }

      if (statusResult?.activeSendHelp?.id) {
        attachHelpListener(statusResult.activeSendHelp.id);
        return;
      }

      // Create new help assignment
      setUIState(UI_STATES.WAITING_FOR_RECEIVER);

      const res = await createSendHelpAssignment({ uid: auth.currentUser.uid });
      attachHelpListener(res.helpId);

    } catch (err) {
      console.error(String('Error in initialize:') + " " + String(err));

      // Check if this is a business case (no receivers available or already activated)
      if (err?.reason === 'ALREADY_ACTIVATED' || err?.message?.includes('ALREADY_ACTIVATED')) {
        setErrorType('ALREADY_ACTIVATED');
        updateUIState(null, false, false, false, 'ALREADY_ACTIVATED', false);
      } else if (err?.isBusinessCase === true ||
        err?.isNoReceiver === true ||
        err?.code === 'functions/failed-precondition' ||
        err?.message?.includes('NO_ELIGIBLE_RECEIVER') ||
        err?.message?.includes('No eligible receivers available')) {
        // This is a valid business case, not an error
        setError(null);
        setErrorType('NO_ELIGIBLE_RECEIVER');
        updateUIState(null, false, false, false, 'NO_ELIGIBLE_RECEIVER', true);
      } else {
        // This is a real error
        setError(err.message || 'Failed to initialize send help');
        setErrorType('GENERAL_ERROR');
        updateUIState(null, false, false, true, 'GENERAL_ERROR', false);
      }
    } finally {
      initStartedRef.current = false;
    }
  };

  // Backend enforcement: trigger auto-block check on expiry
  const handleAutoBlockTrigger = useCallback(async () => {
    // Blocking is now handled globally at the app level.
    // Refreshing profile to ensure the global block catches any status changes.
    console.log('[SendHelp] ⏳ Countdown expired! Refreshing profile...');
    try {
      await refreshUserProfile();
    } catch (err) {
      console.error('[SendHelp] Failed to refresh profile on expiry:', err);
    }
  }, [refreshUserProfile]);

  // Retry function
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setErrorType(null);
    initStartedRef.current = false;

    try {
      await initialize();
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle "Pay Now" button click - shows full-page 4-step flow
  const handlePayNowClick = () => {
    setShowSendHelpFlow(true);
    setUIState(UI_STATES.SEND_HELP_FLOW);
  };

  // Handle payment modal "I Have Paid" button
  const handlePaymentMethodsConfirm = () => {
    setShowPaymentModal(false);
    setShowPaymentConfirmation(true);
  };

  // Handle payment confirmation dialog "Yes, Confirm"
  const handlePaymentConfirmationConfirm = () => {
    setShowPaymentConfirmation(false);
    setShowPaymentProofForm(true);
  };

  // Handle 4-step flow completion
  const handleSendHelpFlowComplete = (finalHelpData) => {
    // Update the UI state to show completion
    setShowSendHelpFlow(false);

    // Clear receiver state immediately to prevent stale UI
    setReceiver(null);
    setTransactionId(null);
    setHelpData(null);

    setUIState(UI_STATES.COMPLETED);
    toast.success('Payment confirmed! Your account is activated!');
    // Optionally refresh or navigate
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Handle 4-step flow cancellation
  const handleSendHelpFlowCancel = () => {
    setShowSendHelpFlow(false);
    setUIState(UI_STATES.RECEIVER_ASSIGNED);
  };

  // Handle payment proof form submission
  const handlePaymentProofSubmit = async (formData) => {
    if (!transactionId || !currentUser) return;

    setIsSubmitting(true);
    try {
      // Upload screenshot
      let screenshotUrl = null;
      if (formData.screenshot) {
        const uploadRes = await uploadImageResumable(
          formData.screenshot,
          `payment-proofs/${currentUser.uid}`,
          (progress) => {

            // Could show progress here if needed
          });
        screenshotUrl = uploadRes.downloadURL;
      }

      // Submit payment proof
      await submitPaymentProof(transactionId, {
        utr: formData.utr.trim(),
        screenshotUrl,
        screenshotPath: screenshotUrl ? 'payment-proofs' : null
      });

      setShowPaymentProofForm(false);
      setPaymentRequestHelp(null); // Clear payment request popup
      toast.success('Payment proof submitted successfully!');

    } catch (error) {
      console.error(String('Error submitting payment proof:') + " " + String(error));
      toast.error(`Failed to submit payment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment request popup actions
  const handlePaymentRequestPopupClose = () => {
    setPaymentRequestHelp(null);
  };

  const handlePaymentRequestPopupPay = () => {
    setPaymentRequestHelp(null);
    handlePayNowClick();
  };

  // Sound effect when new payment request is received
  useEffect(() => {
    if (paymentRequestHelp?.id) {
      console.log(String('🔊 Playing payment request sound for helpId:') + " " + String(paymentRequestHelp.id));
      import('../../services/soundService').then(({ soundService }) => {
        soundService.playNotificationSound('payment', 'high');
      }).catch((err) => console.warn('Failed to play sound:', err));
    }
  }, [paymentRequestHelp?.id]);

  // Combined Auth and REAL-TIME User Document listener
  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup previous user listener if any
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (!user) {
        setUIState(UI_STATES.INITIALIZING);
        initStartedRef.current = false;
        return;
      }

      // Start listening to the source of truth: THE USER DOCUMENT
      unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (!snap.exists()) return;

        const userData = snap.data();

        // CRITICAL: Star level business rule - check if already activated IN REAL TIME
        const currentLevel = userData.level || userData.levelStatus;
        if (currentLevel === 'Star' && userData.starSendHelpDone === true) {
          console.log('[SendHelp] Star user REAL-TIME activated detected');

          // Force clear ALL state IMMEDIATELY - no stale data allowed
          setReceiver(null);
          setTransactionId(null);
          setHelpData(null);
          setShowSendHelpFlow(false);
          setErrorType('ALREADY_ACTIVATED');
          setUIState(UI_STATES.ALREADY_ACTIVATED);

          // Mark as initialized so no redundant API calls happen
          initStartedRef.current = true;
          return;
        }

        // Check if we need to initialize (only once per session or when state resets)
        if (!initStartedRef.current) {
          initialize();
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubHelpRef.current) {
        try {
          unsubHelpRef.current();
        } catch (_) { }
      }
    };
  }, []);

  // Authentication check
  if (!currentUser) {
    return <LoginRequired />;
  }

  // Show full-page 4-step flow when "Pay Now" is clicked
  if (showSendHelpFlow && uiState === UI_STATES.SEND_HELP_FLOW) {
    return (
      <SendHelpFlowContainer
        receiver={receiver}
        helpId={transactionId}
        sender={{
          uid: currentUser.uid,
          userId: currentUser.uid,
          fullName: currentUser.displayName || 'Unknown',
          email: currentUser.email,
          phone: currentUser.phone,
          whatsapp: currentUser.whatsapp,
          profileImage: currentUser.photoURL,
          level: currentUser.level || 1
        }}
        onFlowComplete={handleSendHelpFlowComplete}
        onFlowCancel={handleSendHelpFlowCancel} />);


  }

  // Render based on UI state - PRIORITY DRIVEN
  const renderUIState = ({
    userProfile,
    uiState,
    helpStatus,
    helpData,
    receiver,
    transactionId,
    error,
    isRetrying,
    showChat,
    setShowChat,
    handleRetry,
    handlePayNowClick,
    handleAutoBlockTrigger,
    setHelpStatus,
    setReceiver,
    setTransactionId,
    setHelpData,
    initStartedRef,
    initialize
  }) => {
    // 1. HIGHEST PRIORITY: Activation status and UI Hard Guard
    const userLevel = normalizeLevel({ level: userProfile?.level || userProfile?.levelStatus });
    const isActuallyActivated = userProfile?.isActivated === true || (userLevel === 'Star' && userProfile?.starSendHelpDone === true);

    if (uiState === UI_STATES.ALREADY_ACTIVATED ||
      isActuallyActivated ||
      helpStatus === 'completed' ||
      helpStatus === HELP_STATUS.COMPLETED ||
      helpData?.status === 'completed') {
      return <AlreadyActivatedState />;
    }

    // 2. ERROR HANDLING
    if (uiState === UI_STATES.ERROR) {
      return <ErrorState
        error={error}
        onRetry={handleRetry}
        isRetrying={isRetrying} />;
    }

    // 3. NO RECEIVERS AVAILABLE
    if (uiState === UI_STATES.NO_RECEIVER_AVAILABLE) {
      return <NoReceiverAvailableState userProfile={userProfile} />;
    }

    // 4. FLOW STATES
    switch (uiState) {
      case UI_STATES.INITIALIZING:
        return <InitializingState />;

      case UI_STATES.WAITING_FOR_RECEIVER:
        return <WaitingForReceiverState userProfile={userProfile} />;

      case UI_STATES.SEND_HELP_FLOW:
        return null; // Flow is rendered separately above

      case UI_STATES.RECEIVER_ASSIGNED: {
        const status = normalizeStatus(helpStatus);
        const isActive = [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED].includes(status);

        if (!isActive || !receiver) {
          return <InitializingState />;
        }

        return (
          <ReceiverAssignedState
            receiver={receiver}
            helpStatus={helpStatus}
            helpData={helpData}
            onPaymentClick={handlePayNowClick}
            showChat={showChat}
            setShowChat={setShowChat}
            transactionId={transactionId}
            onExpire={handleAutoBlockTrigger} />
        );
      }

      case UI_STATES.PAYMENT_SUBMITTED: {
        const status = normalizeStatus(helpStatus);
        if (status !== HELP_STATUS.PAYMENT_DONE || !receiver) {
          return <InitializingState />;
        }

        return (
          <PaymentSubmittedState
            receiver={receiver}
            helpData={helpData}
            showChat={showChat}
            setShowChat={setShowChat}
            transactionId={transactionId} />
        );
      }

      case UI_STATES.COMPLETED:
        return <CompletedState
          receiver={receiver}
          showNextHelp={userProfile?.isActivated}
          onNextHelp={() => {
            // Reset for next help
            setHelpStatus(null);
            setReceiver(null);
            setTransactionId(null);
            setHelpData(null);
            initStartedRef.current = false;
            initialize();
          }} />;

      default:
        return <InitializingState />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Send Help</h1>
          <p className="text-slate-600">Complete your payment to activate your account</p>
        </motion.div>

        {/* Main UI State */}
        <AnimatePresence mode="wait">
          <div key={uiState}>
            {renderUIState({
              userProfile,
              uiState,
              helpStatus,
              helpData,
              receiver,
              transactionId,
              error,
              isRetrying,
              showChat,
              setShowChat,
              handleRetry,
              handlePayNowClick,
              handleAutoBlockTrigger,
              setHelpStatus,
              setReceiver,
              setTransactionId,
              setHelpData,
              initStartedRef,
              initialize
            })}
          </div>
        </AnimatePresence>
      </div>

      {/* Modals - Strictly Gated by UI State */}
      {uiState !== UI_STATES.ALREADY_ACTIVATED && (
        <>
          {/* Payment Modal */}
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setShowPaymentConfirmation(false);
              setShowPaymentProofForm(false);
            }}
            receiver={receiver}
            paymentDetails={helpData?.paymentDetails}
            onProceed={handlePaymentMethodsConfirm}
            isProceedLoading={false} />

          {/* Payment Confirmation Dialog */}
          <PaymentDoneConfirmation
            isOpen={showPaymentConfirmation && !showPaymentProofForm}
            onConfirm={handlePaymentConfirmationConfirm}
            onCancel={() => setShowPaymentConfirmation(false)}
            isLoading={false}
            receiver={receiver} />

          {/* Payment Proof Form */}
          <AnimatePresence>
            {showPaymentProofForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <PaymentProofForm
                  onSubmit={handlePaymentProofSubmit}
                  onBack={() => setShowPaymentProofForm(false)}
                  isSubmitting={isSubmitting}
                  receiver={receiver}
                  paymentAmount={300} />
              </div>
            )}
          </AnimatePresence>

          {/* Payment Request Popup */}
          <PaymentRequestPopup
            isOpen={paymentRequestHelp !== null}
            onClose={handlePaymentRequestPopupClose}
            onPay={handlePaymentRequestPopupPay}
            receiver={receiver}
            helpData={paymentRequestHelp} />
        </>
      )}


    </div>);

};

// Payment Request Popup Component
const PaymentRequestPopup = ({ isOpen, onClose, onPay, receiver, helpData }) => {
  console.log(String('🎭 PaymentRequestPopup render:') + " " + String({ isOpen, receiver: receiver?.name, helpData }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
          onClick={(e) => e.stopPropagation()}>

          {/* Alert Icon */}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Payment Requested</h2>

          {/* Message */}
          <p className="text-gray-600 mb-6 text-center">
            Receiver is requesting payment. Please complete the payment.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">

              Later
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPay}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors">

              Pay Now
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

};

export default SendHelpRefactored;