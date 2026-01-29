import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeadset, FaTimes, FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa';
import supportConfig from '../../config/supportConfig';

const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const supportOptions = [
    {
      icon: <FaEnvelope className="text-2xl" />,
      label: 'Email Support',
      action: () => {
        window.open('mailto:support@helpinghandsfoundation.in', '_blank');
      },
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Send us an email'
    },
    {
      icon: <FaPhone className="text-2xl" />,
      label: 'Call Support',
      action: () => {
        window.open('tel:+916299261088', '_blank');
      },
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Call us directly'
    },
    {
      icon: <FaHeadset className="text-2xl" />,
      label: 'Raise Ticket',
      action: () => {
        window.open('https://helpinghandsfoundation.in/support', '_blank');
      },
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Create a support ticket'
    }
  ];

  return (
    <>
      {/* Floating Support Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {/* Main Support Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Support"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaTimes className="text-2xl" />
              </motion.div>
            ) : (
              <motion.div
                key="support"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaHeadset className="text-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Support Options Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <h3 className="text-lg font-bold">Need Help?</h3>
                <p className="text-sm opacity-90">We're here to support you {supportConfig.supportHours}</p>
              </div>

              {/* Support Options */}
              <div className="p-4 space-y-3">
                {supportOptions.map((option, index) => (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl text-white ${option.color} transition-all duration-200 hover:scale-105`}
                  >
                    <div className="flex-shrink-0">
                      {option.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs opacity-90">{option.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-600">
                  {supportConfig.domain}
                </p>
                <p className="text-xs text-gray-500">
                  Available {supportConfig.supportHours} for your support
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportButton; 