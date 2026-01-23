import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiMessageCircle, FiLoader, FiCheckCircle, FiClock, FiUpload, FiCamera, FiCreditCard, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoginRequired from '../auth/LoginRequired';
import TransactionChat from '../chat/TransactionChat';
import PaymentJourneyMotion from '../common/PaymentJourneyMotion';
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
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
  >
    <FiLoader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">Initializing...</h3>
    <p className="text-gray-500">Setting up your send help request</p>
  </motion.div>
);

const WaitingForReceiverState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
  >
    <div className="relative mb-6">
      <FiLoader className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <FiUser className="w-8 h-8 text-indigo-400" />
      </div>
    </div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">Matching you with an eligible receiver</h3>
    <p className="text-gray-500 mb-4">Please wait while we find the perfect match for you</p>
    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </motion.div>
);

const NoReceiverAvailableState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-blue-200"
  >
    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
      <FiClock className="w-8 h-8 text-blue-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">No Receivers Available Right Now</h2>
    <p className="text-gray-600 leading-relaxed mb-6">
      We will automatically match you when a receiver becomes available.
    </p>
    <div className="mb-6 text-sm text-gray-500 space-y-1">
      <p>• New receivers become available regularly</p>
      <p>• You'll be matched automatically</p>
      <p>• No action needed from you</p>
    </div>
    <button
      disabled={true}
      className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-gray-400 text-gray-200 cursor-not-allowed"
    >
      <FiLoader className="w-4 h-4 animate-spin" />
      Waiting for Receiver...
    </button>
  </motion.div>
);

const ErrorState = ({ error, onRetry, isRetrying }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-red-200"
  >
    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
      <FiAlertTriangle className="w-8 h-8 text-red-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
    <p className="text-gray-600 leading-relaxed mb-6">
      {error || 'An unexpected error occurred. Please try again.'}
    </p>
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
        isRetrying
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
      }`}
    >
      {isRetrying ? (
        <>
          <FiLoader className="w-4 h-4 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </>
      )}
    </button>
  </motion.div>
);

const ReceiverAssignedState = ({ receiver, helpStatus, onMakePayment, showChat, setShowChat, transactionId }) => {
  const status = normalizeStatus(helpStatus);
  const canMakePayment = status === HELP_STATUS.PAYMENT_REQUESTED;
  const isPending = status === HELP_STATUS.ASSIGNED;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-auto"
    >
      {/* Status Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
          isPending 
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isPending ? (
            <>
              <FiClock className="w-4 h-4" />
              Payment Pending
            </>
          ) : (
            <>
              <FiCreditCard className="w-4 h-4" />
              Ready for Payment
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Receiver Assigned</h2>
        <p className="text-gray-600">Complete your payment to activate your account</p>
      </div>

      {/* Receiver Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 p-1">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img
                src={receiver.profileImage || '/images/default-avatar.png'}
                alt={receiver.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/images/default-avatar.png';
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{receiver.name}</h3>
            <p className="text-sm text-gray-600">ID: {receiver.userId}</p>
            {receiver.phone && (
              <p className="text-sm text-gray-600">📞 {receiver.phone}</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Amount to Send</p>
            <p className="text-3xl font-bold text-indigo-600">₹300</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {canMakePayment && (
          <button
            onClick={onMakePayment}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <FiCreditCard className="w-5 h-5" />
            Make Payment
          </button>
        )}

        {isPending && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">Waiting for receiver to request payment</p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiMessageCircle className="w-4 h-4" />
          Chat with Receiver
        </button>
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
        Payment Submitted
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted Successfully</h2>
      <p className="text-gray-600">Waiting for receiver confirmation</p>
    </div>

    {/* Payment Details */}
    {helpData?.payment && (
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
        <h4 className="font-semibold text-gray-800 mb-3">Payment Details</h4>
        {helpData.payment.utr && (
          <div className="mb-2">
            <p className="text-sm text-gray-600">UTR/Transaction ID</p>
            <p className="font-mono text-sm font-semibold text-gray-800">{helpData.payment.utr}</p>
          </div>
        )}
        {helpData.payment.method && (
          <div className="mb-2">
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="text-sm font-semibold text-gray-800">{helpData.payment.method}</p>
          </div>
        )}
        {helpData.payment.screenshotUrl && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Screenshot</p>
            <img 
              src={helpData.payment.screenshotUrl} 
              alt="Payment proof" 
              className="w-full h-32 object-cover rounded-lg border"
            />
          </div>
        )}
      </div>
    )}

    {/* Receiver Info */}
    {receiver && (
      <div className="bg-indigo-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-600 mb-2">Receiver</p>
        <div className="flex items-center justify-center gap-3">
          <img
            src={receiver.profileImage || '/images/default-avatar.png'}
            alt={receiver.name}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.target.src = '/images/default-avatar.png';
            }}
          />
          <div className="text-left">
            <p className="font-semibold text-gray-800">{receiver.name}</p>
            <p className="text-sm text-gray-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </div>
    )}

    {/* Chat Button */}
    <button
      onClick={() => setShowChat(true)}
      className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 mb-4"
    >
      <FiMessageCircle className="w-4 h-4" />
      Chat with Receiver
    </button>

    {/* Info Message */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">
        <strong>Next Steps:</strong> The receiver will verify your payment and confirm it. 
        Your account will be activated once confirmed.
      </p>
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

const CompletedState = ({ receiver, showNextHelp = false, onNextHelp }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
  >
    {/* Success Icon */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
    >
      <FiCheckCircle className="w-10 h-10 text-green-600" />
    </motion.div>

    {/* Status Header */}
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-green-100 text-green-800">
        <FiCheckCircle className="w-4 h-4" />
        Completed
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 Send Help Completed!</h2>
      <p className="text-gray-600">Your payment has been confirmed and your account is now active</p>
    </div>

    {/* Receiver Info */}
    {receiver && (
      <div className="bg-green-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-600 mb-2">Payment sent to</p>
        <div className="flex items-center justify-center gap-3">
          <img
            src={receiver.profileImage || '/images/default-avatar.png'}
            alt={receiver.name}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              e.target.src = '/images/default-avatar.png';
            }}
          />
          <div className="text-left">
            <p className="font-semibold text-gray-800">{receiver.name}</p>
            <p className="text-sm text-gray-600">ID: {receiver.userId}</p>
          </div>
        </div>
      </div>
    )}

    {/* Success Message */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-green-800">
        <strong>Congratulations!</strong> Your account is now fully activated. 
        You can access all platform features and start receiving help.
      </p>
    </div>

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

// Payment Form Component
const PaymentForm = ({ receiver, onSubmit, onBack, isSubmitting }) => {
  const { user } = useAuth();
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('File size should be less than 3MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToFirebase = async (file) => {
    return uploadImageResumable(
      file,
      `payment-proofs/${user.uid}`,
      (p) => setUploadProgress(p)
    );
  };

  const handleSubmit = async () => {
    if (!utr.trim()) {
      toast.error('Please enter UTR/Transaction ID');
      return;
    }
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadRes = await uploadImageToFirebase(screenshot);
      setIsUploading(false);
      
      await onSubmit({
        utr: utr.trim(),
        screenshotUrl: uploadRes.downloadURL,
        screenshotPath: uploadRes.screenshotPath,
        screenshotContentType: uploadRes.screenshotContentType,
        screenshotSize: uploadRes.screenshotSize
      });
      
      toast.success('Payment proof uploaded successfully!');
    } catch (error) {
      console.error('Error submitting payment:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(`Failed to submit payment: ${error.message}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiUpload className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit Payment Proof</h2>
        <p className="text-gray-600">Upload your payment details to complete the process</p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* UTR Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            UTR / Transaction ID *
          </label>
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Enter 12-digit UTR or Transaction ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            maxLength={50}
          />
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Screenshot *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200">
            {screenshotPreview ? (
              <div className="space-y-4">
                <img 
                  src={screenshotPreview} 
                  alt="Payment screenshot" 
                  className="max-h-40 mx-auto rounded-lg shadow-md"
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview(null);
                    }}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                  <label
                    htmlFor="screenshot-upload"
                    className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    Change
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FiCamera className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-600 font-medium mb-1">Upload payment screenshot</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 3MB</p>
                </div>
                <label
                  htmlFor="screenshot-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 font-medium"
                >
                  <FiUpload className="w-4 h-4" />
                  Choose File
                </label>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="screenshot-upload"
            />
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          disabled={isSubmitting || isUploading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading || !utr.trim() || !screenshot}
          className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          {isUploading ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : isSubmitting ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Payment'
          )}
        </button>
      </div>
    </motion.div>
  );
};

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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Payment submission handler
  const handlePaymentSubmit = async (paymentData) => {
    if (!transactionId || !currentUser) return;

    setIsSubmitting(true);
    try {
      await submitPaymentProof(transactionId, {
        utr: paymentData.utr,
        method: paymentData.method || null,
        screenshotUrl: paymentData.screenshotUrl,
        screenshotPath: paymentData.screenshotPath,
        screenshotContentType: paymentData.screenshotContentType,
        screenshotSize: paymentData.screenshotSize
      });

      setShowPaymentForm(false);
      toast.success('Payment submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        
      case UI_STATES.RECEIVER_ASSIGNED:
        return (
          <ReceiverAssignedState
            receiver={receiver}
            helpStatus={helpStatus}
            onMakePayment={() => setShowPaymentForm(true)}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Send Help</h1>
          <p className="text-gray-500 mt-1">Complete your payment to activate your account</p>
        </div>

        {/* Main UI State */}
        <AnimatePresence mode="wait">
          {showPaymentForm ? (
            <PaymentForm
              key="payment-form"
              receiver={receiver}
              onSubmit={handlePaymentSubmit}
              onBack={() => setShowPaymentForm(false)}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div key={uiState}>
              {renderUIState()}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Journey Motion Icon */}
      <PaymentJourneyMotion mode="icon" user={currentUser} />
    </div>
  );
};

export default SendHelpRefactored;