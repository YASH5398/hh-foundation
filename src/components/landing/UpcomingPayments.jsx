import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, User, Star, Award, Crown, Gem, Diamond, Eye } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Mock data for upcoming payments (fallback)
const mockPayments = [
  {
    id: 'HH001234',
    name: 'Rajesh Kumar',
    level: 'Gold',
    status: 'Pending',
    amount: '₹14,700',
    timeLeft: '2h 15m',
    avatar: 'RK',
    progress: 75
  },
  {
    id: 'HH001567',
    name: 'Priya Sharma',
    level: 'Silver',
    status: 'Active',
    amount: '₹2,100',
    timeLeft: '4h 30m',
    avatar: 'PS',
    progress: 60
  },
  {
    id: 'HH001890',
    name: 'Amit Patel',
    level: 'Platinum',
    status: 'Processing',
    amount: '₹1,02,900',
    timeLeft: '1h 45m',
    avatar: 'AP',
    progress: 90
  },
  {
    id: 'HH002123',
    name: 'Sunita Devi',
    level: 'Star',
    status: 'Pending',
    amount: '₹300',
    timeLeft: '6h 20m',
    avatar: 'SD',
    progress: 45
  },
  {
    id: 'HH002456',
    name: 'Vikash Singh',
    level: 'Diamond',
    status: 'Active',
    amount: '₹7,20,300',
    timeLeft: '3h 10m',
    avatar: 'VS',
    progress: 85
  },
  {
    id: 'HH002789',
    name: 'Meera Joshi',
    level: 'Gold',
    status: 'Processing',
    amount: '₹14,700',
    timeLeft: '5h 55m',
    avatar: 'MJ',
    progress: 70
  }
];

const levelIcons = {
  Star: Star,
  Silver: Award,
  Gold: Crown,
  Platinum: Gem,
  Diamond: Diamond
};

const levelColors = {
  Star: 'from-yellow-400 to-orange-500',
  Silver: 'from-gray-400 to-gray-600',
  Gold: 'from-yellow-500 to-yellow-700',
  Platinum: 'from-purple-400 to-purple-600',
  Diamond: 'from-blue-400 to-blue-600'
};

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Active: 'bg-green-100 text-green-800 border-green-200',
  Processing: 'bg-blue-100 text-blue-800 border-blue-200'
};

export default function UpcomingPayments() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [visibleCards, setVisibleCards] = useState(3);
  const [payments, setPayments] = useState(mockPayments);
  const [loading, setLoading] = useState(true);

  // Fetch real users from Firestore
  useEffect(() => {
    fetchUpcomingPayments();
  }, []);

  const fetchUpcomingPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch real users where isActivated=true and isReceivingHeld=false
      const usersQuery = query(
        collection(db, 'users'),
        where('isActivated', '==', true),
        where('isReceivingHeld', '==', false),
        orderBy('joinedAt', 'desc'),
        limit(3) // Get 3 real users (about 50% of total 6 payments)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const realUsers = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const levelAmounts = {
          'Star': '₹300',
          'Silver': '₹600', 
          'Gold': '₹2,000',
          'Platinum': '₹20,000',
          'Diamond': '₹2,00,000'
        };
        
        realUsers.push({
          id: data.userId || doc.id,
          name: data.fullName || 'Anonymous User',
          level: data.level || 'Star',
          status: 'Active',
          amount: levelAmounts[data.level] || '₹300',
          timeLeft: `${Math.floor(Math.random() * 8) + 1}h ${Math.floor(Math.random() * 60)}m`,
          avatar: (data.fullName || 'AU').split(' ').map(n => n[0]).join('').toUpperCase(),
          progress: Math.floor(Math.random() * 40) + 60, // 60-100% progress
          isReal: true
        });
      });
      
      // Combine real users with dummy data
      const combinedPayments = [...realUsers, ...mockPayments.slice(0, 6 - realUsers.length)];
      
      setPayments(combinedPayments);
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      // If Firestore fails, use only dummy data
      setPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % payments.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Responsive visible cards
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % payments.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + payments.length) % payments.length);
  };

  const getVisiblePayments = () => {
    const visiblePayments = [];
    for (let i = 0; i < visibleCards; i++) {
      const index = (currentIndex + i) % payments.length;
      visiblePayments.push(payments[index]);
    }
    return visiblePayments;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
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
            Live
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Payments</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See real-time payment activities from our active community members
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">24/7</p>
                <p className="text-gray-600">Active Payments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2,764+</p>
                <p className="text-gray-600">Active Members</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹45L+</p>
                <p className="text-gray-600">Total Distributed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Payment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-16">
            <AnimatePresence mode="wait">
              {getVisiblePayments().map((payment, index) => {
                const LevelIcon = levelIcons[payment.level];
                return (
                  <motion.div
                    key={`${payment.id}-${currentIndex}-${index}`}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-bold">{payment.avatar}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{payment.name}</h3>
                          <p className="text-sm text-gray-500">{payment.id}</p>
                        </div>
                      </div>
                      
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelColors[payment.level]} flex items-center justify-center`}>
                        <LevelIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Level & Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900">{payment.level} Level</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[payment.status]}`}>
                        {payment.status}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                      <p className="text-2xl font-bold text-green-600">{payment.amount}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{payment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${payment.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="bg-gradient-to-r from-green-400 to-emerald-600 h-2 rounded-full"
                        ></motion.div>
                      </div>
                    </div>

                    {/* Time Left */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Time left: {payment.timeLeft}</span>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-green-500 rounded-full"
                      ></motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-8 gap-2">
          {payments.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to See More Live Activities?
            </h3>
            <p className="text-gray-600 mb-6">
              Login to access real-time payment dashboard and track all community activities
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Eye className="w-5 h-5" />
              See All After Login
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}