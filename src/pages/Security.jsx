import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, UserCheck, AlertTriangle, CheckCircle, Server, Key, FileText, Users, Clock, Zap } from 'lucide-react';

const Security = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState(null);

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Data Protection',
      description: 'Advanced encryption and secure data handling',
      details: [
        '256-bit SSL encryption for all data transmission',
        'End-to-end encryption for sensitive information',
        'Regular security audits and penetration testing',
        'GDPR compliant data handling practices',
        'Secure cloud infrastructure with redundancy'
      ],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Lock,
      title: 'Account Security',
      description: 'Multi-layer protection for your account',
      details: [
        'Two-factor authentication (2FA) support',
        'Strong password requirements',
        'Account lockout after failed attempts',
        'Session timeout for inactive users',
        'Login notification alerts'
      ],
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: UserCheck,
      title: 'Identity Verification',
      description: 'Robust KYC and verification processes',
      details: [
        'Government ID verification required',
        'Phone number verification via OTP',
        'Email verification for all accounts',
        'Address verification for withdrawals',
        'Biometric verification options'
      ],
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description: 'Enterprise-grade security infrastructure',
      details: [
        'AWS/Google Cloud secure hosting',
        'DDoS protection and firewall systems',
        'Regular backup and disaster recovery',
        'Monitoring and intrusion detection',
        '99.9% uptime guarantee'
      ],
      color: 'from-orange-500 to-red-600'
    }
  ];

  const complianceStandards = [
    {
      name: 'PCI DSS',
      description: 'Payment Card Industry Data Security Standard',
      status: 'Certified',
      icon: CheckCircle
    },
    {
      name: 'ISO 27001',
      description: 'Information Security Management System',
      status: 'Compliant',
      icon: CheckCircle
    },
    {
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      status: 'Compliant',
      icon: CheckCircle
    },
    {
      name: 'SOC 2',
      description: 'Service Organization Control 2',
      status: 'Type II',
      icon: CheckCircle
    }
  ];

  const securityTips = [
    {
      icon: Key,
      title: 'Use Strong Passwords',
      description: 'Create unique passwords with mix of letters, numbers, and symbols',
      tips: [
        'Use at least 12 characters',
        'Include uppercase and lowercase letters',
        'Add numbers and special characters',
        'Avoid personal information',
        'Use different passwords for different accounts'
      ]
    },
    {
      icon: Eye,
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      tips: [
        'Use authenticator apps like Google Authenticator',
        'Keep backup codes in a safe place',
        'Never share your 2FA codes',
        'Update your phone number if changed',
        'Enable 2FA for email accounts too'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Recognize Phishing Attempts',
      description: 'Stay alert to fraudulent communications',
      tips: [
        'Check sender email addresses carefully',
        'Never click suspicious links',
        'Verify requests through official channels',
        'Look for spelling and grammar errors',
        'Be cautious of urgent payment requests'
      ]
    },
    {
      icon: Users,
      title: 'Protect Personal Information',
      description: 'Keep your sensitive data secure',
      tips: [
        'Never share login credentials',
        'Be cautious on public Wi-Fi',
        'Log out from shared devices',
        'Regularly review account activity',
        'Report suspicious activities immediately'
      ]
    }
  ];

  const incidentResponse = [
    {
      step: 1,
      title: 'Detection',
      description: 'Automated monitoring systems detect potential threats',
      time: '< 1 minute'
    },
    {
      step: 2,
      title: 'Assessment',
      description: 'Security team evaluates the threat level and impact',
      time: '< 5 minutes'
    },
    {
      step: 3,
      title: 'Response',
      description: 'Immediate containment and mitigation measures',
      time: '< 15 minutes'
    },
    {
      step: 4,
      title: 'Recovery',
      description: 'System restoration and service continuity',
      time: '< 30 minutes'
    },
    {
      step: 5,
      title: 'Analysis',
      description: 'Post-incident analysis and security improvements',
      time: '24-48 hours'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Security Overview', icon: Shield },
    { id: 'compliance', name: 'Compliance', icon: FileText },
    { id: 'tips', name: 'Security Tips', icon: Key },
    { id: 'incident', name: 'Incident Response', icon: AlertTriangle }
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
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Security <span className="text-blue-400">Features</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your security is our top priority. Learn about our comprehensive security measures and best practices.
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Security Overview */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Security Features Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-6">{feature.description}</p>
                  
                  <div className="space-y-3">
                    {feature.details.map((detail, detailIndex) => (
                      <motion.div
                        key={detailIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + detailIndex * 0.05 }}
                        className="flex items-center space-x-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Security Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20"
            >
              <h2 className="text-3xl font-bold text-white text-center mb-8">Security by Numbers</h2>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-white/80">Uptime Guarantee</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">256-bit</div>
                  <div className="text-white/80">SSL Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-white/80">Security Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">0</div>
                  <div className="text-white/80">Data Breaches</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Compliance Standards</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                We adhere to the highest industry standards and regulations to ensure your data and transactions are secure.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {complianceStandards.map((standard, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <standard.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{standard.name}</h3>
                      <span className="text-green-400 text-sm font-medium">{standard.status}</span>
                    </div>
                  </div>
                  <p className="text-gray-300">{standard.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Security Tips Tab */}
        {activeTab === 'tips' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Security Best Practices</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Follow these security tips to keep your account and personal information safe.
              </p>
            </div>
            
            <div className="space-y-6">
              {securityTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                    className="w-full p-6 text-left flex items-center space-x-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <tip.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{tip.title}</h3>
                      <p className="text-gray-400">{tip.description}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSection === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertTriangle className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  </button>
                  
                  <motion.div
                    initial={false}
                    animate={{
                      height: expandedSection === index ? 'auto' : 0,
                      opacity: expandedSection === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <div className="space-y-2">
                        {tip.tips.map((tipItem, tipIndex) => (
                          <div key={tipIndex} className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{tipItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Incident Response Tab */}
        {activeTab === 'incident' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Incident Response Process</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our rapid response system ensures quick detection, assessment, and resolution of security incidents.
              </p>
            </div>
            
            <div className="space-y-8">
              {incidentResponse.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-6"
                >
                  {/* Step Number */}
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">{step.step}</span>
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">{step.time}</span>
                      </div>
                    </div>
                    <p className="text-gray-300">{step.description}</p>
                  </div>
                  
                  {/* Connection Line */}
                  {index < incidentResponse.length - 1 && (
                    <div className="absolute left-8 mt-16 w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600"></div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Emergency Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl p-8 border border-white/20 text-center"
            >
              <AlertTriangle className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Security Emergency?</h2>
              <p className="text-white/90 mb-6">
                If you suspect a security breach or unauthorized access to your account, contact us immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
                >
                  Report Security Issue
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  Emergency Hotline
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Security;