import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { uploadImageResumable } from '../../../services/storageUpload';
import { updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import ReceiverDetailsPage from './ReceiverDetailsPage';
import PaymentDetailsPage from './PaymentDetailsPage';
import SubmitProofPage from './SubmitProofPage';
import WaitingForConfirmationPage from './WaitingForConfirmationPage';
import TransactionChat from '../../chat/TransactionChat';

const FLOW_STEPS = {
  RECEIVER_DETAILS: 'receiver_details',
  PAYMENT_DETAILS: 'payment_details',
  SUBMIT_PROOF: 'submit_proof',
  WAITING_CONFIRMATION: 'waiting_confirmation'
};

/**
 * SendHelpFlowContainer - Full-page 4-step Send Help flow
 * 
 * Rules:
 * - No Firestore write before Step 3
 * - Receiver data comes from already fetched receiver profile
 * - Keep existing MLM flow unchanged
 * - Keep amount logic unchanged
 * 
 * On Step 3 submit:
 * - Create sendHelp document with status = "Pending"
 * - Create receiveHelp document with status = "Pending", confirmedByReceiver = false
 * - Upload payment screenshot to Firebase Storage
 */
const SendHelpFlowContainer = ({ 
  receiver, 
  helpId,
  sender,
  onFlowComplete, 
  onFlowCancel 
}) => {
  const { user: currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(FLOW_STEPS.RECEIVER_DETAILS);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdHelpData, setCreatedHelpData] = useState(null);

  if (!receiver || !currentUser) {
    return null;
  }

  const handleReceiverDetailsProceed = () => {
    setCurrentStep(FLOW_STEPS.PAYMENT_DETAILS);
  };

  const handlePaymentDetailsConfirm = () => {
    setCurrentStep(FLOW_STEPS.SUBMIT_PROOF);
  };

  const handleSubmitProofSubmit = async (formData) => {
    if (isSubmitting || !helpId) return;
    setIsSubmitting(true);

    try {
      // Step 1: Upload screenshot to Firebase Storage
      let screenshotUrl = null;
      let screenshotPath = null;
      if (formData.screenshot) {
        const uploadRes = await uploadImageResumable(
          formData.screenshot,
          `payment-proofs/${currentUser.uid}`,
          (progress) => {
            // Could show progress here if needed
          }
        );
        screenshotUrl = uploadRes.downloadURL;
        screenshotPath = `payment-proofs/${currentUser.uid}`;
      }

      // Step 2: Update existing sendHelp document with payment proof
      const timestamp = Date.now();
      const paymentUpdateData = {
        status: 'payment_done',
        'payment.method': 'upi',
        'payment.utr': formData.utr,
        'payment.screenshotUrl': screenshotUrl || '',
        'payment.screenshotPath': screenshotPath || '',
        'payment.paymentDoneAt': new Date().toISOString(),
        'payment.paymentDoneAtMs': timestamp,
        updatedAt: serverTimestamp()
      };

      // Update both sendHelp and receiveHelp documents with payment proof
      await Promise.all([
        updateDoc(doc(db, 'sendHelp', helpId), paymentUpdateData),
        updateDoc(doc(db, 'receiveHelp', helpId), paymentUpdateData)
      ]);

      toast.success('Payment proof submitted! Waiting for receiver confirmation...');
      
      // Store help data for Step 4
      setCreatedHelpData({
        id: helpId,
        status: 'payment_done',
        payment: {
          method: 'upi',
          utr: formData.utr,
          screenshotUrl: screenshotUrl || '',
          screenshotPath: screenshotPath || '',
          paymentDoneAt: new Date().toISOString(),
          paymentDoneAtMs: timestamp
        }
      });

      // Move to waiting confirmation step
      setCurrentStep(FLOW_STEPS.WAITING_CONFIRMATION);
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error(error.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlowConfirmed = (helpData) => {
    toast.success('Payment confirmed! Your account is now activated!');
    // Call the completion callback
    if (onFlowComplete) {
      onFlowComplete(helpData);
    }
  };

  const handleBackClick = () => {
    switch (currentStep) {
      case FLOW_STEPS.PAYMENT_DETAILS:
        setCurrentStep(FLOW_STEPS.RECEIVER_DETAILS);
        break;
      case FLOW_STEPS.SUBMIT_PROOF:
        setCurrentStep(FLOW_STEPS.PAYMENT_DETAILS);
        break;
      case FLOW_STEPS.WAITING_CONFIRMATION:
        // Don't allow going back from waiting confirmation
        break;
      default:
        // First step - close flow
        if (onFlowCancel) {
          onFlowCancel();
        }
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {currentStep === FLOW_STEPS.RECEIVER_DETAILS && (
          <ReceiverDetailsPage
            key="receiver-details"
            receiver={receiver}
            amount={300}
            onProceed={handleReceiverDetailsProceed}
            onBack={handleBackClick}
            isProceding={isSubmitting}
          />
        )}

        {currentStep === FLOW_STEPS.PAYMENT_DETAILS && (
          <PaymentDetailsPage
            key="payment-details"
            receiver={receiver}
            amount={300}
            onConfirm={handlePaymentDetailsConfirm}
            onBack={handleBackClick}
            isConfirming={isSubmitting}
          />
        )}

        {currentStep === FLOW_STEPS.SUBMIT_PROOF && (
          <SubmitProofPage
            key="submit-proof"
            receiver={receiver}
            amount={300}
            onSubmit={handleSubmitProofSubmit}
            onBack={handleBackClick}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === FLOW_STEPS.WAITING_CONFIRMATION && (
          <WaitingForConfirmationPage
            key="waiting-confirmation"
            transactionId={createdHelpData?.id}
            receiver={receiver}
            helpData={createdHelpData}
            onConfirmed={handleFlowConfirmed}
            setShowChat={setShowChat}
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      {createdHelpData?.id && (
        <TransactionChat
          transactionType="sendHelp"
          transactionId={createdHelpData.id}
          otherUser={{
            name: receiver.fullName || receiver.name,
            profileImage: receiver.profileImage
          }}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default SendHelpFlowContainer;
