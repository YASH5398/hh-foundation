import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiClock, FiArrowRight, FiGrid, FiUser } from 'react-icons/fi';
import TransferEpin from './TransferEpin';
import RequestEpin from './RequestEpin';

import EpinHistory from './EpinHistory';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { 
    key: 'transfer', 
    label: 'Transfer E-PIN', 
    icon: FiArrowRight, 
    description: 'Transfer E-PINs and view available count',
    color: 'from-purple-500 to-violet-600'
  },
  { 
    key: 'history', 
    label: 'E-PIN History', 
    icon: FiClock, 
    description: 'View transaction history',
    color: 'from-orange-500 to-red-600'
  }
];

const EpinDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transfer');

  const renderContent = () => {
    switch (activeTab) {
      case 'transfer':
        return <TransferEpin />;
      case 'history':
        return <EpinHistory />;
      default:
        return <TransferEpin />;
    }
  };

  const activeTabData = TABS.find(tab => tab.key === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-lg rounded-full p-4 mr-4">
                <FiGrid className="text-3xl" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  E-PIN Management
                </h1>
                <p className="text-indigo-100 text-lg">
                  Manage your E-PINs with ease and efficiency
                </p>
              </div>
            </div>
            
            {user && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-6 inline-block">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <FiUser className="text-xl" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-indigo-100">Welcome back,</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-0 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-2 py-6"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group relative flex flex-col items-center space-y-2 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 min-w-[140px] ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-xl shadow-${tab.color.split('-')[1]}-500/25`
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200'
                  }`}
                >
                  <div className={`p-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold">{tab.label}</span>
                    <p className={`text-xs mt-1 transition-all duration-300 ${
                      isActive 
                        ? 'text-white/80' 
                        : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 text-sm text-gray-600"
        >
          <span>E-PIN Management</span>
          <span>/</span>
          <span className={`font-semibold bg-gradient-to-r ${activeTabData?.color} bg-clip-text text-transparent`}>
            {activeTabData?.label}
          </span>
        </motion.div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="w-full"
          >
            {/* Content Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 mb-6"
            >
              <div className="flex items-center space-x-4">
                <div className={`bg-gradient-to-r ${activeTabData?.color} rounded-full p-3`}>
                  {activeTabData?.icon && <activeTabData.icon className="text-white text-xl" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{activeTabData?.label}</h2>
                  <p className="text-gray-600">{activeTabData?.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Component Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Need help? Contact our support team for assistance with E-PIN management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpinDashboard;