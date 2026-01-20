import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Search, Book, MessageCircle, Phone, Mail, Clock, CheckCircle, AlertCircle, Info, Users, Shield, CreditCard, Settings } from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: Book, count: 24 },
    { id: 'getting-started', name: 'Getting Started', icon: Users, count: 6 },
    { id: 'payments', name: 'Payments & Transactions', icon: CreditCard, count: 8 },
    { id: 'security', name: 'Security & Safety', icon: Shield, count: 5 },
    { id: 'account', name: 'Account Management', icon: Settings, count: 5 }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I join the HH Foundation platform?',
      answer: 'To join our platform, click the "Join Now" button on our homepage, complete the registration form with your basic details, verify your email address, and complete the KYC verification process. Once approved, you can start participating in our helping community.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'What is the helping plan system?',
      answer: 'Our helping plan is a peer-to-peer community system where members help each other achieve financial goals. Members are matched in levels, and when you help others, you receive help from other community members. It\'s based on mutual support and community growth.'
    },
    {
      id: 3,
      category: 'getting-started',
      question: 'How do the levels work?',
      answer: 'Our platform has multiple levels starting from Level 1. Each level has different helping amounts and benefits. As you successfully complete helps and receive helps, you can upgrade to higher levels with increased benefits and opportunities.'
    },
    {
      id: 4,
      category: 'getting-started',
      question: 'What documents do I need for KYC verification?',
      answer: 'For KYC verification, you need a government-issued photo ID (Aadhaar, PAN, Passport, or Driving License), a recent photograph, and bank account details. All documents must be clear and valid.'
    },
    {
      id: 5,
      category: 'getting-started',
      question: 'How long does account approval take?',
      answer: 'Account approval typically takes 24-48 hours after submitting complete KYC documents. Our team reviews each application carefully to ensure platform security and member safety.'
    },
    {
      id: 6,
      category: 'getting-started',
      question: 'Is there any joining fee?',
      answer: 'There is no joining fee to create an account on our platform. However, each level has specific helping amounts that you need to contribute when you participate in the helping plan.'
    },
    {
      id: 7,
      category: 'payments',
      question: 'How do I make a payment to help someone?',
      answer: 'When you\'re matched with someone to help, you\'ll receive their payment details through the platform. You can make payments via bank transfer, UPI, or other approved payment methods. Always use the reference number provided for tracking.'
    },
    {
      id: 8,
      category: 'payments',
      question: 'What happens if I don\'t pay within 24 hours?',
      answer: 'Timely payments are crucial for community trust. If you don\'t complete your payment within 24 hours of being matched, your account will be temporarily blocked. Repeated delays may result in permanent account suspension.'
    },
    {
      id: 9,
      category: 'payments',
      question: 'How do I receive help from others?',
      answer: 'When it\'s your turn to receive help, other members will be matched to help you. They will transfer money directly to your registered bank account or payment method. You\'ll receive notifications about incoming helps.'
    },
    {
      id: 10,
      category: 'payments',
      question: 'What payment methods are accepted?',
      answer: 'We accept bank transfers, UPI payments (GPay, PhonePe, Paytm), and other digital payment methods. All payments are peer-to-peer; the platform doesn\'t handle money directly.'
    },
    {
      id: 11,
      category: 'payments',
      question: 'Can I get a refund if I change my mind?',
      answer: 'No, all payments in our helping plan are final and non-refundable. This is because payments go directly to other community members, not to the platform. Please consider carefully before participating.'
    },
    {
      id: 12,
      category: 'payments',
      question: 'How do I track my payment history?',
      answer: 'You can view all your payment history in your dashboard under the "Transactions" section. This includes both payments you\'ve made to help others and payments you\'ve received from the community.'
    },
    {
      id: 13,
      category: 'payments',
      question: 'What if someone doesn\'t pay me?',
      answer: 'If someone fails to pay you within the specified time, please report it immediately through the platform. We have strict policies against non-payment, and such members face account suspension.'
    },
    {
      id: 14,
      category: 'payments',
      question: 'Are there any transaction fees?',
      answer: 'The platform doesn\'t charge transaction fees for peer-to-peer payments. However, your bank or payment provider may charge their standard fees for transfers.'
    },
    {
      id: 15,
      category: 'security',
      question: 'How secure is my personal information?',
      answer: 'We use bank-level encryption to protect your data. Your personal information is never shared with unauthorized parties, and we comply with all data protection regulations. Your financial details are especially secure.'
    },
    {
      id: 16,
      category: 'security',
      question: 'How do you prevent fraud on the platform?',
      answer: 'We have multiple fraud prevention measures including KYC verification, payment tracking, member behavior monitoring, and AI-based fraud detection systems. Suspicious activities are immediately investigated.'
    },
    {
      id: 17,
      category: 'security',
      question: 'What should I do if I suspect fraudulent activity?',
      answer: 'Immediately report any suspicious activity through our support channels. Don\'t share your login credentials or make payments outside the platform\'s official matching system.'
    },
    {
      id: 18,
      category: 'security',
      question: 'Can I have multiple accounts?',
      answer: 'No, multiple accounts are strictly prohibited and will result in permanent ban. Each person can only have one account on our platform to maintain fairness and security.'
    },
    {
      id: 19,
      category: 'security',
      question: 'How do I keep my account secure?',
      answer: 'Use a strong, unique password, enable two-factor authentication if available, never share your login details, log out from shared devices, and regularly monitor your account activity.'
    },
    {
      id: 20,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your dashboard and click on "Profile Settings." You can update most information there. For critical changes like bank details, you may need to contact support for verification.'
    },
    {
      id: 21,
      category: 'account',
      question: 'Can I change my registered mobile number?',
      answer: 'Yes, you can update your mobile number through profile settings. You\'ll need to verify the new number via OTP. For security reasons, this change may require additional verification.'
    },
    {
      id: 22,
      category: 'account',
      question: 'How do I deactivate my account?',
      answer: 'To deactivate your account, contact our support team. Please note that you must complete all pending helps before deactivation. Deactivation may not be possible if you have outstanding obligations.'
    },
    {
      id: 23,
      category: 'account',
      question: 'Why is my account suspended?',
      answer: 'Accounts may be suspended for policy violations, late payments, suspicious activity, or incomplete KYC. Contact support with your account details to understand the specific reason and resolution steps.'
    },
    {
      id: 24,
      category: 'account',
      question: 'How do I recover my forgotten password?',
      answer: 'Click "Forgot Password" on the login page, enter your registered email or mobile number, and follow the instructions sent to you. If you still can\'t access your account, contact support.'
    }
  ];

  const supportChannels = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: '24/7 Available',
      action: 'Start Chat',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us detailed questions or concerns',
      availability: 'Response within 4 hours',
      action: 'Send Email',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      availability: 'Mon-Sat, 9 AM - 9 PM',
      action: 'Call Now',
      color: 'from-purple-500 to-violet-600'
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', description: 'Complete guide for new members', link: '/getting-started' },
    { title: 'Payment Methods', description: 'Supported payment options', link: '/payment-methods' },
    { title: 'Security Features', description: 'How we protect your account', link: '/security' },
    { title: 'Terms & Conditions', description: 'Platform rules and policies', link: '/terms' },
    { title: 'Privacy Policy', description: 'How we handle your data', link: '/privacy' },
    { title: 'Community Guidelines', description: 'Best practices for members', link: '/community-guidelines' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (faqId) => {
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <HelpCircle className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Help
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Center</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Find answers to your questions, get support, and learn how to make the most of the HH Foundation platform.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {supportChannels.map((channel, index) => {
              const IconComponent = channel.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 text-center group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${channel.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{channel.title}</h3>
                  <p className="text-gray-300 mb-3 leading-relaxed">{channel.description}</p>
                  <p className="text-sm text-purple-400 mb-4">{channel.availability}</p>
                  <button className={`w-full bg-gradient-to-r ${channel.color} text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                    {channel.action}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.link}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <h3 className="font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{link.title}</h3>
                  <p className="text-gray-300 text-sm">{link.description}</p>
                </a>
              ))}
            </div>
          </motion.div>

          {/* FAQ Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.name} ({category.count})
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-4 mb-16">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.05 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 text-left hover:bg-white/5 transition-all duration-300 flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  <div className={`transform transition-transform duration-300 ${
                    openFaq === faq.id ? 'rotate-180' : ''
                  }`}>
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                  </div>
                </button>
                {openFaq === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Still Need Help?</h2>
            <p className="text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you with any questions or concerns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Mail className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-purple-400 text-sm">support@helpinghandsfoundation.in</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Phone className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-blue-400 text-sm">+91 6299261088</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Clock className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Support Hours</h3>
                <p className="text-green-400 text-sm">24/7 Available</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;