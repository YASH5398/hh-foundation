import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMessageCircle, FiClock, FiCheckCircle, FiX } from 'react-icons/fi';
import UserChatWindow from './UserChatWindow';

const UserSupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [creating, setCreating] = useState(false);

  // Listen to user's tickets
  useEffect(() => {
    if (!user?.uid) return;

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Create new ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userName: user.fullName || user.name || 'Anonymous',
        userEmail: user.email,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'pending',
        createdAt: serverTimestamp(),
        agentId: null,
        agentName: null
      });

      toast.success('Support ticket created successfully!');
      setFormData({ subject: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'in-progress':
        return <FiMessageCircle className="text-blue-500" />;
      case 'closed':
        return <FiCheckCircle className="text-green-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedTicket) {
    return (
      <UserChatWindow 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        user={user}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage your support requests and chat with agents</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FiPlus />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Support Ticket</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
          
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of your issue"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FiPlus />
                )}
                <span>{creating ? 'Creating...' : 'Create Ticket'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets</h3>
            <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="text-lg font-medium text-gray-900">
                        {ticket.subject}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{ticket.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created: {ticket.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</span>
                      {ticket.agentName && (
                        <span>Agent: {ticket.agentName}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {ticket.status === 'in-progress' && (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <FiMessageCircle />
                        <span>Open Chat</span>
                      </button>
                    )}
                    {ticket.status === 'pending' && (
                      <span className="text-yellow-600 font-medium">Waiting for agent...</span>
                    )}
                    {ticket.status === 'closed' && (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <FiMessageCircle />
                        <span>View Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSupportTickets;