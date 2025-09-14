import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Globe, Mail, Phone } from 'lucide-react';

const PrivacyPolicy = () => {
  const privacyData = [
    {
      id: 'data-collection',
      title: 'Information We Collect',
      icon: Database,
      content: [
        'Personal Information: Full name, email address, phone number, and date of birth for account creation and verification.',
        'KYC Documents: Government-issued photo ID, address proof, and bank account details for mandatory verification.',
        'Payment Information: Bank account numbers, UPI IDs, and payment method preferences for transaction processing.',
        'Transaction Data: Payment history, help records, level progression, and platform activity logs.',
        'Technical Data: IP address, device information, browser type, and usage analytics for security and platform improvement.'
      ]
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Information',
      icon: UserCheck,
      content: [
        'Account Management: Creating and maintaining your platform account, processing registrations, and managing user profiles.',
        'KYC Verification: Verifying your identity to comply with legal requirements and prevent fraud.',
        'Transaction Processing: Facilitating peer-to-peer connections and payment matching between members.',
        'Communication: Sending important updates, payment notifications, and platform announcements.',
        'Security & Fraud Prevention: Monitoring for suspicious activities, preventing duplicate accounts, and maintaining platform integrity.',
        'Platform Improvement: Analyzing usage patterns to enhance user experience and platform functionality.'
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Security',
      icon: Lock,
      content: [
        'Encryption: All sensitive data is encrypted using industry-standard AES-256 encryption both in transit and at rest.',
        'Secure Storage: Personal and financial information is stored on secure servers with multiple layers of protection.',
        'Access Control: Strict access controls ensure only authorized personnel can access user data on a need-to-know basis.',
        'Regular Security Audits: We conduct regular security assessments and vulnerability testing to maintain data protection.',
        'Secure Transmission: All data transmission between your device and our servers uses SSL/TLS encryption.',
        'Data Backup: Regular encrypted backups ensure data recovery while maintaining security standards.'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing Policy',
      icon: Globe,
      content: [
        'No Third-Party Sharing: We do not sell, rent, or share your personal information with third parties for marketing purposes.',
        'Member Connections: Limited information (name and payment details) is shared only with matched members for transaction purposes.',
        'Legal Compliance: Information may be disclosed if required by law, court order, or government regulations.',
        'Service Providers: Minimal data may be shared with trusted service providers who assist in platform operations under strict confidentiality agreements.',
        'Business Transfers: In case of merger or acquisition, user data may be transferred under the same privacy protections.',
        'Fraud Prevention: Information may be shared with law enforcement agencies in cases of suspected fraud or illegal activities.'
      ]
    },
    {
      id: 'user-rights',
      title: 'Your Privacy Rights',
      icon: Eye,
      content: [
        'Access Rights: You can request access to all personal information we hold about you.',
        'Correction Rights: You can request correction of any inaccurate or incomplete personal information.',
        'Data Portability: You can request a copy of your data in a structured, machine-readable format.',
        'Deletion Rights: You can request deletion of your personal data, subject to legal and operational requirements.',
        'Consent Withdrawal: You can withdraw consent for data processing, though this may affect platform services.',
        'Complaint Rights: You can file complaints with relevant data protection authorities if you believe your rights have been violated.'
      ]
    },
    {
      id: 'data-retention',
      title: 'Data Retention Policy',
      icon: Database,
      content: [
        'Active Accounts: Personal data is retained as long as your account remains active and you continue using our services.',
        'Inactive Accounts: Data for inactive accounts is retained for 3 years before being permanently deleted.',
        'Transaction Records: Payment and transaction data is retained for 7 years to comply with financial regulations.',
        'KYC Documents: Identity verification documents are retained for 5 years as required by anti-money laundering laws.',
        'Legal Requirements: Some data may be retained longer if required by law or for legal proceedings.',
        'Secure Deletion: When data is deleted, it is permanently removed from all systems and backups using secure deletion methods.'
      ]
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies & Tracking',
      icon: Globe,
      content: [
        'Essential Cookies: We use necessary cookies for login sessions, security, and basic platform functionality.',
        'Analytics Cookies: Optional cookies help us understand user behavior and improve platform performance.',
        'Security Cookies: Cookies are used to detect and prevent fraudulent activities and unauthorized access.',
        'Preference Cookies: We store your preferences and settings to enhance your user experience.',
        'Cookie Control: You can manage cookie preferences through your browser settings or our cookie consent tool.',
        'Third-Party Cookies: We do not allow third-party advertising cookies on our platform.'
      ]
    },
    {
      id: 'contact-privacy',
      title: 'Privacy Contact Information',
      icon: Mail,
      content: [
        'Data Protection Officer: Contact our DPO for any privacy-related questions or concerns.',
        'Privacy Inquiries: Send privacy questions to privacy@helpinghandsfoundation.in',
        'Data Requests: Submit data access, correction, or deletion requests through our support portal.',
        'Security Incidents: Report any suspected data breaches or security incidents immediately.',
        'Response Time: We respond to privacy inquiries within 30 days as required by applicable laws.',
        'Escalation: Unresolved privacy concerns can be escalated to relevant data protection authorities.'
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
              <Shield className="w-12 h-12 text-green-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Privacy
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Policy</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your privacy is important to us. This policy explains how we collect, use, protect, and handle your personal information 
              when you use the HH Foundation platform.
            </p>
          </motion.div>

          {/* Privacy Commitment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 mb-12"
          >
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-green-300 mb-2">Our Privacy Commitment</h3>
                <p className="text-gray-300 leading-relaxed">
                  We are committed to protecting your personal information with the highest standards of security and privacy. 
                  We use advanced encryption, strict access controls, and never share your data with third parties for marketing purposes.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Sections */}
          <div className="space-y-8">
            {privacyData.map((section, index) => {
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
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-gray-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Contact for Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Privacy Questions or Concerns?</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              If you have any questions about our privacy practices or want to exercise your privacy rights, 
              please don't hesitate to contact our privacy team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:privacy@helpinghandsfoundation.in"
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Privacy Email
              </a>
              <a
                href="tel:+916299261088"
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
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

export default PrivacyPolicy;