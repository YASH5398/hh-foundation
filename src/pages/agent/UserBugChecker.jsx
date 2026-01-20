import React, { useState, useEffect } from 'react';
import { 
  FiAlertCircle, FiSearch, FiFilter, FiEye, FiUser, FiCalendar,
  FiAlertTriangle, FiRefreshCw, FiDownload, FiCheckCircle,
  FiXCircle, FiClock, FiMessageSquare, FiTag, FiArrowRight,
  FiExternalLink, FiFileText, FiImage, FiPaperclip
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, where, orderBy, limit, startAfter,
  getDocs, doc, getDoc, onSnapshot, updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
<<<<<<< HEAD
import { formatDate } from '../../utils/formatDate';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const UserBugChecker = () => {
  const { currentUser } = useAgentAuth();
  const [loading, setLoading] = useState(false);
  const [bugTickets, setBugTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Pagination
  const TICKETS_PER_PAGE = 20;

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'open', label: 'Open', color: 'red' },
    { value: 'in_progress', label: 'In Progress', color: 'yellow' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Load bug tickets
  useEffect(() => {
    loadBugTickets();
  }, []);

  // Filter tickets
  useEffect(() => {
    let filtered = bugTickets.filter(ticket => {
      const matchesSearch = 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bDate - aDate;
    });

    setFilteredTickets(filtered);
  }, [bugTickets, searchTerm, statusFilter, priorityFilter]);

  const loadBugTickets = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setBugTickets([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      // Query for tickets with bug-related tags or categories
      let q = query(
        collection(db, 'supportTickets'),
        where('category', 'in', ['bug', 'technical_issue', 'app_error']),
        orderBy('createdAt', 'desc'),
        limit(TICKETS_PER_PAGE)
      );
      
      if (loadMore && lastDoc) {
        q = query(
          collection(db, 'supportTickets'),
          where('category', 'in', ['bug', 'technical_issue', 'app_error']),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(TICKETS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      const ticketsData = [];
      
      for (const docSnap of snapshot.docs) {
        const ticketData = {
          ticketId: docSnap.id,
          ...docSnap.data()
        };
        
        // Load user info
        if (ticketData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', ticketData.userId));
            if (userDoc.exists()) {
              ticketData.userInfo = userDoc.data();
            }
          } catch (error) {
            console.error('Error loading user info:', error);
          }
        }
        
        ticketsData.push(ticketData);
      }
      
      if (loadMore) {
        setBugTickets(prev => [...prev, ...ticketsData]);
      } else {
        setBugTickets(ticketsData);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === TICKETS_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading bug tickets:', error);
      toast.error('Failed to load bug tickets');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadTicketMessages = async (ticketId) => {
    try {
      setLoadingMessages(true);
      
      const messagesQuery = query(
        collection(db, 'supportTickets', ticketId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data()
      }));
      
      setTicketMessages(messages);
      
    } catch (error) {
      console.error('Error loading ticket messages:', error);
      toast.error('Failed to load ticket messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
    await loadTicketMessages(ticket.ticketId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FiAlertTriangle className="w-4 h-4" />;
      case 'in_progress': return <FiClock className="w-4 h-4" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4" />;
      case 'closed': return <FiXCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

<<<<<<< HEAD
=======
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  const exportBugTickets = () => {
    try {
      const csvData = filteredTickets.map(ticket => ({
        'Ticket ID': ticket.ticketId,
        'Subject': ticket.subject || '',
        'Description': ticket.description || '',
        'User ID': ticket.userId || '',
        'User Name': ticket.userInfo?.fullName || '',
        'User Email': ticket.userInfo?.email || '',
        'Status': ticket.status || '',
        'Priority': ticket.priority || '',
        'Category': ticket.category || '',
        'Created At': formatDate(ticket.createdAt),
        'Updated At': formatDate(ticket.updatedAt)
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bug_tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Bug tickets exported successfully');
    } catch (error) {
      console.error('Error exporting bug tickets:', error);
      toast.error('Failed to export bug tickets');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FiAlertCircle className="w-6 h-6 text-red-500" />
            <span>User Bug Checker</span>
          </h1>
          <p className="text-gray-600">View and manage tickets flagged as bugs or technical issues</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            {filteredTickets.length} of {bugTickets.length} bug tickets
          </div>
          
          <button
            onClick={exportBugTickets}
            disabled={filteredTickets.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => loadBugTickets()}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bug tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Open: {bugTickets.filter(t => t.status === 'open').length}</span>
            <span>Critical: {bugTickets.filter(t => t.priority === 'critical').length}</span>
            <span>Resolved: {bugTickets.filter(t => t.status === 'resolved').length}</span>
          </div>
        </div>
      </div>

      {/* Bug Tickets List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading bug tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No bug tickets found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.ticketId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Ticket Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {ticket.subject || 'No Subject'}
                      </h3>
                      
                      {/* Status Badge */}
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(ticket.status) === 'green' ? 'bg-green-100 text-green-800' :
                        getStatusColor(ticket.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getStatusColor(ticket.status) === 'red' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status || 'open'}</span>
                      </div>
                      
                      {/* Priority Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getPriorityColor(ticket.priority)
                      }`}>
                        {ticket.priority || 'medium'}
                      </div>
                      
                      {/* Category Badge */}
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FiTag className="w-3 h-3" />
                        <span>{ticket.category || 'bug'}</span>
                      </div>
                    </div>
                    
                    {/* Ticket Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {ticket.description || 'No description provided'}
                    </p>
                    
                    {/* Ticket Meta */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-4 h-4" />
                        <span>{ticket.userInfo?.fullName || ticket.userId || 'Unknown User'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>Created {formatDate(ticket.createdAt)}</span>
                      </div>
                      
                      {ticket.updatedAt && (
                        <div className="flex items-center space-x-1">
                          <FiRefreshCw className="w-4 h-4" />
                          <span>Updated {formatDate(ticket.updatedAt)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <FiFileText className="w-4 h-4" />
                        <span>ID: {ticket.ticketId.slice(-8)}</span>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      {ticket.agentId && (
                        <span>Assigned to: {ticket.agentId}</span>
                      )}
                      
                      {ticket.userInfo?.email && (
                        <span>Email: {ticket.userInfo.email}</span>
                      )}
                      
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <FiPaperclip className="w-3 h-3" />
                          <span>{ticket.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTicketClick(ticket);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/dashboard/support-tickets/${ticket.ticketId}`, '_blank');
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Open in Support Tickets"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  onClick={() => loadBugTickets(true)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiDownload className="w-4 h-4" />
                  )}
                  <span>{loadingMore ? 'Loading...' : 'Load More'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {showTicketDetails && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTicketDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Bug Ticket Details</h2>
                    <p className="text-sm text-gray-500">Ticket ID: {selectedTicket.ticketId}</p>
                  </div>
                  <button
                    onClick={() => setShowTicketDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Ticket Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Main Info */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedTicket.subject || 'No Subject'}
                      </h3>
                      
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(selectedTicket.status) === 'green' ? 'bg-green-100 text-green-800' :
                          getStatusColor(selectedTicket.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          getStatusColor(selectedTicket.status) === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusIcon(selectedTicket.status)}
                          <span>{selectedTicket.status || 'open'}</span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getPriorityColor(selectedTicket.priority)
                        }`}>
                          {selectedTicket.priority || 'medium'}
                        </div>
                        
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <FiTag className="w-3 h-3" />
                          <span>{selectedTicket.category || 'bug'}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <strong>Description:</strong>
                        <p className="mt-1 whitespace-pre-wrap">
                          {selectedTicket.description || 'No description provided'}
                        </p>
                      </div>
                      
                      {/* Attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mb-4">
                          <strong className="text-sm text-gray-600">Attachments:</strong>
                          <div className="mt-2 space-y-2">
                            {selectedTicket.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                <FiPaperclip className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{attachment.name || `Attachment ${index + 1}`}</span>
                                {attachment.url && (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FiExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">User Information</h4>
                      
                      {selectedTicket.userInfo ? (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Name:</span>
                            <p className="text-gray-900">{selectedTicket.userInfo.fullName || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">Email:</span>
                            <p className="text-gray-900">{selectedTicket.userInfo.email || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">Phone:</span>
                            <p className="text-gray-900">{selectedTicket.userInfo.phone || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">User ID:</span>
                            <p className="text-gray-900 font-mono text-xs">{selectedTicket.userId}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <p>User information not available</p>
                          <p className="font-mono text-xs mt-1">ID: {selectedTicket.userId}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Created:</span>
                            <p className="text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                          </div>
                          
                          {selectedTicket.updatedAt && (
                            <div>
                              <span className="font-medium text-gray-600">Updated:</span>
                              <p className="text-gray-900">{formatDate(selectedTicket.updatedAt)}</p>
                            </div>
                          )}
                          
                          {selectedTicket.agentId && (
                            <div>
                              <span className="font-medium text-gray-600">Assigned Agent:</span>
                              <p className="text-gray-900">{selectedTicket.agentId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Conversation</h4>
                  
                  {loadingMessages ? (
                    <div className="text-center py-4">
                      <FiRefreshCw className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <FiMessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {ticketMessages.map((message) => (
                        <div
                          key={message.messageId}
                          className={`p-3 rounded-lg ${
                            message.senderType === 'agent' 
                              ? 'bg-blue-50 border-l-4 border-blue-500 ml-4'
                              : 'bg-gray-50 border-l-4 border-gray-300 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {message.senderType === 'agent' ? 'Agent' : 'User'}
                              {message.senderName && ` (${message.senderName})`}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {message.content || message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => window.open(`/dashboard/support-tickets/${selectedTicket.ticketId}`, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    <span>Open in Support Tickets</span>
                  </button>
                  
                  <button
                    onClick={() => setShowTicketDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserBugChecker;