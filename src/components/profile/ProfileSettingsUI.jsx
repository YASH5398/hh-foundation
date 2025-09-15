import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircleIcon, 
  CameraIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { getProfileImageUrl, hasCustomProfileImage } from '../../utils/profileUtils';

/**
 * ProfileSettingsUI - A modern, professional Profile Settings component
 * This is a presentation-only component that accepts props and calls handlers from parent
 */
const ProfileSettingsUI = ({
  user = {},
  onChange,
  onSave,
  onCancel,
  onUploadAvatar,
  isSaving = false
}) => {
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Handle input changes
  const handleInputChange = (fieldName, value) => {
    if (onChange) {
      onChange(fieldName, value);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
    }
  };

  // Copy to clipboard functionality (UI only)
  const handleCopyToClipboard = async (value, fieldName) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Reset form to default values
  const handleReset = () => {
    // This would typically call a parent handler to reset form
    if (onChange) {
      // Reset key fields to empty or default values
      onChange('fullName', '');
      onChange('phone', '');
      onChange('whatsapp', '');
      onChange('bankName', '');
      onChange('accountNumber', '');
      onChange('ifscCode', '');
      onChange('upiId', '');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        {/* Main Container */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            <p className="text-indigo-100 mt-1">Manage your account information and preferences</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Avatar */}
              <div className="lg:col-span-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-center border border-gray-200"
                >
                  <div className="relative inline-block">
                    {/* Avatar Display */}
                    <div className="relative group">
                      <img
                        src={getProfileImageUrl(user)}
                        alt="Profile Avatar"
                        className="w-32 h-32 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          e.target.src = getProfileImageUrl(null); // Fallback to default
                        }}
                      />
                      
                      {/* Hover Overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={() => document.getElementById('avatar-upload').click()}
                      >
                        <div className="text-white text-center">
                          <CameraIcon className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-sm font-medium">Change</span>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Upload profile picture"
                    />
                  </div>
                  
                  {/* Change Profile Picture Button */}
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload').click()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                  >
                    <CameraIcon className="w-4 h-4" />
                    Change Profile Picture
                  </button>
                  
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {user.fullName || 'Your Name'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {user.email || 'your.email@example.com'}
                  </p>
                </motion.div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-2">
                <form className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={user.fullName || ''}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={user.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        id="whatsapp"
                        type="tel"
                        value={user.whatsapp || ''}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    {/* Sponsor ID (Read-only) */}
                    <div className="md:col-span-2">
                      <label htmlFor="sponsorId" className="block text-sm font-medium text-gray-700 mb-2">
                        Sponsor ID
                      </label>
                      <input
                        id="sponsorId"
                        type="text"
                        value={user.sponsorId || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="SPONSOR123"
                      />
                    </div>
                  </div>

                  {/* Payment Information - Collapsible */}
                  <motion.div
                    initial={false}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
                      className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors duration-200"
                      aria-expanded={isPaymentExpanded}
                      aria-controls="payment-details"
                    >
                      <span className="text-lg font-medium text-gray-900">Payment Details</span>
                      <motion.div
                        animate={{ rotate: isPaymentExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isPaymentExpanded && (
                        <motion.div
                          id="payment-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 space-y-6">
                            {/* Bank Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                                  Bank Name
                                </label>
                                <input
                                  id="bankName"
                                  type="text"
                                  value={user.bankName || ''}
                                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                  placeholder="State Bank of India"
                                />
                              </div>

                              <div>
                                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                  Account Number
                                </label>
                                <div className="relative">
                                  <input
                                    id="accountNumber"
                                    type="text"
                                    value={user.accountNumber || ''}
                                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="1234567890"
                                  />
                                  {user.accountNumber && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(user.accountNumber, 'accountNumber')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                      aria-label="Copy account number"
                                    >
                                      {copiedField === 'accountNumber' ? (
                                        <CheckIcon className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                                  IFSC Code
                                </label>
                                <div className="relative">
                                  <input
                                    id="ifscCode"
                                    type="text"
                                    value={user.ifscCode || ''}
                                    onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="SBIN0001234"
                                  />
                                  {user.ifscCode && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(user.ifscCode, 'ifscCode')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                      aria-label="Copy IFSC code"
                                    >
                                      {copiedField === 'ifscCode' ? (
                                        <CheckIcon className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                                  UPI ID / GPay / PhonePe
                                </label>
                                <div className="relative">
                                  <input
                                    id="upiId"
                                    type="text"
                                    value={user.upiId || ''}
                                    onChange={(e) => handleInputChange('upiId', e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="yourname@paytm"
                                  />
                                  {user.upiId && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(user.upiId, 'upiId')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                      aria-label="Copy UPI ID"
                                    >
                                      {copiedField === 'upiId' ? (
                                        <CheckIcon className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200 underline"
                    >
                      Reset to default
                    </button>

                    <div className="flex gap-4">
                      <motion.button
                        type="button"
                        onClick={onCancel}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium"
                      >
                        Cancel
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        whileHover={{ scale: isSaving ? 1 : 1.02 }}
                        whileTap={{ scale: isSaving ? 1 : 0.98 }}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSettingsUI;