import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { FiFileText, FiPlus, FiX, FiEye, FiClock, FiCheckCircle, FiArrowLeft, FiZap, FiStar, FiAlertCircle, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TICKET_STATUSES = {
  open: { label: 'Open', color: 'yellow', icon: FiClock },
  'in-progress': { label: 'In Progress', color: 'blue', icon: FiFileText },
  closed: { label: 'Closed', color: 'green', icon: FiCheckCircle }
};

const TicketSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user tickets
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(userTickets);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        userEmail: user.email,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Ticket created successfully!');
      setFormData({ subject: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = TICKET_STATUSES[status] || TICKET_STATUSES.open;
    const Icon = statusConfig.icon;
    
    const colorClasses = {
      yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300',
      blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
      green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300'
    };

    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${
          colorClasses[statusConfig.color]
        } border backdrop-blur-sm font-medium text-sm`}
      >
        <Icon className="w-4 h-4" />
        {statusConfig.label}
      </motion.span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate('/dashboard/support')}
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Support
            </motion.button>
            
            <motion.div
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              whileHover={{ scale: 1.05 }}
            >
              <FiStar className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80 text-sm font-medium">Premium Support</span>
            </motion.div>
          </div>
          
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Support Tickets
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              Track and manage your support requests with our premium ticket system
            </motion.p>
          </div>
        </motion.div>

        {/* Create Ticket Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-center"
        >
          <motion.button
            onClick={() => setShowCreateForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto shadow-2xl"
          >
            <FiPlus className="w-5 h-5" />
            Create New Ticket
          </motion.button>
        </motion.div>

        {/* Create Ticket Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Support Ticket</h2>
                    <motion.button
                      onClick={() => setShowCreateForm(false)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <FiX className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 resize-none"
                        placeholder="Detailed description of your issue"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all duration-300 font-medium"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Ticket'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tickets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {tickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiFileText className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Tickets Yet</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                You haven't created any support tickets yet. Click the button above to get started.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {ticket.subject}
                      </h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    
                    <p className="text-white/70 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          Created {ticket.createdAt?.toDate?.()?.toLocaleDateString()}
                        </span>
                        {ticket.updatedAt && (
                          <span>
                            Updated {ticket.updatedAt?.toDate?.()?.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center ml-4 group-hover:bg-white/20 transition-colors"
                      >
                        <FiEye className="w-5 h-5 text-white/60" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Premium Ticket Detail Modal */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedTicket(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FiFileText className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                        <p className="text-white/60">Ticket #{selectedTicket.id.slice(-8)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedTicket.status)}
                      <motion.button
                        onClick={() => setSelectedTicket(null)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300"
                      >
                        <FiX className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiMessageCircle className="w-5 h-5 text-blue-400" />
                      Description
                    </h3>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <p className="text-white/80 leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5 text-blue-400" />
                      Ticket Details
                    </h3>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Created:</span>
                        <span className="text-white font-medium">
                          {selectedTicket.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                        </span>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Last Updated:</span>
                        <span className="text-white font-medium">
                          {selectedTicket.updatedAt?.toDate?.()?.toLocaleString() || 'Not updated'}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FiAlertCircle className="w-5 h-5 text-green-400" />
                        Admin Comments ({selectedTicket.comments.length})
                      </h3>
                      <div className="space-y-4">
                        {selectedTicket.comments.map((comment, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 ml-8"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                  <FiAlertCircle className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-white">Admin</span>
                              </div>
                              <span className="text-sm text-white/50">
                                {comment.timestamp?.toDate?.()?.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white/80 leading-relaxed">{comment.message}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
              <FiZap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">24/7 Support Available</span>
            </div>
            <p className="text-white/50 text-sm">
              Our support team typically responds within 2-4 hours
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TicketSystem;