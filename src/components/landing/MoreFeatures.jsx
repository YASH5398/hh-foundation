import React from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Bell, 
  Headphones, 
  Users, 
  Shield, 
  Zap, 
  Clock, 
  TrendingUp,
  CheckCircle,
  Globe,
  Lock,
  Award
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Access your account anywhere, anytime with our responsive mobile design',
    details: 'Optimized for all devices with native app-like experience',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    stats: '99.9% Uptime'
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get real-time alerts for payments, upgrades, and important updates',
    details: 'Never miss an opportunity with smart notification system',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    stats: 'Real-time Updates'
  },
  {
    icon: Headphones,
    title: 'Admin Support',
    description: '24/7 dedicated support team to help you with any queries or issues',
    details: 'Expert assistance available via chat, email, and phone',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    stats: '< 2min Response'
  },
  {
    icon: Users,
    title: 'Growth Community',
    description: 'Join a thriving community of like-minded individuals focused on growth',
    details: 'Network, learn, and grow together with successful members',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    stats: '2,500+ Members'
  }
];

const additionalFeatures = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Advanced encryption and security protocols'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Instant transactions and real-time processing'
  },
  {
    icon: Clock,
    title: 'Auto-Matching',
    description: 'Smart algorithm for automatic member matching'
  },
  {
    icon: TrendingUp,
    title: 'Growth Analytics',
    description: 'Detailed insights and performance tracking'
  },
  {
    icon: CheckCircle,
    title: 'Verified Members',
    description: 'KYC verified community for trust and safety'
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Available in multiple regional languages'
  },
  {
    icon: Lock,
    title: 'Data Privacy',
    description: 'Your personal information is completely secure'
  },
  {
    icon: Award,
    title: 'Achievement System',
    description: 'Earn badges and rewards for milestones'
  }
];

export default function MoreFeatures() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Features</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for a seamless and successful helping plan experience
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`${feature.bgColor} rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-2xl group`}
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-300`}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {feature.details}
                </p>

                {/* Stats Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${feature.color} text-white text-sm font-medium`}>
                  {feature.stats}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              And Much More...
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover additional features that make our platform the most comprehensive helping plan solution
            </p>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:bg-white transition-all duration-300 hover:shadow-lg group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h4 className="font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Highlight 1 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Mobile First Design</h3>
            <p className="text-blue-100 mb-4">
              Our platform is designed with mobile users in mind, ensuring perfect functionality across all devices.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm">Responsive & Fast</span>
            </div>
          </div>

          {/* Highlight 2 */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Enterprise Security</h3>
            <p className="text-green-100 mb-4">
              Bank-grade security protocols protect your data and transactions with military-level encryption.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm">256-bit SSL Encryption</span>
            </div>
          </div>

          {/* Highlight 3 */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Community Driven</h3>
            <p className="text-purple-100 mb-4">
              Join a supportive community where members help each other succeed and grow together.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm">2,500+ Active Members</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Experience All Features Today
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Don't just take our word for it. Join our platform and experience all these powerful features firsthand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
              >
                <Smartphone className="w-5 h-5" />
                Get Started Now
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-full font-bold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 justify-center"
              >
                <Bell className="w-5 h-5" />
                Learn More
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}