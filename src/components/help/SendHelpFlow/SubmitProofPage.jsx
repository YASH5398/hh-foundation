import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiLoader, FiCamera, FiChevronRight, FiArrowLeft, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * SubmitProofPage - Step 3 of Send Help Flow (Modern Mobile-First Design)
 * Screenshot upload with preview and UTR number input
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-zinc-100 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm"
            >
              3
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Step 3</p>
              <p className="text-xs text-slate-600">Payment Proof</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase">of 4</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-8 mb-6"
        >
          {/* Header */}
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Upload Payment Proof</h2>
          <p className="text-slate-600 text-sm mb-6">Complete the final verification step</p>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* UTR / Transaction ID Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label htmlFor="utr" className="block text-xs uppercase font-semibold text-slate-700 mb-2 tracking-wide">
                Transaction ID / UTR <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="utr"
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium text-slate-900 placeholder-slate-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Check payment confirmation for the transaction ID
              </p>
            </motion.div>

            {/* Screenshot Upload */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-xs uppercase font-semibold text-slate-700 mb-2 tracking-wide">
                Payment Screenshot <span className="text-red-500">*</span>
              </label>
              <AnimatePresence mode="wait">
                {screenshotPreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-slate-50 p-3"
                  >
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="w-full h-auto rounded-lg max-h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRemoveScreenshot}
                        disabled={isSubmitting || isUploading}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </motion.button>
                      <label
                        htmlFor="screenshot-input"
                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <FiCamera className="w-4 h-4" />
                      </label>
                    </div>
                    <div className="absolute top-2 right-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                      >
                        <FiCheckCircle className="w-3 h-3" />
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
                    className="block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FiCamera className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                    <p className="text-slate-900 font-semibold text-sm mb-1">
                      Upload Payment Screenshot
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      PNG, JPG • Max 5MB
                    </p>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors">
                      <FiUpload className="w-4 h-4" />
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
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900"
          >
            <p className="font-semibold text-sm mb-2">Screenshot must include:</p>
            <ul className="space-y-1 text-xs ml-4">
              <li>✓ Amount sent (₹{amount})</li>
              <li>✓ Receiver's UPI ID or Bank Account</li>
              <li>✓ Transaction confirmation (Success)</li>
              <li>✓ Transaction ID or UTR number</li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 0.98 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              onClick={onBack}
              disabled={isSubmitting || isUploading}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: isFormValid ? 1.02 : 1 }}
              whileTap={{ scale: isFormValid ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                isFormValid
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Submit & Continue
                  <FiChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SubmitProofPage;
