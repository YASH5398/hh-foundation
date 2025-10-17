import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCreditCard, FiUpload, FiCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import storageService from '../../services/storageService';

const PaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPackage = location.state?.selectedPackage;
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const pricePerEpin = 60;
  
  // Redirect if no package selected
  if (!selectedPackage) {
    navigate('/epin/request');
    return null;
  }
  
  const totalPrice = selectedPackage.paid * pricePerEpin;
  
  const handlePaymentDone = () => {
    setShowPaymentForm(true);
  };
  
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast.error('User not authenticated. Please login again.');
      return;
    }
    
    if (!selectedPackage) {
      toast.error('No package selected. Please go back and select a package.');
      return;
    }
    
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR/Transaction ID');
      return;
    }
    
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Upload screenshot to Firebase Storage
      const screenshotUrl = await storageService.uploadEpinScreenshot(
        screenshot,
        (progress) => setUploadProgress(progress)
      );

      // fallback for packageName
      const packageName = selectedPackage?.name || "Unknown Package";

      const epinRequestDoc = await addDoc(collection(db, 'epinRequests'), {
        userId: user.uid,
        userEmail: user.email,
        packageDetails: selectedPackage,
        totalAmount: totalPrice,
        utrNumber: utrNumber.trim(),
        screenshotUrl: screenshotUrl, // Store Firebase Storage URL instead of base64
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create notification for E-PIN request
      await notificationService.createNotification({
        uid: user.uid,
        userId: user.userId || user.uid,
        title: 'E-PIN Request Submitted',
        message: `Your E-PIN request for ${packageName} package (₹${totalPrice}) has been submitted successfully. UTR: ${utrNumber.trim()}`,
        type: 'success',
        category: 'epin_request',
        data: {
          requestId: epinRequestDoc.id,
          packageName: packageName,
          amount: totalPrice,
          utrNumber: utrNumber.trim()
        }
      });
           
      toast.success('E-PIN request submitted successfully!');
      
      // Reset form
      setUtrNumber('');
      setScreenshot(null);
      setShowPaymentForm(false);
      setLoading(false);
      setUploadProgress(0);
      
      // Navigate back to request page after a short delay
      setTimeout(() => {
        navigate('/dashboard/epins/request');
      }, 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(`Failed to submit request: ${error.message}`);
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file using storage service
      const validation = storageService.validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
      setScreenshot(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/epin/request')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="text-lg" />
            <span>Back</span>
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Payment
            </h1>
          </motion.div>
        </div>
        
        {/* Package Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Package Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Selected Package</div>
              <div className="font-bold text-gray-800">
                {selectedPackage.total} E-PINs ({selectedPackage.paid} Paid + {selectedPackage.free} Free)
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Total Amount</div>
              <div className="font-bold text-emerald-600 text-2xl">₹{totalPrice.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
        
        {!showPaymentForm ? (
          <>
            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiCreditCard className="text-indigo-600" />
                Payment Methods
              </h3>
              
              {/* Payment Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">PhonePe</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="font-mono text-sm font-bold text-gray-800">6299261088</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">GPay</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="font-mono text-sm font-bold text-gray-800">6299261088</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Paytm</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="font-mono text-sm font-bold text-gray-800">6299261088</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">UPI ID</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="font-mono text-xs font-bold text-gray-800">helpingpin@axl</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm col-span-2 sm:col-span-1">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">QR Code</h4>
                  <img 
                    src="https://freeimage.host/i/KIUDbUv" 
                    alt="UPI QR Code" 
                    className="w-16 h-16 mx-auto rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Payment Done Button */}
            <motion.button
              onClick={handlePaymentDone}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <FiCheck className="text-lg" />
              <span>Payment Done</span>
            </motion.button>
          </>
        ) : (
          /* Payment Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiUpload className="text-indigo-600" />
              Payment Confirmation
            </h3>
            
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              <div>
                <label htmlFor="utrNumber" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  UTR / Transaction ID
                </label>
                <input
                  type="text"
                  id="utrNumber"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter UTR or Transaction ID"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="screenshot" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Upload Payment Screenshot
                </label>
                <input
                  type="file"
                  id="screenshot"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  required
                />
                {screenshot && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    File selected: {screenshot.name}
                  </p>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>
                        {uploadProgress > 0 && uploadProgress < 100 
                          ? `Uploading... ${uploadProgress}%` 
                          : 'Submitting...'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <FiUpload className="text-lg" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;