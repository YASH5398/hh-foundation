import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Users, AlertTriangle, CheckCircle, XCircle, FileText, Scale } from 'lucide-react';

const TermsConditions = () => {
  const termsData = [
    {
      id: 'platform-overview',
      title: 'Platform Overview',
      icon: Shield,
      content: [
        'HH Foundation operates a peer-to-peer helping plan platform that connects members for mutual financial assistance.',
        'Our platform serves as a matching system only and does not hold, manage, or guarantee any funds.',
        'All transactions are direct between members, and the platform facilitates connections only.',
        'By using our services, you acknowledge that this is a community-driven helping system, not an investment scheme.'
      ]
    },
    {
      id: 'payment-rules',
      title: 'Payment Rules & Deadlines',
      icon: Clock,
      content: [
        'All members must complete their help payments within 24 hours of receiving payment instructions.',
        'Failure to make payment within the 24-hour deadline will result in automatic account suspension.',
        'Late payments may result in permanent account blocking without prior notice.',
        'Payment confirmations must be uploaded immediately after completing the transaction.',
        'False payment confirmations will result in immediate account termination.'
      ]
    },
    {
      id: 'upgrade-requirements',
      title: 'Level Upgrade Requirements',
      icon: Users,
      content: [
        'Members must upgrade to the next level after receiving the required number of helps for their current level.',
        'Failure to upgrade when eligible will result in account restrictions.',
        'Upgrade payments must be completed within 48 hours of receiving upgrade notification.',
        'Members cannot remain at the same level indefinitely once upgrade criteria are met.',
        'Downgrading to lower levels is not permitted under any circumstances.'
      ]
    },
    {
      id: 'refund-policy',
      title: 'No Refund Policy',
      icon: XCircle,
      content: [
        'All payments made through the platform are final and non-refundable.',
        'Once a help payment is sent to another member, it cannot be reversed or refunded.',
        'The platform does not provide refunds for any reason, including technical issues or disputes.',
        'Members are responsible for verifying payment details before completing transactions.',
        'Disputes between members must be resolved directly and do not qualify for platform intervention.'
      ]
    },
    {
      id: 'kyc-verification',
      title: 'KYC Verification Requirements',
      icon: CheckCircle,
      content: [
        'All members must complete mandatory KYC (Know Your Customer) verification before participating.',
        'Required documents include government-issued photo ID, address proof, and bank account verification.',
        'Incomplete or fraudulent KYC submissions will result in account rejection.',
        'KYC information must be accurate and up-to-date at all times.',
        'The platform reserves the right to request additional verification documents at any time.'
      ]
    },
    {
      id: 'fraud-prevention',
      title: 'Fraud Prevention & Account Security',
      icon: AlertTriangle,
      content: [
        'Creating duplicate accounts is strictly prohibited and will result in permanent blocking of all associated accounts.',
        'Any form of fraud, manipulation, or dishonest behavior will lead to immediate account termination.',
        'Members found using fake documents or information will be permanently banned.',
        'Attempting to manipulate the matching system or payment process is grounds for immediate removal.',
        'The platform employs advanced fraud detection systems to monitor all activities.'
      ]
    },
    {
      id: 'platform-responsibility',
      title: 'Platform Responsibility & Limitations',
      icon: Scale,
      content: [
        'HH Foundation provides only the software platform and matching system for member connections.',
        'The platform does not hold, manage, or guarantee any member funds or payments.',
        'We are not responsible for member defaults, payment failures, or disputes between members.',
        'Technical issues, server downtime, or system maintenance do not constitute grounds for compensation.',
        'Members participate at their own risk and responsibility.'
      ]
    },
    {
      id: 'account-termination',
      title: 'Account Termination & Blocking',
      icon: XCircle,
      content: [
        'The platform reserves the right to terminate or block accounts without prior notice for policy violations.',
        'Blocked accounts cannot be reactivated, and no refunds will be provided.',
        'Members who violate terms may be permanently banned from creating new accounts.',
        'Account termination decisions are final and not subject to appeal.',
        'Terminated members forfeit any pending helps or benefits.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <FileText className="w-12 h-12 text-blue-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Terms &
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Conditions</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Please read these terms and conditions carefully before participating in the HH Foundation Helping Plan. 
              By using our platform, you agree to comply with all rules and regulations outlined below.
            </p>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30 mb-12"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-300 mb-2">Important Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  This is a peer-to-peer helping plan, not an investment scheme. All payments are made directly between members. 
                  The platform only provides matching services and does not guarantee returns or hold any funds. 
                  Participation is voluntary and at your own risk.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {termsData.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Questions About Our Terms?</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              If you have any questions about these terms and conditions, please contact our support team. 
              We're here to help clarify any concerns before you begin participating.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@helpinghandsfoundation.in"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Email Support
              </a>
              <a
                href="tel:+916299261088"
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Call Support
              </a>
            </div>
          </motion.div>

          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 text-center text-gray-400"
          >
            <p>Last updated: January 2025</p>
            <p className="mt-2">© 2025 HH Foundation. All rights reserved.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsConditions;