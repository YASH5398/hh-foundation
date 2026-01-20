import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';

export default function PaymentConfirmed() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-green-400 via-green-500 to-green-600">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 80 }}
        className="w-full max-w-md mx-auto rounded-3xl bg-white/90 shadow-2xl border border-green-200 p-8 flex flex-col items-center justify-center"
        style={{ minHeight: '320px' }}
      >
        <FiCheckCircle className="text-6xl text-green-500 mb-4 drop-shadow-lg animate-bounce" />
        <h2 className="text-2xl font-bold text-green-800 mb-2 text-center">Your Payment is Confirmed</h2>
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-lg text-green-700 text-center mb-4">Your ID is now active.<br/>You can now receive help from other users.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-green-800 transition-all text-lg"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
} 