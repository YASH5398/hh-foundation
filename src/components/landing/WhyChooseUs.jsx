import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  BellIcon,
  LockClosedIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const WhyChooseUs = () => {
  const features = [
    {
      icon: UsersIcon,
      title: "100% Peer to Peer",
      description: "No admin involvement in transactions. Direct member-to-member payments ensure complete transparency.",
      gradient: "from-green-400 to-emerald-600"
    },
    {
      icon: LockClosedIcon,
      title: "Fast and Secure Transactions",
      description: "UPI and bank transfers with advanced security protocols for instant and safe payments.",
      gradient: "from-blue-400 to-cyan-600"
    },
    {
      icon: ClockIcon,
      title: "24×7 Auto System",
      description: "Automated matching and payment system works round the clock without any manual intervention.",
      gradient: "from-purple-400 to-pink-600"
    },
    {
      icon: ChartBarIcon,
      title: "Fair Upline Payment Structure",
      description: "Transparent and fair payment distribution system ensuring everyone gets their rightful earnings.",
      gradient: "from-orange-400 to-red-600"
    },
    {
      icon: BellIcon,
      title: "Real-time Notifications",
      description: "Instant notifications and comprehensive dashboard to track all your activities and earnings.",
      gradient: "from-indigo-400 to-purple-600"
    },
    {
      icon: GiftIcon,
      title: "Referral Rewards",
      description: "Earn attractive referral bonuses and unlock growth opportunities as you build your network.",
      gradient: "from-teal-400 to-blue-600"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Why Choose Our Platform?
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Members Choose
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HH Foundation
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the most trusted helping community with transparent processes, secure transactions, and guaranteed growth opportunities.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <motion.div
                className="relative h-full bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm`} />
                
                {/* Icon Container */}
                <motion.div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl mb-4 shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>

                {/* Hover Effect Overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  initial={false}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.button
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Start Your Journey Today</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;