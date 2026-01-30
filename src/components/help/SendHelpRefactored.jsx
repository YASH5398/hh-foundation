import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiMessageCircle, FiLoader, FiCheckCircle, FiClock, FiUpload, FiCamera, FiCreditCard, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoginRequired from '../auth/LoginRequired';
import TransactionChat from '../chat/TransactionChat';

import PaymentModal from './PaymentModal';
import PaymentDoneConfirmation from './PaymentDoneConfirmation';
import PaymentProofForm from './PaymentProofForm';
import SendHelpFlowContainer from './SendHelpFlow/SendHelpFlowContainer';
import { createSendHelpAssignment, getUserHelpStatus, listenToHelpStatus, submitPaymentProof } from '../../services/helpService';
import { HELP_STATUS, normalizeStatus } from '../../config/helpStatus';
import { waitForAuthReady } from '../../services/authReady';
import { uploadImageResumable } from '../../services/storageUpload';
import { auth } from '../../config/firebase';
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
        return UI_STATES.COMPLETED;
      default:
        return UI_STATES.RECEIVER_ASSIGNED;
    }
  }
  
  // Default state
  return hasReceiver ? UI_STATES.RECEIVER_ASSIGNED : UI_STATES.WAITING_FOR_RECEIVER;
};

// UI State Components
const InitializingState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm"
  >
    <div className="flex justify-center mb-6">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <FiLoader className="w-full h-full text-slate-400" />
        </motion.div>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">Initializing...</h3>
    <p className="text-slate-600 text-sm">Setting up your send help request</p>
  </motion.div>
);

const WaitingForReceiverState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm"
  >
    <div className="relative mb-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-slate-400 mx-auto"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <FiUser className="w-8 h-8 text-slate-500" />
      </motion.div>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">Matching you with a receiver</h3>
    <p className="text-slate-600 text-sm mb-6">Please wait while we find the perfect match for you</p>
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
          className="w-2 h-2 bg-slate-400 rounded-full"
        />
      ))}
    </div>
  </motion.div>
);

const NoReceiverAvailableState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
      className="w-16 h-16 mx-auto mb-6 rounded-lg bg-slate-100 flex items-center justify-center"
    >
      <FiClock className="w-8 h-8 text-slate-500" />
    </motion.div>
    <h2 className="text-lg font-bold text-slate-900 mb-2">No Receivers Available Right Now</h2>
    <p className="text-slate-600 text-sm leading-relaxed mb-6">
      We will automatically match you when a receiver becomes available.
    </p>
    <div className="mb-6 text-xs text-slate-600 space-y-1">
      <p>• New receivers become available regularly</p>
      <p>• You'll be matched automatically</p>
      <p>• No action needed from you</p>
    </div>
    <motion.button
      disabled={true}
      className="w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 cursor-not-allowed"
    >
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
        <FiLoader className="w-4 h-4" />
      </motion.div>
      Waiting for Receiver...
    </motion.button>
  </motion.div>
);

const ErrorState = ({ error, onRetry, isRetrying }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
      className="w-16 h-16 mx-auto mb-6 rounded-lg bg-red-100 flex items-center justify-center"
    >
      <FiAlertTriangle className="w-8 h-8 text-red-600" />
    </motion.div>
    <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
    <p className="text-slate-600 text-sm leading-relaxed mb-6">
      {error || 'An unexpected error occurred. Please try again.'}
    </p>
    <motion.button
      whileHover={{ scale: isRetrying ? 1 : 1.02 }}
      whileTap={{ scale: isRetrying ? 1 : 0.98 }}
      onClick={onRetry}
      disabled={isRetrying}
      className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
        isRetrying
          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {isRetrying ? (
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <FiLoader className="w-4 h-4" />
          </motion.div>
          Retrying...
        </>
      ) : (
        <>
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </>
      )}
    </motion.button>
  </motion.div>
);

const ReceiverAssignedState = ({ receiver, helpStatus, helpData, onPaymentClick, showChat, setShowChat, transactionId }) => {
  const status = normalizeStatus(helpStatus);
  const showPayButton = status === HELP_STATUS.ASSIGNED || status === HELP_STATUS.PAYMENT_REQUESTED;
  const isPaymentRequested = helpData?.paymentRequested === true;

  console.log('🎯 ReceiverAssignedState render:', {
    helpStatus,
    status,
    helpData,
    paymentRequested: helpData?.paymentRequested,
    isPaymentRequested,
    showPayButton,
    lastPaymentRequestAt: helpData?.lastPaymentRequestAt
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg p-8 max-w-md w-full shadow-sm"
    >
      {/* Payment Request Alert */}
      {isPaymentRequested && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <h4 className="font-semibold text-orange-800">Payment Requested</h4>
              <p className="text-sm text-orange-700">The receiver has requested you to complete the payment.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Receiver Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="w-16 h-16 rounded-lg overflow-hidden shadow-sm flex items-center justify-center flex-shrink-0 bg-slate-200"
          >
            <img
              src={receiver?.profileImage || '/images/default-avatar.png'}
              alt={receiver?.name || 'Receiver'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{receiver?.name || 'Loading...'}</h3>
            <p className="text-xs text-slate-600 font-mono">ID: {receiver?.userId || '-'}</p>
            {receiver?.phone && (
              <p className="text-xs text-slate-600 mt-1">📞 {receiver.phone}</p>
            )}
          </div>
        </div>

        {/* Amount Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-50 rounded-lg p-4 text-center mb-6 border border-slate-200"
        >
          <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-1">Amount to Send</p>
          <p className="text-4xl font-bold text-slate-900">₹300</p>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {showPayButton && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPaymentClick}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isPaymentRequested 
                ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <FiCreditCard className="w-4 h-4" />
            {isPaymentRequested ? 'Complete Payment Now' : 'Pay Now'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowChat(true)}
          className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FiMessageCircle className="w-4 h-4" />
          Chat with Receiver
        </motion.button>
      </div>

      {/* Chat Modal */}
      {transactionId && (
        <TransactionChat
          transactionType="sendHelp"
          transactionId={transactionId}
          otherUser={{
            name: receiver?.name,
            profileImage: receiver?.profileImage
          }}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </motion.div>
  );
};

const PaymentSubmittedState = ({ receiver, helpData, showChat, setShowChat, transactionId }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
  >
    {/* Status Icon */}
    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <FiCheckCircle className="w-10 h-10 text-blue-600" />
    </div>

    {/* Status Header */}
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-blue-100 text-blue-800">
        <FiClock className="w-4 h-4" />
        Pending Receiver Confirmation
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
      <p className="text-gray-600 font-semibold text-green-700">Payment submitted successfully. Waiting for receiver confirmation.</p>
    </div>

    {/* Payment Details */}
    {helpData?.paymentDetails && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 rounded-lg p-4 mb-6 text-left border border-slate-200"
      >
        <h4 className="font-semibold text-slate-900 text-sm mb-3">Payment Details</h4>
        {helpData.paymentDetails.utrNumber && (
          <div className="mb-3">
            <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-1">UTR/Transaction ID</p>
            <p className="font-mono text-xs font-semibold text-slate-800 break-all">{helpData.paymentDetails.utrNumber}</p>
          </div>
        )}
        {helpData.paymentDetails.screenshotUrl && (
          <div>
            <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-2">Screenshot</p>
            <img 
              src={helpData.paymentDetails.screenshotUrl} 
              alt="Payment proof" 
              className="w-full h-32 object-cover rounded-lg border border-slate-200"
            />
          </div>
        )}
      </motion.div>
    )}

    {/* Receiver Info */}
    {receiver && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200"
      >
        <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-3">Receiver</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-200">
            <img
              src={receiver.profileImage || '/images/default-avatar.png'}
              alt={receiver.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 text-sm">{receiver.name}</p>
            <p className="text-xs text-slate-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </motion.div>
    )}

    {/* Chat Button */}
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowChat(true)}
      className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 mb-4"
    >
      <FiMessageCircle className="w-4 h-4" />
      Chat with Receiver
    </motion.button>

    {/* Info Message */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
    >
      <p className="text-xs text-blue-900 leading-relaxed">
        <strong>Next Steps:</strong> The receiver will verify your payment. Your account activates once confirmed.
      </p>
    </motion.div>

    {/* Chat Modal */}
    {transactionId && (
      <TransactionChat
        transactionType="sendHelp"
        transactionId={transactionId}
        otherUser={{
          name: receiver?.name,
          profileImage: receiver?.profileImage
        }}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    )}
  </motion.div>
);

const CompletedState = ({ receiver, showNextHelp = false, onNextHelp }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-sm"
  >
    {/* Success Icon */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-6"
    >
      <FiCheckCircle className="w-8 h-8 text-green-600" />
    </motion.div>

    {/* Status Header */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6"
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Help Completed!</h2>
      <p className="text-slate-600 text-sm">Your account is now fully activated</p>
    </motion.div>

    {/* Receiver Info */}
    {receiver && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200"
      >
        <p className="text-xs uppercase font-semibold text-slate-600 tracking-wide mb-3">Payment sent to</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-200">
            <img
              src={receiver.profileImage || '/images/default-avatar.png'}
              alt={receiver.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 text-sm">{receiver.name}</p>
            <p className="text-xs text-slate-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </motion.div>
    )}

    {/* Success Message */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
    >
      <p className="text-xs text-green-900 leading-relaxed">
        <strong>Congratulations!</strong> Your account is now fully activated. Access all features and start receiving help.
      </p>
    </motion.div>

    {/* Next Help Button (if eligible) */}
    {showNextHelp && (
      <button
        onClick={onNextHelp}
        className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        <FiUser className="w-5 h-5" />
        Send Next Help
      </button>
    )}
  </motion.div>
);

// Payment Form Component - REMOVED (replaced with PaymentProofForm, PaymentModal, PaymentDoneConfirmation)

// Main SendHelpRefactored Component
const SendHelpRefactored = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  
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
      } catch (_) {}
    }
    
    const unsub = listenToHelpStatus(helpId, (docData) => {
      if (!docData) return;
      
      console.log('🔥 SendHelp listener received data:', {
        helpId,
        status: docData.status,
        paymentRequested: docData.paymentRequested,
        lastPaymentRequestAt: docData.lastPaymentRequestAt,
        fullData: docData
      });
      
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
        console.log('🔍 Help data for popup:', docData);
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
      // Check for existing help
      const status = await getUserHelpStatus(auth.currentUser.uid);
      if (status?.activeSendHelp?.id) {
        attachHelpListener(status.activeSendHelp.id);
        return;
      }

      // Create new help assignment
      setUIState(UI_STATES.WAITING_FOR_RECEIVER);
      
      const res = await createSendHelpAssignment({ uid: auth.currentUser.uid });
      attachHelpListener(res.helpId);
      
    } catch (err) {
      console.error('Error in initialize:', err);
      
      // Check if this is a business case (no receivers available)
      if (err?.isBusinessCase === true || 
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
          }
        );
        screenshotUrl = uploadRes.downloadURL;
      }

      // Submit payment proof
      await submitPaymentProof(transactionId, {
        utr: formData.utr.trim(),
        screenshotUrl,
        screenshotPath: screenshotUrl ? 'payment-proofs' : null,
      });

      setShowPaymentProofForm(false);
      setPaymentRequestHelp(null); // Clear payment request popup
      toast.success('Payment proof submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting payment proof:', error);
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
      console.log('🔊 Playing payment request sound for helpId:', paymentRequestHelp.id);
      import('../../services/soundService').then(({ soundService }) => {
        soundService.playNotificationSound('payment', 'high');
      }).catch(err => console.warn('Failed to play sound:', err));
    }
  }, [paymentRequestHelp?.id]);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUIState(UI_STATES.INITIALIZING);
        initStartedRef.current = false;
        return;
      }
      initialize();
    });

    return unsubscribeAuth;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubHelpRef.current) {
        try {
          unsubHelpRef.current();
        } catch (_) {}
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
        onFlowCancel={handleSendHelpFlowCancel}
      />
    );
  }

  // Render based on UI state
  const renderUIState = () => {
    switch (uiState) {
      case UI_STATES.INITIALIZING:
        return <InitializingState />;
        
      case UI_STATES.WAITING_FOR_RECEIVER:
        return <WaitingForReceiverState />;
        
      case UI_STATES.NO_RECEIVER_AVAILABLE:
        return <NoReceiverAvailableState />;
        
      case UI_STATES.ERROR:
        return <ErrorState error={error} onRetry={handleRetry} isRetrying={isRetrying} />;
      
      case UI_STATES.SEND_HELP_FLOW:
        return null; // Flow is rendered separately above
        
      case UI_STATES.RECEIVER_ASSIGNED:
        return (
          <ReceiverAssignedState
            receiver={receiver}
            helpStatus={helpStatus}
            helpData={helpData}
            onPaymentClick={handlePayNowClick}
            showChat={showChat}
            setShowChat={setShowChat}
            transactionId={transactionId}
          />
        );
        
      case UI_STATES.PAYMENT_SUBMITTED:
        return (
          <PaymentSubmittedState
            receiver={receiver}
            helpData={helpData}
            showChat={showChat}
            setShowChat={setShowChat}
            transactionId={transactionId}
          />
        );
        
      case UI_STATES.COMPLETED:
        return (
          <CompletedState
            receiver={receiver}
            showNextHelp={currentUser?.isActivated}
            onNextHelp={() => {
              // Reset for next help
              setHelpStatus(null);
              setReceiver(null);
              setTransactionId(null);
              setHelpData(null);
              initStartedRef.current = false;
              initialize();
            }}
          />
        );
        
      default:
        return <InitializingState />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Send Help</h1>
          <p className="text-slate-600 text-sm">Complete your payment to activate your account</p>
        </motion.div>

        {/* Main UI State */}
        <AnimatePresence mode="wait">
          <div key={uiState}>
            {renderUIState()}
          </div>
        </AnimatePresence>
      </div>

      {/* Payment Modal - Show receiver's payment methods */}
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
        isProceedLoading={false}
      />

      {/* Payment Confirmation Dialog - Ask "Are you sure?" */}
      <PaymentDoneConfirmation
        isOpen={showPaymentConfirmation && !showPaymentProofForm}
        onConfirm={handlePaymentConfirmationConfirm}
        onCancel={() => setShowPaymentConfirmation(false)}
        isLoading={false}
        receiver={receiver}
      />

      {/* Payment Proof Form - Upload screenshot and UTR */}
      <AnimatePresence>
        {showPaymentProofForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <PaymentProofForm
              onSubmit={handlePaymentProofSubmit}
              onBack={() => setShowPaymentProofForm(false)}
              isSubmitting={isSubmitting}
              receiver={receiver}
              paymentAmount={300}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Payment Request Popup */}
      <PaymentRequestPopup
        isOpen={paymentRequestHelp !== null}
        onClose={handlePaymentRequestPopupClose}
        onPay={handlePaymentRequestPopupPay}
        receiver={receiver}
        helpData={paymentRequestHelp}
      />

    </div>
  );
};

// Payment Request Popup Component
const PaymentRequestPopup = ({ isOpen, onClose, onPay, receiver, helpData }) => {
  console.log('🎭 PaymentRequestPopup render:', { isOpen, receiver: receiver?.name, helpData });
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
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
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Later
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPay}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Pay Now
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SendHelpRefactored;