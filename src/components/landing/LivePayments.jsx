import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyRupeeIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LivePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dummy payment data to fill the rest
  const dummyPayments = [
    {
      id: 'dummy1',
      senderName: 'Rajesh Kumar',
      receiverName: 'Priya Sharma',
      amount: 300,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      level: 'Star',
      isDummy: true
    },
    {
      id: 'dummy2',
      senderName: 'Sunita Devi',
      receiverName: 'Amit Singh',
      amount: 600,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      level: 'Silver',
      isDummy: true
    },
    {
      id: 'dummy3',
      senderName: 'Vikash Yadav',
      receiverName: 'Neha Gupta',
      amount: 2000,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      level: 'Gold',
      isDummy: true
    },
    {
      id: 'dummy4',
      senderName: 'Ravi Patel',
      receiverName: 'Kavita Joshi',
      amount: 300,
      status: 'pending',
      timestamp: new Date(Date.now() - Math.random() * 1800000),
      level: 'Star',
      isDummy: true
    },
    {
      id: 'dummy5',
      senderName: 'Deepak Sharma',
      receiverName: 'Pooja Verma',
      amount: 20000,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 7200000),
      level: 'Platinum',
      isDummy: true
    },
    {
      id: 'dummy6',
      senderName: 'Manish Agarwal',
      receiverName: 'Sita Ram',
      amount: 600,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      level: 'Silver',
      isDummy: true
    },
    {
      id: 'dummy7',
      senderName: 'Rohit Kumar',
      receiverName: 'Anjali Mishra',
      amount: 300,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 5400000),
      level: 'Star',
      isDummy: true
    },
    {
      id: 'dummy8',
      senderName: 'Suresh Gupta',
      receiverName: 'Rekha Singh',
      amount: 2000,
      status: 'pending',
      timestamp: new Date(Date.now() - Math.random() * 1800000),
      level: 'Gold',
      isDummy: true
    },
    {
      id: 'dummy9',
      senderName: 'Anil Yadav',
      receiverName: 'Geeta Devi',
      amount: 600,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      level: 'Silver',
      isDummy: true
    },
    {
      id: 'dummy10',
      senderName: 'Ramesh Tiwari',
      receiverName: 'Shanti Kumari',
      amount: 300,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 7200000),
      level: 'Star',
      isDummy: true
    },
    {
      id: 'dummy11',
      senderName: 'Vinod Singh',
      receiverName: 'Radha Sharma',
      amount: 20000,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 10800000),
      level: 'Platinum',
      isDummy: true
    },
    {
      id: 'dummy12',
      senderName: 'Mukesh Jain',
      receiverName: 'Savita Patel',
      amount: 2000,
      status: 'completed',
      timestamp: new Date(Date.now() - Math.random() * 5400000),
      level: 'Gold',
      isDummy: true
    }
  ];

  useEffect(() => {
    fetchLivePayments();
  }, []);

  const fetchLivePayments = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from Firestore receiveHelp collection
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        orderBy('timestamp', 'desc'),
        limit(5) // Get 5 real payments (about 30% of total 15-20 payments)
      );
      
      const querySnapshot = await getDocs(receiveHelpQuery);
      const realPayments = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        realPayments.push({
          id: doc.id,
          senderName: data.senderName || 'Anonymous',
          receiverName: data.receiverName || 'Anonymous',
          amount: data.amount || 300,
          status: data.status || 'completed',
          timestamp: data.timestamp?.toDate() || new Date(),
          level: data.level || 'Star',
          isDummy: false
        });
      });
      
      // Combine real payments (30%) with dummy payments (70%)
      const combinedPayments = [...realPayments, ...dummyPayments.slice(0, 12)];
      
      // Sort by timestamp (newest first)
      combinedPayments.sort((a, b) => b.timestamp - a.timestamp);
      
      setPayments(combinedPayments);
    } catch (error) {
      console.error('Error fetching live payments:', error);
      // If Firestore fails, use only dummy data
      setPayments(dummyPayments);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Star':
        return 'text-blue-600 bg-blue-100';
      case 'Silver':
        return 'text-gray-600 bg-gray-100';
      case 'Gold':
        return 'text-yellow-600 bg-yellow-100';
      case 'Platinum':
        return 'text-purple-600 bg-purple-100';
      case 'Diamond':
        return 'text-cyan-600 bg-cyan-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live payments...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-blue-100 text-green-800 text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Live Activity
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Live
            <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Payment Transactions
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real-time payment activity from our community members. See the trust and transparency in action.
          </p>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            { label: 'Total Transactions Today', value: '₹2,45,600', icon: CurrencyRupeeIcon, color: 'from-green-500 to-emerald-500' },
            { label: 'Active Payments', value: '127', icon: CheckCircleIcon, color: 'from-blue-500 to-cyan-500' },
            { label: 'Success Rate', value: '99.8%', icon: SparklesIcon, color: 'from-purple-500 to-pink-500' }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl mb-4 mx-auto`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </motion.div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h4>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Payments List */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Recent Transactions</h3>
              <motion.div
                className="flex items-center gap-2 text-green-600"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Live</span>
              </motion.div>
            </div>

            <motion.div
              className="space-y-4 max-h-96 overflow-y-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {payments.slice(0, 15).map((payment, index) => (
                <motion.div
                  key={payment.id}
                  variants={itemVariants}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      whileHover={{ scale: 1.1 }}
                    >
                      {payment.senderName.charAt(0)}
                    </motion.div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{payment.senderName}</span>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{payment.receiverName}</span>
                        {!payment.isDummy && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                            Real
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(payment.level)}`}>
                          {payment.level}
                        </span>
                        <span>{formatTime(payment.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 mb-1">
                      ₹{payment.amount.toLocaleString()}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status === 'completed' && <CheckCircleIcon className="w-3 h-3 inline mr-1" />}
                      {payment.status === 'pending' && <ClockIcon className="w-3 h-3 inline mr-1" />}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Join the Community
          </motion.button>
          <p className="text-gray-600 mt-4">Start your journey and see your name here!</p>
        </motion.div>
      </div>
    </section>
  );
};

export default LivePayments;