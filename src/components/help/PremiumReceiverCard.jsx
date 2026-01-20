import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiPhone, FiMail, FiUser, FiSmartphone } from 'react-icons/fi';
import { FaWhatsapp, FaUniversity } from 'react-icons/fa';
import { SiGooglepay, SiPhonepe } from 'react-icons/si';

const PremiumReceiverCard = ({ 
  receiver, 
  onChatClick, 
  onActivateClick, 
  isActivated = false,
  loading = false 
}) => {
  if (!receiver) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border border-blue-200"
      >
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const getLevelBadgeColor = (level) => {
    const levelColors = {
      'Star': 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      'Silver': 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
      'Gold': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      'Platinum': 'bg-gradient-to-r from-purple-500 to-purple-700 text-white',
      'Diamond': 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
    };
    return levelColors[level] || 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
  };

  const formatContactInfo = (info) => {
    if (!info) return 'Not provided';
    if (typeof info === 'string') return info;
    return info.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-xl border border-blue-100 overflow-hidden relative"
    >
      {/* Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 rounded-t-2xl"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Profile Section */}
        <div className="flex items-start space-x-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img
              src={receiver.profileImage || '/images/default-avatar.png'}
              alt={receiver.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.src = '/images/default-avatar.png';
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800">
                {receiver.name || 'Unknown User'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(receiver.level)}`}>
                {receiver.level || 'Star'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              ID: {receiver.userId || receiver.id || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              Member since {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FiUser className="mr-2" />
            Contact Information
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            {receiver.phone && (
              <div className="flex items-center space-x-2">
                <FiPhone className="text-blue-500 w-4 h-4" />
                <span className="text-sm text-gray-700">
                  {formatContactInfo(receiver.phone)}
                </span>
              </div>
            )}
            
            {receiver.whatsapp && (
              <div className="flex items-center space-x-2">
                <FaWhatsapp className="text-green-500 w-4 h-4" />
                <span className="text-sm text-gray-700">
                  {formatContactInfo(receiver.whatsapp)}
                </span>
              </div>
            )}
            
            {receiver.email && (
              <div className="flex items-center space-x-2 sm:col-span-2">
                <FiMail className="text-purple-500 w-4 h-4" />
                <span className="text-sm text-gray-700">
                  {formatContactInfo(receiver.email)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FiSmartphone className="mr-2" />
            Payment Methods
          </h4>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {receiver.upi && receiver.upi.trim() !== '' && (
              <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <FiSmartphone className="text-purple-600 w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-purple-700">UPI</span>
                <span className="text-xs text-purple-600 truncate w-full text-center">{receiver.upi}</span>
              </div>
            )}
            
            {receiver.googlepay && receiver.googlepay.trim() !== '' && (
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <SiGooglepay className="text-blue-600 w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-blue-700">Google Pay</span>
                <span className="text-xs text-blue-600 truncate w-full text-center">{receiver.googlepay}</span>
              </div>
            )}
            
            {receiver.phonepe && receiver.phonepe.trim() !== '' && (
              <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <SiPhonepe className="text-indigo-600 w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-indigo-700">PhonePe</span>
                <span className="text-xs text-indigo-600 truncate w-full text-center">{receiver.phonepe}</span>
              </div>
            )}
            
            {receiver.bankDetails && (receiver.bankDetails.accountNumber || receiver.bankDetails.ifsc) && (
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <FaUniversity className="text-green-600 w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-green-700">Bank</span>
                <span className="text-xs text-green-600 truncate w-full text-center">
                  {receiver.bankDetails.accountNumber || 'Available'}
                </span>
              </div>
            )}
          </div>
          
          {!receiver.upi && !receiver.googlepay && !receiver.phonepe && !receiver.bankDetails && (
            <div className="text-center py-4">
              <span className="text-sm text-gray-500">No payment methods available</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChatClick?.(receiver)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>Chat with Receiver</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onActivateClick}
            className={`flex items-center justify-center px-6 py-3 ${
              isActivated 
                ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                : 'bg-gradient-to-r from-green-500 to-green-600'
            } text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none`}
            disabled={isActivated}
          >
            {isActivated ? 'Payment Methods Shown' : 'Activate Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumReceiverCard;