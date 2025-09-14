import React from 'react';
import { motion } from 'framer-motion';
import { FiLogIn } from 'react-icons/fi';

const LoginRequired = () => {
  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
      >
        <FiLogIn className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to log in to access the Send Help feature.</p>
        <button
          onClick={handleLoginRedirect}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-200"
        >
          Go to Login
        </button>
      </motion.div>
    </div>
  );
};

export default LoginRequired;