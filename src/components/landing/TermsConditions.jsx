import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Fallback terms data
const mockTermsData = {
  lastUpdated: '2024-01-15',
  sections: [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: 'CheckCircle',
      content: [
        'By accessing and using this helping plan platform, you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by the above, please do not use this service.',
        'These terms constitute a legally binding agreement between you and our platform.'
      ]
    },
    {
      id: 'eligibility',
      title: 'Eligibility Criteria',
      icon: 'Users',
      content: [
        'You must be at least 18 years of age to participate in our helping plan.',
        'You must provide accurate and complete information during registration.',
        'You must complete KYC (Know Your Customer) verification as required.',
        'You must have a valid bank account and UPI ID for transactions.'
      ]
    },
    {
      id: 'platform-rules',
      title: 'Platform Rules',
      icon: 'Shield',
      content: [
        'All transactions must be completed within the specified time frame.',
        'Members must help others in the sequence as assigned by the system.',
        'Any attempt to manipulate or bypass the system will result in immediate termination.',
        'Members must maintain respectful communication with other participants.',
        'Sharing of payment screenshots and transaction details is mandatory for verification.'
      ]
    },
    {
      id: 'payments',
      title: 'Payment Terms',
      icon: 'FileText',
      content: [
        'All payments are made directly between members through secure payment methods.',
        'The platform does not hold or manage any member funds.',
        'Payment confirmations must be submitted within 24 hours of transaction.',
        'Failed or delayed payments may result in account suspension.',
        'Refunds are processed according to our refund policy.'
      ]
    },
    {
      id: 'responsibilities',
      title: 'User Responsibilities',
      icon: 'AlertCircle',
      content: [
        'You are responsible for maintaining the confidentiality of your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'You are responsible for all activities that occur under your account.',
        'You must comply with all applicable laws and regulations.',
        'You must not use the platform for any illegal or unauthorized purpose.'
      ]
    },
    {
      id: 'termination',
      title: 'Account Termination',
      icon: 'Clock',
      content: [
        'We reserve the right to terminate accounts that violate our terms.',
        'You may close your account at any time by contacting support.',
        'Upon termination, your access to the platform will be immediately revoked.',
        'Pending transactions must be completed before account closure.',
        'We are not liable for any losses resulting from account termination.'
      ]
    }
  ]
};

const iconComponents = {
  CheckCircle,
  Users,
  Shield,
  FileText,
  AlertCircle,
  Clock
};

export default function TermsConditions() {
  const [termsData, setTermsData] = useState(mockTermsData);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  // Fetch terms from Firestore
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const termsDoc = await getDoc(doc(db, 'settings', 'terms'));
        
        if (termsDoc.exists()) {
          const termsFirestore = termsDoc.data();
          if (termsFirestore.sections && Array.isArray(termsFirestore.sections)) {
            setTermsData({
              lastUpdated: termsFirestore.lastUpdated || mockTermsData.lastUpdated,
              sections: termsFirestore.sections.length > 0 ? termsFirestore.sections : mockTermsData.sections
            });
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        // Keep fallback data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchTerms();
  }, []);

  const toggleSection = (index) => {
    setActiveSection(activeSection === index ? null : index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms &
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Conditions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Please read these terms and conditions carefully before using our platform
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(termsData.lastUpdated).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12"
        >
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Notice</h3>
              <p className="text-amber-700 leading-relaxed">
                By using our platform, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. 
                This is a peer-to-peer helping platform where members help each other voluntarily.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {termsData.sections.map((section, index) => {
            const IconComponent = iconComponents[section.icon] || FileText;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Click to {activeSection === index ? 'collapse' : 'expand'} details
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: activeSection === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6 text-gray-400"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
                
                {activeSection === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <ul className="space-y-3">
                          {section.content.map((item, itemIndex) => (
                            <motion.li
                              key={itemIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                              className="flex items-start gap-3 text-gray-700"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="leading-relaxed">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
            <Shield className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Questions About Our Terms?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              If you have any questions about these terms and conditions, please don't hesitate to contact our support team.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Contact Support
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}