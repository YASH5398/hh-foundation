import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, TrendingDown, Users, Scale, FileText, Clock, Phone } from 'lucide-react';

const Disclaimer = () => {
  const disclaimerData = [
    {
      id: 'not-investment',
      title: 'Not an Investment Scheme',
      icon: TrendingDown,
      content: [
        'HH Foundation is NOT an investment scheme, MLM, or get-rich-quick program.',
        'This is a peer-to-peer helping plan where members voluntarily help each other.',
        'There are no guaranteed returns, profits, or financial gains promised.',
        'Participation does not constitute an investment in any company, security, or financial instrument.',
        'Members should not expect or rely on any form of financial return from participation.',
        'This platform is designed for mutual assistance, not wealth generation or investment purposes.'
      ]
    },
    {
      id: 'member-responsibility',
      title: 'Member Responsibility',
      icon: Users,
      content: [
        'Members are solely responsible for making timely payments within the 24-hour deadline.',
        'Each member must manage their own financial obligations and payment schedules.',
        'The platform does not remind, force, or guarantee member payment compliance.',
        'Members participate voluntarily and at their own risk and discretion.',
        'Personal financial decisions and their consequences are entirely the member\'s responsibility.',
        'Members must ensure they can afford to participate before joining any level.'
      ]
    },
    {
      id: 'platform-role',
      title: 'Platform Role & Limitations',
      icon: Shield,
      content: [
        'HH Foundation provides ONLY software platform and member matching services.',
        'We do not provide financial services, banking, investment advice, or payment processing.',
        'The platform does not hold, manage, control, or guarantee any member funds.',
        'We are not a financial institution, bank, or licensed investment advisor.',
        'Platform services are limited to connecting members and providing communication tools.',
        'Technical support is provided for platform functionality only, not financial guidance.'
      ]
    },
    {
      id: 'no-guarantees',
      title: 'No Financial Guarantees',
      icon: Scale,
      content: [
        'The platform provides NO financial guarantees of any kind to members.',
        'We do not guarantee that members will receive helps or payments from others.',
        'Platform functionality, member participation, and payment completion are not guaranteed.',
        'Technical issues, system downtime, or platform changes may affect member experience.',
        'Member defaults, non-payments, or account suspensions are beyond platform control.',
        'The platform disclaims all liability for member financial losses or missed opportunities.'
      ]
    },
    {
      id: 'risk-acknowledgment',
      title: 'Risk Acknowledgment',
      icon: AlertTriangle,
      content: [
        'Participation in the helping plan involves inherent financial and personal risks.',
        'Members may lose money if other members fail to fulfill their payment obligations.',
        'There is no insurance, protection, or compensation for member losses.',
        'Platform suspension, termination, or technical issues may result in lost opportunities.',
        'Members acknowledge and accept all risks associated with peer-to-peer financial assistance.',
        'The platform strongly advises members to participate only with funds they can afford to lose.'
      ]
    },
    {
      id: 'legal-compliance',
      title: 'Legal Compliance & Jurisdiction',
      icon: FileText,
      content: [
        'Members are responsible for ensuring their participation complies with local laws.',
        'The platform operates under Indian jurisdiction and applicable laws.',
        'Members must verify that peer-to-peer helping plans are legal in their jurisdiction.',
        'Any legal disputes will be subject to Indian courts and legal system.',
        'The platform reserves the right to restrict access based on legal requirements.',
        'Members agree to hold the platform harmless from any legal consequences of their participation.'
      ]
    },
    {
      id: 'platform-changes',
      title: 'Platform Changes & Termination',
      icon: Clock,
      content: [
        'The platform reserves the right to modify, suspend, or terminate services at any time.',
        'Changes to platform rules, structure, or functionality may occur without prior notice.',
        'Platform termination may result in loss of member benefits, pending helps, or account access.',
        'No compensation will be provided for platform changes, suspension, or termination.',
        'Members acknowledge that platform availability is not guaranteed indefinitely.',
        'Backup plans and alternative arrangements are the member\'s responsibility.'
      ]
    },
    {
      id: 'limitation-liability',
      title: 'Limitation of Liability',
      icon: Shield,
      content: [
        'HH Foundation\'s liability is limited to the maximum extent permitted by law.',
        'The platform is not liable for any direct, indirect, incidental, or consequential damages.',
        'We disclaim liability for member losses, missed payments, or financial damages.',
        'Platform errors, bugs, or technical issues do not create liability for member losses.',
        'Members waive any claims against the platform for participation-related losses.',
        'Total platform liability, if any, shall not exceed the platform service fees paid by the member.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-red-900">
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
              <AlertTriangle className="w-12 h-12 text-orange-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Platform
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> Disclaimer</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Important disclaimers and limitations regarding the HH Foundation platform. 
              Please read this carefully to understand our role, limitations, and your responsibilities.
            </p>
          </motion.div>

          {/* Critical Warning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30 mb-12"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-300 mb-2">Critical Warning</h3>
                <p className="text-gray-300 leading-relaxed">
                  <strong>PARTICIPATE AT YOUR OWN RISK.</strong> This is not an investment scheme. 
                  The platform provides only software services and member matching. We do not guarantee 
                  payments, returns, or financial outcomes. Members are responsible for all financial decisions and risks.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer Sections */}
          <div className="space-y-8">
            {disclaimerData.map((section, index) => {
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
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Acknowledgment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Acknowledgment Required</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              By using the HH Foundation platform, you acknowledge that you have read, understood, and agree to 
              all disclaimers above. You participate voluntarily and at your own risk. If you have questions 
              about these disclaimers, please contact support before participating.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@helpinghandsfoundation.in"
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
              >
                Contact Support
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

export default Disclaimer;