import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  ExternalLink,
  Shield,
  FileText,
  HelpCircle,
  Users,
  Heart
} from 'lucide-react';

const faqData = [
  {
    question: 'How does the Helping Plan work?',
    answer: 'Our helping plan is a peer-to-peer system where members help each other by sending and receiving financial assistance. When you join, you send help to existing members and receive help from new members who join after you.'
  },
  {
    question: 'Is this platform safe and legal?',
    answer: 'Yes, our platform operates within legal frameworks and follows all regulatory guidelines. We use bank-grade security, KYC verification, and transparent processes to ensure member safety and trust.'
  },
  {
    question: 'How much can I earn?',
    answer: 'Earnings depend on your level and activity. Starting from ₹300 at Star level, you can earn up to ₹50+ lakhs at Diamond level. The more active you are, the higher your earning potential.'
  },
  {
    question: 'How do I upgrade to higher levels?',
    answer: 'You can upgrade to higher levels after completing the required number of receives at your current level. Each level has specific upgrade criteria that are clearly mentioned in your dashboard.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major payment methods including UPI, Net Banking, Debit/Credit Cards, and Bank Transfers. All transactions are secure and processed instantly.'
  },
  {
    question: 'How long does it take to receive help?',
    answer: 'Typically, you start receiving help within 24-48 hours of joining. The exact timing depends on new member registrations and your position in the queue.'
  }
];

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Success Stories', href: '/success-stories' },
    { name: 'Leadership Team', href: '/leadership' },
    { name: 'Careers', href: '/careers' }
  ],
  support: [
    { name: 'Help Center', href: '/help-center' },
    { name: 'Contact Support', href: '/contact' },
    { name: 'Live Chat', href: '/live-chat' },
    { name: 'Video Tutorials', href: '/tutorials' },
    { name: 'Community Forum', href: '/community' }
  ],
  legal: [
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund-policy' },
    { name: 'Cookie Policy', href: '/cookie-policy' },
    { name: 'Disclaimer', href: '/disclaimer' }
  ],
  resources: [
    { name: 'Resources & Guides', href: '/resources' },
    { name: 'Level Information', href: '/levels' },
    { name: 'Payment Methods', href: '/payment-methods' },
    { name: 'Security Features', href: '/security' },
    { name: 'Mobile App', href: '/mobile-app' }
  ]
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com', color: 'hover:text-blue-600' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com', color: 'hover:text-blue-400' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com', color: 'hover:text-pink-600' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', color: 'hover:text-red-600' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com', color: 'hover:text-blue-700' }
];

export default function Footer() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* FAQ Section */}
      <section className="py-16 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Questions</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Get answers to the most common questions about our helping plan platform
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="mb-4"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-blue-300 transition-colors duration-300">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/5 rounded-2xl p-6 mt-2 border border-white/10">
                        <p className="text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    HH Foundation
                  </span>
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Empowering financial freedom through our transparent peer-to-peer helping plan. 
                  Join thousands of members who have transformed their lives with our community-driven platform.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <a href="mailto:support@helpinghandsfoundation.in" className="text-gray-300 hover:text-blue-300 transition-colors duration-300">
                      support@helpinghandsfoundation.in
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-400" />
                    <a href="tel:+916299261088" className="text-gray-300 hover:text-green-300 transition-colors duration-300">
                      +91 6299261088
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-400" />
                    <span className="text-gray-300">Mumbai, Maharashtra, India</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-400" />
                Support
              </h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Legal
              </h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Resources Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-gray-700"
          >
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              Resources & Guides
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {footerLinks.resources.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
                >
                  <span className="text-gray-300 group-hover:text-white transition-colors duration-300 text-sm">
                    {link.name}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Footer */}
      <section className="py-8 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center gap-2"
            >
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-gray-300">
                © 2025 HH Foundation. Made with ❤️ for our community.
              </span>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <span className="text-gray-400 text-sm">Follow us:</span>
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-10 h-10 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 transition-all duration-300 text-gray-300 ${social.color}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 pt-6 border-t border-gray-800 text-center"
          >
            <p className="text-gray-400 text-sm">
              All rights reserved. This platform operates under applicable laws and regulations. 
              Please read our Terms & Conditions before participating.
            </p>
          </motion.div>
        </div>
      </section>
    </footer>
  );
}