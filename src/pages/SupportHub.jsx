import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMessageCircle, 
  FiHeadphones,
  FiFileText,
  FiArrowRight,
  FiZap,
  FiStar,
  FiShield
} from 'react-icons/fi';

const SupportHub = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      subtitle: 'Instant Support',
      description: 'Get immediate answers from our advanced AI assistant, available 24/7 with lightning-fast responses',
      icon: <FiMessageCircle className="w-10 h-10" />,
      path: '/support/chatbot',
      gradient: 'from-cyan-400 via-blue-500 to-purple-600',
      glowColor: 'cyan',
      features: ['⚡ Instant Responses', '🤖 AI-Powered', '🌙 24/7 Available'],
      badge: 'Most Popular'
    },
    {
      id: 'agent',
      title: 'Live Agent',
      subtitle: 'Human Expert',
      description: 'Connect with our professional support agents for personalized assistance and complex problem solving',
      icon: <FiHeadphones className="w-10 h-10" />,
      path: '/support/agent',
      gradient: 'from-emerald-400 via-green-500 to-teal-600',
      glowColor: 'emerald',
      features: ['👨‍💼 Expert Agents', '💬 Real-time Chat', '🎯 Personalized Help'],
      badge: 'Premium'
    },
    {
      id: 'tickets',
      title: 'Support Tickets',
      subtitle: 'Detailed Tracking',
      description: 'Submit comprehensive support requests with file attachments and track progress with detailed updates',
      icon: <FiFileText className="w-10 h-10" />,
      path: '/support/tickets',
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
      glowColor: 'violet',
      features: ['📋 Detailed Tracking', '📎 File Attachments', '🏷️ Priority Levels'],
      badge: 'Professional'
    }
  ];

  const handleOptionClick = (option) => {
    navigate(option.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
            <FiStar className="w-5 h-5 text-yellow-400" />
            <span className="text-white/90 font-medium">Premium Support Experience</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6 leading-tight">
            How can we
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">help you?</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Choose your preferred support channel and experience our world-class assistance.
            <br className="hidden sm:block" />
            Our team is ready to help you succeed.
          </p>
        </motion.div>

        {/* Premium Support Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -12, 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => handleOptionClick(option)}
            >
              <div className="relative h-full">
                {/* Badge */}
                <div className="absolute -top-3 left-6 z-20">
                  <div className={`bg-gradient-to-r ${option.gradient} text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg`}>
                    {option.badge}
                  </div>
                </div>

                {/* Main Card */}
                <div className="relative h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 overflow-hidden group-hover:bg-white/15 transition-all duration-500">
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
                  
                  {/* Animated Border Glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${option.gradient} opacity-0 group-hover:opacity-30 blur-sm transition-all duration-500 -z-10`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon Container */}
                    <div className="mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                        <div className="text-white group-hover:scale-110 transition-transform duration-300">
                          {option.icon}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title & Subtitle */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-white transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-purple-300 font-medium text-sm">
                        {option.subtitle}
                      </p>
                    </div>
                    
                    {/* Description */}
                    <p className="text-white/70 mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                      {option.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {option.features.map((feature, featureIndex) => (
                        <motion.div 
                          key={featureIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 + featureIndex * 0.1 }}
                          className="flex items-center text-white/80 group-hover:text-white transition-colors"
                        >
                          <div className={`w-2 h-2 bg-gradient-to-r ${option.gradient} rounded-full mr-3 group-hover:scale-125 transition-transform`}></div>
                          <span className="text-sm font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Action Button */}
                    <div className={`bg-gradient-to-r ${option.gradient} rounded-xl p-4 group-hover:shadow-xl transition-all duration-300`}>
                      <div className="flex items-center justify-between text-white">
                        <span className="font-bold text-lg">Get Started</span>
                        <FiArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Premium Footer Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <FiShield className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">
                Enterprise-Grade Support
              </h2>
            </div>
            
            <p className="text-white/70 mb-8 text-lg leading-relaxed">
              Our dedicated support team is available around the clock to ensure your success.
              <br className="hidden sm:block" />
              Experience the difference of premium support.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <FiZap className="w-6 h-6 text-red-400" />
                  <h3 className="font-bold text-white text-lg">Priority Support</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Critical issues get immediate attention with our priority escalation system
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <FiStar className="w-6 h-6 text-blue-400" />
                  <h3 className="font-bold text-white text-lg">Expert Guidance</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Get personalized assistance from our certified support specialists
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportHub;