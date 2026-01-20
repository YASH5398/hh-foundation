import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiCheck, FiImage, FiAlertCircle } from 'react-icons/fi';

const PaymentConfirmationSection = ({ 
  isVisible = false, 
  selectedMethod, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  if (!isVisible) return null;

  const validateForm = () => {
    const newErrors = {};
    
    if (!utrNumber.trim()) {
      newErrors.utr = 'UTR/Transaction ID is required';
    } else if (utrNumber.length < 6) {
      newErrors.utr = 'UTR/Transaction ID must be at least 6 characters';
    }
    
    if (!uploadedFile) {
      newErrors.file = 'Payment screenshot is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, file: 'Please upload an image file' });
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, file: 'File size must be less than 5MB' });
      return;
    }
    
    setUploadedFile(file);
    setErrors({ ...errors, file: null });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSubmit({ utr: utrNumber.trim(), screenshot: uploadedFile });
    } catch (error) {
      console.error('Error submitting payment proof:', error);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 mt-6 border border-green-200 shadow-lg">
            {/* Selected Payment Method */}
            {selectedMethod && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Selected Payment Method</h3>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiImage className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">{selectedMethod}</p>
                    <p className="text-sm text-blue-600">Complete your payment using this method</p>
                  </div>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Payment Confirmation
              </h3>
              <p className="text-sm text-gray-600">
                Please provide your payment details to complete the transaction
              </p>
            </div>

            {/* UTR Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                UTR/Transaction ID *
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value);
                  if (errors.utr) setErrors({ ...errors, utr: null });
                }}
                placeholder="Enter your UTR or Transaction ID"
                className={`
                  w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                  text-lg font-mono tracking-wide
                  ${errors.utr 
                    ? 'border-red-300 bg-red-50 focus:border-red-500' 
                    : 'border-gray-200 bg-white focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-4 focus:ring-blue-100
                `}
                disabled={isSubmitting}
              />
              {errors.utr && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-2 flex items-center"
                >
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.utr}
                </motion.p>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Screenshot *
              </label>
              
              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200 hover:bg-gray-50
                    ${isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : errors.file 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${isDragOver ? 'bg-blue-100' : 'bg-gray-200'}
                    `}>
                      <FiUpload className={`w-8 h-8 ${
                        isDragOver ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Upload Payment Screenshot
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Drag and drop your screenshot here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports: JPG, PNG, GIF (Max 5MB)
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              ) : (
                <div className="relative bg-white rounded-xl border-2 border-green-200 p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Payment screenshot"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">
                        {uploadedFile.name}
                      </h5>
                      <p className="text-sm text-gray-500 mb-2">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex items-center text-green-600 text-sm">
                        <FiImage className="w-4 h-4 mr-1" />
                        Screenshot uploaded successfully
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      disabled={isSubmitting}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {errors.file && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-2 flex items-center"
                >
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.file}
                </motion.p>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">
                📸 Upload Instructions
              </h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Take a clear screenshot of your payment confirmation</li>
                <li>• Ensure the UTR/Transaction ID is visible</li>
                <li>• Include the amount and receiver details</li>
                <li>• File should be less than 5MB</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold
                  shadow-lg hover:shadow-xl transition-all duration-200 flex-1
                  ${isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  }
                  text-white
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    <span>Confirm Payment Done</span>
                  </>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 flex-1 sm:flex-none"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentConfirmationSection;