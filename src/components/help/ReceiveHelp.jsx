import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment, writeBatch, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { Phone, MessageCircle, DollarSign, Send, Eye, X, Clock, CheckCircle, ExternalLink, User, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import defaultImage from '../../assets/default-avatar.png';

export default function ReceiveHelp() {
  const { user } = useAuth();
  const [receiveHelps, setReceiveHelps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHelpId, setSelectedHelpId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelHelp, setSelectedCancelHelp] = useState(null);
  const [requestCooldowns, setRequestCooldowns] = useState({});

  // Helper function to normalize status for consistent comparison
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    return status.toLowerCase().trim();
  };

  // Helper function to check if status is pending
  const isPendingStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === 'pending' || normalized === 'waiting';
  };

  // Helper function to check if status is payment done
  const isPaymentDoneStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === 'payment done' || normalized === 'payment_done' || normalized === 'paid';
  };

  // Helper function to check if status is confirmed
  const isConfirmedStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === 'confirmed' || normalized === 'complete' || normalized === 'completed';
  };

  // Load cooldowns from Firestore on component mount
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

  // Fetch receiveHelp data with real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setReceiveHelps([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Create query with limit to show maximum 3 receivers
    const baseQuery = query(
      collection(db, "receiveHelp"),
      where("receiverUid", "==", user.uid),
      limit(3)
    );
    
    const unsubscribe = onSnapshot(baseQuery, 
      (snapshot) => {
        const helps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out duplicate entries based on senderId + receiverId and exclude cancelled transactions
        const uniqueHelps = [];
        const seenCombinations = new Set();
        
        helps.forEach(help => {
          // Skip cancelled transactions
          if (normalizeStatus(help.status) === 'cancelled') {
            return;
          }
          
          const combination = `${help.senderId || help.senderUid || 'unknown'}_${help.receiverUid || user.uid}`;
          if (!seenCombinations.has(combination)) {
            seenCombinations.add(combination);
            uniqueHelps.push(help);
          }
        });
        
        // Extract cooldown timestamps from Firestore data
        const firestoreCooldowns = {};
        uniqueHelps.forEach(help => {
          if (help.lastPaymentRequestTimestamp) {
            firestoreCooldowns[help.id] = help.lastPaymentRequestTimestamp;
          }
        });
        
        // Merge with localStorage cooldowns
        const localCooldowns = JSON.parse(localStorage.getItem('paymentRequestCooldowns') || '{}');
        const mergedCooldowns = { ...localCooldowns, ...firestoreCooldowns };
        setRequestCooldowns(mergedCooldowns);
        
        // Sort manually to handle missing createdAt fields
        const sortedHelps = uniqueHelps.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return new Date(bTime) - new Date(aTime); // Descending order
        });
        
        setReceiveHelps(sortedHelps);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching receive helps:", err);
        toast.error('Failed to load help requests');
        setReceiveHelps([]);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid]);

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
  const handleRequestPayment = async (help) => {
    if (isRequestOnCooldown(help.id)) {
      const remainingTime = formatRemainingTime(help.id);
      toast.error(`Please wait ${remainingTime} before requesting payment again.`);
      return;
    }

    try {
      const currentTimestamp = Date.now();
      
      // Update Firestore document with request timestamp
      const receiveHelpRef = doc(db, "receiveHelp", help.id);
      await updateDoc(receiveHelpRef, {
        lastPaymentRequest: serverTimestamp(),
        lastPaymentRequestTimestamp: currentTimestamp
      });
      
      // Update local state
      setRequestCooldowns(prev => ({
        ...prev,
        [help.id]: currentTimestamp
      }));

      // Store cooldown in localStorage for persistence
      const cooldowns = JSON.parse(localStorage.getItem('paymentRequestCooldowns') || '{}');
      cooldowns[help.id] = currentTimestamp;
      localStorage.setItem('paymentRequestCooldowns', JSON.stringify(cooldowns));

      toast.success(`Payment request sent to ${help.senderName || 'sender'}!`);
    } catch (error) {
      console.error('Error requesting payment:', error);
      toast.error('Failed to send payment request');
    }
  };

  const handlePaymentAccept = (helpId) => {
    setSelectedHelpId(helpId);
    setShowConfirmModal(true);
  };

  const confirmPaymentReceived = async () => {
    if (!selectedHelpId) return;
    
    setConfirmingId(selectedHelpId);
    try {
      const batch = writeBatch(db);
      
      // Update receiveHelp document
      const receiveHelpRef = doc(db, "receiveHelp", selectedHelpId);
      batch.update(receiveHelpRef, {
        status: "Confirmed",
        confirmedByReceiver: true,
        confirmationTime: serverTimestamp()
      });
      
      // Update sendHelp document
      const sendHelpRef = doc(db, "sendHelp", selectedHelpId);
      batch.update(sendHelpRef, {
        status: "Confirmed",
        confirmedByReceiver: true,
        confirmationTime: serverTimestamp()
      });
      
      // Increment helpReceived for receiver
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        batch.update(userRef, {
          helpReceived: increment(1)
        });
      }
      
      await batch.commit();
      
      // Send notification to sender about payment confirmation
      try {
        const helpData = receiveHelps.find(h => h.id === selectedHelpId);
        if (helpData?.senderUid) {
          const { sendNotification } = await import('../../context/NotificationContext');
          await sendNotification({
            title: 'Payment Confirmed',
            message: `Your payment has been confirmed by ${user.displayName || user.email}`,
            type: 'success',
            priority: 'high',
            actionLink: '/user/send-help',
            targetUserId: helpData.senderUid
          });
        }
      } catch (notificationError) {
        console.error('Error sending payment confirmation notification:', notificationError);
      }
      
      toast.success("Payment confirmed successfully!");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Failed to confirm payment");
    } finally {
      setConfirmingId(null);
      setShowConfirmModal(false);
      setSelectedHelpId(null);
    }
  };

  const handleCancelPayment = (help) => {
    setSelectedCancelHelp(help);
    setShowCancelModal(true);
  };

  const confirmCancelPayment = async () => {
    if (!selectedCancelHelp) return;
    
    try {
      const batch = writeBatch(db);
      
      // Update receiveHelp document
      const receiveHelpRef = doc(db, "receiveHelp", selectedCancelHelp.id);
      batch.update(receiveHelpRef, {
        status: "Cancelled",
        cancelledByReceiver: true,
        cancellationTime: serverTimestamp(),
        cancellationReason: "Payment proof rejected by receiver"
      });
      
      // Update sendHelp document
      const sendHelpRef = doc(db, "sendHelp", selectedCancelHelp.id);
      batch.update(sendHelpRef, {
        status: "Cancelled",
        cancelledByReceiver: true,
        cancellationTime: serverTimestamp(),
        cancellationReason: "Payment proof rejected by receiver"
      });
      
      await batch.commit();
      toast.success("Payment request cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling payment:", error);
      toast.error("Failed to cancel payment request");
    } finally {
      setShowCancelModal(false);
      setSelectedCancelHelp(null);
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
    if (help.profileImage) {
      return help.profileImage;
    }
    return null; // Will show default avatar with first letter
  };

  // Helper function to get first letter for default avatar
  const getFirstLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Helper function to check if help request is in cooldown
  const isInCooldown = (helpId) => {
    return isRequestOnCooldown(helpId);
  };

  // Helper function to get status badge configuration
  const getStatusBadge = (status) => {
    let config, displayText;
    
    if (isPendingStatus(status)) {
      config = { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      displayText = 'Pending';
    } else if (isPaymentDoneStatus(status)) {
      config = { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send };
      displayText = 'Payment Done';
    } else if (isConfirmedStatus(status)) {
      config = { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      displayText = 'Confirmed';
    } else {
      config = { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
      displayText = status || 'Unknown';
    }

    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <IconComponent className="w-4 h-4" />
        {displayText}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Receive Help</h1>
            <p className="text-gray-600">Manage your incoming help requests</p>
          </motion.div>

          {/* Loading Skeleton - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Receive Help</h1>
          <p className="text-gray-600">Manage your incoming help requests</p>
        </motion.div>

        {/* Empty State */}
        {receiveHelps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-4"
          >
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <DollarSign className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Help Requests Yet</h3>
              <p className="text-gray-600 mb-6">
                When someone sends you a help request, it will appear here. Share your profile to start receiving help!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Make sure your profile is complete and share your HH ID with friends and family.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help Cards - Responsive Grid Layout */}
        {receiveHelps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {receiveHelps.map((help, index) => (
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
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100"
                >
                  {/* Profile Section */}
                  <div className="flex items-center space-x-3 mb-4">
                    {getProfileImage(help) ? (
                      <img
                        src={getProfileImage(help)}
                        alt={help.senderName || help.fullName || 'Sender'}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-md"
                        onError={(e) => {
                          e.target.src = defaultImage;
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 shadow-md">
                        <span className="text-white font-bold text-xl">
                          {getFirstLetter(help.senderName || help.fullName || 'Unknown User')}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg">{help.senderName || help.fullName || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-600 truncate flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>ID: {help.senderId || help.userId || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-3 mb-4">
                    {/* Mobile Number */}
                    {(help.senderMobile || help.senderPhone || help.phone) && (
                      <div className="flex items-center space-x-2 text-sm bg-blue-50 p-2 rounded-lg">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700 font-medium">Mobile: {help.senderMobile || help.senderPhone || help.phone}</span>
                      </div>
                    )}
                    
                    {/* WhatsApp with Click-to-Chat */}
                    {(help.senderWhatsApp || help.whatsapp || help.senderMobile || help.senderPhone || help.phone) && (
                      <div className="flex items-center space-x-2 text-sm bg-green-50 p-2 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <a
                          href={`https://wa.me/${(help.senderWhatsApp || help.whatsapp || help.senderMobile || help.senderPhone || help.phone)?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 flex items-center space-x-1 hover:underline font-medium flex-1"
                        >
                          <span>WhatsApp: {help.senderWhatsApp || help.whatsapp || help.senderMobile || help.senderPhone || help.phone}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Payment Amount */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">💰 Amount:</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">₹{help.amount || 300}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">📌 Status:</span>
                      {getStatusBadge(help.status)}
                    </div>
                  </div>

                  {/* UTR Number - Show when paymentDetails.utrNumber exists */}
                  {(help.paymentDetails?.utrNumber || help.utrNumber || help.utr) && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 mb-4 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">📌 UTR Number:</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-purple-900 bg-white px-2 py-1 rounded border">{help.paymentDetails?.utrNumber || help.utrNumber || help.utr}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Request Payment - Only show when paymentDetails.utrNumber and paymentDetails.screenshotUrl don't exist */}
                    {isPendingStatus(help.status) && !(help.paymentDetails?.utrNumber && help.paymentDetails?.screenshotUrl) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRequestPayment(help)}
                        disabled={isInCooldown(help.id)}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${
                          isInCooldown(help.id) 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>
                          {isInCooldown(help.id) 
                            ? `Wait ${formatRemainingTime(help.id)}` 
                            : 'Request Payment'
                          }
                        </span>
                      </motion.button>
                    )}
                    
                    {/* Approve Payment - Show when paymentDetails.utrNumber and paymentDetails.screenshotUrl exist and status is not confirmed */}
                    {(help.paymentDetails?.utrNumber && help.paymentDetails?.screenshotUrl) && !isConfirmedStatus(help.status) && (
                      <div className="space-y-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePaymentAccept(help.id)}
                          disabled={confirmingId === help.id}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm shadow-md hover:shadow-lg"
                        >
                          {confirmingId === help.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>✅ Approve Payment</span>
                            </>
                          )}
                        </motion.button>
                        {/* Green check icon indicator */}
                        <div className="flex items-center justify-center space-x-2 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Proof submitted - Ready for approval</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Confirmed Status Display */}
                    {isConfirmedStatus(help.status) && (
                      <div className="w-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 py-3 px-4 rounded-lg font-semibold text-center flex items-center justify-center space-x-2 text-sm border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <span>✅ Payment Confirmed</span>
                      </div>
                    )}

                    {/* View Proof Button - Available when paymentDetails.screenshotUrl exists */}
                    {(help.paymentDetails?.screenshotUrl || help.proofScreenshot || help.screenshotUrl || help.paymentProof || help.screenshot) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleViewProof(help.paymentDetails?.screenshotUrl || help.proofScreenshot || help.screenshotUrl || help.paymentProof || help.screenshot)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>🔍 View Proof</span>
                      </motion.button>
                    )}

                    {/* Cancel Payment Button - Available when proof is submitted but payment not confirmed */}
                    {(help.paymentDetails?.screenshotUrl || help.proofScreenshot || help.screenshotUrl || help.paymentProof || help.screenshot) && 
                     normalizeStatus(help.status) !== 'confirmed' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCancelPayment(help)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm shadow-md hover:shadow-lg"
                      >
                        <X className="w-4 h-4" />
                        <span>❌ Cancel Payment</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
    </div>
  );
}