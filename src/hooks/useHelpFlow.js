/**
 * HELP FLOW HOOK - UI STATE MANAGEMENT
 * Coordinates between components and helpService
 * Manages loading states, errors, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc } from '../config/firebase';
import {
  checkSenderEligibility,
  createSendHelpAssignment,
  submitPaymentProof,
  confirmPaymentReceived,
  requestPayment,
  getUserHelpStatus,
  listenToHelpStatus,
  listenToReceiveHelps,
  disputePayment
} from '../services/helpService';
import { HELP_STATUS, canSubmitPayment, canConfirmPayment } from '../config/helpStatus';
import { getAmountByLevel } from '../utils/amountUtils';
import { toast } from 'react-hot-toast';

export const useHelpFlow = () => {
  const { userProfile: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHelp, setActiveHelp] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [currentStep, setCurrentStep] = useState(3); // server assigns immediately; UI stays in waiting/payment based on status

  const isTerminalHelp = useCallback((status) => {
    return [HELP_STATUS.CONFIRMED, HELP_STATUS.FORCE_CONFIRMED, HELP_STATUS.CANCELLED, HELP_STATUS.TIMEOUT].includes(status);
  }, []);

  // Real-time listeners (need cleanup)
  const helpStatusUnsubscribeRef = useRef(null);
  const receiveHelpsUnsubscribeRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (helpStatusUnsubscribeRef.current) {
      helpStatusUnsubscribeRef.current();
      helpStatusUnsubscribeRef.current = null;
    }
    if (receiveHelpsUnsubscribeRef.current) {
      receiveHelpsUnsubscribeRef.current();
      receiveHelpsUnsubscribeRef.current = null;
    }
  }, []);

  // Initialize help flow for sender
  const initializeSendFlow = useCallback(async () => {
    if (!currentUser?.uid) return;

    // Clean up any existing listeners before setting up new ones
    cleanup();

    setLoading(true);
    setError(null);

    try {
      // Check if user already has active help
      const helpStatus = await getUserHelpStatus(currentUser.uid);

      if (helpStatus.hasActiveHelp) {
        // User has active help, show waiting state
        if (helpStatus.activeSendHelp) {
          if (isTerminalHelp(helpStatus.activeSendHelp.status)) {
            setActiveHelp(null);
            setReceiver(null);
            setCurrentStep(3);
            return;
          }

          setActiveHelp(helpStatus.activeSendHelp);
          setCurrentStep(3);

          setReceiver({
            uid: helpStatus.activeSendHelp.receiverUid,
            id: helpStatus.activeSendHelp.receiverUid,
            userId: helpStatus.activeSendHelp.receiverId,
            name: helpStatus.activeSendHelp.receiverName,
            phone: helpStatus.activeSendHelp.receiverPhone
          });

        // Set up real-time listener for status updates
        helpStatusUnsubscribeRef.current = listenToHelpStatus(
          helpStatus.activeSendHelp.id,
          (updatedHelp) => {
            try {
              if (updatedHelp) {
                if (isTerminalHelp(updatedHelp.status)) {
                  setActiveHelp(null);
                  setReceiver(null);
                  return;
                }
                setActiveHelp(updatedHelp);
                setReceiver({
                  uid: updatedHelp.receiverUid,
                  id: updatedHelp.receiverUid,
                  userId: updatedHelp.receiverId,
                  name: updatedHelp.receiverName,
                  phone: updatedHelp.receiverPhone
                });
              }
            } catch (error) {
              console.error('Error handling help status update:', error);
            }
          }
        );
        }
      } else {
        // Check sender eligibility
        const eligibility = await checkSenderEligibility(currentUser);

        if (eligibility.eligible) {
          // Start server-side assignment immediately
          const result = await createSendHelpAssignment({ uid: currentUser.uid });
          if (result?.helpId) {
            setCurrentStep(3);
            helpStatusUnsubscribeRef.current = listenToHelpStatus(result.helpId, (updatedHelp) => {
              if (updatedHelp) {
                if (isTerminalHelp(updatedHelp.status)) {
                  setActiveHelp(null);
                  setReceiver(null);
                  return;
                }
                setActiveHelp(updatedHelp);
                setReceiver({
                  uid: updatedHelp.receiverUid,
                  id: updatedHelp.receiverUid,
                  userId: updatedHelp.receiverId,
                  name: updatedHelp.receiverName,
                  phone: updatedHelp.receiverPhone
                });
              }
            });
          }
        } else {
          setError(eligibility.reason);
        }
      }
    } catch (err) {
      console.error('Error initializing send flow:', err);
      setError('Failed to initialize help flow. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const assignHelp = useCallback(async () => {
    // Deprecated in server-assigned flow
    return;
  }, []);

  // Submit payment proof
  const submitPayment = useCallback(async (paymentData) => {
    if (!activeHelp?.id) {
      setError('No active help found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitPaymentProof(activeHelp.id, paymentData);

      if (result.success) {
        toast.success('Payment proof submitted successfully! Waiting for receiver confirmation.');
        // Status will update via real-time listener
      }
    } catch (err) {
      console.error('Error submitting payment:', err);

      // Handle specific Firestore permission errors with user-friendly messages
      let userMessage = 'Failed to submit payment proof. Please try again.';
      if (err.message?.includes('permission-denied') ||
          err.message?.includes('You can only update your own') ||
          err.code === 'permission-denied') {
        userMessage = 'Unable to submit payment at this time. Please contact support if this issue persists.';
        console.error('Permission error during payment submission - check Firestore rules');
      }

      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  }, [activeHelp]);

  // Refresh help flow (for manual refresh)
  const refreshHelpFlow = useCallback(async () => {
    cleanup();
    setActiveHelp(null);
    setReceiver(null);
    setCurrentStep(1);
    setError(null);
    await initializeSendFlow();
  }, [initializeSendFlow, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Initialize on mount and when user status changes (upgrade, activation)
  useEffect(() => {
    const initFlow = async () => {
      try {
        if (currentUser?.uid) {
          await initializeSendFlow();
        }
      } catch (err) {
        console.error('Error initializing send flow:', err);
        setError('Failed to initialize help flow. Please refresh the page.');
      }
    };

    initFlow();
  }, [currentUser?.uid, currentUser?.levelStatus, currentUser?.isActivated, initializeSendFlow]);

  return {
    // State
    loading,
    error,
    activeHelp,
    receiver,
    currentStep,

    // Actions
    assignHelp,
    submitPayment,
    refreshHelpFlow,
    setCurrentStep,
    clearError: () => setError(null),

    // Computed values
    canSubmitPayment: activeHelp ? (canSubmitPayment(activeHelp.status) && !isTerminalHelp(activeHelp.status)) : false,
    canConfirmPayment: activeHelp ? (canConfirmPayment(activeHelp.status) && !isTerminalHelp(activeHelp.status)) : false,
    isActiveHelp: activeHelp ? (!isTerminalHelp(activeHelp.status) && [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE].includes(activeHelp.status)) : false,
    amount: currentUser ? getAmountByLevel(currentUser.levelStatus || 'Star') : 300
  };
};

export const useReceiveHelpFlow = () => {
  const { user: currentUser } = useAuth();
  const [receiveHelps, setReceiveHelps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState(null);

  // Real-time listener
  const unsubscribeRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Confirm payment received
  const confirmPayment = useCallback(async (helpId) => {
    setConfirmingId(helpId);
    setError(null);

    try {
      const result = await confirmPaymentReceived(helpId);

      if (result.success) {
        toast.success(`Payment confirmed! ₹${result.amount} credited to your account.`);
        // Note: User stats updates and sendHelp updates are handled by Cloud Functions
      }
    } catch (err) {
      console.error('Error confirming payment:', err);

      // Handle specific Firestore permission errors with user-friendly messages
      let userMessage = 'Failed to confirm payment. Please try again.';
      if (err.message?.includes('permission-denied') ||
          err.message?.includes('You can only update your own') ||
          err.code === 'permission-denied') {
        userMessage = 'Unable to confirm payment at this time. Please contact support if this issue persists.';
        console.error('Permission error during payment confirmation - check Firestore rules');
      }

      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setConfirmingId(null);
    }
  }, []);

  // Request payment from sender
  const requestPaymentFromSender = useCallback(async (helpId) => {
    setConfirmingId(helpId);
    setError(null);

    try {
      const result = await requestPayment(helpId);

      if (result.success) {
        toast.success('Payment request sent to sender!');
      }
    } catch (err) {
      console.error('Error requesting payment:', err);
      setError(err.message || 'Failed to request payment. Please try again.');
      toast.error('Failed to request payment. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  }, []);

  const rejectPaymentRequest = useCallback(async (helpId, reason) => {
    try {
      const result = await disputePayment(helpId, reason);
      if (result.success) {
        toast.success('Payment disputed. Support will review.');
      }
    } catch (err) {
      console.error('Error disputing payment:', err);
      toast.error('Failed to dispute payment.');
    }
  }, []);

  // Initialize receive helps listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setReceiveHelps([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    unsubscribeRef.current = listenToReceiveHelps(currentUser.uid, (helps) => {
      setReceiveHelps(helps);
      setLoading(false);
    });

    return cleanup;
  }, [currentUser?.uid, cleanup]);

  return {
    // State
    receiveHelps,
    loading,
    confirmingId,
    error,

    // Actions
    confirmPayment,
    requestPaymentFromSender,
    rejectPaymentRequest,
    clearError: () => setError(null)
  };
};
