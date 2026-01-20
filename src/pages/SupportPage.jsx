import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { createSupportTicket, uploadTicketAttachment, listenToUserSupportTickets } from '../services/supportService';
import { formatDate } from '../utils/formatDate';
import {
  MessageSquare,
  Upload,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
  User,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SupportPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('create');
  const [userTickets, setUserTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create ticket form state
  const [ticketForm, setTicketForm] = useState({
    reason: location.state?.reason || 'Account blocked - deadline expired',
    description: location.state?.message || '',
    relatedHelpId: location.state?.blockedHelpId || null,
    attachments: [],
    priority: 'high'
  });

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Listen to user's support tickets
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenToUserSupportTickets(user.uid, (tickets) => {
      setUserTickets(tickets);
    });

    return unsubscribe;
  }, [user?.uid]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newAttachments = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
          toast.error(`Invalid file type: ${file.name}. Only images and PDFs allowed.`);
          continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File too large: ${file.name}. Maximum 5MB allowed.`);
          continue;
        }

        // Upload file
        const attachment = await uploadTicketAttachment(file, 'temp');
        newAttachments.push(attachment);
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`${newAttachments.length} file(s) uploaded successfully`);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.reason.trim()) {
      toast.error('Please provide a reason for your ticket');
      return;
    }

    if (!ticketForm.description.trim()) {
      toast.error('Please describe your issue in detail');
      return;
    }

    setLoading(true);

    try {
      const ticketData = {
        ...ticketForm,
        attachments: attachments,
        category: 'block_resolution'
      };

      const result = await createSupportTicket(user, ticketData);

      if (result.success) {
        toast.success('Support ticket created successfully! We will respond within 24 hours.');
        setTicketForm({
          reason: '',
          description: '',
          relatedHelpId: null,
          attachments: [],
          priority: 'high'
        });
        setAttachments([]);
        setActiveTab('tickets');
      }

    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast.error('Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">Get help with your account and resolve issues</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'create'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Ticket
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'tickets'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Tickets ({userTickets.length})
            </button>
          </div>
        </div>

        {/* Create Ticket Tab */}
        {activeTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Support Ticket</h2>

            <div className="space-y-6">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  value={ticketForm.reason}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Account blocked - deadline expired">Account blocked - deadline expired</option>
                  <option value="Payment deadline issue">Payment deadline issue</option>
                  <option value="Technical problem">Technical problem</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please describe your issue in detail. Include any relevant information like transaction IDs, error messages, or steps to reproduce the problem."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Related Help ID (if applicable) */}
              {ticketForm.relatedHelpId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Help ID
                  </label>
                  <input
                    type="text"
                    value={ticketForm.relatedHelpId}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              )}

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Upload screenshots or documents</p>
                  <p className="text-sm text-gray-500 mb-4">PNG, JPG, PDF up to 5MB each</p>

                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />

                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Choose Files
                      </>
                    )}
                  </label>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitTicket}
                  disabled={loading || !ticketForm.reason.trim() || !ticketForm.description.trim()}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Ticket...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* My Tickets Tab */}
        {activeTab === 'tickets' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {userTickets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Tickets</h3>
                <p className="text-gray-600">You haven't created any support tickets yet.</p>
              </div>
            ) : (
              userTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ticket.reason}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {ticket.ticketId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ticket.createdAt)}
                          </span>
                          {ticket.relatedHelpId && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Help: {ticket.relatedHelpId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>

                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Attachments ({ticket.attachments.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
