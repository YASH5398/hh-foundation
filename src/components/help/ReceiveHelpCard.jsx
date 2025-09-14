import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock } from "lucide-react";
import { Dialog } from '@headlessui/react';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, getDocs, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "../../config/firebase";
import { toast } from "react-hot-toast";

export default function ReceiveHelpCard({ entry, onConfirm, confirming, index }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [timeUntilNextRequest, setTimeUntilNextRequest] = useState(null);
  const [canRequestPayment, setCanRequestPayment] = useState(true);
  const [lastReminderTime, setLastReminderTime] = useState(null);

  // Check cooldown based on latest reminder document
  useEffect(() => {
    if (!entry) return;
    
    const checkReminderCooldown = async () => {
      try {
        // Query the latest reminder document
        const remindersRef = collection(db, 'sendHelp', entry.id, 'reminders');
        const q = query(remindersRef, orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setCanRequestPayment(true);
          setTimeUntilNextRequest(null);
          setLastReminderTime(null);
          return;
        }
        
        const lastReminder = snapshot.docs[0].data();
        const lastReminderCreatedAt = lastReminder.createdAt;
        
        if (!lastReminderCreatedAt) {
          setCanRequestPayment(true);
          setTimeUntilNextRequest(null);
          setLastReminderTime(null);
          return;
        }
        
        const now = new Date();
        const lastReminderDate = lastReminderCreatedAt.toDate ? lastReminderCreatedAt.toDate() : new Date(lastReminderCreatedAt);
        const timeDiff = now - lastReminderDate;
        const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        
        setLastReminderTime(lastReminderDate);
        
        if (timeDiff >= threeHours) {
          setCanRequestPayment(true);
          setTimeUntilNextRequest(null);
        } else {
          setCanRequestPayment(false);
          const remainingTime = threeHours - timeDiff;
          setTimeUntilNextRequest(remainingTime);
        }
      } catch (error) {
        console.error('Error checking reminder cooldown:', error);
        // On error, allow request
        setCanRequestPayment(true);
        setTimeUntilNextRequest(null);
      }
    };
    
    checkReminderCooldown();
    
    // Update countdown every second
    const interval = setInterval(() => {
      if (lastReminderTime && !canRequestPayment) {
        const now = new Date();
        const timeDiff = now - lastReminderTime;
        const threeHours = 3 * 60 * 60 * 1000;
        
        if (timeDiff >= threeHours) {
          setCanRequestPayment(true);
          setTimeUntilNextRequest(null);
        } else {
          const remainingTime = threeHours - timeDiff;
          setTimeUntilNextRequest(remainingTime);
        }
      }
    }, 1000); // Update every second for smooth countdown
    
    return () => clearInterval(interval);
  }, [entry, lastReminderTime, canRequestPayment]);

  if (!entry) return null;

  const sender = entry.sender || {};
  const { amount, paymentDetails = {}, proofUrl, utrNumber, confirmedByReceiver, status } = entry;
  
  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const utrFromDetails = paymentDetails?.utrNumber || utrNumber;
  const screenshotFromDetails = paymentDetails?.screenshotUrl || proofUrl;
  const hasProofSubmitted = utrFromDetails || screenshotFromDetails;
  const isPending = !confirmedByReceiver && hasProofSubmitted;

  const handleConfirmPayment = (action) => {
    if (typeof onConfirm === 'function') {
      if (action === 'YES') {
        onConfirm(entry.id, 'confirmed');
      } else if (action === 'NO') {
        onConfirm(entry.id, 'rejected');
      }
    }
    setShowConfirmModal(false);
    setConfirmationInput('');
  };

  const handleViewProof = () => {
    if (screenshotFromDetails && screenshotFromDetails !== 'https://example.com/pay.jpg') {
      window.open(screenshotFromDetails, '_blank');
    }
  };

  const handleConfirmSubmit = () => {
    const input = confirmationInput.trim().toUpperCase();
    if (input === 'YES' || input === 'NO') {
      handleConfirmPayment(input);
    }
  };

  const handlePhoneClick = (phone) => {
    if (phone) {
      window.location.href = `tel:+91${phone}`;
    }
  };

  const handleWhatsAppClick = (whatsapp) => {
    if (whatsapp) {
      window.open(`https://wa.me/91${whatsapp}`, '_blank');
    }
  };

  const handleEmailClick = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleRequestPayment = async () => {
    if (!canRequestPayment) {
      const timeLeft = formatTimeRemaining(timeUntilNextRequest);
      toast.error(`You can request again in ${timeLeft}`);
      return;
    }
    
    setIsRequestingPayment(true);
    
    try {
      const currentTime = serverTimestamp();
      const reminderDocId = `${entry.receiverUid}_${Date.now()}`;
      
      // Create reminder document in sendHelp/{help.id}/reminders/{currentUser.uid}_{Date.now()}
      const reminderRef = doc(db, 'sendHelp', entry.id, 'reminders', reminderDocId);
      await setDoc(reminderRef, {
        senderUid: entry.senderUid,
        receiverUid: entry.receiverUid,
        createdAt: currentTime,
        status: 'pending'
      });
      
      // Create notification for sender
      await addDoc(collection(db, 'notifications'), {
        userId: entry.senderUid,
        title: 'Payment Reminder',
        message: `${entry.receiverName || 'Receiver'} requested you to send payment.`,
        timestamp: currentTime,
        read: false
      });
      
      // Send FCM notification with sound
      const notificationResult = await sendPaymentReminderNotification({
        senderUid: entry.senderUid,
        receiverUid: entry.receiverUid,
        amount: amount,
        helpId: entry.id
      });
      
      if (notificationResult.success !== false) {
        toast.success("Payment Requested ✅");
      } else {
        // Show different messages based on error type
        if (notificationResult.error.includes('Cloud Function not accessible')) {
          toast.success("Payment Requested ✅ (In-app notification created)");
          console.info('FCM push notification unavailable, but in-app notification was created successfully.');
        } else if (notificationResult.error.includes('Network error')) {
          toast.success("Payment Requested ✅ (Push notification failed - Network issue)");
        } else {
          toast.success("Payment Requested ✅ (Push notification may not have been delivered)");
        }
        console.warn('Notification delivery failed:', notificationResult.error);
      }
      
      // Update local state for immediate UI feedback
      setCanRequestPayment(false);
      setTimeUntilNextRequest(3 * 60 * 60 * 1000); // 3 hours
      setLastReminderTime(new Date());
      
    } catch (error) {
      console.error("Reminder error", error);
      toast.error("Failed to send reminder ❌");
    } finally {
      setIsRequestingPayment(false);
    }
  };
  
  const sendPaymentReminderNotification = async (payload) => {
    try {
      const functions = getFunctions(app);
      const sendNotificationCallable = httpsCallable(functions, 'sendNotificationCallable');
      
      const notificationPayload = {
        userId: payload.senderUid,
        title: "Payment Reminder",
        body: `Receiver has requested payment of ₹${payload.amount}. Please complete it.`,
        data: {
          type: 'payment_reminder',
          helpId: payload.helpId,
          receiverUid: payload.receiverUid,
          amount: payload.amount.toString(),
          actionLink: '/dashboard'
        }
      };
      
      console.log('Sending notification with payload:', notificationPayload);
      
      const result = await sendNotificationCallable(notificationPayload);
      console.log('FCM notification sent successfully:', result.data);
      return { success: true, result: result.data };
      
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user initial
  const userInitial = (sender.fullName || entry.senderName || 'U')[0].toUpperCase();

  // Status badge component
  const StatusBadge = () => {
    if (confirmedByReceiver) {
      return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-semibold backdrop-blur-sm">
          <CheckCircle className="w-4 h-4" />
          Confirmed
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-sm font-semibold backdrop-blur-sm">
        <Clock className="w-4 h-4" />
        Pending
      </div>
    );
  };

  // Contact info component with clickable icons on the right
  const ContactInfo = () => {
    const phone = sender.phone || entry.senderPhone;
    const whatsapp = sender.whatsapp || entry.senderWhatsapp;
    const email = sender.email || entry.senderEmail;

    if (!phone && !whatsapp && !email) return null;

    return (
      <div className="space-y-3">
        {/* Phone */}
        {phone && (
          <div className="flex items-center justify-between text-white/90 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
            <span>+91 {phone}</span>
            <button
              onClick={() => handlePhoneClick(phone)}
              className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-white/10 rounded"
              title="Call"
            >
              📞
            </button>
          </div>
        )}

        {/* WhatsApp */}
        {whatsapp && (
          <div className="flex items-center justify-between text-white/90 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
            <span>{whatsapp}</span>
            <button
              onClick={() => handleWhatsAppClick(whatsapp)}
              className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-white/10 rounded"
              title="WhatsApp"
            >
              💬
            </button>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-center justify-between text-white/90 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
            <span className="truncate">{email}</span>
            <button
              onClick={() => handleEmailClick(email)}
              className="text-purple-400 hover:text-purple-300 transition-colors p-1 hover:bg-white/10 rounded flex-shrink-0"
              title="Email"
            >
              ✉️
            </button>
          </div>
        )}
      </div>
    );
  };

  // Proof submission section
  const ProofSection = () => {
    // Don't show if no proof exists or if it's the default example URL
    if (!hasProofSubmitted || screenshotFromDetails === 'https://example.com/pay.jpg') return null;

    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
        <h4 className="text-white font-semibold text-sm">Payment Proof</h4>
        {utrFromDetails && (
          <p className="text-white/90 text-sm">
            <span className="font-bold text-yellow-300">UTR: {utrFromDetails}</span>
          </p>
        )}
        {screenshotFromDetails && screenshotFromDetails !== 'https://example.com/pay.jpg' && (
          <button
            onClick={handleViewProof}
            className="mt-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all duration-200"
          >
            View Proof
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ delay: index * 0.1, duration: 0.4, type: "spring", stiffness: 100 }}
        className="
          w-full
          bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600
          backdrop-blur-xl border border-white/10
          rounded-2xl shadow-xl hover:shadow-2xl
          hover:scale-105 transition-all duration-300
          p-6 flex flex-col
          relative overflow-hidden
        "
      >
        {/* MLM Dashboard Header with Gradient Text */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-lg drop-shadow-lg bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Receive Help - Star Level
            </h3>
            <StatusBadge />
          </div>
          <p className="text-white/70 text-sm font-medium bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Helping Hand Network
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-4"></div>
        
        {/* Card Header - Avatar & User Info */}
        <div className="relative z-10 flex flex-col items-center mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/30 to-white/10 border-2 border-white/40 flex items-center justify-center mb-3 shadow-lg">
            <span className="text-2xl font-bold text-white drop-shadow-lg">{userInitial}</span>
          </div>

          {/* Amount - Large, Bold, Centered */}
          <div className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            ₹{amount}
          </div>

          {/* Name and User ID */}
          <div className="text-center">
            <div className="text-lg font-semibold text-white drop-shadow-sm">
              {sender.fullName || entry.senderName || 'Unknown User'}
            </div>
            <div className="text-sm text-white/70 font-medium">
              User ID: {sender.userId || entry.senderId || 'N/A'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-3 pt-3 mb-4"></div>

        {/* Contact Section */}
        <div className="relative z-10 mb-4">
          <ContactInfo />
        </div>

        {/* Payment Details Section - UTR and Screenshot */}
        {(paymentDetails.utrNumber || paymentDetails.screenshotUrl) && (
          <div className="relative z-10 mb-4 space-y-3">
            {/* UTR Number */}
            {paymentDetails.utrNumber && (
              <div className="text-white text-sm">
                <span className="font-bold">UTR Number: {paymentDetails.utrNumber}</span>
              </div>
            )}
            
            {/* Screenshot Preview */}
            {paymentDetails.screenshotUrl && (
              <div className="">
                <img
                  src={paymentDetails.screenshotUrl}
                  alt="Payment Screenshot"
                  className="max-h-[180px] w-full object-cover rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => window.open(paymentDetails.screenshotUrl, '_blank')}
                />
              </div>
            )}
          </div>
        )}

        {/* Request Payment Button - Show only for receiver when payment not confirmed */}
        {!confirmedByReceiver && (
          <div className="relative z-10 mb-4">
            <button
              onClick={handleRequestPayment}
              disabled={!canRequestPayment || isRequestingPayment}
              className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRequestingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : !canRequestPayment ? (
                `Next request in ${formatTimeRemaining(timeUntilNextRequest)}`
              ) : (
                "Request Payment"
              )}
            </button>
          </div>
        )}

        {/* Divider */}
        {(sender.phone || entry.senderPhone || sender.whatsapp || entry.senderWhatsapp || sender.email || entry.senderEmail) && (
          <div className="border-t border-white/10 mt-3 pt-3 mb-4"></div>
        )}

        {/* Proof Section */}
        <div className="relative z-10 mb-4">
          <ProofSection />
        </div>

        {/* Divider */}
        {hasProofSubmitted && screenshotFromDetails !== 'https://example.com/pay.jpg' && (
          <div className="border-t border-white/10 mt-3 pt-3"></div>
        )}

        {/* Actions Section */}
        <div className="relative z-10 mt-auto">
          {/* Confirm Button - Only show if status is Pending */}
          {isPending && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={confirming}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg"
            >
              {confirming ? 'Processing...' : 'Confirm Payment'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Confirm Modal */}
      <Dialog open={showConfirmModal} onClose={() => setShowConfirmModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 z-10">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4 text-center">
              Payment Confirmation
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6 text-center">
              Kya aapko payment mil chuka hai? Type <strong>YES</strong> to confirm or <strong>NO</strong> to reject.
            </Dialog.Description>
            
            {/* Input Box */}
            <div className="mb-6">
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type YES or NO"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold text-lg uppercase"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSubmit}
                disabled={!confirmationInput.trim() || !['YES', 'NO'].includes(confirmationInput.trim().toUpperCase())}
                className="flex-1 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmationInput('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Dialog>


    </>
  );
}