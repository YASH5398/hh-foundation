import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Crown, Gem, Diamond, TrendingUp, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const levels = [
  {
    name: 'Star',
    icon: Star,
    entryAmount: '₹300',
    maxReceives: '₹2,400',
    upgradeRule: '8 receives',
    totalEarning: '₹2,100',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    members: 1250,
    description: 'Perfect for beginners to start their journey'
  },
  {
    name: 'Silver',
    icon: Award,
    entryAmount: '₹2,100',
    maxReceives: '₹16,800',
    upgradeRule: '8 receives',
    totalEarning: '₹14,700',
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    members: 890,
    description: 'Steady growth with consistent returns'
  },
  {
    name: 'Gold',
    icon: Crown,
    entryAmount: '₹14,700',
    maxReceives: '₹1,17,600',
    upgradeRule: '8 receives',
    totalEarning: '₹1,02,900',
    color: 'from-yellow-500 to-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    members: 456,
    description: 'Accelerated earnings for committed members'
  },
  {
    name: 'Platinum',
    icon: Gem,
    entryAmount: '₹1,02,900',
    maxReceives: '₹8,23,200',
    upgradeRule: '8 receives',
    totalEarning: '₹7,20,300',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    members: 123,
    description: 'Elite level with premium benefits'
  },
  {
    name: 'Diamond',
    icon: Diamond,
    entryAmount: '₹7,20,300',
    maxReceives: '₹57,62,400',
    upgradeRule: '8 receives',
    totalEarning: '₹50,42,100',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    members: 45,
    description: 'Ultimate level for top performers'
  }
];

const chartData = [
  { name: 'Star', earning: 2100, members: 1250 },
  { name: 'Silver', earning: 14700, members: 890 },
  { name: 'Gold', earning: 102900, members: 456 },
  { name: 'Platinum', earning: 720300, members: 123 },
  { name: 'Diamond', earning: 5042100, members: 45 }
];

const pieData = [
  { name: 'Star', value: 1250, color: '#f59e0b' },
  { name: 'Silver', value: 890, color: '#6b7280' },
  { name: 'Gold', value: 456, color: '#eab308' },
  { name: 'Platinum', value: 123, color: '#a855f7' },
  { name: 'Diamond', value: 45, color: '#3b82f6' }
];

export default function LevelsAndCharts() {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [activeChart, setActiveChart] = useState('bar');

  return (
    <section className="py-20 bg-gradient-to-br from-white to-gray-50">
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
            Membership
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Levels</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your level and unlock unlimited earning potential with our transparent system
          </p>
        </motion.div>

        {/* Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          {levels.map((level, index) => {
            const IconComponent = level.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => setSelectedLevel(index)}
                className={`${level.bgColor} rounded-3xl p-6 border-2 ${selectedLevel === index ? level.borderColor : 'border-gray-100'} cursor-pointer transition-all duration-300 hover:shadow-2xl ${selectedLevel === index ? 'shadow-xl' : 'shadow-lg'}`}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-4 mx-auto`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Level Name */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                  {level.name}
                </h3>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Entry:</span>
                    <span className="font-bold text-gray-900">{level.entryAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Max Receives:</span>
                    <span className="font-bold text-green-600">{level.maxReceives}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Upgrade:</span>
                    <span className="font-bold text-blue-600">{level.upgradeRule}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Total Earning:</span>
                    <span className="font-bold text-purple-600">{level.totalEarning}</span>
                  </div>
                </div>

                {/* Members Count */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{level.members} members</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Level Details */}
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${levels[selectedLevel].color} flex items-center justify-center`}>
                  {React.createElement(levels[selectedLevel].icon, { className: "w-10 h-10 text-white" })}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">{levels[selectedLevel].name} Level</h3>
                  <p className="text-gray-600">{levels[selectedLevel].description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-2xl p-4">
                  <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Entry Amount</p>
                  <p className="text-2xl font-bold text-green-600">{levels[selectedLevel].entryAmount}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4">
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Total Earning</p>
                  <p className="text-2xl font-bold text-blue-600">{levels[selectedLevel].totalEarning}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Level Benefits</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Receive up to {levels[selectedLevel].maxReceives}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Upgrade after {levels[selectedLevel].upgradeRule}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Priority support & faster processing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Access to exclusive community features</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Earning Analytics</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart('bar')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeChart === 'bar'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Earnings Chart
              </button>
              <button
                onClick={() => setActiveChart('pie')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeChart === 'pie'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Members Distribution
              </button>
            </div>
          </div>

          <div className="h-80">
            {activeChart === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Earning']}
                  />
                  <Bar 
                    dataKey="earning" 
                    fill="url(#gradient)" 
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`${value} members`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}