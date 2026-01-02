import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ModernSendHelp from '../components/help/ModernSendHelp';
import { FiEye, FiCode, FiPlay } from 'react-icons/fi';

const SendHelpDemo = () => {
  const [activeDemo, setActiveDemo] = useState('modern');

  const demos = [
    {
      id: 'modern',
      name: 'Modern Design',
      component: ModernSendHelp,
      description: 'Ultra-modern, clean, and responsive design with Framer Motion animations'
    }
  ];

  const ActiveComponent = demos.find(demo => demo.id === activeDemo)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Send Help Redesign Demo</h1>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Live Demo
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiPlay className="w-4 h-4" />
                Preview
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FiCode className="w-4 h-4" />
                Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeDemo === demo.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <motion.div
        key={activeDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {ActiveComponent && <ActiveComponent />}
      </motion.div>

      {/* Features Showcase */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Modern Send Help Features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of user interface design with our ultra-modern Send Help section.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Ultra-Modern Design',
                description: 'Clean, minimalist interface with glassmorphism effects and smooth animations'
              },
              {
                icon: '📱',
                title: 'Fully Responsive',
                description: 'Perfect spacing and typography across all devices with mobile-first approach'
              },
              {
                icon: '⚡',
                title: 'Framer Motion',
                description: 'Smooth animations and transitions for enhanced user experience'
              },
              {
                icon: '🎯',
                title: 'Status Management',
                description: 'Clear visual states for all payment statuses with intuitive filtering'
              },
              {
                icon: '💳',
                title: 'Payment Details',
                description: 'Comprehensive payment information with screenshots and transaction details'
              },
              {
                icon: '🎭',
                title: 'Visual Effects',
                description: 'Floating elements, gradients, and modern card designs for visual appeal'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendHelpDemo;
