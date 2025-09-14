import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiUser, FiMail, FiMessageSquare, FiAlertTriangle,
  FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiEye,
  FiEdit3, FiTrash2, FiPlus, FiSearch, FiFilter
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, addDoc, query, where, orderBy, limit,
  getDocs, doc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const RequestAdmin = () => {
  const { currentUser } = useAgentAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    userEmail: '',
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'in_review', label: 'In Review', color: 'blue' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'completed', label: 'Completed', color: 'green' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'general', label: 'General Support' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'user_account', label: 'User Account' },
    { value: 'policy', label: 'Policy Question' },
    { value: 'escalation', label: 'Ticket Escalation' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' }
  ];

  // Load escalation requests
  useEffect(() => {
    loadRequests();
  }, [user]);

  // Filter requests
  useEffect(() => {
    let filtered = requests.filter(request => {
      const matchesSearch = 
        request.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bDate - aDate;
    });

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Query agent requests created by current agent
      const q = query(
        collection(db, 'agentRequests'),
        where('agentId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const requestData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestData);
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedRequests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(updatedRequests);
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load escalation requests');
    } finally {
      setLoading(false);
    }
  };

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
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const requestData = {
        ...formData,
        agentId: currentUser.uid,
        agentEmail: currentUser.email,
          agentName: currentUser.displayName || currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'agentRequests'), requestData);
      
      toast.success('Escalation request submitted successfully');
      
      // Reset form
      setFormData({
        userId: '',
        userEmail: '',
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
      
      setShowForm(false);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit escalation request');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'agentRequests', requestId));
      toast.success('Request deleted successfully');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'gray';
  };

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return priorityOption ? priorityOption.color : 'gray';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'in_review': return <FiEye className="w-4 h-4" />;
      case 'approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiXCircle className="w-4 h-4" />;
      case 'completed': return <FiCheckCircle className="w-4 h-4" />;
      default: return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <FiAlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <FiAlertTriangle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FiSend className="w-6 h-6 text-blue-500" />
            <span>Admin Escalations</span>
          </h1>
          <p className="text-gray-600">Submit and track escalation requests to admin</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            {filteredRequests.length} of {requests.length} requests
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Request</span>
          </button>
          
          <button
            onClick={loadRequests}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search requests..."
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
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Pending: {requests.filter(r => r.status === 'pending').length}</span>
            <span>In Review: {requests.filter(r => r.status === 'in_review').length}</span>
            <span>Completed: {requests.filter(r => r.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading escalation requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <FiSend className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No escalation requests found</p>
            <p className="text-sm text-gray-400">Create your first escalation request to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Request Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(request.status) === 'green' ? 'bg-green-100 text-green-800' :
                        getStatusColor(request.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                        getStatusColor(request.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getStatusColor(request.status) === 'red' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </div>
                      
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getPriorityColor(request.priority) === 'red' ? 'bg-red-100 text-red-800' :
                        getPriorityColor(request.priority) === 'orange' ? 'bg-orange-100 text-orange-800' :
                        getPriorityColor(request.priority) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getPriorityColor(request.priority) === 'green' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPriorityIcon(request.priority)}
                        <span>{request.priority}</span>
                      </div>
                      
                      <span className="text-xs text-gray-500">#{request.id.slice(-6)}</span>
                    </div>
                    
                    {/* Request Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.subject}
                    </h3>
                    
                    {/* Request Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {request.description}
                    </p>
                    
                    {/* Request Meta */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-3 h-3" />
                        <span>Category: {categoryOptions.find(c => c.value === request.category)?.label || request.category}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-3 h-3" />
                        <span>Created {formatDate(request.createdAt)}</span>
                      </div>
                      
                      {request.userId && (
                        <div className="flex items-center space-x-1">
                          <FiMail className="w-3 h-3" />
                          <span>User: {request.userEmail || request.userId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* View Details */}
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetails(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    
                    {/* Delete (only for pending requests) */}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Request"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Request Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="p-6">
                {/* Form Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">New Escalation Request</h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        placeholder="Enter user ID if applicable"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User Email (Optional)
                      </label>
                      <input
                        type="email"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleInputChange}
                        placeholder="Enter user email if applicable"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of the issue"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed description of the issue and what action you need from admin"
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categoryOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {submitting ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSend className="w-4 h-4" />
                    )}
                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Details Modal */}
      <AnimatePresence>
        {showDetails && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Request Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <p className="text-gray-900">{selectedRequest.subject}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(selectedRequest.status) === 'green' ? 'bg-green-100 text-green-800' :
                        getStatusColor(selectedRequest.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                        getStatusColor(selectedRequest.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getStatusColor(selectedRequest.status) === 'red' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(selectedRequest.status)}
                        <span>{selectedRequest.status}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getPriorityColor(selectedRequest.priority) === 'red' ? 'bg-red-100 text-red-800' :
                        getPriorityColor(selectedRequest.priority) === 'orange' ? 'bg-orange-100 text-orange-800' :
                        getPriorityColor(selectedRequest.priority) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getPriorityColor(selectedRequest.priority) === 'green' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPriorityIcon(selectedRequest.priority)}
                        <span>{selectedRequest.priority}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <p className="text-gray-900">{categoryOptions.find(c => c.value === selectedRequest.category)?.label || selectedRequest.category}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request ID</label>
                      <p className="text-gray-900 font-mono text-sm">#{selectedRequest.id}</p>
                    </div>
                  </div>
                  
                  {(selectedRequest.userId || selectedRequest.userEmail) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.userId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                          <p className="text-gray-900">{selectedRequest.userId}</p>
                        </div>
                      )}
                      
                      {selectedRequest.userEmail && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                          <p className="text-gray-900">{selectedRequest.userEmail}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-gray-900">{formatDate(selectedRequest.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {selectedRequest.adminResponse && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Response</label>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-blue-900 whitespace-pre-wrap">{selectedRequest.adminResponse}</p>
                        {selectedRequest.respondedAt && (
                          <p className="text-xs text-blue-600 mt-2">Responded: {formatDate(selectedRequest.respondedAt)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  {selectedRequest.status === 'pending' && (
                    <button
                      onClick={() => deleteRequest(selectedRequest.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Request
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetails(false)}
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

export default RequestAdmin;