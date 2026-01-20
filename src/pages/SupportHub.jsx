import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiClock,
  FiSettings,
  FiHeadphones,
  FiStar
} from 'react-icons/fi';

const SupportHub = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12 shadow-2xl"
        >
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
            <FiStar className="w-5 h-5 text-yellow-400" />
            <span className="text-white/90 font-medium">Premium Support Experience</span>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center"
          >
            <FiSettings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6"
          >
            Coming Soon
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto"
          >
            We're crafting an exceptional support experience for you. Our new premium support hub will be available soon with advanced features and 24/7 assistance.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          >
            <div className="flex items-center justify-center space-x-3 text-white/80 bg-white/5 rounded-xl p-4">
              <FiClock className="w-5 h-5 text-cyan-400" />
              <span>24/7 Premium Support</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-white/80 bg-white/5 rounded-xl p-4">
              <FiHeadphones className="w-5 h-5 text-purple-400" />
              <span>Live Expert Assistance</span>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full bg-white/10 rounded-full h-3 mb-4"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "80%" }}
              transition={{ delay: 1.2, duration: 1.5 }}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="text-white/60"
          >
            80% Complete - Almost Ready!
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportHub;