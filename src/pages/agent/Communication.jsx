import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiPlus, FiX, FiSend } from 'react-icons/fi';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import {
  createAgentChat,
  subscribeToAgentChats,
  subscribeToChatMessages,
  sendMessage
} from '../../services/agentAdminChatService';
import { toast } from 'react-hot-toast';

const ISSUE_TYPES = [
  'Send Help',
  'Receive Help',
  'E-PIN',
  'Account Related',
  'Leaderboard',
  'Upcoming Payment',
  'Other'
];

const Communication = () => {
  const { currentUser } = useAgentAuth();
  const { profile } = useAgentProfile();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    issueType: '',
    message: '',
    context: ''
  });
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToAgentChats(currentUser.uid, (chatsData) => {
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = subscribeToChatMessages(selectedChat.id, (messagesData) => {
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatForm.issueType || !newChatForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createAgentChat(
        {
          uid: currentUser.uid,
          userId: profile?.userId || currentUser.email,
          name: profile?.fullName || currentUser.email
        },
        newChatForm.issueType,
        newChatForm.message,
        newChatForm.context
      );

      toast.success('Chat created successfully');
      setShowNewChatModal(false);
      setNewChatForm({ issueType: '', message: '', context: '' });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;

    try {
      await sendMessage(selectedChat.id, 'agent', replyText);
      setReplyText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      replied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Agent to Admin Communication</h1>
            <p className="text-slate-400 mt-1">Contact admin for support</p>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus /> New Chat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Your Chats</h2>
            <div className="space-y-2">
              {chats.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No chats yet</p>
              ) : (
                chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedChat?.id === chat.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-white">{chat.issueType}</span>
                      {getStatusBadge(chat.status)}
                    </div>
                    <p className="text-xs text-slate-400">{formatTimestamp(chat.createdAt)}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-[600px]">
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedChat.issueType}</h3>
                      <p className="text-sm text-slate-400">Chat with Admin</p>
                    </div>
                    {getStatusBadge(selectedChat.status)}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'agent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.sender === 'agent' ? 'You' : 'Admin'}
                          </span>
                          <span className="text-xs opacity-70">{formatTimestamp(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                        {msg.context && (
                          <p className="text-xs mt-2 opacity-80 border-t border-white/20 pt-2">
                            Context: {msg.context}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedChat.status !== 'closed' && (
                  <form onSubmit={handleSendReply} className="p-4 border-t border-slate-700/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FiSend /> Send
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FiMessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a chat to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">New Chat with Admin</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Issue Type *
                </label>
                <select
                  value={newChatForm.issueType}
                  onChange={(e) => setNewChatForm({ ...newChatForm, issueType: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select issue type</option>
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={newChatForm.message}
                  onChange={(e) => setNewChatForm({ ...newChatForm, message: e.target.value })}
                  placeholder="Describe your issue..."
                  rows="4"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={newChatForm.context}
                  onChange={(e) => setNewChatForm({ ...newChatForm, context: e.target.value })}
                  placeholder="Any additional information..."
                  rows="3"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Chat'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Communication;
