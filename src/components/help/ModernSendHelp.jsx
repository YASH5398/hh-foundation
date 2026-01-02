import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiUpload, 
  FiEye, 
  FiFilter,
  FiSearch,
  FiWallet,
  FiCreditCard,
  FiSmartphone,
  FiBank,
  FiX,
  FiChevronDown,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import { useSendHelp } from '../../context/SendHelpContext';
import { useAuth } from '../../context/AuthContext';

// Status constants
const STATUS = {
  NO_RECEIVER: 'no_receiver',
  PENDING_PAYMENT: 'pending_payment',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  CONFIRMED: 'confirmed'
};

// Payment methods
const PAYMENT_METHODS = {
  UPI: { icon: FiSmartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
  PHONEPE: { icon: FiSmartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
  GPAY: { icon: FiSmartphone, color: 'text-green-600', bg: 'bg-green-50' },
  BANK: { icon: FiBank, color: 'text-indigo-600', bg: 'bg-indigo-50' }
};

// Floating elements component
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Status filter dropdown
const StatusFilter = ({ currentFilter, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filters = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'awaiting', label: 'Awaiting Confirmation', count: 0 },
    { value: 'confirmed', label: 'Confirmed', count: 0 }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/90 transition-all duration-200"
      >
        <FiFilter className="w-4 h-4" />
        <span className="text-sm font-medium">
          {filters.find(f => f.value === currentFilter)?.label || 'All'}
        </span>
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-48 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg z-10"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  onFilterChange(filter.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
              >
                <span className="text-sm font-medium">{filter.label}</span>
                {currentFilter === filter.value && (
                  <FiCheck className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Payment details modal
const PaymentDetailsModal = ({ isOpen, onClose, paymentData }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {paymentData?.screenshot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Screenshot</label>
                <img
                  src={paymentData.screenshot}
                  alt="Payment proof"
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
            )}
            
            {paymentData?.utr && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UTR Number</label>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {paymentData.utr}
                </div>
              </div>
            )}
            
            {paymentData?.timestamp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Time</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {new Date(paymentData.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// No Receiver State
const NoReceiverState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 text-center overflow-hidden"
  >
    <FloatingElements />
    
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="relative z-10"
    >
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
        <FiSearch className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        No receiver available right now
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Please wait while we assign one for you. We'll notify you as soon as a receiver becomes available.
      </p>
      
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 mx-auto"
      >
        <FiLoader className="w-8 h-8 text-blue-500" />
      </motion.div>
    </motion.div>
  </motion.div>
);

// Receiver Card Component
const ReceiverCard = ({ receiver, status, onMakePayment, onUploadScreenshot, onViewDetails, paymentData }) => {
  const getStatusConfig = () => {
    switch (status) {
      case STATUS.PENDING_PAYMENT:
        return {
          tag: { text: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
          cardClass: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50',
          actions: (
            <div className="flex gap-3">
              <button
                onClick={onMakePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
              >
                Make Payment
              </button>
              <button
                onClick={onUploadScreenshot}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Upload Screenshot
              </button>
            </div>
          )
        };
      case STATUS.AWAITING_CONFIRMATION:
        return {
          tag: { text: 'Awaiting Confirmation', color: 'bg-blue-100 text-blue-800' },
          cardClass: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
          actions: (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <FiClock className="w-4 h-4" />
                <span>Payment submitted at {paymentData?.timestamp ? new Date(paymentData.timestamp).toLocaleTimeString() : 'recently'}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            </div>
          )
        };
      case STATUS.CONFIRMED:
        return {
          tag: { text: 'Confirmed by Receiver', color: 'bg-green-100 text-green-800' },
          cardClass: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
          actions: (
            <button
              onClick={onViewDetails}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            >
              View Payment Details
            </button>
          )
        };
      default:
        return {
          tag: { text: 'Unknown', color: 'bg-gray-100 text-gray-800' },
          cardClass: 'border-gray-200 bg-gray-50',
          actions: null
        };
    }
  };

  const config = getStatusConfig();
  const paymentMethod = PAYMENT_METHODS[receiver?.paymentMethod] || PAYMENT_METHODS.UPI;
  const PaymentIcon = paymentMethod.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`relative rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${config.cardClass}`}
    >
      {/* Status Tag */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.tag.color}`}>
          {config.tag.text}
        </span>
      </div>

      {/* Receiver Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {receiver?.profileImage ? (
            <img
              src={receiver.profileImage}
              alt={receiver.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {receiver?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          {status === STATUS.CONFIRMED && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <FiCheck className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{receiver?.name || 'Unknown User'}</h3>
          <p className="text-sm text-gray-600">ID: {receiver?.userId || 'N/A'}</p>
          <div className="flex items-center gap-2 mt-1">
            <PaymentIcon className={`w-4 h-4 ${paymentMethod.color}`} />
            <span className="text-sm text-gray-600">{receiver?.paymentMethod || 'UPI'}</span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Amount</span>
          <span className="text-2xl font-bold text-gray-800">₹300</span>
        </div>
      </div>

      {/* Actions */}
      {config.actions}
    </motion.div>
  );
};

// Payment Upload Modal
const PaymentUploadModal = ({ isOpen, onClose, onUpload, receiver }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !utrNumber) return;
    
    setIsUploading(true);
    try {
      await onUpload({
        file: selectedFile,
        utr: utrNumber,
        receiver
      });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload Payment Proof</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Payment proof"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="space-y-2">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* UTR Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UTR Number
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter UTR number"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || !utrNumber || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Submit Payment'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Modern Send Help Component
const ModernSendHelp = () => {
  const { selectedReceiver, isLoading } = useSendHelp();
  const { user } = useAuth();
  
  // State management
  const [currentStatus, setCurrentStatus] = useState(STATUS.NO_RECEIVER);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedReceiverForAction, setSelectedReceiverForAction] = useState(null);

  // Mock data for demonstration - in real app, this would come from your context/API
  const [mockReceivers, setMockReceivers] = useState([
    {
      id: 1,
      name: 'John Doe',
      userId: 'RCV001',
      profileImage: null,
      paymentMethod: 'UPI',
      status: STATUS.PENDING_PAYMENT,
      amount: 300,
      timestamp: new Date().toISOString(),
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210'
    },
    {
      id: 2,
      name: 'Jane Smith',
      userId: 'RCV002',
      profileImage: null,
      paymentMethod: 'PHONEPE',
      status: STATUS.AWAITING_CONFIRMATION,
      amount: 300,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      phone: '+91 98765 43211',
      whatsapp: '+91 98765 43211'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      userId: 'RCV003',
      profileImage: null,
      paymentMethod: 'GPAY',
      status: STATUS.CONFIRMED,
      amount: 300,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      phone: '+91 98765 43212',
      whatsapp: '+91 98765 43212'
    }
  ]);

  // Filter receivers based on status
  const filteredReceivers = mockReceivers.filter(receiver => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return receiver.status === STATUS.PENDING_PAYMENT;
    if (statusFilter === 'awaiting') return receiver.status === STATUS.AWAITING_CONFIRMATION;
    if (statusFilter === 'confirmed') return receiver.status === STATUS.CONFIRMED;
    return true;
  });

  // Handle actions
  const handleMakePayment = (receiver) => {
    setSelectedReceiverForAction(receiver);
    setShowPaymentModal(true);
  };

  const handleUploadScreenshot = (receiver) => {
    setSelectedReceiverForAction(receiver);
    setShowUploadModal(true);
  };

  const handleViewDetails = (receiver) => {
    setPaymentData({
      screenshot: '/api/placeholder/400/300',
      utr: 'UTR123456789',
      timestamp: receiver.timestamp
    });
    setShowDetailsModal(true);
  };

  const handlePaymentUpload = async (uploadData) => {
    // Simulate API call
    console.log('Uploading payment proof:', uploadData);
    
    // Update receiver status to awaiting confirmation
    setMockReceivers(prev => prev.map(receiver => 
      receiver.id === uploadData.receiver.id 
        ? { ...receiver, status: STATUS.AWAITING_CONFIRMATION }
        : receiver
    ));
    
    setShowUploadModal(false);
  };

  // Update status based on receiver availability
  useEffect(() => {
    if (isLoading) {
      setCurrentStatus(STATUS.NO_RECEIVER);
    } else if (selectedReceiver) {
      setCurrentStatus(STATUS.PENDING_PAYMENT);
    } else {
      setCurrentStatus(STATUS.NO_RECEIVER);
    }
  }, [selectedReceiver, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Send Help
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Send help to activate your account and start receiving payments from the community.
          </p>
        </motion.div>

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <StatusFilter
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </motion.div>

        {/* Content */}
        <div className="space-y-6">
          {/* No Receiver State */}
          {currentStatus === STATUS.NO_RECEIVER && (
            <NoReceiverState />
          )}

          {/* Receiver Cards */}
          <AnimatePresence>
            {filteredReceivers.map((receiver, index) => (
              <motion.div
                key={receiver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ReceiverCard
                  receiver={receiver}
                  status={receiver.status}
                  onMakePayment={() => handleMakePayment(receiver)}
                  onUploadScreenshot={() => handleUploadScreenshot(receiver)}
                  onViewDetails={() => handleViewDetails(receiver)}
                  paymentData={receiver}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Payment Details Modal */}
        <PaymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          paymentData={paymentData}
        />

        {/* Payment Upload Modal */}
        <PaymentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handlePaymentUpload}
          receiver={selectedReceiverForAction}
        />
      </div>
    </div>
  );
};

export default ModernSendHelp;
