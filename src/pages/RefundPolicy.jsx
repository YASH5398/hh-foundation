import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, Users, ArrowRightLeft, Shield, Clock, FileText, Phone } from 'lucide-react';

const RefundPolicy = () => {
  const refundData = [
    {
      id: 'no-refund-policy',
      title: 'No Refund Policy',
      icon: XCircle,
      content: [
        'All payments made through the HH Foundation platform are final and non-refundable.',
        'Once you send help to another member, the transaction cannot be reversed or refunded.',
        'This policy applies to all levels and amounts within the helping plan system.',
        'No exceptions will be made for any reason, including technical issues, disputes, or misunderstandings.',
        'By participating in the platform, you acknowledge and accept this no-refund policy.'
      ]
    },
    {
      id: 'peer-to-peer-nature',
      title: 'Peer-to-Peer Payment System',
      icon: Users,
      content: [
        'All payments are made directly between members (peer-to-peer) without platform involvement.',
        'HH Foundation does not hold, manage, or control any member funds at any time.',
        'The platform only provides matching services to connect members for mutual help.',
        'Direct member-to-member transactions mean the platform cannot reverse or refund payments.',
        'Each member is responsible for their own payment decisions and transactions.',
        'Payment disputes must be resolved directly between the involved members.'
      ]
    },
    {
      id: 'transaction-finality',
      title: 'Transaction Finality',
      icon: ArrowRightLeft,
      content: [
        'Once a payment is sent to another member, it is considered final and complete.',
        'Payment confirmations uploaded to the platform cannot be reversed or cancelled.',
        'Bank transfers, UPI payments, and other payment methods used are irreversible.',
        'Members must verify all payment details before completing transactions.',
        'Incorrect payments due to member error are not eligible for platform assistance.',
        'The platform does not provide payment reversal services under any circumstances.'
      ]
    },
    {
      id: 'platform-limitations',
      title: 'Platform Limitations',
      icon: Shield,
      content: [
        'HH Foundation operates as a software platform and matching service only.',
        'We do not provide financial services, banking, or payment processing.',
        'The platform cannot access or control member bank accounts or payment methods.',
        'We do not have the technical capability to reverse peer-to-peer transactions.',
        'Platform maintenance, downtime, or technical issues do not qualify for refunds.',
        'System errors or glitches do not create refund obligations for the platform.'
      ]
    },
    {
      id: 'member-responsibility',
      title: 'Member Responsibility',
      icon: AlertTriangle,
      content: [
        'Members are fully responsible for verifying recipient details before making payments.',
        'Double-checking bank account numbers, UPI IDs, and payment amounts is mandatory.',
        'Members must ensure they understand the helping plan rules before participating.',
        'Payment decisions are made voluntarily by members without platform coercion.',
        'Members acknowledge the risks involved in peer-to-peer financial assistance.',
        'Participation in the helping plan is entirely at the member\'s own risk and discretion.'
      ]
    },
    {
      id: 'dispute-resolution',
      title: 'Dispute Resolution',
      icon: FileText,
      content: [
        'Payment disputes between members must be resolved directly without platform mediation.',
        'The platform does not arbitrate, mediate, or resolve financial disputes between members.',
        'Members should maintain proper communication and documentation for all transactions.',
        'Legal disputes should be handled through appropriate legal channels, not the platform.',
        'The platform may provide transaction records for legal proceedings if required by law.',
        'Platform support is limited to technical assistance and account-related queries only.'
      ]
    },
    {
      id: 'exceptional-circumstances',
      title: 'No Exceptions Policy',
      icon: Clock,
      content: [
        'No refunds will be provided for any reason, including but not limited to:',
        '• Technical difficulties or platform downtime during transactions',
        '• Member disputes, disagreements, or communication issues',
        '• Changes in personal financial circumstances',
        '• Misunderstanding of platform rules or helping plan structure',
        '• Bank errors, payment delays, or third-party service issues',
        '• Account suspension, termination, or blocking for policy violations'
      ]
    },
    {
      id: 'legal-compliance',
      title: 'Legal Compliance',
      icon: Shield,
      content: [
        'This refund policy complies with applicable laws and regulations.',
        'Members agree to this policy as part of the platform terms and conditions.',
        'The policy is binding and enforceable under the platform\'s terms of service.',
        'Legal challenges to this policy must be pursued through appropriate legal channels.',
        'The platform reserves the right to update this policy with proper notice to members.',
        'Continued use of the platform after policy updates constitutes acceptance of changes.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900">
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
              <XCircle className="w-12 h-12 text-red-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Refund
                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> Policy</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Important information about our no-refund policy for the HH Foundation peer-to-peer helping plan. 
              Please read this carefully before making any payments.
            </p>
          </motion.div>

          {/* Critical Notice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30 mb-12"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-300 mb-2">Critical Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  <strong>ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE.</strong> This is a peer-to-peer helping system where 
                  payments are made directly between members. Once sent, payments cannot be reversed, refunded, or recovered 
                  through the platform. Participate only if you fully understand and accept this policy.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Refund Policy Sections */}
          <div className="space-y-8">
            {refundData.map((section, index) => {
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
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Understanding Confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-yellow-500/20 to-red-500/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Before You Participate</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              By participating in the HH Foundation helping plan, you confirm that you have read, understood, 
              and accept this no-refund policy. If you have any doubts or questions, please contact support 
              before making any payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@helpinghandsfoundation.in"
                className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
              >
                Contact Support
              </a>
              <a
                href="tel:+916299261088"
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us
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

export default RefundPolicy;