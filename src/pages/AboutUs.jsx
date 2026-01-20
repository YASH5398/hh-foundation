import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Shield, Target, Award, Globe, Handshake, TrendingUp } from 'lucide-react';

const AboutUs = () => {
  const missionData = [
    {
      icon: Heart,
      title: 'Our Mission',
      description: 'To create a transparent, secure, and community-driven helping platform that connects people in need with those willing to help, fostering mutual support and financial empowerment.'
    },
    {
      icon: Target,
      title: 'Our Vision',
      description: 'To build the world\'s most trusted peer-to-peer helping network where every member can achieve their financial goals through community support and collective growth.'
    },
    {
      icon: Users,
      title: 'Our Values',
      description: 'Transparency, Trust, Community, Integrity, and Mutual Support. We believe in creating lasting relationships and empowering individuals through collective strength.'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Advanced security measures, KYC verification, and fraud detection to protect all members.'
    },
    {
      icon: Handshake,
      title: 'Peer-to-Peer System',
      description: 'Direct member-to-member transactions without platform interference in financial flows.'
    },
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Multiple levels and upgrade paths to help members achieve their financial objectives.'
    },
    {
      icon: Globe,
      title: 'Community Driven',
      description: 'Built by the community, for the community, with transparent rules and fair practices.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Members' },
    { number: '₹50L+', label: 'Total Helps Exchanged' },
    { number: '99.8%', label: 'Success Rate' },
    { number: '24/7', label: 'Platform Support' }
  ];

  const timeline = [
    {
      year: '2024',
      title: 'Foundation Established',
      description: 'HH Foundation was founded with the vision of creating a transparent helping platform for the community.'
    },
    {
      year: '2024',
      title: 'Platform Development',
      description: 'Developed secure, user-friendly platform with advanced security features and KYC integration.'
    },
    {
      year: '2024',
      title: 'Community Launch',
      description: 'Successfully launched the platform with initial community members and established trust protocols.'
    },
    {
      year: '2025',
      title: 'Expansion & Growth',
      description: 'Expanding reach across India with enhanced features, mobile app, and improved user experience.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Heart className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                About
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> HH Foundation</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              We are a community-driven platform dedicated to creating meaningful connections and 
              fostering mutual support through our innovative peer-to-peer helping system.
            </p>
          </motion.div>

          {/* Company Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-16"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              HH Foundation was born from a simple yet powerful idea: that communities thrive when people help each other. 
              In a world where traditional financial systems often exclude those who need support the most, we saw an 
              opportunity to create something different.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Our platform is built on the principles of transparency, trust, and mutual benefit. We believe that when 
              people come together with a shared purpose, extraordinary things happen. Every member of our community 
              plays a vital role in creating a supportive ecosystem where everyone can achieve their financial goals.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              Based in Mumbai, Maharashtra, we serve members across India, providing a secure, regulated, and 
              user-friendly platform that puts community first. Our commitment to transparency means that every 
              rule, every process, and every decision is made with our members' best interests in mind.
            </p>
          </motion.div>

          {/* Mission, Vision, Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {missionData.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Platform Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Our Journey</h2>
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{item.year}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 flex-1">
                    <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Have questions about our platform or want to learn more about how we can help you 
              achieve your financial goals? We're here to support you every step of the way.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-purple-400">support@helpinghandsfoundation.in</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-purple-400">+91 6299261088</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold mb-2">Office Location</h3>
                <p className="text-purple-400">Mumbai, Maharashtra, India</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;