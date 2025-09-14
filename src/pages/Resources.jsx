import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, FileText, Video, Calculator, Shield, TrendingUp, Users, Search, Filter, ExternalLink, Clock, Star } from 'lucide-react';

const Resources = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Resources', icon: BookOpen, count: 24 },
    { id: 'guides', name: 'Guides & Tutorials', icon: FileText, count: 8 },
    { id: 'videos', name: 'Video Resources', icon: Video, count: 6 },
    { id: 'tools', name: 'Tools & Calculators', icon: Calculator, count: 4 },
    { id: 'legal', name: 'Legal Documents', icon: Shield, count: 6 }
  ];

  const resources = [
    {
      id: 1,
      title: 'Complete Beginner\'s Guide to HH Foundation',
      description: 'Everything you need to know to get started with our helping plan system.',
      category: 'guides',
      type: 'PDF Guide',
      size: '2.5 MB',
      downloads: 1250,
      rating: 4.9,
      featured: true,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      title: 'Level Upgrade Calculator',
      description: 'Calculate your potential earnings and upgrade costs for different levels.',
      category: 'tools',
      type: 'Interactive Tool',
      size: 'Web App',
      downloads: 890,
      rating: 4.8,
      featured: true,
      icon: Calculator,
      color: 'from-green-500 to-emerald-500',
      lastUpdated: '2024-01-10'
    },
    {
      id: 3,
      title: 'Payment Security Best Practices',
      description: 'Learn how to make secure payments and protect yourself from fraud.',
      category: 'guides',
      type: 'Video Guide',
      size: '45 min',
      downloads: 2100,
      rating: 4.9,
      featured: false,
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      lastUpdated: '2024-01-12'
    },
    {
      id: 4,
      title: 'KYC Document Checklist',
      description: 'Complete list of documents required for KYC verification.',
      category: 'legal',
      type: 'PDF Checklist',
      size: '500 KB',
      downloads: 1800,
      rating: 4.7,
      featured: false,
      icon: FileText,
      color: 'from-purple-500 to-indigo-500',
      lastUpdated: '2024-01-08'
    },
    {
      id: 5,
      title: 'Network Building Strategies',
      description: 'Proven strategies to build and grow your downline network effectively.',
      category: 'guides',
      type: 'eBook',
      size: '5.2 MB',
      downloads: 950,
      rating: 4.8,
      featured: true,
      icon: Users,
      color: 'from-orange-500 to-red-500',
      lastUpdated: '2024-01-14'
    },
    {
      id: 6,
      title: 'Mobile App Tutorial Series',
      description: 'Step-by-step video tutorials for using the HH Foundation mobile app.',
      category: 'videos',
      type: 'Video Series',
      size: '2.5 hours',
      downloads: 1400,
      rating: 4.6,
      featured: false,
      icon: Video,
      color: 'from-teal-500 to-blue-500',
      lastUpdated: '2024-01-11'
    },
    {
      id: 7,
      title: 'Terms & Conditions Explained',
      description: 'Simplified explanation of our terms and conditions in easy language.',
      category: 'legal',
      type: 'PDF Guide',
      size: '1.8 MB',
      downloads: 750,
      rating: 4.5,
      featured: false,
      icon: FileText,
      color: 'from-gray-500 to-slate-500',
      lastUpdated: '2024-01-09'
    },
    {
      id: 8,
      title: 'ROI Calculator & Planner',
      description: 'Plan your investments and calculate returns across different levels.',
      category: 'tools',
      type: 'Excel Template',
      size: '850 KB',
      downloads: 680,
      rating: 4.7,
      featured: false,
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      lastUpdated: '2024-01-13'
    }
  ];

  const quickTools = [
    {
      name: 'Earnings Calculator',
      description: 'Calculate potential earnings',
      icon: Calculator,
      color: 'bg-blue-500'
    },
    {
      name: 'Level Comparison',
      description: 'Compare different levels',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      name: 'Payment Tracker',
      description: 'Track your payments',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      name: 'Network Analyzer',
      description: 'Analyze your network',
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter(resource => resource.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Resources & <span className="text-blue-400">Guides</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Everything you need to succeed in the HH Foundation helping plan system
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Quick Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickTools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group"
              >
                <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{tool.name}</h3>
                <p className="text-gray-400 text-xs">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8 flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-400 mr-3" />
            Featured Resources
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${resource.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <resource.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {resource.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                        {resource.type}
                      </span>
                      <span className="text-gray-400">{resource.size}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>{resource.downloads}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{resource.rating}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Updated {resource.lastUpdated}</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Access Resource</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
                <span className="bg-white/20 px-2 py-1 rounded text-xs">{category.count}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Resources Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${resource.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <resource.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {resource.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                      {resource.type}
                    </span>
                    <span className="text-gray-400 text-xs">{resource.size}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
              
              <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Download className="w-4 h-4" />
                    <span>{resource.downloads}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{resource.rating}</span>
                  </div>
                </div>
                <span className="text-xs">Updated {resource.lastUpdated}</span>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 border border-white/20">
            <BookOpen className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Need More Help?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you with any questions 
              about our resources or the HH Foundation system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Contact Support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Request Resource
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Resources;