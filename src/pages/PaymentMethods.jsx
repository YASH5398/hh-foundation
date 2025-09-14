import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Building2, Shield, CheckCircle, AlertCircle, Clock, DollarSign, Lock, Zap, Users, TrendingUp } from 'lucide-react';

const PaymentMethods = () => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [showFAQ, setShowFAQ] = useState({});

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Instant payments using UPI apps like PhonePe, Google Pay, Paytm',
      processingTime: 'Instant',
      fees: 'Free',
      minAmount: 100,
      maxAmount: 100000,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500',
      features: [
        'Instant activation',
        '24/7 availability',
        'No additional charges',
        'Secure & encrypted',
        'Direct bank transfer'
      ],
      supportedApps: ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay'],
      steps: [
        'Select UPI as payment method',
        'Enter your UPI ID or scan QR code',
        'Confirm payment in your UPI app',
        'Receive instant confirmation'
      ]
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building2,
      description: 'Direct bank transfer through internet banking',
      processingTime: '2-5 minutes',
      fees: 'Free',
      minAmount: 100,
      maxAmount: 200000,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500',
      features: [
        'All major banks supported',
        'High transaction limits',
        'Secure bank gateway',
        'Transaction history',
        'Instant confirmation'
      ],
      supportedBanks: ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOI', 'Canara'],
      steps: [
        'Select your bank',
        'Login to net banking',
        'Authorize the payment',
        'Receive payment confirmation'
      ]
    },
    {
      id: 'cards',
      name: 'Debit/Credit Cards',
      icon: CreditCard,
      description: 'Pay using your debit or credit cards',
      processingTime: 'Instant',
      fees: '2% (Credit Cards)',
      minAmount: 100,
      maxAmount: 150000,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500',
      features: [
        'Visa & Mastercard accepted',
        'EMI options available',
        'International cards supported',
        'Secure 3D authentication',
        'Instant processing'
      ],
      supportedCards: ['Visa', 'Mastercard', 'RuPay', 'American Express'],
      steps: [
        'Enter card details',
        'Verify with OTP/PIN',
        'Complete 3D secure authentication',
        'Payment processed instantly'
      ]
    }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'SSL Encryption',
      description: 'All transactions are protected with 256-bit SSL encryption'
    },
    {
      icon: Lock,
      title: 'PCI Compliance',
      description: 'We follow PCI DSS standards for secure payment processing'
    },
    {
      icon: CheckCircle,
      title: 'Fraud Protection',
      description: 'Advanced fraud detection and prevention systems'
    },
    {
      icon: Users,
      title: 'Trusted Gateway',
      description: 'Payments processed through trusted payment gateways'
    }
  ];

  const faqs = [
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept UPI payments, Net Banking, and Debit/Credit cards. UPI is the fastest and most convenient option with instant activation.'
    },
    {
      question: 'Are there any transaction fees?',
      answer: 'UPI and Net Banking payments are completely free. Credit card payments have a 2% processing fee. Debit card payments are free.'
    },
    {
      question: 'How long does payment processing take?',
      answer: 'UPI and card payments are processed instantly. Net Banking takes 2-5 minutes. Your account will be activated immediately after successful payment.'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard security measures including SSL encryption, PCI compliance, and trusted payment gateways to protect your information.'
    },
    {
      question: 'What if my payment fails?',
      answer: 'If payment fails, the amount will be refunded to your account within 3-7 business days. You can retry the payment or contact support for assistance.'
    },
    {
      question: 'Can I get a refund after activation?',
      answer: 'As per our policy, refunds are not available after successful account activation and level entry. Please read our refund policy for complete details.'
    }
  ];

  const selectedMethodData = paymentMethods.find(method => method.id === selectedMethod);

  const toggleFAQ = (index) => {
    setShowFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
          <CreditCard className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Payment <span className="text-blue-400">Methods</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Secure, fast, and convenient payment options for your helping journey
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Payment Method Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {paymentMethods.map((method) => (
              <motion.button
                key={method.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedMethod === method.id
                    ? `${method.bgColor} text-white shadow-lg`
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <method.icon className="w-5 h-5" />
                <span>{method.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Selected Method Details */}
        <motion.div
          key={selectedMethod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Method Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className={`w-16 h-16 bg-gradient-to-r ${selectedMethodData.color} rounded-full flex items-center justify-center mb-6`}>
                <selectedMethodData.icon className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">{selectedMethodData.name}</h2>
              <p className="text-gray-300 mb-6">{selectedMethodData.description}</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">Processing Time</span>
                  </div>
                  <div className="text-white font-semibold">{selectedMethodData.processingTime}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400 text-sm">Fees</span>
                  </div>
                  <div className="text-white font-semibold">{selectedMethodData.fees}</div>
                </div>
              </div>
              
              {/* Limits */}
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">Transaction Limits</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Minimum: ₹{selectedMethodData.minAmount.toLocaleString()}</span>
                  <span className="text-gray-400">Maximum: ₹{selectedMethodData.maxAmount.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h3 className="text-white font-semibold mb-4">Key Features</h3>
                <div className="space-y-3">
                  {selectedMethodData.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Payment Steps */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">How to Pay</h3>
              
              <div className="space-y-6">
                {selectedMethodData.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className={`w-8 h-8 ${selectedMethodData.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white">{step}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Supported Options */}
              <div className="mt-8">
                <h4 className="text-white font-semibold mb-4">
                  {selectedMethod === 'upi' ? 'Supported Apps' : 
                   selectedMethod === 'netbanking' ? 'Supported Banks' : 'Supported Cards'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedMethodData.supportedApps || selectedMethodData.supportedBanks || selectedMethodData.supportedCards)?.map((item, index) => (
                    <span
                      key={index}
                      className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm border border-white/20"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full ${selectedMethodData.bgColor} text-white py-4 rounded-xl font-semibold mt-8 hover:opacity-90 transition-all duration-300 flex items-center justify-center space-x-2`}
              >
                <Zap className="w-5 h-5" />
                <span>Pay with {selectedMethodData.name}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Security & Trust</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: showFAQ[index] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  </motion.div>
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: showFAQ[index] ? 'auto' : 0,
                    opacity: showFAQ[index] ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20">
            <TrendingUp className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Choose your preferred payment method and activate your account today. Join thousands of members already earning through our helping system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Activate Account
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

export default PaymentMethods;