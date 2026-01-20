import React from 'react';
import { motion } from 'framer-motion';
import {
  UserPlusIcon,
  CreditCardIcon,
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: UserPlusIcon,
      title: "Register with Sponsor ID and E-PIN",
      description: "Create your account using a valid Sponsor ID and E-PIN to join the HH Foundation community.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      id: 2,
      icon: CreditCardIcon,
      title: "Send Help of ₹300 to Activate",
      description: "Send your first help of ₹300 to activate your ID and start your journey in the helping plan.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      id: 3,
      icon: BanknotesIcon,
      title: "Receive Help from 3 Members",
      description: "Receive help from 3 members (₹300 × 3 = ₹900) as part of the Star level benefits.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      id: 4,
      icon: ChartBarIcon,
      title: "Upgrade by Sending ₹600",
      description: "Upgrade to Silver level by sending ₹600 and unlock higher earning potential.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      id: 5,
      icon: CheckCircleIcon,
      title: "Continue Level by Level",
      description: "Progress through Star, Silver, Gold, Platinum, and Diamond levels for maximum returns.",
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut",
        delay: 1
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Simple Process
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Follow these 5 simple steps to join our trusted helping community and start earning with just ₹300.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Connecting Lines for Desktop */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ zIndex: 1 }}>
            <motion.path
              d="M 200 150 Q 400 100 600 150 Q 800 200 1000 150 Q 1200 100 1400 150"
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              variants={lineVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={stepVariants}
              className="relative group"
              style={{ zIndex: 2 }}
            >
              <motion.div
                className={`relative bg-gradient-to-br ${step.bgGradient} rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500`}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                {/* Step Number */}
                <motion.div
                  className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-lg font-bold text-gray-700">{step.id}</span>
                </motion.div>

                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-2xl mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {step.description}
                </p>

                {/* Hover Effect */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  initial={false}
                />

                {/* Progress Indicator */}
                <motion.div
                  className={`h-1 bg-gradient-to-r ${step.gradient} rounded-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 border border-blue-100 shadow-lg">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Join thousands of successful members and begin your path to financial freedom today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Get Started Now</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              
              <motion.button
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;