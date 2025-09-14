import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, CheckCircle, DollarSign, TrendingUp, Shield, Clock, Award, Play, ChevronDown, ChevronUp } from 'lucide-react';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Register & Complete KYC',
      description: 'Create your account with valid details and complete KYC verification for secure transactions.',
      icon: Users,
      details: [
        'Provide valid personal information',
        'Upload required KYC documents',
        'Wait for verification (24-48 hours)',
        'Receive confirmation email'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Choose Your Level',
      description: 'Select your starting level based on your helping capacity and goals.',
      icon: TrendingUp,
      details: [
        'Level 1: ₹550 activation fee',
        'Level 2: ₹1,100 activation fee',
        'Level 3: ₹2,200 activation fee',
        'Higher levels = Higher returns'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'Make Your First Help',
      description: 'Send help to your assigned upline member within 24 hours of activation.',
      icon: DollarSign,
      details: [
        'Receive upline member details',
        'Transfer exact amount via provided method',
        'Upload payment proof',
        'Wait for confirmation'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 4,
      title: 'Receive Help',
      description: 'Start receiving help from new members joining under your network.',
      icon: Award,
      details: [
        'Get downline member assignments',
        'Receive help payments',
        'Confirm received payments',
        'Maintain active status'
      ],
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 5,
      title: 'Upgrade & Grow',
      description: 'Upgrade to higher levels for increased earning potential and benefits.',
      icon: TrendingUp,
      details: [
        'Complete current level cycle',
        'Choose higher level upgrade',
        'Pay upgrade activation fee',
        'Enjoy increased benefits'
      ],
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const levelInfo = [
    {
      level: 1,
      activation: '₹550',
      help: '₹500',
      positions: '9 positions',
      earning: '₹4,500',
      upgrade: '₹1,100',
      color: 'bg-green-500'
    },
    {
      level: 2,
      activation: '₹1,100',
      help: '₹1,000',
      positions: '9 positions',
      earning: '₹9,000',
      upgrade: '₹2,200',
      color: 'bg-blue-500'
    },
    {
      level: 3,
      activation: '₹2,200',
      help: '₹2,000',
      positions: '9 positions',
      earning: '₹18,000',
      upgrade: 'Max Level',
      color: 'bg-purple-500'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'All payments are peer-to-peer with KYC verification for maximum security.'
    },
    {
      icon: Clock,
      title: '24-Hour Rule',
      description: 'Quick payment processing with 24-hour payment confirmation requirement.'
    },
    {
      icon: Users,
      title: '3x3 Matrix System',
      description: 'Structured 3x3 matrix ensures fair distribution and growth opportunities.'
    },
    {
      icon: TrendingUp,
      title: 'Level Upgrades',
      description: 'Progressive level system with increasing benefits and earning potential.'
    }
  ];

  const faqs = [
    {
      question: 'How does the 3x3 matrix system work?',
      answer: 'In our 3x3 matrix system, each member can have a maximum of 3 direct referrals, and the matrix goes 3 levels deep. This creates 9 total positions (3 + 3 + 3). When all 9 positions are filled, you complete the level and can upgrade to the next level.'
    },
    {
      question: 'What happens if I don\'t pay within 24 hours?',
      answer: 'The 24-hour payment rule is strictly enforced. If payment is not made within 24 hours of receiving upline details, your account may be temporarily suspended. You\'ll need to contact support to reactivate your account.'
    },
    {
      question: 'Can I upgrade to multiple levels at once?',
      answer: 'No, you must complete each level sequentially. You can only upgrade to the next immediate level after completing your current level\'s 3x3 matrix.'
    },
    {
      question: 'Is there a refund policy?',
      answer: 'Due to the peer-to-peer nature of our helping plan, refunds are not available once you\'ve been activated and made your first help payment. Please read our terms carefully before joining.'
    },
    {
      question: 'How do I know when to upgrade?',
      answer: 'You\'ll receive notifications in your dashboard when your current level\'s matrix is complete. You can then choose to upgrade to the next level to continue earning.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Play className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            How It <span className="text-blue-400">Works</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Understanding the HH Foundation peer-to-peer helping plan system
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Simple 5-Step Process</h2>
          
          {/* Desktop Steps */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className="grid grid-cols-5 gap-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative"
                  >
                    {/* Step Circle */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mb-4 mx-auto relative z-10`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Step Content */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-400 text-sm mb-4">{step.description}</p>
                      
                      {/* Details */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="text-gray-300 text-xs flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Steps */}
          <div className="lg:hidden space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start space-x-4"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <ul className="space-y-1">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="text-gray-300 text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Level Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Level Structure & Earnings</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {levelInfo.map((level, index) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 ${level.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-white font-bold text-xl">L{level.level}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Level {level.level}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Activation Fee</span>
                    <span className="text-white font-semibold">{level.activation}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Help Amount</span>
                    <span className="text-white font-semibold">{level.help}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Matrix Size</span>
                    <span className="text-white font-semibold">{level.positions}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Total Earning</span>
                    <span className="text-green-400 font-bold">{level.earning}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Upgrade Cost</span>
                    <span className="text-blue-400 font-semibold">{level.upgrade}</span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full mt-6 ${level.color} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300`}
                >
                  Choose Level {level.level}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center hover:border-white/40 transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-semibold">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: expandedFaq === index ? 'auto' : 0,
                    opacity: expandedFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Helping?</h2>
            <p className="text-gray-200 mb-6 max-w-2xl mx-auto">
              Join thousands of members who are already helping each other and earning through our proven system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Contact Support
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;