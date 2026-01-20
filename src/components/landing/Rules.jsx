import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Clock, DollarSign, AlertTriangle, CheckCircle, Star, Target } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Fallback rules data
const mockRulesData = {
  lastUpdated: '2024-01-15',
  categories: [
    {
      id: 'participation',
      title: 'Participation Rules',
      icon: 'Users',
      color: 'blue',
      rules: [
        {
          id: 'age-requirement',
          title: 'Age Requirement',
          description: 'Must be 18+ years old to participate',
          type: 'mandatory',
          penalty: 'Account rejection'
        },
        {
          id: 'kyc-verification',
          title: 'KYC Verification',
          description: 'Complete identity verification within 24 hours of registration',
          type: 'mandatory',
          penalty: 'Account suspension'
        },
        {
          id: 'single-account',
          title: 'Single Account Policy',
          description: 'Only one account per person/mobile number allowed',
          type: 'mandatory',
          penalty: 'Permanent ban'
        },
        {
          id: 'accurate-information',
          title: 'Accurate Information',
          description: 'Provide genuine and accurate personal details',
          type: 'mandatory',
          penalty: 'Account termination'
        }
      ]
    },
    {
      id: 'helping',
      title: 'Helping Guidelines',
      icon: 'Target',
      color: 'green',
      rules: [
        {
          id: 'help-sequence',
          title: 'Follow Help Sequence',
          description: 'Help members in the exact order assigned by the system',
          type: 'mandatory',
          penalty: 'Level demotion'
        },
        {
          id: 'payment-timeframe',
          title: 'Payment Timeframe',
          description: 'Complete payments within 24 hours of assignment',
          type: 'mandatory',
          penalty: 'Account suspension'
        },
        {
          id: 'payment-proof',
          title: 'Payment Proof',
          description: 'Upload payment screenshot immediately after transaction',
          type: 'mandatory',
          penalty: 'Payment rejection'
        },
        {
          id: 'communication',
          title: 'Respectful Communication',
          description: 'Maintain polite and professional communication',
          type: 'recommended',
          penalty: 'Warning/Suspension'
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Rules',
      icon: 'DollarSign',
      color: 'purple',
      rules: [
        {
          id: 'payment-methods',
          title: 'Approved Payment Methods',
          description: 'Use only UPI, bank transfer, or approved digital wallets',
          type: 'mandatory',
          penalty: 'Transaction rejection'
        },
        {
          id: 'exact-amount',
          title: 'Exact Amount Transfer',
          description: 'Transfer the exact amount as specified in the system',
          type: 'mandatory',
          penalty: 'Payment rejection'
        },
        {
          id: 'no-cash',
          title: 'No Cash Transactions',
          description: 'Physical cash transactions are strictly prohibited',
          type: 'mandatory',
          penalty: 'Account termination'
        },
        {
          id: 'transaction-fees',
          title: 'Transaction Fees',
          description: 'Sender bears all transaction charges and fees',
          type: 'mandatory',
          penalty: 'Payment shortfall'
        }
      ]
    },
    {
      id: 'conduct',
      title: 'Code of Conduct',
      icon: 'Shield',
      color: 'red',
      rules: [
        {
          id: 'no-manipulation',
          title: 'No System Manipulation',
          description: 'Any attempt to bypass or manipulate the system is forbidden',
          type: 'mandatory',
          penalty: 'Permanent ban'
        },
        {
          id: 'no-spam',
          title: 'No Spam or Harassment',
          description: 'Avoid sending spam messages or harassing other members',
          type: 'mandatory',
          penalty: 'Account suspension'
        },
        {
          id: 'privacy-respect',
          title: 'Respect Privacy',
          description: 'Do not share personal information of other members',
          type: 'mandatory',
          penalty: 'Warning/Suspension'
        },
        {
          id: 'platform-promotion',
          title: 'Platform Promotion',
          description: 'Promote the platform ethically and truthfully',
          type: 'recommended',
          penalty: 'Warning'
        }
      ]
    }
  ]
};

const iconComponents = {
  Users,
  Target,
  DollarSign,
  Shield,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle
};

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-200',
    bgLight: 'bg-blue-50'
  },
  green: {
    bg: 'from-green-500 to-green-600',
    text: 'text-green-600',
    border: 'border-green-200',
    bgLight: 'bg-green-50'
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-200',
    bgLight: 'bg-purple-50'
  },
  red: {
    bg: 'from-red-500 to-red-600',
    text: 'text-red-600',
    border: 'border-red-200',
    bgLight: 'bg-red-50'
  }
};

export default function Rules() {
  const [rulesData, setRulesData] = useState(mockRulesData);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  // Fetch rules from Firestore
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rulesDoc = await getDoc(doc(db, 'settings', 'rules'));
        
        if (rulesDoc.exists()) {
          const rulesFirestore = rulesDoc.data();
          if (rulesFirestore.categories && Array.isArray(rulesFirestore.categories)) {
            setRulesData({
              lastUpdated: rulesFirestore.lastUpdated || mockRulesData.lastUpdated,
              categories: rulesFirestore.categories.length > 0 ? rulesFirestore.categories : mockRulesData.categories
            });
          }
        }
      } catch (error) {
        console.error('Error fetching rules:', error);
        // Keep fallback data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchRules();
  }, []);

  const toggleCategory = (index) => {
    setActiveCategory(activeCategory === index ? null : index);
  };

  const filteredCategories = rulesData.categories.map(category => ({
    ...category,
    rules: selectedType === 'all' 
      ? category.rules 
      : category.rules.filter(rule => rule.type === selectedType)
  }));

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Platform
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent"> Rules</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Follow these guidelines to ensure a safe and fair experience for everyone
          </p>
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(rulesData.lastUpdated).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            {[
              { id: 'all', label: 'All Rules', icon: Shield },
              { id: 'mandatory', label: 'Mandatory', icon: AlertTriangle },
              { id: 'recommended', label: 'Recommended', icon: Star }
            ].map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedType === filter.id
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Rules Categories */}
        <div className="grid gap-8">
          {filteredCategories.map((category, index) => {
            const IconComponent = iconComponents[category.icon] || Shield;
            const colors = colorClasses[category.color] || colorClasses.blue;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(index)}
                  className={`w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {category.title}
                      </h3>
                      <p className="text-gray-500 mt-1">
                        {category.rules.length} rules • Click to {activeCategory === index ? 'collapse' : 'expand'}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: activeCategory === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6 text-gray-400"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
                
                {activeCategory === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8">
                      <div className="grid gap-4">
                        {category.rules.map((rule, ruleIndex) => (
                          <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: ruleIndex * 0.1 }}
                            className={`${colors.bgLight} ${colors.border} border rounded-2xl p-6`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  rule.type === 'mandatory' ? 'bg-red-500' : 'bg-blue-500'
                                }`}></div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {rule.title}
                                </h4>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                rule.type === 'mandatory' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {rule.type}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              {rule.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="text-amber-700 font-medium">
                                Penalty: {rule.penalty}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 text-white">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Violation of Rules
            </h3>
            <p className="text-red-100 mb-6 max-w-2xl mx-auto">
              Violation of any mandatory rule may result in penalties including warnings, account suspension, or permanent ban. 
              Please ensure you understand and follow all guidelines.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Contact Support
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}