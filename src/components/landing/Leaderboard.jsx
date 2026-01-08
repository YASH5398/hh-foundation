import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Star, Users, DollarSign } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Fallback leaderboard data
const mockTopEarners = [
  {
    rank: 1,
    name: 'Rajesh Kumar',
    userId: 'HH001234',
    totalEarning: '₹12,45,000',
    level: 'Diamond',
    avatar: 'RK',
    monthlyGrowth: '+25%',
    referrals: 156,
    badge: 'Top Performer'
  },
  {
    rank: 2,
    name: 'Priya Sharma',
    userId: 'HH001567',
    totalEarning: '₹8,90,000',
    level: 'Platinum',
    avatar: 'PS',
    monthlyGrowth: '+18%',
    referrals: 134,
    badge: 'Rising Star'
  },
  {
    rank: 3,
    name: 'Amit Patel',
    userId: 'HH001890',
    totalEarning: '₹7,65,000',
    level: 'Platinum',
    avatar: 'AP',
    monthlyGrowth: '+22%',
    referrals: 128,
    badge: 'Consistent Earner'
  }
];

const mockOtherEarners = [
  {
    rank: 4,
    name: 'Sunita Devi',
    userId: 'HH002123',
    totalEarning: '₹6,45,000',
    level: 'Gold',
    avatar: 'SD',
    monthlyGrowth: '+15%'
  },
  {
    rank: 5,
    name: 'Vikash Singh',
    userId: 'HH002456',
    totalEarning: '₹5,89,000',
    level: 'Gold',
    avatar: 'VS',
    monthlyGrowth: '+20%'
  },
  {
    rank: 6,
    name: 'Meera Joshi',
    userId: 'HH002789',
    totalEarning: '₹5,23,000',
    level: 'Gold',
    avatar: 'MJ',
    monthlyGrowth: '+12%'
  },
  {
    rank: 7,
    name: 'Ravi Gupta',
    userId: 'HH003012',
    totalEarning: '₹4,78,000',
    level: 'Silver',
    avatar: 'RG',
    monthlyGrowth: '+17%'
  },
  {
    rank: 8,
    name: 'Kavita Yadav',
    userId: 'HH003345',
    totalEarning: '₹4,34,000',
    level: 'Silver',
    avatar: 'KY',
    monthlyGrowth: '+14%'
  },
  {
    rank: 9,
    name: 'Deepak Verma',
    userId: 'HH003678',
    totalEarning: '₹3,89,000',
    level: 'Silver',
    avatar: 'DV',
    monthlyGrowth: '+19%'
  },
  {
    rank: 10,
    name: 'Anita Singh',
    userId: 'HH003901',
    totalEarning: '₹3,56,000',
    level: 'Silver',
    avatar: 'AS',
    monthlyGrowth: '+16%'
  }
];

const levelColors = {
  Diamond: 'from-blue-400 to-blue-600',
  Platinum: 'from-purple-400 to-purple-600',
  Gold: 'from-yellow-400 to-yellow-600',
  Silver: 'from-gray-400 to-gray-600'
};

const podiumHeights = ['h-32', 'h-40', 'h-28'];
const podiumColors = [
  'from-yellow-400 to-yellow-600', // 1st place - Gold
  'from-gray-300 to-gray-500',     // 2nd place - Silver
  'from-orange-400 to-orange-600'  // 3rd place - Bronze
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [topEarners, setTopEarners] = useState(mockTopEarners);
  const [otherEarners, setOtherEarners] = useState(mockOtherEarners);
  const [loading, setLoading] = useState(true);

  // Fetch top earners from Firestore
  useEffect(() => {
    const fetchTopEarners = async () => {
      try {
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
          leaderboardRef,
          where("level", "==", 1),
          orderBy('totalEarnings', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const realUsers = [];
        
        querySnapshot.forEach((doc, index) => {
          const userData = doc.data();
          const user = {
            rank: index + 1,
            name: userData.name || `User ${userData.userId?.slice(-4) || 'XXXX'}`,
            userId: userData.userId || doc.id,
            totalEarning: `₹${(userData.totalEarnings || 0).toLocaleString('en-IN')}`,
            level: userData.currentLevel || 'Star',
            avatar: (userData.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            monthlyGrowth: `+${Math.floor(Math.random() * 20 + 10)}%`,
            referrals: userData.directReferrals || Math.floor(Math.random() * 50 + 20),
            badge: index === 0 ? 'Top Performer' : index === 1 ? 'Rising Star' : 'Consistent Earner'
          };
          realUsers.push(user);
        });
        
        // Combine real users with dummy data to ensure we have 10 total
        const combinedTopEarners = [...realUsers];
        const combinedOtherEarners = [];
        
        // Fill remaining spots with dummy data
        const dummyData = [...mockTopEarners, ...mockOtherEarners];
        let currentRank = realUsers.length + 1;
        
        for (let i = realUsers.length; i < 10; i++) {
          const dummyUser = dummyData[i] || dummyData[i % dummyData.length];
          const adjustedUser = {
            ...dummyUser,
            rank: currentRank++,
            totalEarning: `₹${Math.floor(Math.random() * 500000 + 100000).toLocaleString('en-IN')}`
          };
          
          if (i < 3) {
            combinedTopEarners.push(adjustedUser);
          } else {
            combinedOtherEarners.push(adjustedUser);
          }
        }
        
        // Ensure we have exactly 3 top earners and 7 others
        setTopEarners(combinedTopEarners.slice(0, 3));
        setOtherEarners(combinedOtherEarners.length > 0 ? combinedOtherEarners : combinedTopEarners.slice(3, 10));
        
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        // Keep fallback data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopEarners();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Top
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Performers</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Celebrating our community's highest achievers and their success stories
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-full p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'monthly'
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Monthly Leaders
            </button>
            <button
              onClick={() => setActiveTab('alltime')}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'alltime'
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              All Time
            </button>
          </div>
        </motion.div>

        {/* Podium Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-gray-300">
                  <span className="text-gray-700 font-bold text-xl">{topEarners[1].avatar}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{topEarners[1].name}</h3>
              <p className="text-gray-300 text-sm mb-2">{topEarners[1].userId}</p>
              <p className="text-gray-300 font-bold text-xl mb-4">{topEarners[1].totalEarning}</p>
              <div className={`${podiumHeights[1]} w-24 bg-gradient-to-t ${podiumColors[1]} rounded-t-lg mx-auto flex items-end justify-center pb-2`}>
                <Medal className="w-6 h-6 text-white" />
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-4">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-yellow-300 shadow-lg"
                >
                  <span className="text-yellow-800 font-bold text-2xl">{topEarners[0].avatar}</span>
                </motion.div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">{topEarners[0].name}</h3>
              <p className="text-gray-300 text-sm mb-2">{topEarners[0].userId}</p>
              <p className="text-yellow-400 font-bold text-2xl mb-2">{topEarners[0].totalEarning}</p>
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium mb-4">
                {topEarners[0].badge}
              </div>
              <div className={`${podiumHeights[0]} w-28 bg-gradient-to-t ${podiumColors[0]} rounded-t-lg mx-auto flex items-end justify-center pb-2`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-orange-300">
                  <span className="text-orange-800 font-bold text-xl">{topEarners[2].avatar}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{topEarners[2].name}</h3>
              <p className="text-gray-300 text-sm mb-2">{topEarners[2].userId}</p>
              <p className="text-gray-300 font-bold text-xl mb-4">{topEarners[2].totalEarning}</p>
              <div className={`${podiumHeights[2]} w-24 bg-gradient-to-t ${podiumColors[2]} rounded-t-lg mx-auto flex items-end justify-center pb-2`}>
                <Award className="w-6 h-6 text-white" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Top 3 Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {topEarners.map((earner, index) => (
            <div key={earner.rank} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${levelColors[earner.level]} flex items-center justify-center`}>
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold">{earner.level} Level</h4>
                  <p className="text-gray-300 text-sm">{earner.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Monthly Growth</p>
                  <p className="text-green-400 font-bold">{earner.monthlyGrowth}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Referrals</p>
                  <p className="text-white font-bold">{earner.referrals}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Other Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Other Top Performers</h3>
          
          <div className="space-y-4">
            {otherEarners.map((earner, index) => (
              <motion.div
                key={earner.rank}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                className="flex items-center justify-between p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{earner.rank}</span>
                  </div>
                  
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-bold">{earner.avatar}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-bold">{earner.name}</h4>
                    <p className="text-gray-400 text-sm">{earner.userId} • {earner.level} Level</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-bold text-lg">{earner.totalEarning}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">{earner.monthlyGrowth}</span>
                  </div>
                </div>
              </motion.div>
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
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 border border-yellow-400/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Join the Leaderboard?
            </h3>
            <p className="text-gray-300 mb-6">
              Start your journey today and become the next success story in our community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
              >
                <Users className="w-5 h-5" />
                Join Community
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-full font-bold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 justify-center"
              >
                <DollarSign className="w-5 h-5" />
                View Full Leaderboard
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}