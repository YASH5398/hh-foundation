import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, Star, Users, Zap, Shield, Bell, CreditCard, BarChart3, MessageCircle, QrCode, CheckCircle, ArrowRight, Play, Apple } from 'lucide-react';

const MobileApp = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [showQR, setShowQR] = useState(false);

  const appFeatures = [
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Get real-time updates on payments, level upgrades, and team activities',
      details: [
        'Push notifications for all transactions',
        'Level completion alerts',
        'Team member join notifications',
        'Payment reminders and confirmations',
        'System updates and announcements'
      ],
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: CreditCard,
      title: 'Easy Payments',
      description: 'Make payments and manage transactions on the go',
      details: [
        'UPI integration for instant payments',
        'Multiple payment method support',
        'Transaction history and receipts',
        'Payment status tracking',
        'Secure payment gateway'
      ],
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track your progress and earnings with detailed analytics',
      details: [
        'Live earnings dashboard',
        'Team performance metrics',
        'Level progression tracking',
        'Income vs investment analysis',
        'Goal setting and achievement'
      ],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage your team and track their progress efficiently',
      details: [
        'Team member directory',
        'Performance leaderboards',
        'Direct communication tools',
        'Team building resources',
        'Mentorship program access'
      ],
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Support',
      description: 'Get instant help with built-in chat and support features',
      details: [
        '24/7 live chat support',
        'AI-powered help assistant',
        'Video call support option',
        'FAQ and knowledge base',
        'Community forum access'
      ],
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Advanced security features to protect your account',
      details: [
        'Biometric authentication',
        'Two-factor authentication',
        'Device management',
        'Login activity monitoring',
        'Secure data encryption'
      ],
      color: 'from-red-500 to-pink-600'
    }
  ];

  const appStats = [
    { number: '50K+', label: 'Downloads', icon: Download },
    { number: '4.8', label: 'App Rating', icon: Star },
    { number: '25K+', label: 'Active Users', icon: Users },
    { number: '99.9%', label: 'Uptime', icon: Zap }
  ];

  const screenshots = [
    {
      title: 'Dashboard',
      description: 'Clean and intuitive dashboard with all key metrics'
    },
    {
      title: 'Payments',
      description: 'Easy payment interface with multiple options'
    },
    {
      title: 'Analytics',
      description: 'Detailed analytics and performance tracking'
    },
    {
      title: 'Team',
      description: 'Team management and communication tools'
    },
    {
      title: 'Support',
      description: 'Integrated support and help features'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      level: 'Level 3 Member',
      rating: 5,
      comment: 'The mobile app makes managing my helping plan so much easier. I can track everything on the go!'
    },
    {
      name: 'Priya Sharma',
      level: 'Level 2 Member',
      rating: 5,
      comment: 'Love the instant notifications and easy payment features. Very user-friendly interface.'
    },
    {
      name: 'Amit Patel',
      level: 'Level 3 Member',
      rating: 5,
      comment: 'Best app for managing my team and tracking progress. The analytics are very detailed.'
    }
  ];

  const systemRequirements = {
    android: {
      os: 'Android 6.0+',
      ram: '2GB RAM',
      storage: '100MB',
      network: '3G/4G/WiFi'
    },
    ios: {
      os: 'iOS 12.0+',
      ram: '2GB RAM',
      storage: '100MB',
      network: '3G/4G/WiFi'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Smartphone className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Mobile <span className="text-blue-400">App</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Take your helping journey anywhere with our powerful mobile application
        </p>
        
        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-black text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 hover:bg-gray-800 transition-all duration-300"
          >
            <Play className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs text-gray-300">Get it on</div>
              <div className="text-lg font-bold">Google Play</div>
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-black text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 hover:bg-gray-800 transition-all duration-300"
          >
            <Apple className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs text-gray-300">Download on the</div>
              <div className="text-lg font-bold">App Store</div>
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR(true)}
            className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 hover:bg-blue-600 transition-all duration-300"
          >
            <QrCode className="w-6 h-6" />
            <span>Scan QR Code</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* App Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          {appStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature List */}
            <div className="space-y-4">
              {appFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setActiveFeature(index)}
                  className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                    activeFeature === index
                      ? 'bg-white/20 border-blue-400'
                      : 'bg-white/10 border-white/20 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Feature Details */}
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${appFeatures[activeFeature].color} rounded-full flex items-center justify-center mb-6`}>
                {React.createElement(appFeatures[activeFeature].icon, { className: "w-8 h-8 text-white" })}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">{appFeatures[activeFeature].title}</h3>
              <p className="text-gray-300 mb-6">{appFeatures[activeFeature].description}</p>
              
              <div className="space-y-3">
                {appFeatures[activeFeature].details.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Screenshots Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">App Screenshots</h2>
          
          <div className="grid md:grid-cols-5 gap-6">
            {screenshots.map((screenshot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                {/* Phone Mockup */}
                <div className="bg-gray-800 rounded-3xl p-2 mx-auto mb-4 w-32 h-56 border-4 border-gray-700">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl w-full h-full flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{screenshot.title}</h3>
                <p className="text-gray-400 text-sm">{screenshot.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">What Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-300 mb-4 italic">"{testimonial.comment}"</p>
                
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-blue-400 text-sm">{testimonial.level}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">System Requirements</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Android Requirements */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Android</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Operating System</span>
                  <span className="text-white">{systemRequirements.android.os}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">RAM</span>
                  <span className="text-white">{systemRequirements.android.ram}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-white">{systemRequirements.android.storage}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">{systemRequirements.android.network}</span>
                </div>
              </div>
            </div>
            
            {/* iOS Requirements */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">iOS</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Operating System</span>
                  <span className="text-white">{systemRequirements.ios.os}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">RAM</span>
                  <span className="text-white">{systemRequirements.ios.ram}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-white">{systemRequirements.ios.storage}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">{systemRequirements.ios.network}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Download CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20">
            <Download className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Download Now & Get Started</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of users who are already managing their helping journey with our mobile app. Download now and start earning on the go!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download App</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Learn More</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Scan to Download</h3>
            <div className="w-48 h-48 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">Scan this QR code with your phone camera to download the app</p>
            <button
              onClick={() => setShowQR(false)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileApp;