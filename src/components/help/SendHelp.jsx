import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiMessageCircle, FiLoader, FiCheckCircle, FiClock, FiUpload, FiCamera, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc,
  onSnapshot, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import LoginRequired from '../auth/LoginRequired';
import TransactionChat from '../chat/TransactionChat';
import ChatWindow from '../chat/ChatWindow';

// Step 1: Receiver Card Component
const ReceiverCard = ({ receiver, onNext }) => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-auto"
    >
      {/* Profile Section */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 p-1">
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
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{receiver.name}</h2>
        <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
          ID: {receiver.userId}
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-6">
        {receiver.whatsapp && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiMessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">WhatsApp</p>
              <p className="text-green-800 font-semibold">{receiver.whatsapp}</p>
            </div>
          </div>
        )}
        {receiver.phone && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiPhone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Phone</p>
              <p className="text-blue-800 font-semibold">{receiver.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Icon Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowChat(true)}
          className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-blue-600 shadow-lg hover:shadow-xl"
        >
          <FiMessageCircle className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>

      {/* Payment Details */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
        <div className="space-y-3">
          {receiver?.paymentMethod?.upi && (
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
              <img src="/images/upi-icon.svg" alt="UPI" className="w-8 h-8 mr-3" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">UPI</p>
                <p className="text-sm text-gray-600">{receiver.paymentMethod.upi}</p>
              </div>
            </div>
          )}
          {receiver?.paymentMethod?.gpay && (
            <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm">
              <img src="/images/googlepay-icon.svg" alt="Google Pay" className="w-8 h-8 mr-3" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Google Pay</p>
                <p className="text-sm text-gray-600">{receiver.paymentMethod.gpay}</p>
              </div>
            </div>
          )}
          {receiver?.paymentMethod?.phonePe && (
            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 shadow-sm">
              <img src="/images/phonepe-icon.svg" alt="PhonePe" className="w-8 h-8 mr-3" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">PhonePe</p>
                <p className="text-sm text-gray-600">{receiver.paymentMethod.phonePe}</p>
              </div>
            </div>
          )}
          {receiver?.paymentMethod?.bank?.accountNumber && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800">Bank Transfer</p>
              </div>
              <div className="grid grid-cols-1 gap-1 text-sm">
                <p><span className="font-medium text-gray-700">Bank:</span> <span className="text-gray-600">{receiver.paymentMethod.bank.bankName}</span></p>
                <p><span className="font-medium text-gray-700">Account:</span> <span className="text-gray-600">{receiver.paymentMethod.bank.accountNumber}</span></p>
                <p><span className="font-medium text-gray-700">IFSC:</span> <span className="text-gray-600">{receiver.paymentMethod.bank.ifscCode}</span></p>
                <p><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-600">{receiver.paymentMethod.bank.name}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onNext}
        className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        Activate Account – Send ₹300
      </button>

      {/* Chat Modal */}
      <TransactionChat
        transactionType="sendHelp"
        transactionId={receiver?.userId + '_' + user?.uid}
        otherUser={{
          name: receiver?.name,
          profileImage: receiver?.profileImage
        }}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </motion.div>
  );
};

// Step 2: Payment Submission Component
const PaymentSubmission = ({ receiver, onSubmit, onBack, isSubmitting }) => {
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('📁 File selected:', file);
    
    if (file) {
      console.log('📊 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      
      setScreenshot(file);
      console.log('✅ File stored in state successfully');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
        console.log('🖼️ File preview generated');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ No file selected');
    }
  };

  const uploadImageToFirebase = async (file) => {
    return new Promise((resolve, reject) => {
      try {
        // Create unique filename with timestamp
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `payment-proofs/${fileName}`);
        
        console.log('🔄 Starting upload to Firebase Storage:', fileName);
        
        // Create upload task with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Track upload progress
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
            console.log(`📊 Upload progress: ${Math.round(progress)}%`);
          },
          (error) => {
            console.error('❌ Upload failed:', error);
            setIsUploading(false);
            setUploadProgress(0);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Upload completed! Download URL:', downloadURL);
              setIsUploading(false);
              setUploadProgress(100);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              setIsUploading(false);
              setUploadProgress(0);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('❌ Error creating upload task:', error);
        setIsUploading(false);
        setUploadProgress(0);
        reject(error);
      }
    });
  };

  const handleSubmit = async () => {
    console.log('🔍 Submit button clicked - validating inputs...');
    console.log('📝 UTR value:', utr.trim());
    console.log('📁 Screenshot file:', screenshot);
    
    if (!utr.trim()) {
      console.log('❌ UTR validation failed');
      toast.error('Please enter UTR/Transaction ID');
      return;
    }
    if (!screenshot) {
      console.log('❌ Screenshot validation failed - no file selected');
      toast.error('Please upload payment screenshot');
      return;
    }

    console.log('✅ All validations passed, starting upload...');
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('🚀 Starting payment submission process...');
      console.log('📤 About to upload file:', {
        name: screenshot.name,
        size: screenshot.size,
        type: screenshot.type
      });
      
      // Upload image to Firebase Storage with progress tracking
      const screenshotUrl = await uploadImageToFirebase(screenshot);
      
      console.log('✅ Image uploaded successfully, submitting payment data...');
      console.log('🔗 Screenshot URL:', screenshotUrl);
      
      // Submit payment data with screenshot URL
      await onSubmit({
        utr: utr.trim(),
        screenshotUrl
      });
      
      console.log('✅ Payment submission completed successfully!');
      toast.success('Payment proof uploaded and submitted successfully!');
      
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      setIsUploading(false);
      setUploadProgress(0);
      
      // Provide specific error messages
      if (error.code === 'storage/unauthorized') {
        toast.error('Upload failed: Permission denied. Storage rules updated, please try again.');
      } else if (error.code === 'storage/canceled') {
        toast.error('Upload was canceled. Please try again.');
      } else if (error.code === 'storage/unknown') {
        toast.error('Upload failed due to unknown error. Please check your internet connection.');
      } else {
        toast.error(`Failed to submit payment: ${error.message}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiUpload className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit Your Payment Proof</h2>
        <p className="text-gray-600">Upload your payment details to complete activation</p>
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
                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading payment proof...</span>
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
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading || !utr.trim() || !screenshot}
          className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl"
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

// Step 3: Waiting State Component
const WaitingState = ({ receiver, status, showChat, setShowChat, transactionId }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: FiClock,
          title: '✅ Payment Submitted',
          message: 'Waiting for receiver confirmation...',
          note: 'Your ID will be activated once the receiver confirms your payment.',
          bgGradient: 'from-yellow-50 to-orange-50',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800'
        };
      case 'confirmed':
        return {
          icon: FiCheckCircle,
          title: '🎉 Account Activated!',
          message: 'Your payment has been confirmed and your account is now active.',
          note: 'Welcome to the platform! You can now access all features.',
          bgGradient: 'from-green-50 to-emerald-50',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800'
        };
      default:
        return {
          icon: FiClock,
          title: 'Processing...',
          message: 'Please wait while we process your request.',
          note: '',
          bgGradient: 'from-gray-50 to-slate-50',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl shadow-lg p-8 max-w-md w-full mx-auto text-center`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6"
      >
        <Icon className={`w-16 h-16 ${config.iconColor} mx-auto`} />
      </motion.div>
      
      <h2 className={`text-2xl font-bold ${config.titleColor} mb-3`}>
        {config.title}
      </h2>
      
      <p className="text-gray-700 mb-4 text-lg">{config.message}</p>
      
      {config.note && (
        <p className="text-sm text-gray-600 bg-white bg-opacity-50 rounded-lg p-3 mb-6">
          {config.note}
        </p>
      )}
      
      {receiver && (
        <div className="space-y-4">
          <div className="bg-white bg-opacity-70 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Receiver</p>
            <div className="flex items-center justify-center gap-3">
              <img
                src={receiver.profileImage || '/images/default-avatar.png'}
                alt={receiver.name}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.target.src = '/images/default-avatar.png';
                }}
              />
              <span className="font-semibold text-gray-800">{receiver.name}</span>
            </div>
          </div>
          
          {/* Chat Button */}
          <button
            onClick={() => setShowChat(true)}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-blue-600 shadow-lg hover:shadow-xl"
          >
            <FiMessageCircle className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      )}
      
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

// Main SendHelp Component
const SendHelp = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Receiver Card, 2: Payment, 3: Waiting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpStatus, setHelpStatus] = useState(null);
  const [activeHelp, setActiveHelp] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  // Fetch eligible receiver for new users
  const fetchEligibleReceiver = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, 'users'),
        where('isActivated', '==', true),
        where('helpVisibility', '==', true),
        where('isOnHold', '==', false),
        where('isReceivingHeld', '==', false),
        where('isBlocked', '==', false),
        orderBy('referralCount', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const eligibleReceivers = snapshot.docs.filter(doc => doc.id !== currentUser.uid);
        
        if (eligibleReceivers.length > 0) {
          const receiverDoc = eligibleReceivers[0];
          const receiverData = receiverDoc.data();
          
          setReceiver({ 
            id: receiverDoc.id, 
            userId: receiverData.userId,
            name: receiverData.name || receiverData.fullName,
            whatsapp: receiverData.whatsapp,
            phone: receiverData.phone,
            phonePe: receiverData.phonePe,
            upi: receiverData.upi,
            googlePay: receiverData.googlePay,
            bankDetails: receiverData.bankDetails,
            profileImage: receiverData.profileImage,
            referralCount: receiverData.referralCount || 0,
            ...receiverData
          });
        }
      }
    } catch (error) {
      console.error('Error fetching receiver:', error);
      toast.error('Failed to load receiver information');
    }
  };

  // Check for existing active help
  const checkActiveHelp = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, 'sendHelp'),
        where('senderId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const helpDoc = snapshot.docs[0];
        const helpData = helpDoc.data();
        setActiveHelp({ id: helpDoc.id, ...helpData });
        setHelpStatus(helpData.status);
        setTransactionId(helpDoc.id);
        setCurrentStep(3); // Go to waiting state
        
        // Set up real-time listener for status updates
        const unsubscribe = onSnapshot(doc(db, 'sendHelp', helpDoc.id), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setHelpStatus(data.status);
          }
        });
        
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error checking active help:', error);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    if (!receiver || !currentUser) return;

    setIsSubmitting(true);
    try {
      console.log('💾 Creating sendHelp document with payment data...');
      
      // Create sendHelp document with custom ID format
      const timestamp = Date.now();
      const sendHelpId = `${receiver.userId}_${currentUser.uid}_${timestamp}`;
      const sendHelpRef = doc(db, 'sendHelp', sendHelpId);
      const sendHelpData = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.name || currentUser.email,
        senderEmail: currentUser.email,
        receiverId: receiver.id,
        receiverName: receiver.name,
        amount: 300,
        status: 'pending',
        utr: paymentData.utr,
        screenshotUrl: paymentData.screenshotUrl, // This now comes from Firebase Storage
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Saving to Firestore:', { ...sendHelpData, screenshotUrl: 'URL_SAVED' });
      
      await setDoc(sendHelpRef, sendHelpData);
      
      // Create receiveHelp document with same ID
      const receiveHelpRef = doc(db, 'receiveHelp', sendHelpId);
      const receiveHelpData = {
        sendHelpId: sendHelpId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.name || currentUser.email,
        receiverId: receiver.id,
        receiverName: receiver.name,
        amount: 300,
        status: 'pending',
        utr: paymentData.utr,
        screenshotUrl: paymentData.screenshotUrl, // This now comes from Firebase Storage
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(receiveHelpRef, receiveHelpData);
      
      console.log('✅ SendHelp and ReceiveHelp documents created successfully with ID:', sendHelpId);
      
      setHelpStatus('pending');
      setActiveHelp({ id: sendHelpId, status: 'pending' });
      setTransactionId(sendHelpId);
      setCurrentStep(3);
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(doc(db, 'sendHelp', sendHelpId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setHelpStatus(data.status);
        }
      });
      
      toast.success('Payment submitted successfully!');
      
    } catch (error) {
      console.error('❌ Error creating help documents:', error);
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      if (currentUser && currentUser.uid && currentUser.hasOwnProperty('isActivated')) {
        // Add a small delay to ensure Firestore connection is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!currentUser.isActivated) {
          // For new users, fetch eligible receiver
          await fetchEligibleReceiver();
        } else {
          // For activated users, check for active help
          await checkActiveHelp();
        }
      }
      
      setLoading(false);
    };
    
    initialize();
  }, [currentUser]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <FiLoader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h3>
          <p className="text-gray-500">Please wait while we prepare your activation flow.</p>
        </motion.div>
      </div>
    );
  }

  // Authentication check
  if (!currentUser) {
    return <LoginRequired />;
  }

  // Main render logic
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-0 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Receiver Card */}
          {!currentUser.isActivated && receiver && currentStep === 1 && (
            <ReceiverCard
              key="receiver-card"
              receiver={receiver}
              onNext={() => setCurrentStep(2)}
            />
          )}
          
          {/* Step 2: Payment Submission */}
          {!currentUser.isActivated && receiver && currentStep === 2 && (
            <PaymentSubmission
              key="payment-submission"
              receiver={receiver}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStep(1)}
              isSubmitting={isSubmitting}
            />
          )}
          
          {/* Step 3: Waiting State */}
          {(helpStatus || currentStep === 3) && (
            <WaitingState
              key="waiting-state"
              receiver={receiver}
              status={helpStatus}
              showChat={showChat}
              setShowChat={setShowChat}
              transactionId={transactionId}
            />
          )}
          
          {/* Activated users with no active help */}
          {currentUser.isActivated && !helpStatus && (
            <motion.div
              key="activated-user"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
            >
              <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Active</h3>
              <p className="text-gray-600">Your account is activated and ready to use all features.</p>
            </motion.div>
          )}
          
          {/* Fallback for new users without receiver */}
          {!currentUser.isActivated && !receiver && (
            <motion.div
              key="no-receiver"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
            >
              <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Receivers Available</h3>
              <p className="text-gray-500 mb-4">Please try again later or contact support.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-colors duration-200"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SendHelp;