import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Award, CheckCircle, ArrowRight, Calculator, Clock, Star, Target } from 'lucide-react';

const Levels = () => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);

  const levels = [
    {
      id: 1,
      name: 'Level 1',
      activationFee: 550,
      helpAmount: 500,
      adminFee: 50,
      positions: 9,
      totalEarning: 4500,
      upgradeCost: 1100,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500',
      description: 'Perfect for beginners to start their helping journey',
      features: [
        '3x3 Matrix System',
        '9 Total Positions',
        'Basic Support Access',
        'Mobile App Access',
        'Payment Tracking',
        'Level 2 Upgrade Option'
      ],
      benefits: [
        'Low entry barrier',
        'Learn the system',
        'Build initial network',
        'Earn while learning'
      ]
    },
    {
      id: 2,
      name: 'Level 2',
      activationFee: 1100,
      helpAmount: 1000,
      adminFee: 100,
      positions: 9,
      totalEarning: 9000,
      upgradeCost: 2200,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500',
      description: 'Enhanced earning potential with better support',
      features: [
        '3x3 Matrix System',
        '9 Total Positions',
        'Priority Support',
        'Advanced Analytics',
        'Team Building Tools',
        'Level 3 Upgrade Option'
      ],
      benefits: [
        'Double the earnings',
        'Priority support',
        'Advanced features',
        'Better network growth'
      ]
    },
    {
      id: 3,
      name: 'Level 3',
      activationFee: 2200,
      helpAmount: 2000,
      adminFee: 200,
      positions: 9,
      totalEarning: 18000,
      upgradeCost: null,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500',
      description: 'Maximum earning potential with premium benefits',
      features: [
        '3x3 Matrix System',
        '9 Total Positions',
        'VIP Support Access',
        'Premium Analytics',
        'Leadership Tools',
        'Maximum Level Achieved'
      ],
      benefits: [
        'Highest earnings',
        'VIP treatment',
        'Leadership recognition',
        'Maximum network potential'
      ]
    }
  ];

  const comparisonFeatures = [
    { name: 'Activation Fee', level1: '₹550', level2: '₹1,100', level3: '₹2,200' },
    { name: 'Help Amount', level1: '₹500', level2: '₹1,000', level3: '₹2,000' },
    { name: 'Admin Fee', level1: '₹50', level2: '₹100', level3: '₹200' },
    { name: 'Matrix Positions', level1: '9', level2: '9', level3: '9' },
    { name: 'Total Earning', level1: '₹4,500', level2: '₹9,000', level3: '₹18,000' },
    { name: 'ROI Percentage', level1: '818%', level2: '818%', level3: '818%' },
    { name: 'Support Level', level1: 'Basic', level2: 'Priority', level3: 'VIP' },
    { name: 'Analytics', level1: 'Basic', level2: 'Advanced', level3: 'Premium' }
  ];

  const upgradeProcess = [
    {
      step: 1,
      title: 'Complete Current Level',
      description: 'Fill all 9 positions in your current level matrix',
      icon: Target
    },
    {
      step: 2,
      title: 'Receive Upgrade Notification',
      description: 'Get notified when you\'re eligible for upgrade',
      icon: Award
    },
    {
      step: 3,
      title: 'Pay Upgrade Fee',
      description: 'Pay the activation fee for the next level',
      icon: DollarSign
    },
    {
      step: 4,
      title: 'Start New Level',
      description: 'Begin earning at the higher level with increased benefits',
      icon: TrendingUp
    }
  ];

  const selectedLevelData = levels.find(level => level.id === selectedLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Level <span className="text-blue-400">Information</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Understand our 3-level system and choose the right level for your goals
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Level Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8 mb-16"
        >
          {levels.map((level, index) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => setSelectedLevel(level.id)}
              className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer ${
                selectedLevel === level.id
                  ? 'border-blue-400 scale-105'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {/* Level Badge */}
              <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${level.bgColor} text-white px-6 py-2 rounded-full font-bold`}>
                {level.name}
              </div>
              
              {/* Level Icon */}
              <div className={`w-20 h-20 bg-gradient-to-r ${level.color} rounded-full flex items-center justify-center mx-auto mb-6 mt-4`}>
                <span className="text-white font-bold text-2xl">L{level.id}</span>
              </div>
              
              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">₹{level.activationFee.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Activation Fee</div>
              </div>
              
              {/* Key Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Help Amount</span>
                  <span className="text-white font-semibold">₹{level.helpAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Total Earning</span>
                  <span className="text-green-400 font-bold">₹{level.totalEarning.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">ROI</span>
                  <span className="text-yellow-400 font-bold">818%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Upgrade Cost</span>
                  <span className="text-blue-400 font-semibold">
                    {level.upgradeCost ? `₹${level.upgradeCost.toLocaleString()}` : 'Max Level'}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-300 text-sm text-center mb-6">{level.description}</p>
              
              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full ${level.bgColor} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300`}
              >
                Choose {level.name}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Level Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {selectedLevelData.name} Details
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                Features Included
              </h3>
              <div className="space-y-3">
                {selectedLevelData.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Benefits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                Key Benefits
              </h3>
              <div className="space-y-3">
                {selectedLevelData.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Level Comparison</h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-white font-semibold">Feature</th>
                    <th className="text-center p-4 text-green-400 font-semibold">Level 1</th>
                    <th className="text-center p-4 text-blue-400 font-semibold">Level 2</th>
                    <th className="text-center p-4 text-purple-400 font-semibold">Level 3</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-gray-300 font-medium">{feature.name}</td>
                      <td className="p-4 text-center text-white">{feature.level1}</td>
                      <td className="p-4 text-center text-white">{feature.level2}</td>
                      <td className="p-4 text-center text-white">{feature.level3}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Upgrade Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Upgrade Process</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {upgradeProcess.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="relative"
              >
                {/* Connection Line */}
                {index < upgradeProcess.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform translate-x-0 z-0"></div>
                )}
                
                {/* Step Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm text-blue-400 font-medium mb-2">Step {step.step}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Calculator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20">
            <Calculator className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Calculate Your Potential</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Use our earnings calculator to see how much you can earn at each level and plan your upgrade strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCalculator(true)}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Calculator className="w-5 h-5" />
                <span>Open Calculator</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Levels;