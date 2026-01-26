import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiLoader, FiCamera, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * PaymentProofForm Component
 * Form for uploading payment screenshot and entering UTR/Transaction ID
 */
const PaymentProofForm = ({ 
  onSubmit, 
  onBack, 
  isSubmitting = false, 
  receiver,
  paymentAmount = 300
}) => {
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (event) => setScreenshotPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!utr.trim()) {
      toast.error('Please enter UTR/Transaction ID');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    // Call parent handler
    await onSubmit({
      utr: utr.trim(),
      screenshot,
      screenshotPreview
    });
  };

  const isFormValid = utr.trim() && screenshot && !isSubmitting && !isUploading;

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
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Payment Proof</h2>
        <p className="text-sm text-gray-600">
          Upload screenshot and transaction ID
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 mb-6">
        {/* UTR / Transaction ID Input */}
        <div>
          <label htmlFor="utr" className="block text-sm font-semibold text-gray-700 mb-2">
            UTR / Transaction ID <span className="text-red-600">*</span>
          </label>
          <input
            id="utr"
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Enter 12-digit UTR or transaction ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
            maxLength={50}
            disabled={isSubmitting || isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            This appears in your transaction receipt
          </p>
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Screenshot <span className="text-red-600">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200 bg-gray-50">
            {screenshotPreview ? (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative inline-block">
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot preview"
                    className="max-h-48 rounded-lg shadow-md border border-gray-200"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleRemoveScreenshot}
                    disabled={isSubmitting || isUploading}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Remove
                  </button>
                  <label
                    htmlFor="screenshot-input"
                    className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Change
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FiCamera className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-1">
                    Upload payment screenshot
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </div>
                <label
                  htmlFor="screenshot-input"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 font-medium disabled:opacity-50"
                >
                  <FiUpload className="w-4 h-4" />
                  Choose File
                </label>
              </div>
            )}
            <input
              id="screenshot-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting || isUploading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Screenshot should clearly show the transaction amount and confirmation
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-xs text-blue-800">
        <p className="font-semibold mb-1">📝 What to include in screenshot:</p>
        <ul className="list-disc list-inside space-y-1 text-xs ml-1">
          <li>Transaction amount (₹{paymentAmount})</li>
          <li>Receiver's UPI ID or Bank Account</li>
          <li>Transaction status (Success/Completed)</li>
          <li>Transaction ID or UTR number</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting || isUploading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl ${
            isFormValid
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : isUploading ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Payment Proof'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentProofForm;
