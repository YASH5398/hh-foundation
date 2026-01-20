import React from 'react';
import { motion } from 'framer-motion';

const TransactionHistory = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction History</h3>
          <p className="text-gray-500">Your transaction history will be displayed here.</p>
          <p className="text-sm text-gray-400 mt-2">This feature is coming soon.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionHistory;
