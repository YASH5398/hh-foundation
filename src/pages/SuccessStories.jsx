import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, Users, Calendar, MapPin, Quote, Filter, Search, Play } from 'lucide-react';

const SuccessStories = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Stories', count: 45 },
    { id: 'level-1', name: 'Level 1 Success', count: 18 },
    { id: 'level-2', name: 'Level 2 Success', count: 15 },
    { id: 'level-3', name: 'Level 3 Success', count: 12 },
    { id: 'quick-growth', name: 'Quick Growth', count: 8 },
    { id: 'life-changing', name: 'Life Changing', count: 6 }
  ];

  const successStories = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      location: 'Mumbai, Maharashtra',
      level: 'Level 3',
      joinDate: 'January 2024',
      earnings: '₹2,45,000',
      timeframe: '8 months',
      category: 'level-3',
      featured: true,
      image: '/api/placeholder/150/150',
      story: 'I was skeptical at first, but HH Foundation changed my life completely. Starting from Level 1, I systematically grew to Level 3 within 8 months. The peer-to-peer system is transparent and the support team is amazing. I\'ve helped over 50 people join and grow their networks.',
      highlights: [
        'Grew from Level 1 to Level 3 in 8 months',
        'Helped 50+ people join the system',
        'Earned ₹2,45,000 total',
        'Built a strong downline network'
      ],
      videoTestimonial: true
    },
    {
      id: 2,
      name: 'Priya Sharma',
      location: 'Delhi, NCR',
      level: 'Level 2',
      joinDate: 'March 2024',
      earnings: '₹85,000',
      timeframe: '6 months',
      category: 'quick-growth',
      featured: false,
      image: '/api/placeholder/150/150',
      story: 'As a homemaker, I was looking for ways to contribute to my family income. HH Foundation provided the perfect opportunity. The 24-hour payment system ensures quick transactions, and I love how I can help others while earning.',
      highlights: [
        'Achieved Level 2 in just 6 months',
        'Balanced family life with earning',
        'Built network of 25+ members',
        'Consistent monthly earnings'
      ],
      videoTestimonial: false
    },
    {
      id: 3,
      name: 'Amit Patel',
      location: 'Ahmedabad, Gujarat',
      level: 'Level 3',
      joinDate: 'December 2023',
      earnings: '₹3,20,000',
      timeframe: '10 months',
      category: 'life-changing',
      featured: true,
      image: '/api/placeholder/150/150',
      story: 'I lost my job during the pandemic and was struggling financially. A friend introduced me to HH Foundation, and it literally saved my family. Now I earn more than my previous salary and have financial freedom.',
      highlights: [
        'Overcame financial crisis',
        'Earned more than previous job',
        'Achieved financial independence',
        'Helped 75+ people join'
      ],
      videoTestimonial: true
    },
    {
      id: 4,
      name: 'Sunita Devi',
      location: 'Jaipur, Rajasthan',
      level: 'Level 1',
      joinDate: 'June 2024',
      earnings: '₹15,000',
      timeframe: '3 months',
      category: 'level-1',
      featured: false,
      image: '/api/placeholder/150/150',
      story: 'I started with Level 1 just 3 months ago. Even though I\'m new, I\'ve already completed my first cycle and earned ₹15,000. The system is simple to understand and the community is very supportive.',
      highlights: [
        'Completed first cycle in 3 months',
        'Earned ₹15,000 as beginner',
        'Found supportive community',
        'Planning Level 2 upgrade'
      ],
      videoTestimonial: false
    },
    {
      id: 5,
      name: 'Vikash Singh',
      location: 'Patna, Bihar',
      level: 'Level 2',
      joinDate: 'February 2024',
      earnings: '₹1,25,000',
      timeframe: '7 months',
      category: 'level-2',
      featured: false,
      image: '/api/placeholder/150/150',
      story: 'Being from a small town, I never thought I could earn this much online. HH Foundation proved me wrong. The transparent system and genuine people made all the difference. Now I\'m planning to upgrade to Level 3.',
      highlights: [
        'Small town success story',
        'Earned ₹1,25,000 in 7 months',
        'Built trust in online systems',
        'Ready for Level 3 upgrade'
      ],
      videoTestimonial: false
    },
    {
      id: 6,
      name: 'Meera Joshi',
      location: 'Pune, Maharashtra',
      level: 'Level 3',
      joinDate: 'October 2023',
      earnings: '₹4,50,000',
      timeframe: '12 months',
      category: 'life-changing',
      featured: true,
      image: '/api/placeholder/150/150',
      story: 'I was a college student when I joined HH Foundation. Now I\'ve graduated and have my own financial independence. I\'ve even helped my parents with their expenses. This platform taught me about financial planning.',
      highlights: [
        'Student to financially independent',
        'Earned ₹4,50,000 in a year',
        'Helped family financially',
        'Learned financial planning'
      ],
      videoTestimonial: true
    }
  ];

  const stats = [
    { label: 'Success Stories', value: '500+', icon: Award },
    { label: 'Total Earnings', value: '₹2.5Cr+', icon: TrendingUp },
    { label: 'Active Members', value: '10,000+', icon: Users },
    { label: 'Average Growth', value: '300%', icon: Star }
  ];

  const filteredStories = successStories.filter(story => {
    const matchesSearch = story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.story.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredStories = successStories.filter(story => story.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Award className="w-8 h-8 text-yellow-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Success <span className="text-yellow-400">Stories</span>
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Real people, real results - Inspiring journeys of HH Foundation members
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center"
            >
              <stat.icon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8 flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-400 mr-3" />
            Featured Success Stories
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {featuredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{story.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{story.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{story.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium">
                        {story.level}
                      </span>
                      {story.videoTestimonial && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                          <Play className="w-3 h-3 mr-1" />
                          Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Quote className="w-6 h-6 text-yellow-400 mb-2" />
                  <p className="text-gray-300 text-sm italic">"{story.story}"</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{story.earnings}</div>
                    <div className="text-gray-400 text-xs">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{story.timeframe}</div>
                    <div className="text-gray-400 text-xs">Time Period</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {story.highlights.slice(0, 2).map((highlight, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter */}
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
                placeholder="Search success stories..."
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
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* All Stories Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {filteredStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{story.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {story.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{story.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  story.level === 'Level 1' ? 'bg-green-500' :
                  story.level === 'Level 2' ? 'bg-blue-500' : 'bg-purple-500'
                } text-white`}>
                  {story.level}
                </span>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{story.joinDate}</span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{story.story}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{story.earnings}</div>
                  <div className="text-gray-400 text-xs">Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{story.timeframe}</div>
                  <div className="text-gray-400 text-xs">Duration</div>
                </div>
              </div>
              
              <div className="space-y-1">
                {story.highlights.slice(0, 2).map((highlight, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs">{highlight}</span>
                  </div>
                ))}
              </div>
              
              {story.videoTestimonial && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Watch Video</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-8 border border-white/20">
            <Award className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Your Success Story Awaits</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of successful members who have transformed their lives through HH Foundation. 
              Your journey to financial freedom starts today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Start Your Journey
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Share Your Story
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuccessStories;