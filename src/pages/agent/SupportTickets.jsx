import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiUser, FiClock, FiMessageSquare,
  FiPaperclip, FiChevronRight, FiX, FiSend, FiAlertCircle,
  FiCheckCircle, FiRefreshCw, FiEdit3, FiFlag, FiFileText, FiPlus
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, addDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Raise Ticket Modal State ───────────────────────────────
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  // Fetch tickets with real-time updates - filtered by logged-in user
  useEffect(() => {
    if (!user?.uid) return;

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let filtered = tickets;
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }
    const messagesQuery = query(
      collection(db, 'supportTickets', selectedTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, [selectedTicket?.id]);

  // ── Existing handlers (unchanged) ─────────────────────────────
  const handleAssignToMe = async (ticketId) => { /* ... unchanged ... */ };
  const handleStatusChange = async (ticketId, newStatus) => { /* ... unchanged ... */ };
  const handleSendMessage = async (e) => { /* ... unchanged ... */ };

  // ── Raise Ticket Handlers (only UI + basic validation) ───────
  const handleRaiseTicketChange = (e) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleRaiseTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }

    try {
      await addDoc(collection(db, 'supportTickets'), {
        ...newTicket,
        userId: user?.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        agentId: null
      });
      toast.success('Ticket raised successfully');
      setShowRaiseTicketModal(false);
      setNewTicket({ subject: '', description: '', priority: 'medium' });
    } catch (err) {
      console.error('Failed to create ticket:', err);
      toast.error('Failed to raise ticket');
    }
  };

  // Color helpers (unchanged)
  const getStatusColor = (status) => { /* ... unchanged ... */ };
  const getPriorityColor = (priority) => { /* ... unchanged ... */ };
  const formatTimestamp = (timestamp) => { /* ... unchanged ... */ };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-white/10 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white/5 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Raise Ticket Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Support Tickets</h1>
            <p className="mt-1 text-blue-200">View and manage your support ticket history</p>
          </div>

          <button
            onClick={() => setShowRaiseTicketModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 
                     text-white font-medium rounded-lg shadow-lg shadow-blue-900/30 
                     transition-all duration-200 active:scale-95"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Raise New Ticket
          </button>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tickets by subject or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3 bg-white/10 border border-white/20 rounded-lg
                       text-white placeholder-blue-300 focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters toggle + panel */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-sm bg-white/10 hover:bg-white/15 
                       text-blue-100 rounded-lg border border-white/20 transition-colors"
            >
              <FiFilter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3"
              >
                {/* Status, Priority, Assignment selects – same logic, modern styling */}
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg 
                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg
                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket List */}
          <div className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-sm
                    ${selectedTicket?.id === ticket.id
                      ? 'bg-white/15 border-blue-400/50 shadow-lg shadow-blue-900/40'
                      : 'bg-white/8 border-white/10 hover:bg-white/12 hover:border-white/20'}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate mb-1">
                        {ticket.subject || 'No Subject'}
                      </h3>
                      <p className="text-sm text-blue-200">ID: {ticket.id}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                        ticket.status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' :
                        ticket.status === 'in-progress' ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' :
                        ticket.status === 'resolved' ? 'bg-green-500/20 border-green-500/30 text-green-200' :
                        'bg-gray-500/20 border-gray-500/30 text-gray-200'
                      }`}>
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                          ticket.priority === 'high' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                          ticket.priority === 'medium' ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' :
                          'bg-green-500/20 border-green-500/30 text-green-200'
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-blue-100 mb-4 line-clamp-2 leading-relaxed">
                    {ticket.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-blue-200">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <FiUser className="w-4 h-4 mr-2" />
                        {ticket.userId || 'Unknown'}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {formatTimestamp(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <FiFileText className="h-16 w-16 text-blue-400/40 mx-auto mb-6" />
                <p className="text-xl text-white/80 font-medium">No tickets found</p>
                <p className="mt-2 text-blue-200">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Ticket Detail Panel */}
          <div className="lg:sticky lg:top-6">
            {selectedTicket ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden shadow-2xl"
              >
                {/* Ticket Header */}
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {selectedTicket.subject || 'No Subject'}
                      </h2>
                      <p className="text-blue-200">ID: {selectedTicket.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 text-blue-300 hover:text-white bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium border ${
                      selectedTicket.status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' :
                      selectedTicket.status === 'in-progress' ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' :
                      selectedTicket.status === 'resolved' ? 'bg-green-500/20 border-green-500/30 text-green-200' :
                      'bg-gray-500/20 border-gray-500/30 text-gray-200'
                    }`}>
                      {selectedTicket.status}
                    </span>
                    {selectedTicket.priority && (
                      <span className={`px-3 py-1 text-sm rounded-full font-medium border ${
                        selectedTicket.priority === 'high' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                        selectedTicket.priority === 'medium' ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' :
                        'bg-green-500/20 border-green-500/30 text-green-200'
                      }`}>
                        {selectedTicket.priority}
                      </span>
                    )}
                    <span className="text-sm text-blue-200">
                      Created {formatTimestamp(selectedTicket.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {/* Initial Description */}
                  {selectedTicket.description && (
                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-600/50 rounded-lg flex items-center justify-center mr-3">
                          <FiUser className="w-4 h-4 text-blue-200" />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {selectedTicket.userId || 'User'}
                        </span>
                        <span className="text-xs text-blue-200 ml-2">
                          {formatTimestamp(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-blue-100 leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                          message.senderType === 'agent'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                            : 'bg-white/10 backdrop-blur-sm text-blue-100 border border-white/20'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.senderType === 'agent' ? 'text-blue-100' : 'text-blue-200'
                        }`}>
                          {message.senderName} • {formatTimestamp(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                {selectedTicket.agentId === user?.uid && selectedTicket.status !== 'closed' && (
                  <form onSubmit={handleSendMessage} className="p-6 border-t border-white/20">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {sendingMessage ? (
                          <FiRefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiSend className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center shadow-lg"
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiMessageSquare className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-xl font-semibold text-white mb-2">Select a ticket to view details</p>
                <p className="text-blue-200">Click on any ticket from the list to start managing it</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Raise Ticket Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showRaiseTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRaiseTicketModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gradient-to-b from-blue-900 to-indigo-950 rounded-2xl shadow-2xl max-w-lg w-full border border-blue-700/30 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-blue-800/40">
                <h3 className="text-2xl font-bold text-white">Raise New Support Ticket</h3>
              </div>

              <form onSubmit={handleRaiseTicketSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={newTicket.subject}
                    onChange={handleRaiseTicketChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                             placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief summary of the issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newTicket.description}
                    onChange={handleRaiseTicketChange}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                             placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Please describe your issue in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={newTicket.priority}
                    onChange={handleRaiseTicketChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRaiseTicketModal(false)}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                             shadow-lg shadow-blue-900/30 transition-all"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;