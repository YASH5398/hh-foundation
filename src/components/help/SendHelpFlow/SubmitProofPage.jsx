import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiLoader, FiCamera, FiChevronRight, FiArrowLeft, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import StepIndicator from './StepIndicator';

/**
 * SubmitProofPage - Step 3 of Send Help Flow
 * Modern mobile-first design with horizontal stepper
 */
const SubmitProofPage = ({ receiver, amount = 300, onSubmit, onBack, isSubmitting = false }) => {
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicator */}
        <StepIndicator currentStep={3} totalSteps={4} />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          {/* Proof Upload Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Upload Payment Proof</h2>
              <p className="text-white/80 text-sm">Complete the final verification step</p>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* UTR / Transaction ID Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="utr" className="block text-sm font-bold text-slate-900 mb-3">
                  Transaction ID / UTR <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="utr"
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter transaction ID or UTR number"
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    maxLength={50}
                    disabled={isSubmitting || isUploading}
                  />
                  <AnimatePresence>
                    {utr.trim() && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <FiCheckCircle className="w-6 h-6 text-green-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Check your payment confirmation for the transaction ID
                </p>
              </motion.div>

              {/* Screenshot Upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  Payment Screenshot <span className="text-red-500">*</span>
                </label>
                <AnimatePresence mode="wait">
                  {screenshotPreview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative rounded-xl overflow-hidden shadow-md border-2 border-green-200 bg-green-50 p-4"
                    >
                      <img
                        src={screenshotPreview}
                        alt="Payment screenshot preview"
                        className="w-full h-auto rounded-lg max-h-80 object-contain bg-white"
                      />
                      <div className="absolute top-6 right-6 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleRemoveScreenshot}
                          disabled={isSubmitting || isUploading}
                          className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg"
                        >
                          <FiX className="w-5 h-5" />
                        </motion.button>
                        <label
                          htmlFor="screenshot-input"
                          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-lg"
                        >
                          <FiCamera className="w-5 h-5" />
                        </label>
                      </div>
                      <div className="absolute top-6 left-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          Uploaded
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.label
                      key="upload"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      htmlFor="screenshot-input"
                      className="block border-3 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer bg-white"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <FiCamera className="w-8 h-8 text-slate-600" />
                        </div>
                      </div>
                      <p className="text-slate-900 font-bold text-base mb-2">
                        Upload Payment Screenshot
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        PNG, JPG • Max 5MB
                      </p>
                      <span className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg">
                        <FiUpload className="w-5 h-5" />
                        Choose File
                      </span>
                    </motion.label>
                  )}
                </AnimatePresence>
                <input
                  id="screenshot-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting || isUploading}
                />
                <p className="text-xs text-slate-600 mt-2">
                  Include amount (₹{amount}), receiver's account, and transaction status
                </p>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <p className="font-bold text-blue-900 text-sm mb-3">Screenshot must include:</p>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Amount sent (₹{amount})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Receiver's UPI ID or Bank Account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Transaction confirmation (Success)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Transaction ID or UTR number</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 0.98 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  onClick={onBack}
                  disabled={isSubmitting || isUploading}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: isFormValid ? 1.02 : 1 }}
                  whileTap={{ scale: isFormValid ? 0.98 : 1 }}
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isFormValid
                      ? 'bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Continue</span>
                      <FiChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SubmitProofPage;
