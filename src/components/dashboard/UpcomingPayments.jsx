import React from 'react';
import { motion } from 'framer-motion';
import PaymentJourneyMotion from '../common/PaymentJourneyMotion';
import { useAuth } from '../../context/AuthContext';

const UpcomingPayments = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-4">
            Your Upcoming Payments
          </h1>
          <p className="text-lg text-gray-600">
            Here's what you can earn at each level
          </p>
        </motion.div>

        {/* Star Level - ALWAYS VISIBLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">⭐</div>
            <h2 className="text-2xl font-bold text-yellow-600">Star Level</h2>
            <span className="ml-auto text-lg font-semibold text-green-600">₹900</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
                className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-4 text-center border-2 border-yellow-200"
              >
                <div className="text-2xl font-bold text-yellow-800">₹300</div>
                <div className="text-sm text-yellow-600">User {i + 1}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center text-gray-600">
            <div className="font-semibold">3 users × ₹300 = ₹900</div>
            <div className="text-sm mt-1">This is your starting point</div>
          </div>
        </motion.div>

        {/* Higher Levels Preview */}
        <div className="space-y-4">
          {[
            { level: 'Silver', icon: '🥈', amount: 5400, users: 9, perUser: 600, color: 'from-gray-100 to-gray-200', border: 'border-gray-300' },
            { level: 'Gold', icon: '🥇', amount: 54000, users: 27, perUser: 2000, color: 'from-yellow-100 to-yellow-200', border: 'border-yellow-300' },
            { level: 'Platinum', icon: '💎', amount: 1620000, users: 81, perUser: 20000, color: 'from-slate-100 to-slate-200', border: 'border-slate-300' },
            { level: 'Diamond', icon: '👑', amount: 486000000, users: 243, perUser: 200000, color: 'from-blue-100 to-purple-200', border: 'border-blue-300' }
          ].map((levelData, index) => (
            <motion.div
              key={levelData.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.3 }}
              className={`rounded-xl shadow-md border-2 ${levelData.border} p-6 bg-gradient-to-r ${levelData.color} opacity-75`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{levelData.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{levelData.level} Level</h3>
                    <div className="text-sm text-gray-600">
                      {levelData.users} users × ₹{levelData.perUser.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ₹{levelData.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Journey Video Icon */}
        <div className="mt-8 text-center">
          <PaymentJourneyMotion mode="icon" user={user} />
        </div>
      </div>
    </div>
  );
};

export default UpcomingPayments; 