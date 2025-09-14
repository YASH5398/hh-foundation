import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Users, Star, Search, Filter, BookOpen, Video, Download } from 'lucide-react';

const VideoTutorials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 24 },
    { id: 'getting-started', name: 'Getting Started', count: 6 },
    { id: 'payments', name: 'Payments & KYC', count: 5 },
    { id: 'levels', name: 'Level System', count: 4 },
    { id: 'support', name: 'Support & Help', count: 3 },
    { id: 'advanced', name: 'Advanced Features', count: 6 }
  ];

  const tutorials = [
    {
      id: 1,
      title: 'Welcome to HH Foundation - Complete Overview',
      description: 'Learn everything about our peer-to-peer helping plan system, how it works, and how to get started.',
      duration: '12:45',
      views: '15.2K',
      rating: 4.9,
      category: 'getting-started',
      thumbnail: '/api/placeholder/320/180',
      level: 'Beginner',
      featured: true
    },
    {
      id: 2,
      title: 'Account Registration & KYC Verification',
      description: 'Step-by-step guide to create your account and complete KYC verification for secure transactions.',
      duration: '8:30',
      views: '12.8K',
      rating: 4.8,
      category: 'getting-started',
      thumbnail: '/api/placeholder/320/180',
      level: 'Beginner'
    },
    {
      id: 3,
      title: 'Understanding the 3x3 Level System',
      description: 'Comprehensive explanation of our level system, upgrade requirements, and benefits at each level.',
      duration: '15:20',
      views: '18.5K',
      rating: 4.9,
      category: 'levels',
      thumbnail: '/api/placeholder/320/180',
      level: 'Intermediate'
    },
    {
      id: 4,
      title: 'Making Your First Payment Safely',
      description: 'Learn how to make secure payments, verify receiver details, and follow our 24-hour payment rule.',
      duration: '10:15',
      views: '14.3K',
      rating: 4.7,
      category: 'payments',
      thumbnail: '/api/placeholder/320/180',
      level: 'Beginner'
    },
    {
      id: 5,
      title: 'Receiving Help & Payment Confirmation',
      description: 'How to receive help payments, confirm transactions, and maintain your account status.',
      duration: '9:45',
      views: '11.7K',
      rating: 4.8,
      category: 'payments',
      thumbnail: '/api/placeholder/320/180',
      level: 'Beginner'
    },
    {
      id: 6,
      title: 'Level Upgrade Process & Requirements',
      description: 'Detailed walkthrough of upgrading to higher levels and unlocking additional benefits.',
      duration: '13:30',
      views: '16.9K',
      rating: 4.9,
      category: 'levels',
      thumbnail: '/api/placeholder/320/180',
      level: 'Intermediate'
    },
    {
      id: 7,
      title: 'Using the Support System Effectively',
      description: 'How to get help from our support team, submit tickets, and resolve common issues.',
      duration: '7:20',
      views: '8.4K',
      rating: 4.6,
      category: 'support',
      thumbnail: '/api/placeholder/320/180',
      level: 'Beginner'
    },
    {
      id: 8,
      title: 'Advanced Dashboard Features',
      description: 'Explore advanced features in your dashboard, analytics, and team management tools.',
      duration: '18:45',
      views: '9.2K',
      rating: 4.8,
      category: 'advanced',
      thumbnail: '/api/placeholder/320/180',
      level: 'Advanced'
    }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTutorial = tutorials.find(t => t.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Video className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Video <span className="text-blue-400">Tutorials</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Master the HH Foundation helping plan with our comprehensive video guides
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Featured Tutorial */}
        {featuredTutorial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Star className="w-6 h-6 text-yellow-400 mr-2" />
              Featured Tutorial
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="relative group cursor-pointer">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl aspect-video flex items-center justify-center">
                    <Play className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {featuredTutorial.duration}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{featuredTutorial.title}</h3>
                  <p className="text-gray-300 mb-4">{featuredTutorial.description}</p>
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">{featuredTutorial.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">{featuredTutorial.views} views</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">{featuredTutorial.rating}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Watch Now</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 appearance-none cursor-pointer"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id} className="bg-slate-800">
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tutorial Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTutorials.map((tutorial, index) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Play className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {tutorial.duration}
                </div>
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${
                  tutorial.level === 'Beginner' ? 'bg-green-500' :
                  tutorial.level === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                } text-white`}>
                  {tutorial.level}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{tutorial.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{tutorial.rating}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Learning Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Recommended Learning Path</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Follow this structured path to master the HH Foundation helping plan system
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Getting Started', description: 'Account setup and basics' },
              { step: 2, title: 'First Payment', description: 'Making secure transactions' },
              { step: 3, title: 'Level System', description: 'Understanding upgrades' },
              { step: 4, title: 'Advanced Features', description: 'Mastering the platform' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoTutorials;