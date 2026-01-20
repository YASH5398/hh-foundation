import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Target, Heart, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const LeadershipTeam = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      position: 'Founder & CEO',
      image: '/api/placeholder/300/300',
      bio: 'Visionary leader with 15+ years in fintech and community building. Passionate about creating transparent financial ecosystems that empower individuals.',
      expertise: ['Strategic Leadership', 'Fintech Innovation', 'Community Building'],
      achievements: [
        'Founded 3 successful fintech startups',
        'Led digital transformation for 100+ companies',
        'Speaker at major fintech conferences'
      ],
      contact: {
        email: 'rajesh@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/rajeshkumar'
      }
    },
    {
      id: 2,
      name: 'Priya Sharma',
      position: 'Chief Technology Officer',
      image: '/api/placeholder/300/300',
      bio: 'Technology expert specializing in secure platform development, blockchain integration, and scalable system architecture.',
      expertise: ['Platform Security', 'Blockchain Technology', 'System Architecture'],
      achievements: [
        'Built security systems for major banks',
        '10+ years in cybersecurity',
        'Expert in fraud detection algorithms'
      ],
      contact: {
        email: 'priya@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/priyasharma'
      }
    },
    {
      id: 3,
      name: 'Amit Patel',
      position: 'Chief Operating Officer',
      image: '/api/placeholder/300/300',
      bio: 'Operations specialist focused on community growth, member satisfaction, and platform optimization for seamless user experience.',
      expertise: ['Operations Management', 'Community Growth', 'Process Optimization'],
      achievements: [
        'Scaled operations for 50,000+ users',
        'Reduced platform downtime by 99%',
        'Implemented 24/7 support systems'
      ],
      contact: {
        email: 'amit@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/amitpatel'
      }
    },
    {
      id: 4,
      name: 'Sneha Gupta',
      position: 'Head of Community Relations',
      image: '/api/placeholder/300/300',
      bio: 'Community advocate dedicated to member support, education, and ensuring positive experiences for all platform participants.',
      expertise: ['Community Management', 'Member Support', 'Education & Training'],
      achievements: [
        'Built communities of 25,000+ members',
        '98% member satisfaction rate',
        'Developed comprehensive training programs'
      ],
      contact: {
        email: 'sneha@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/snehagupta'
      }
    },
    {
      id: 5,
      name: 'Vikash Singh',
      position: 'Head of Security & Compliance',
      image: '/api/placeholder/300/300',
      bio: 'Security expert ensuring platform compliance, fraud prevention, and maintaining the highest standards of member protection.',
      expertise: ['Cybersecurity', 'Compliance', 'Risk Management'],
      achievements: [
        'Zero major security breaches',
        'Implemented advanced KYC systems',
        'Expert in financial regulations'
      ],
      contact: {
        email: 'vikash@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/vikashsingh'
      }
    },
    {
      id: 6,
      name: 'Anita Reddy',
      position: 'Head of Product Development',
      image: '/api/placeholder/300/300',
      bio: 'Product strategist focused on user experience, feature development, and creating intuitive solutions for community needs.',
      expertise: ['Product Strategy', 'UX Design', 'Feature Development'],
      achievements: [
        'Launched 15+ successful features',
        'Improved user engagement by 300%',
        'Award-winning UX designer'
      ],
      contact: {
        email: 'anita@helpinghandsfoundation.in',
        linkedin: 'linkedin.com/in/anitareddy'
      }
    }
  ];

  const advisors = [
    {
      name: 'Dr. Suresh Menon',
      position: 'Financial Advisor',
      expertise: 'Former RBI Official, Financial Regulation Expert',
      bio: '25+ years in banking and financial regulation'
    },
    {
      name: 'Kavita Joshi',
      position: 'Legal Advisor',
      expertise: 'Corporate Law, Fintech Compliance',
      bio: 'Leading fintech lawyer with expertise in regulatory compliance'
    },
    {
      name: 'Ravi Krishnan',
      position: 'Technology Advisor',
      expertise: 'Blockchain, Security Architecture',
      bio: 'Former CTO of major fintech companies'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'Every decision we make prioritizes our community\'s well-being and success.'
    },
    {
      icon: Target,
      title: 'Transparency',
      description: 'Open communication and clear processes in everything we do.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality platform and support.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Working together to build something greater than the sum of our parts.'
    }
  ];

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
              <Users className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Leadership
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Team</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Meet the passionate individuals driving HH Foundation's mission to create a transparent, 
              secure, and community-focused helping platform.
            </p>
          </motion.div>

          {/* Leadership Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 mb-16"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Our Leadership Philosophy</h2>
            <p className="text-gray-300 leading-relaxed text-lg text-center max-w-4xl mx-auto">
              We believe that great leadership comes from serving our community with integrity, transparency, and dedication. 
              Our team combines decades of experience in technology, finance, and community building to create a platform 
              that truly serves its members. Every decision we make is guided by our commitment to your success and security.
            </p>
          </motion.div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value, index) => {
              const IconComponent = value.icon;
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
                  <h3 className="text-lg font-bold mb-2 text-white">{value.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Team Members */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-12 text-center">Executive Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  {/* Profile Image Placeholder */}
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-purple-400 font-semibold">{member.position}</p>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{member.bio}</p>
                  
                  {/* Expertise */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Expertise:</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.expertise.map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Achievements */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Key Achievements:</h4>
                    <ul className="space-y-1">
                      {member.achievements.map((achievement, achIndex) => (
                        <li key={achIndex} className="text-gray-300 text-xs flex items-start gap-2">
                          <div className="w-1 h-1 bg-purple-400 rounded-full flex-shrink-0 mt-1.5"></div>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Contact */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
                    <a href={`mailto:${member.contact.email}`} className="text-gray-400 hover:text-purple-400 transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                    <a href={`https://${member.contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Advisory Board */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Advisory Board</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {advisors.map((advisor, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-white">
                      {advisor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{advisor.name}</h3>
                  <p className="text-blue-400 font-semibold mb-2">{advisor.position}</p>
                  <p className="text-purple-300 text-sm mb-3">{advisor.expertise}</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{advisor.bio}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Join Our Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
            <p className="text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              We're always looking for passionate individuals who share our vision of creating a better, 
              more inclusive financial ecosystem. If you're interested in making a meaningful impact, 
              we'd love to hear from you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Current Openings</h3>
                <p className="text-gray-300 mb-4">Explore exciting career opportunities with our growing team.</p>
                <a href="/careers" className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-300">
                  View Careers
                </a>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Contact Leadership</h3>
                <p className="text-gray-300 mb-4">Have questions or want to connect with our team?</p>
                <a href="mailto:leadership@helpinghandsfoundation.in" className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                  Get in Touch
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LeadershipTeam;