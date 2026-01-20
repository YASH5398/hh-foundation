import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import {
  FiSearch, FiFilter, FiUser, FiClock, FiMessageSquare,
  FiPaperclip, FiChevronRight, FiX, FiSend, FiAlertCircle,
  FiCheckCircle, FiRefreshCw, FiEdit3, FiFlag, FiFileText, FiPlus
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, onSnapshot, orderBy,
=======
import { 
  FiSearch, FiFilter, FiUser, FiClock, FiMessageSquare, 
  FiPaperclip, FiChevronRight, FiX, FiSend, FiAlertCircle,
  FiCheckCircle, FiRefreshCw, FiEdit3, FiFlag, FiFileText
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, where, onSnapshot, orderBy, 
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  doc, updateDoc, addDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
<<<<<<< HEAD

=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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

<<<<<<< HEAD
  // ── Raise Ticket Modal State ───────────────────────────────
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  // Fetch tickets with real-time updates - filtered by logged-in user
=======
  // Fetch tickets with real-time updates
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  useEffect(() => {
    if (!user?.uid) return;

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
<<<<<<< HEAD
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
=======
      orderBy('createdAt', 'desc')
    );

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
<<<<<<< HEAD
=======
      
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      setLoading(false);
    });
<<<<<<< HEAD
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

=======

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter tickets based on search and filters
  useEffect(() => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Assignment filter
    if (assignmentFilter === 'assigned-to-me') {
      filtered = filtered.filter(ticket => ticket.agentId === user?.uid);
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter(ticket => !ticket.agentId);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, assignmentFilter, user?.uid]);

  // Fetch messages for selected ticket
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }
<<<<<<< HEAD
=======

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    const messagesQuery = query(
      collection(db, 'supportTickets', selectedTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
<<<<<<< HEAD
=======

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setMessages(messagesData);
    });
<<<<<<< HEAD
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
=======

    return () => unsubscribe();
  }, [selectedTicket?.id]);

  const handleAssignToMe = async (ticketId) => {
    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        agentId: user.uid,
        status: 'in-progress',
        updatedAt: serverTimestamp()
      });
      toast.success('Ticket assigned to you');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'resolved' && { resolvedAt: serverTimestamp() })
      });
      toast.success(`Ticket ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket?.id) return;

    try {
      setSendingMessage(true);
      await addDoc(collection(db, 'supportTickets', selectedTicket.id, 'messages'), {
        content: newMessage.trim(),
        senderId: user.uid,
        senderType: 'agent',
        senderName: user.fullName || 'Agent',
        createdAt: serverTimestamp()
      });
      
      // Update ticket's last activity
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        updatedAt: serverTimestamp()
      });
      
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
          </div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage and respond to customer support requests</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredTickets.length} of {tickets.length} tickets
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FiFilter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tickets by subject, description, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tickets</option>
                  <option value="assigned-to-me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {ticket.subject || 'No Subject'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">ID: {ticket.id}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    {ticket.priority && (
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {ticket.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <FiUser className="w-3 h-3 mr-1" />
                      {ticket.userId || 'Unknown'}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatTimestamp(ticket.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!ticket.agentId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToMe(ticket.id);
                        }}
                        disabled={updatingStatus}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Assign to Me
                      </button>
                    )}
                    <FiChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tickets found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:sticky lg:top-6">
          {selectedTicket ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Ticket Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedTicket.subject || 'No Subject'}
                    </h2>
                    <p className="text-sm text-gray-500">ID: {selectedTicket.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  {selectedTicket.priority && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Created {formatTimestamp(selectedTicket.createdAt)}
                  </span>
                </div>
                
                {/* Status Actions */}
                {selectedTicket.agentId === user?.uid && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'in-progress')}
                        disabled={updatingStatus}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Start Progress
                      </button>
                    )}
                    {selectedTicket.status === 'in-progress' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                        disabled={updatingStatus}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {/* Initial Description */}
                {selectedTicket.description && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FiUser className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedTicket.userId || 'User'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTimestamp(selectedTicket.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{selectedTicket.description}</p>
                  </div>
                )}
                
                {/* Chat Messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.senderType === 'agent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderType === 'agent' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.senderName} • {formatTimestamp(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              {selectedTicket.agentId === user?.uid && selectedTicket.status !== 'closed' && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiSend className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a ticket to view details</p>
              <p className="text-sm text-gray-400">Click on any ticket from the list to start managing it</p>
            </div>
          )}
        </div>
      </div>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    </div>
  );
};

export default SupportTickets;