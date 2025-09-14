import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, TrendingUp, Clock, ThumbsUp, MessageCircle, Search, Filter, Plus, Pin, Award, Eye } from 'lucide-react';

const Community = () => {
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', count: 156 },
    { id: 'getting-started', name: 'Getting Started', count: 45 },
    { id: 'payments', name: 'Payments & KYC', count: 32 },
    { id: 'levels', name: 'Level System', count: 28 },
    { id: 'support', name: 'Support', count: 24 },
    { id: 'success-stories', name: 'Success Stories', count: 18 },
    { id: 'general', name: 'General Discussion', count: 9 }
  ];

  const discussions = [
    {
      id: 1,
      title: 'How to maximize earnings in Level 3?',
      author: 'RahulK_2024',
      authorLevel: 'Level 3',
      category: 'levels',
      replies: 23,
      views: 456,
      likes: 12,
      lastActivity: '2 hours ago',
      isPinned: true,
      isHot: true,
      excerpt: 'Looking for strategies to optimize my Level 3 performance and help more people effectively...'
    },
    {
      id: 2,
      title: 'KYC Verification Taking Too Long - Need Help',
      author: 'PriyaS_Helper',
      authorLevel: 'Level 1',
      category: 'payments',
      replies: 15,
      views: 234,
      likes: 8,
      lastActivity: '4 hours ago',
      isPinned: false,
      isHot: false,
      excerpt: 'My KYC has been pending for 3 days. Has anyone faced similar issues? What should I do?'
    },
    {
      id: 3,
      title: 'Success Story: From Level 1 to Level 3 in 2 Months!',
      author: 'AmitSuccess',
      authorLevel: 'Level 3',
      category: 'success-stories',
      replies: 45,
      views: 1234,
      likes: 67,
      lastActivity: '6 hours ago',
      isPinned: false,
      isHot: true,
      excerpt: 'Sharing my journey and tips that helped me grow quickly in the HH Foundation system...'
    },
    {
      id: 4,
      title: 'Best Payment Methods for Quick Transactions',
      author: 'TechGuru_HH',
      authorLevel: 'Level 2',
      category: 'payments',
      replies: 18,
      views: 567,
      likes: 25,
      lastActivity: '8 hours ago',
      isPinned: false,
      isHot: false,
      excerpt: 'Comparing different payment methods and their processing times for helping transactions...'
    },
    {
      id: 5,
      title: 'New Member Introduction and Questions',
      author: 'NewHelper2024',
      authorLevel: 'Level 1',
      category: 'getting-started',
      replies: 12,
      views: 189,
      likes: 6,
      lastActivity: '12 hours ago',
      isPinned: false,
      isHot: false,
      excerpt: 'Just joined HH Foundation! Excited to start helping others. Have a few questions about the process...'
    },
    {
      id: 6,
      title: 'Understanding the 24-Hour Payment Rule',
      author: 'HelpingHand_Pro',
      authorLevel: 'Level 3',
      category: 'getting-started',
      replies: 31,
      views: 789,
      likes: 19,
      lastActivity: '1 day ago',
      isPinned: true,
      isHot: false,
      excerpt: 'Detailed explanation of why we have the 24-hour rule and how to manage your payments effectively...'
    }
  ];

  const topContributors = [
    { name: 'AmitSuccess', level: 'Level 3', posts: 156, likes: 1234, badge: 'Top Helper' },
    { name: 'HelpingHand_Pro', level: 'Level 3', posts: 134, likes: 987, badge: 'Expert' },
    { name: 'TechGuru_HH', level: 'Level 2', posts: 89, likes: 654, badge: 'Tech Expert' },
    { name: 'RahulK_2024', level: 'Level 3', posts: 76, likes: 543, badge: 'Mentor' },
    { name: 'PriyaS_Helper', level: 'Level 1', posts: 45, likes: 321, badge: 'Rising Star' }
  ];

  const stats = [
    { label: 'Total Members', value: '12,456', icon: Users, color: 'text-blue-400' },
    { label: 'Discussions', value: '1,234', icon: MessageSquare, color: 'text-green-400' },
    { label: 'Success Stories', value: '89', icon: Award, color: 'text-yellow-400' },
    { label: 'Active Today', value: '456', icon: TrendingUp, color: 'text-purple-400' }
  ];

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || discussion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Users className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Community <span className="text-blue-400">Forum</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Connect, share experiences, and grow together in the HH Foundation community
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 appearance-none cursor-pointer"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id} className="bg-slate-800">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Post</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Discussions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {filteredDiscussions.map((discussion, index) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {discussion.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                        {discussion.isHot && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            HOT
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          categories.find(c => c.id === discussion.category)?.name === 'Success Stories' ? 'bg-green-500' :
                          categories.find(c => c.id === discussion.category)?.name === 'Getting Started' ? 'bg-blue-500' :
                          categories.find(c => c.id === discussion.category)?.name === 'Payments & KYC' ? 'bg-purple-500' :
                          'bg-gray-500'
                        } text-white`}>
                          {categories.find(c => c.id === discussion.category)?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {discussion.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{discussion.excerpt}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-blue-400">{discussion.author}</span>
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {discussion.authorLevel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{discussion.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{discussion.replies} replies</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{discussion.views} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{discussion.likes} likes</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Join Discussion
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Top Contributors */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 text-yellow-400 mr-2" />
                Top Contributors
              </h3>
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{contributor.name}</div>
                      <div className="text-gray-400 text-xs">{contributor.level}</div>
                      <div className="text-xs text-blue-400">{contributor.badge}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">{contributor.posts}</div>
                      <div className="text-gray-400 text-xs">{contributor.likes} likes</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{category.name}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">{category.count}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;