import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Search, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Fallback FAQ data
const mockFAQs = [
  {
    id: 1,
    question: "How does the helping plan work?",
    answer: "Our helping plan is a peer-to-peer community where members help each other financially. When you join, you send help to existing members and receive help from new members who join after you. It's a transparent, community-driven system.",
    category: "General"
  },
  {
    id: 2,
    question: "Is this platform safe and secure?",
    answer: "Yes, absolutely. We use advanced security measures to protect your data and transactions. All payments are direct between members, and we provide complete transparency with real-time tracking of all activities.",
    category: "Security"
  },
  {
    id: 3,
    question: "How much can I earn?",
    answer: "Earnings depend on your level and activity. Our levels range from Star (₹300 to ₹900) to Diamond (₹2,00,000 to ₹18,00,000). The more you participate and help others, the more you can earn.",
    category: "Earnings"
  },
  {
    id: 4,
    question: "How do I get paid?",
    answer: "Payments are made directly between members through UPI, bank transfer, or other secure payment methods. You'll receive payment details when it's your turn to receive help.",
    category: "Payments"
  },
  {
    id: 5,
    question: "What if someone doesn't pay?",
    answer: "We have strict verification processes and community guidelines. Members who don't fulfill their commitments are removed from the platform. We also provide support to resolve any payment issues.",
    category: "Support"
  },
  {
    id: 6,
    question: "How do I join?",
    answer: "Simply register with your details, complete KYC verification, and start with any level that suits your budget. You'll be guided through the entire process step by step.",
    category: "Getting Started"
  },
  {
    id: 7,
    question: "Can I upgrade my level?",
    answer: "Yes, you can upgrade to higher levels anytime to increase your earning potential. Each level has different investment amounts and corresponding returns.",
    category: "Levels"
  },
  {
    id: 8,
    question: "Is there any hidden fee?",
    answer: "No, there are no hidden fees. The platform is completely transparent. You only pay the help amount for your chosen level, and that's it.",
    category: "Fees"
  }
];

const categories = ['All', 'General', 'Security', 'Earnings', 'Payments', 'Support', 'Getting Started', 'Levels', 'Fees'];

export default function FAQs() {
  const [faqs, setFaqs] = useState(mockFAQs);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch FAQs from Firestore
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const faqsDoc = await getDoc(doc(db, 'settings', 'faqs'));
        
        if (faqsDoc.exists()) {
          const faqsData = faqsDoc.data();
          if (faqsData.questions && Array.isArray(faqsData.questions)) {
            // Combine real FAQs with fallback data
            const realFAQs = faqsData.questions.map((faq, index) => ({
              id: `real-${index}`,
              question: faq.question || '',
              answer: faq.answer || '',
              category: faq.category || 'General'
            }));
            
            // Use real FAQs if available, otherwise use mock data
            setFaqs(realFAQs.length > 0 ? [...realFAQs, ...mockFAQs.slice(realFAQs.length)] : mockFAQs);
          }
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        // Keep fallback data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchFAQs();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Filter FAQs based on category and search term
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get answers to the most common questions about our helping plan platform
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {faq.question}
                  </h3>
                  <span className="text-sm text-blue-600 font-medium">
                    {faq.category}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredFaqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Found</h3>
            <p className="text-gray-600">Try adjusting your search or category filter.</p>
          </motion.div>
        )}

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Still Have Questions?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you 24/7.
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