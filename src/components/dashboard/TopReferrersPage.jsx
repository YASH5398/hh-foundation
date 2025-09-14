import React from 'react';
import { motion } from 'framer-motion';
import TopReferrers from './TopReferrers';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const TopReferrersPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-4xl mx-auto px-2 sm:px-3 lg:px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Top Referrers Leaderboard
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the most successful referrers in our community. 
              Rankings are based on referral count and updated in real-time.
            </p>
          </div>
        </div>

        {/* Top Referrers Component */}
        <TopReferrers />

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How to become a top referrer?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Invite Friends</h4>
              <p className="text-sm text-gray-600">
                Share your referral link with friends and family
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Help Them Succeed</h4>
              <p className="text-sm text-gray-600">
                Guide your referrals through the platform
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Earn Rewards</h4>
              <p className="text-sm text-gray-600">
                Get commissions and climb the leaderboard
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TopReferrersPage; 