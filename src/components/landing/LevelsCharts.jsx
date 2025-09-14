import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  StarIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const LevelsCharts = () => {
  const [activeTab, setActiveTab] = useState('levels');

  // Level data
  const levels = [
    {
      id: 1,
      name: 'Star',
      investment: 300,
      returns: 900,
      members: 3,
      duration: '7-15 days',
      color: '#3B82F6',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      icon: StarIcon,
      features: ['Basic Support', 'Community Access', '3x Returns']
    },
    {
      id: 2,
      name: 'Silver',
      investment: 600,
      returns: 5400,
      members: 9,
      duration: '15-30 days',
      color: '#6B7280',
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-50 to-slate-50',
      icon: TrophyIcon,
      features: ['Priority Support', 'Advanced Tools', '9x Returns']
    },
    {
      id: 3,
      name: 'Gold',
      investment: 2000,
      returns: 18000,
      members: 9,
      duration: '30-45 days',
      color: '#F59E0B',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      icon: TrophyIcon,
      features: ['VIP Support', 'Exclusive Events', '9x Returns']
    },
    {
      id: 4,
      name: 'Platinum',
      investment: 20000,
      returns: 180000,
      members: 9,
      duration: '45-60 days',
      color: '#8B5CF6',
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      icon: TrophyIcon,
      features: ['Personal Manager', 'Premium Benefits', '9x Returns']
    },
    {
      id: 5,
      name: 'Diamond',
      investment: 200000,
      returns: 1800000,
      members: 9,
      duration: '60-90 days',
      color: '#06B6D4',
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-50',
      icon: TrophyIcon,
      features: ['Elite Status', 'Maximum Returns', '9x Returns']
    }
  ];

  // Chart data
  const earningsData = levels.map(level => ({
    name: level.name,
    investment: level.investment,
    returns: level.returns,
    profit: level.returns - level.investment
  }));

  const growthData = [
    { month: 'Month 1', members: 8, earnings: 2400 },
    { month: 'Month 2', members: 16, earnings: 7200 },
    { month: 'Month 3', members: 32, earnings: 19200 },
    { month: 'Month 4', members: 64, earnings: 48000 },
    { month: 'Month 5', members: 128, earnings: 115200 },
    { month: 'Month 6', members: 256, earnings: 268800 }
  ];

  const distributionData = [
    { name: 'Star', value: 35, color: '#3B82F6' },
    { name: 'Silver', value: 25, color: '#6B7280' },
    { name: 'Gold', value: 20, color: '#F59E0B' },
    { name: 'Platinum', value: 15, color: '#8B5CF6' },
    { name: 'Diamond', value: 5, color: '#06B6D4' }
  ];

  const tabs = [
    { id: 'levels', label: 'Levels Overview', icon: StarIcon },
    { id: 'earnings', label: 'Earnings Chart', icon: ChartBarIcon },
    { id: 'growth', label: 'Growth Projection', icon: ArrowTrendingUpIcon },
    { id: 'distribution', label: 'Member Distribution', icon: UsersIcon }
  ];

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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
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
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Investment Levels
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Levels &
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Earning Charts
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our transparent level structure and see your potential earnings with detailed charts and projections.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'levels' && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {levels.map((level, index) => {
                const IconComponent = level.icon;
                return (
                  <motion.div
                    key={level.id}
                    variants={itemVariants}
                    className="group"
                  >
                    <motion.div
                      className={`relative bg-gradient-to-br ${level.bgGradient} rounded-3xl p-6 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500`}
                      whileHover={{ 
                        y: -10,
                        scale: 1.02,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                    >
                      {/* Level Badge */}
                      <motion.div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${level.gradient} rounded-2xl mb-4 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>

                      {/* Level Name */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {level.name}
                      </h3>

                      {/* Investment & Returns */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Investment:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(level.investment)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Returns:</span>
                          <span className="font-bold text-green-600">{formatCurrency(level.returns)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Members:</span>
                          <span className="font-bold text-blue-600">{level.members}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-bold text-purple-600">{level.duration}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {level.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${level.gradient}`} />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* ROI Badge */}
                      <motion.div
                        className={`bg-gradient-to-r ${level.gradient} text-white px-4 py-2 rounded-xl text-center font-bold`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {level.name === 'Star' ? '3x' : '9x'} Returns
                      </motion.div>

                      {/* Hover Effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${level.gradient} rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                        initial={false}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Investment vs Returns Comparison
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value/1000}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="investment" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returns" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Network Growth & Earnings Projection
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value/1000}K`} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'earnings' ? formatCurrency(value) : value,
                        name === 'earnings' ? 'Earnings' : 'Members'
                      ]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#8B5CF6" 
                      fill="url(#earningsGradient)" 
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="members" 
                      stroke="#06B6D4" 
                      strokeWidth={3}
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 6 }}
                    />
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Member Distribution by Level
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Percentage']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                {distributionData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 font-medium">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {[
            { label: 'Total Levels', value: '5', icon: StarIcon, color: 'from-blue-500 to-cyan-500' },
            { label: 'Max Returns', value: '8x', icon: TrophyIcon, color: 'from-green-500 to-emerald-500' },
            { label: 'Active Members', value: '10K+', icon: UsersIcon, color: 'from-purple-500 to-pink-500' },
            { label: 'Success Rate', value: '98%', icon: ChartBarIcon, color: 'from-orange-500 to-red-500' }
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
                <h4 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h4>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default LevelsCharts;