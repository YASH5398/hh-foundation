import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HeadphonesIcon } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'support@helpinghandsfoundation.in',
      link: 'mailto:support@helpinghandsfoundation.in',
      description: 'Get help with your account, payments, or general inquiries'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      value: '+91 6299261088',
      link: 'tel:+916299261088',
      description: 'Call us for urgent assistance or technical support'
    },
    {
      icon: MapPin,
      title: 'Office Location',
      value: 'Mumbai, Maharashtra, India',
      link: null,
      description: 'Our headquarters and main support center'
    },
    {
      icon: Clock,
      title: 'Support Hours',
      value: '24/7 Available',
      link: null,
      description: 'We provide round-the-clock support for all members'
    }
  ];

  const quickActions = [
    {
      title: 'Live Chat Support',
      description: 'Get instant help from our support team',
      link: '/live-chat',
      icon: MessageCircle,
      color: 'bg-blue-500'
    },
    {
      title: 'Help Center',
      description: 'Browse FAQs and helpful guides',
      link: '/help-center',
      icon: HeadphonesIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      link: '/tutorials',
      icon: Send,
      color: 'bg-purple-500'
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
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Contact <span className="text-blue-400">HH Foundation</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Get in touch with our support team for assistance with your helping plan journey
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">Get in Touch</h2>
            
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-500 p-3 rounded-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{info.title}</h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-lg font-medium"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-gray-300 text-lg font-medium">{info.value}</p>
                        )}
                        <p className="text-gray-400 text-sm mt-1">{info.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <h3 className="text-2xl font-bold text-white mb-6">Quick Support Options</h3>
            <div className="space-y-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.a
                    key={index}
                    href={action.link}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-4 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all duration-300 border border-white/10 hover:border-white/20"
                  >
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{action.title}</h4>
                      <p className="text-gray-400 text-sm">{action.description}</p>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                >
                  <option value="" className="bg-slate-800">Select a subject</option>
                  <option value="account" className="bg-slate-800">Account Issues</option>
                  <option value="payment" className="bg-slate-800">Payment Problems</option>
                  <option value="upgrade" className="bg-slate-800">Upgrade Assistance</option>
                  <option value="technical" className="bg-slate-800">Technical Support</option>
                  <option value="general" className="bg-slate-800">General Inquiry</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
                  placeholder="Describe your issue or inquiry in detail..."
                />
              </div>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;