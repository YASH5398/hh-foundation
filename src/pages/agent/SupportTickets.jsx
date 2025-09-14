import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiFileText, FiClock, FiCheckCircle, FiAlertTriangle, FiUser, FiCalendar, FiMessageSquare, FiEdit3, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved, in-progress
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    // Real-time listener for support tickets
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = [];
      snapshot.forEach((doc) => {
        ticketsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status?.toLowerCase() === filter;
  });

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'Resolved' && { resolvedAt: serverTimestamp() })
      });
      toast.success(`Ticket ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const addResponse = async (ticketId) => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      // Add response to ticket responses subcollection
      await addDoc(collection(db, 'supportTickets', ticketId, 'responses'), {
        message: response,
        respondedBy: 'agent', // In real app, get from auth context
        respondedAt: serverTimestamp(),
        agentId: 'current-agent-id' // In real app, get from auth context
      });

      // Update ticket status to in-progress if it was pending
      if (selectedTicket?.status === 'Pending') {
        await updateDoc(doc(db, 'supportTickets', ticketId), {
          status: 'In Progress',
          updatedAt: serverTimestamp()
        });
      }

      setResponse('');
      setShowResponseModal(false);
      toast.success('Response added successfully');
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'in progress': return <FiEdit3 className="w-4 h-4" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4" />;
      default: return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
          <p className="text-gray-600">Manage and respond to user support requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
              <FiFileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {tickets.filter(t => t.status === 'Pending').length}
                </p>
              </div>
              <FiClock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'In Progress').length}
                </p>
              </div>
              <FiEdit3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'Resolved').length}
                </p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Tickets' },
                { key: 'pending', label: 'Pending' },
                { key: 'in-progress', label: 'In Progress' },
                { key: 'resolved', label: 'Resolved' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'No support tickets available.' : `No ${filter} tickets found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {ticket.title || 'No Title'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status || 'Unknown'}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.description || 'No description provided'}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <FiUser className="w-4 h-4 mr-1" />
                            <span>{ticket.raisedByName || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1" />
                            <span>{ticket.createdAt?.toDate?.()?.toLocaleDateString?.() || 'No date'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      {ticket.status !== 'Resolved' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowResponseModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FiMessageSquare className="w-4 h-4 mr-2" />
                            Respond
                          </button>
                          {ticket.status === 'Pending' && (
                            <button
                              onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Start Working
                            </button>
                          )}
                          {ticket.status === 'In Progress' && (
                            <button
                              onClick={() => updateTicketStatus(ticket.id, 'Resolved')}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Respond to: {selectedTicket.title}
                </h3>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Original Issue:</p>
                <p className="text-gray-900">{selectedTicket.description}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your response to help resolve this issue..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponse('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addResponse(selectedTicket.id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;