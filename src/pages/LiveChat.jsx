import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, User, Bot, Clock, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LiveChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Hello! Welcome to HH Foundation Live Chat Support. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        message: getBotResponse(newMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('payment') || message.includes('pay')) {
      return 'For payment issues, please ensure you have completed your KYC verification and are using the correct payment details. You can also contact our payment support team at support@helpinghandsfoundation.in';
    }
    if (message.includes('upgrade') || message.includes('level')) {
      return 'To upgrade your level, you need to complete the current level requirements and make the upgrade payment. Each level has specific benefits and requirements. Would you like me to explain the level system?';
    }
    if (message.includes('help') || message.includes('support')) {
      return 'I\'m here to help! You can ask me about account issues, payment problems, level upgrades, or any other questions about the HH Foundation helping plan.';
    }
    if (message.includes('account') || message.includes('login')) {
      return 'For account-related issues, please check your email for verification links. If you\'re having trouble logging in, try resetting your password or contact our support team.';
    }
    
    return 'Thank you for your message. Our support team will assist you shortly. For immediate assistance, you can also call us at +91 6299261088 or email support@helpinghandsfoundation.in';
  };

  const quickActions = [
    { text: 'How to Start', action: () => setNewMessage('How do I get started with the helping plan?') },
    { text: 'Payment Issues', action: () => setNewMessage('I\'m having payment problems') },
    { text: 'Upgrade Help', action: () => setNewMessage('How do I upgrade my level?') },
    { text: 'Contact Support', action: () => setNewMessage('I need to speak with a support agent') }
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-4 border-b border-white/10"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <MessageCircle className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Live Chat Support
          </h1>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Get instant help from our support team. We're here 24/7 to assist you with your helping plan journey.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">HH Foundation Support</h3>
                  <p className="text-blue-100 text-sm">Online • Typically replies instantly</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-gray-100 border border-white/20'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={action.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                  >
                    {action.text}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <a
                  href="tel:+916299261088"
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                  <span>+91 6299261088</span>
                </a>
                <a
                  href="mailto:support@helpinghandsfoundation.in"
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>support@helpinghandsfoundation.in</span>
                </a>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>24/7 Support Available</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">Your Account</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">Logged in as:</p>
                  <p className="text-white font-medium">{user.email}</p>
                  <p className="text-gray-400 text-sm">User ID: {user.uid?.slice(0, 8)}...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;