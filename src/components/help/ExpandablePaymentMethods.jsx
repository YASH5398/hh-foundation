import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiSmartphone, FiDollarSign, FiCheck } from 'react-icons/fi';
import { SiGooglepay, SiPhonepe } from 'react-icons/si';
import { FaUniversity } from 'react-icons/fa';

const ExpandablePaymentMethods = ({ 
  receiver, 
  isVisible = false, 
  onMethodSelect, 
  selectedMethod 
}) => {
  const [hoveredMethod, setHoveredMethod] = useState(null);

  if (!receiver) return null;

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: FiSmartphone,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      value: receiver.upi,
      description: 'Pay using any UPI app'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      icon: SiGooglepay,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      value: receiver.googlepay,
      description: 'Pay with Google Pay'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: SiPhonepe,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      value: receiver.phonepe,
      description: 'Pay with PhonePe'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: FaUniversity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      value: receiver.bankDetails,
      description: 'Direct bank transfer'
    }
  ];

  // Filter out methods that don't have values
  const availableMethods = paymentMethods.filter(method => {
    if (method.id === 'bank') {
      return method.value && (method.value.accountNumber || method.value.ifsc);
    }
    return method.value && method.value.trim() !== '';
  });

  const formatPaymentValue = (method) => {
    if (method.id === 'bank' && method.value) {
      return `${method.value.accountNumber || 'N/A'} (${method.value.ifsc || 'N/A'})`;
    }
    return method.value;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -20 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mt-6 border border-gray-200 shadow-lg">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Choose Payment Method
              </h3>
              <p className="text-sm text-gray-600">
                Select how you want to send payment to {receiver.name}
              </p>
            </div>

            {/* Payment Methods Grid */}
            {availableMethods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableMethods.map((method, index) => {
                  const IconComponent = method.icon;
                  const isSelected = selectedMethod === method.id;
                  const isHovered = hoveredMethod === method.id;
                  
                  return (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredMethod(method.id)}
                      onHoverEnd={() => setHoveredMethod(null)}
                      onClick={() => onMethodSelect(method.id)}
                      className={`
                        relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                        ${isSelected 
                          ? `bg-gradient-to-r ${method.color} text-white border-transparent shadow-lg` 
                          : `${method.bgColor} ${method.borderColor} hover:shadow-md`
                        }
                        ${isHovered && !isSelected ? 'transform scale-102' : ''}
                      `}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        >
                          <FiCheck className="w-4 h-4 text-green-600" />
                        </motion.div>
                      )}

                      {/* Method Icon and Name */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center
                          ${isSelected ? 'bg-white bg-opacity-20' : 'bg-white shadow-sm'}
                        `}>
                          <IconComponent 
                            className={`w-6 h-6 ${
                              isSelected ? 'text-white' : method.textColor
                            }`} 
                          />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            isSelected ? 'text-white' : 'text-gray-800'
                          }`}>
                            {method.name}
                          </h4>
                          <p className={`text-sm ${
                            isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
                          }`}>
                            {method.description}
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className={`
                        text-sm font-mono p-2 rounded-lg
                        ${isSelected 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-white text-gray-700'
                        }
                      `}>
                        {formatPaymentValue(method)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  No Payment Methods Available
                </h4>
                <p className="text-gray-500">
                  The receiver hasn't set up any payment methods yet.
                </p>
              </div>
            )}

            {/* Security Notice */}
            {availableMethods.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCheck className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-blue-800 mb-1">
                      Secure Payment
                    </h5>
                    <p className="text-xs text-blue-700">
                      Your payment information is encrypted and secure. Only send money to verified receivers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExpandablePaymentMethods;