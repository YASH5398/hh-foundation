import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Heart, TrendingUp, MapPin, Clock, DollarSign, Send, Star, Award, Target } from 'lucide-react';

const Careers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const jobOpenings = [
    {
      id: 1,
      title: 'Senior Full Stack Developer',
      department: 'technology',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹8-15 LPA',
      description: 'Join our tech team to build scalable, secure platform features using React, Node.js, and modern technologies.',
      requirements: [
        'Strong experience with React.js and Node.js',
        'Knowledge of database design and optimization',
        'Experience with cloud platforms (AWS/Azure)',
        'Understanding of security best practices',
        'Experience with payment gateway integrations'
      ],
      responsibilities: [
        'Develop and maintain platform features',
        'Implement security measures and fraud detection',
        'Optimize platform performance and scalability',
        'Collaborate with product and design teams',
        'Mentor junior developers'
      ]
    },
    {
      id: 2,
      title: 'Community Manager',
      department: 'community',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '2-4 years',
      salary: '₹5-8 LPA',
      description: 'Lead community engagement, member support, and growth initiatives to build a thriving helping community.',
      requirements: [
        'Experience in community management or customer success',
        'Excellent communication and interpersonal skills',
        'Understanding of social media and digital marketing',
        'Problem-solving and conflict resolution abilities',
        'Passion for helping others and building communities'
      ],
      responsibilities: [
        'Manage member onboarding and education',
        'Handle community support and dispute resolution',
        'Create engaging content and communication strategies',
        'Monitor community health and satisfaction metrics',
        'Organize community events and initiatives'
      ]
    },
    {
      id: 3,
      title: 'Cybersecurity Specialist',
      department: 'security',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '4-6 years',
      salary: '₹10-18 LPA',
      description: 'Protect our platform and members by implementing advanced security measures and fraud detection systems.',
      requirements: [
        'Strong background in cybersecurity and risk management',
        'Experience with fraud detection and prevention',
        'Knowledge of compliance frameworks and regulations',
        'Expertise in security testing and vulnerability assessment',
        'Understanding of fintech security requirements'
      ],
      responsibilities: [
        'Implement and maintain security protocols',
        'Monitor for suspicious activities and fraud',
        'Conduct security audits and assessments',
        'Develop incident response procedures',
        'Ensure compliance with financial regulations'
      ]
    },
    {
      id: 4,
      title: 'Product Manager',
      department: 'product',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹12-20 LPA',
      description: 'Drive product strategy and development to enhance user experience and platform functionality.',
      requirements: [
        'Experience in product management, preferably in fintech',
        'Strong analytical and data-driven decision making skills',
        'Understanding of user experience and design principles',
        'Excellent project management and communication skills',
        'Knowledge of agile development methodologies'
      ],
      responsibilities: [
        'Define product roadmap and strategy',
        'Gather and analyze user feedback and requirements',
        'Coordinate with engineering and design teams',
        'Monitor product metrics and performance',
        'Conduct market research and competitive analysis'
      ]
    },
    {
      id: 5,
      title: 'Digital Marketing Specialist',
      department: 'marketing',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '2-4 years',
      salary: '₹4-7 LPA',
      description: 'Drive growth through digital marketing campaigns, content creation, and community outreach.',
      requirements: [
        'Experience in digital marketing and social media management',
        'Knowledge of SEO, SEM, and content marketing',
        'Proficiency in marketing analytics and tools',
        'Creative thinking and content creation skills',
        'Understanding of fintech and community-based platforms'
      ],
      responsibilities: [
        'Develop and execute digital marketing strategies',
        'Create engaging content for various channels',
        'Manage social media presence and community engagement',
        'Analyze marketing performance and optimize campaigns',
        'Collaborate with community team on growth initiatives'
      ]
    },
    {
      id: 6,
      title: 'Customer Support Representative',
      department: 'support',
      location: 'Mumbai, Maharashtra',
      type: 'Full-time',
      experience: '1-3 years',
      salary: '₹3-5 LPA',
      description: 'Provide exceptional support to our community members and help resolve their queries and concerns.',
      requirements: [
        'Excellent communication skills in English and Hindi',
        'Customer service experience, preferably in fintech',
        'Problem-solving abilities and patience',
        'Basic understanding of financial transactions',
        'Ability to work in shifts and handle multiple queries'
      ],
      responsibilities: [
        'Handle member queries via chat, email, and phone',
        'Assist with account setup and verification processes',
        'Resolve transaction-related issues and disputes',
        'Educate members about platform features and policies',
        'Escalate complex issues to appropriate teams'
      ]
    }
  ];

  const departments = [
    { id: 'all', name: 'All Departments', count: jobOpenings.length },
    { id: 'technology', name: 'Technology', count: jobOpenings.filter(job => job.department === 'technology').length },
    { id: 'community', name: 'Community', count: jobOpenings.filter(job => job.department === 'community').length },
    { id: 'security', name: 'Security', count: jobOpenings.filter(job => job.department === 'security').length },
    { id: 'product', name: 'Product', count: jobOpenings.filter(job => job.department === 'product').length },
    { id: 'marketing', name: 'Marketing', count: jobOpenings.filter(job => job.department === 'marketing').length },
    { id: 'support', name: 'Support', count: jobOpenings.filter(job => job.department === 'support').length }
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and wellness programs for you and your family.'
    },
    {
      icon: TrendingUp,
      title: 'Growth & Learning',
      description: 'Professional development opportunities, training programs, and conference attendance support.'
    },
    {
      icon: Users,
      title: 'Work-Life Balance',
      description: 'Flexible working hours, remote work options, and generous paid time off policies.'
    },
    {
      icon: Award,
      title: 'Recognition & Rewards',
      description: 'Performance bonuses, employee recognition programs, and equity participation opportunities.'
    }
  ];

  const culture = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Work on meaningful projects that make a real difference in people\'s lives and financial well-being.'
    },
    {
      icon: Users,
      title: 'Collaborative',
      description: 'Open, inclusive environment where every voice is heard and diverse perspectives are valued.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation-Focused',
      description: 'Encouraged to think creatively, experiment with new ideas, and drive technological advancement.'
    },
    {
      icon: Heart,
      title: 'Community-Centered',
      description: 'Strong emphasis on building relationships, supporting each other, and growing together as a team.'
    }
  ];

  const filteredJobs = selectedDepartment === 'all' 
    ? jobOpenings 
    : jobOpenings.filter(job => job.department === selectedDepartment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Briefcase className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Join Our
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Team</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Be part of a mission-driven team that's building the future of community-based financial support. 
              Help us create meaningful connections and empower individuals through technology.
            </p>
          </motion.div>

          {/* Why Join Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 mb-16"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Why Choose HH Foundation?</h2>
            <p className="text-gray-300 leading-relaxed text-lg text-center max-w-4xl mx-auto mb-8">
              Join a company that values innovation, transparency, and community impact. We're not just building a platform; 
              we're creating a movement that empowers people to help each other achieve their financial goals.
            </p>
            
            {/* Culture Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {culture.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white">{item.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{benefit.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Department Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Open Positions</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    selectedDepartment === dept.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {dept.name} ({dept.count})
                </button>
              ))}
            </div>
          </motion.div>

          {/* Job Listings */}
          <div className="space-y-6 mb-16">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30 capitalize">
                        {job.department}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{job.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">{job.experience}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">{job.salary}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">{job.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-3">Requirements:</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, reqIndex) => (
                            <li key={reqIndex} className="text-gray-300 text-sm flex items-start gap-2">
                              <div className="w-1 h-1 bg-purple-400 rounded-full flex-shrink-0 mt-2"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-3">Responsibilities:</h4>
                        <ul className="space-y-2">
                          {job.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} className="text-gray-300 text-sm flex items-start gap-2">
                              <div className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:w-48 flex-shrink-0">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Apply Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Application Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Application Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-bold mb-2">Apply Online</h3>
                <p className="text-gray-300 text-sm">Submit your application with resume and cover letter</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-bold mb-2">Initial Screening</h3>
                <p className="text-gray-300 text-sm">HR review and initial phone/video screening</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-bold mb-2">Technical Interview</h3>
                <p className="text-gray-300 text-sm">Skills assessment and team interviews</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">4</span>
                </div>
                <h3 className="font-bold mb-2">Final Decision</h3>
                <p className="text-gray-300 text-sm">Offer discussion and onboarding</p>
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Questions About Careers?</h2>
            <p className="text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Don't see a position that fits your skills? We're always interested in hearing from talented individuals. 
              Reach out to us and let's discuss how you can contribute to our mission.
            </p>
            <a 
              href="mailto:careers@helpinghandsfoundation.in" 
              className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Contact HR Team
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Careers;