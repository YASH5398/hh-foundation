import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote, Play, Pause } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Fallback testimonials data
const mockTestimonials = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    location: 'Mumbai, Maharashtra',
    avatar: 'RK',
    rating: 5,
    level: 'Diamond',
    earning: '₹12,45,000',
    feedback: "This platform has completely transformed my financial situation. The transparency and genuine support from the community is incredible. I've been able to achieve financial freedom I never thought possible.",
    joinDate: 'Member since 2022',
    verified: true
  },
  {
    id: 2,
    name: 'Priya Sharma',
    location: 'Delhi, NCR',
    avatar: 'PS',
    rating: 5,
    level: 'Platinum',
    earning: '₹8,90,000',
    feedback: "As a working mother, this platform gave me the flexibility to earn while managing my family. The community is supportive and the system is completely transparent. Highly recommended!",
    joinDate: 'Member since 2022',
    verified: true
  },
  {
    id: 3,
    name: 'Amit Patel',
    location: 'Ahmedabad, Gujarat',
    avatar: 'AP',
    rating: 5,
    level: 'Gold',
    earning: '₹5,67,000',
    feedback: "I was skeptical at first, but the results speak for themselves. The peer-to-peer system is brilliant and the earnings are consistent. This has become my primary source of income.",
    joinDate: 'Member since 2023',
    verified: true
  },
  {
    id: 4,
    name: 'Sunita Devi',
    location: 'Patna, Bihar',
    avatar: 'SD',
    rating: 5,
    level: 'Silver',
    earning: '₹3,45,000',
    feedback: "Coming from a small town, I never imagined I could earn this much. The platform is user-friendly and the support team is always helpful. It's changed my family's life completely.",
    joinDate: 'Member since 2023',
    verified: true
  },
  {
    id: 5,
    name: 'Vikash Singh',
    location: 'Bangalore, Karnataka',
    avatar: 'VS',
    rating: 5,
    level: 'Gold',
    earning: '₹6,78,000',
    feedback: "The best part about this platform is the community. Everyone helps each other grow. The earning potential is unlimited and the process is completely transparent.",
    joinDate: 'Member since 2022',
    verified: true
  },
  {
    id: 6,
    name: 'Meera Joshi',
    location: 'Pune, Maharashtra',
    avatar: 'MJ',
    rating: 5,
    level: 'Platinum',
    earning: '₹9,23,000',
    feedback: "I've tried many platforms before, but none come close to this. The real-time updates, instant payments, and genuine community support make this the best choice for financial growth.",
    joinDate: 'Member since 2022',
    verified: true
  }
];

const levelColors = {
  Diamond: 'from-blue-400 to-blue-600',
  Platinum: 'from-purple-400 to-purple-600',
  Gold: 'from-yellow-400 to-yellow-600',
  Silver: 'from-gray-400 to-gray-600'
};

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const [testimonials, setTestimonials] = useState(mockTestimonials);
  const [loading, setLoading] = useState(true);

  // Fetch real testimonials from Firestore
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('isActivated', '==', true),
          where('totalEarnings', '>', 10000), // Users with significant earnings
          orderBy('totalEarnings', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const realTestimonials = [];
        
        querySnapshot.forEach((doc, index) => {
          const userData = doc.data();
          const testimonial = {
            id: `real-${doc.id}`,
            name: userData.name || `User ${userData.userId?.slice(-4) || 'XXXX'}`,
            location: userData.city ? `${userData.city}, ${userData.state || 'India'}` : 'India',
            avatar: (userData.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            rating: 5,
            level: userData.currentLevel || 'Star',
            earning: `₹${(userData.totalEarnings || 0).toLocaleString('en-IN')}`,
            feedback: index === 0 
              ? "This platform has completely transformed my financial situation. The transparency and genuine support from the community is incredible."
              : index === 1
              ? "The peer-to-peer system is brilliant and the earnings are consistent. This has become my primary source of income."
              : "The community is supportive and the system is completely transparent. Highly recommended!",
            joinDate: userData.createdAt ? `Member since ${new Date(userData.createdAt.toDate()).getFullYear()}` : 'Member since 2023',
            verified: true
          };
          realTestimonials.push(testimonial);
        });
        
        // Combine real testimonials with dummy ones for balance
        const combinedTestimonials = [
          ...realTestimonials,
          ...mockTestimonials.slice(realTestimonials.length)
        ];
        
        setTestimonials(combinedTestimonials.slice(0, 6)); // Keep max 6 testimonials
        
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Keep fallback data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestimonials();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Success
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Stories</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real experiences from our community members who have transformed their lives
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">2,500+</div>
            <div className="text-gray-600">Happy Members</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">₹45L+</div>
            <div className="text-gray-600">Total Distributed</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">98%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </motion.div>

        {/* Main Testimonial Card */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110 -ml-6"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110 -mr-6"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Auto-play Control */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-300"
          >
            {isAutoPlaying ? (
              <Pause className="w-5 h-5 text-gray-600" />
            ) : (
              <Play className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Testimonial Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="p-8 md:p-12"
              >
                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Quote className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center mb-6">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial Text */}
                <motion.blockquote
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl md:text-2xl text-gray-700 text-center leading-relaxed mb-8 font-medium"
                >
                  "{currentTestimonial.feedback}"
                </motion.blockquote>

                {/* User Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col md:flex-row items-center justify-center gap-6"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-gray-700 font-bold text-2xl">{currentTestimonial.avatar}</span>
                    </div>
                    {currentTestimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{currentTestimonial.name}</h3>
                    <p className="text-gray-600 mb-2">{currentTestimonial.location}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${levelColors[currentTestimonial.level]} text-white text-sm font-medium`}>
                        {currentTestimonial.level} Level
                      </div>
                      <span className="text-green-600 font-bold text-lg">{currentTestimonial.earning}</span>
                    </div>
                    <p className="text-gray-500 text-sm">{currentTestimonial.joinDate}</p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Testimonial Indicators */}
        <div className="flex justify-center mt-8 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 h-3 bg-purple-600 rounded-full'
                  : 'w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Thumbnail Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div className="flex justify-center gap-4 overflow-x-auto pb-4">
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                onClick={() => goToTestimonial(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  index === currentIndex
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-bold">{testimonial.avatar}</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                    <p className="text-gray-600 text-xs">{testimonial.level} Level</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Write Your Success Story?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied members who have transformed their financial future with our platform
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey Today
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}