import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
<<<<<<< HEAD
import { formatDate } from '../../utils/formatDate';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
import { FiMessageSquare, FiUser, FiClock, FiCheck, FiX, FiArrowLeft, FiSend, FiEye, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedSupportTickets = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, in-progress, resolved

  // Real-time sync for support tickets
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketList);
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  // Real-time sync for messages when ticket is selected
  useEffect(() => {
    if (!selectedTicket) return;
    
    setLoadingMessages(true);
    const q = query(
      collection(db, 'supportTickets', selectedTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messageList);
      setLoadingMessages(false);
    });
    
    return () => unsub();
  }, [selectedTicket]);

  // Filter tickets based on status
  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'in-progress' && { agentId: user.uid, agentName: user.displayName })
      });
      
      // Add system message
      await addDoc(collection(db, 'supportTickets', ticketId, 'messages'), {
        text: `Ticket status updated to ${newStatus}`,
        sender: 'system',
        timestamp: new Date(),
        agentId: user.uid,
        agentName: user.displayName
      });
      
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'supportTickets', selectedTicket.id, 'messages'), {
        text: newMessage,
        sender: 'agent',
        timestamp: new Date(),
        agentId: user.uid,
        agentName: user.displayName
      });
      
      // Update ticket status to in-progress if it's pending
      if (selectedTicket.status === 'pending') {
        await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
          status: 'in-progress',
          agentId: user.uid,
          agentName: user.displayName,
          updatedAt: new Date()
        });
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4" />;
      case 'in-progress':
        return <FiAlertCircle className="w-4 h-4" />;
      case 'resolved':
        return <FiCheck className="w-4 h-4" />;
      case 'closed':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

<<<<<<< HEAD
=======
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedTicket) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg h-full flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedTicket.subject || 'Support Ticket'}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-gray-600">#{selectedTicket.id.slice(-8)}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1 capitalize">{selectedTicket.status || 'pending'}</span>
                  </span>
                  {selectedTicket.priority && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status Actions */}
            <div className="flex items-center space-x-2">
              {selectedTicket.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'in-progress')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  Take Ticket
                </button>
              )}
              {selectedTicket.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">User</label>
              <div className="flex items-center space-x-2 mt-1">
                <FiUser className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{selectedTicket.userName || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">{selectedTicket.userId}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
<<<<<<< HEAD
              <p className="text-gray-900 mt-1">{formatDate(selectedTicket.createdAt, { includeTime: true })}</p>
=======
              <p className="text-gray-900 mt-1">{formatDate(selectedTicket.createdAt)}</p>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <p className="text-gray-900 mt-1 capitalize">{selectedTicket.category || 'General'}</p>
            </div>
          </div>
          
          {selectedTicket.description && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900 mt-1">{selectedTicket.description}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingMessages ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <FiMessageSquare className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'agent'
                        ? 'bg-blue-600 text-white'
                        : message.sender === 'system'
                        ? 'bg-gray-200 text-gray-800 text-center'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
<<<<<<< HEAD
                      {formatDate(message.timestamp, { includeTime: true })}
=======
                      {formatDate(message.timestamp)}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                      {message.sender === 'agent' && message.agentName && (
                        <span className="ml-1">• {message.agentName}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <FiSend className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg"
    >
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Support Tickets</h2>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage and respond to user support requests</p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'resolved', label: 'Resolved' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <FiMessageSquare className="mx-auto text-gray-400 text-4xl mb-2" />
            <h3 className="text-base lg:text-lg font-medium text-gray-800 mb-2">No Tickets Found</h3>
            <p className="text-gray-600 text-sm lg:text-base">
              {filter === 'all' ? 'No support tickets available.' : `No ${filter} tickets found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                whileHover={{ scale: 1.01 }}
                className="bg-gray-50 rounded-lg p-3 lg:p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleTicketSelect(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                      <FiUser className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm lg:text-base truncate">
                        {ticket.userName || 'Anonymous User'}
                      </span>
                      <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">
                        #{ticket.id.slice(-8)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status || 'pending'}</span>
                      </span>
                      {ticket.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-base lg:text-lg font-medium text-gray-800 mb-2 line-clamp-1">
                      {ticket.subject || 'Support Request'}
                    </h3>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm lg:text-base">
                      {ticket.description || ticket.message || 'No description provided'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiClock className="flex-shrink-0" />
<<<<<<< HEAD
                        <span className="truncate">{formatDate(ticket.createdAt, { includeTime: true })}</span>
=======
                        <span className="truncate">{formatDate(ticket.createdAt)}</span>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                      </div>
                      {ticket.category && (
                        <span className="capitalize truncate">{ticket.category}</span>
                      )}
                      {ticket.agentName && (
                        <span className="truncate">Assigned to: {ticket.agentName}</span>
                      )}
                    </div>
                  </div>
                  
                  <FiEye className="text-gray-400 ml-2 lg:ml-4 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedSupportTickets;