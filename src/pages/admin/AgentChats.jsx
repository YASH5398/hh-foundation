import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiSend, FiFilter, FiX } from 'react-icons/fi';
import {
  subscribeToAllChats,
  subscribeToChatMessages,
  sendMessage,
  updateChatStatus
} from '../../services/agentAdminChatService';
import { toast } from 'react-hot-toast';

const AgentChats = () => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = subscribeToAllChats((chatsData) => {
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredChats(chats);
    } else {
      setFilteredChats(chats.filter(chat => chat.status === statusFilter));
    }
  }, [chats, statusFilter]);

  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = subscribeToChatMessages(selectedChat.id, (messagesData) => {
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;

    try {
      await sendMessage(selectedChat.id, 'admin', replyText);
      setReplyText('');
      toast.success('Reply sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;

    try {
      await updateChatStatus(selectedChat.id, 'closed');
      toast.success('Chat closed');
    } catch (error) {
      console.error('Error closing chat:', error);
      toast.error('Failed to close chat');
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
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Agent Chats</h1>
          <p className="text-slate-400 mt-1">Manage agent communications</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <span className="text-sm text-slate-400">Filter:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'replied', 'closed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Chats ({filteredChats.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredChats.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No chats found</p>
              ) : (
                filteredChats.map((chat) => (
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
                      <div className="flex-1">
                        <span className="text-sm font-medium text-white block">
                          {chat.issueType}
                        </span>
                        <span className="text-xs text-slate-400">
                          {chat.agentName} ({chat.agentUserId})
                        </span>
                      </div>
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
                      <p className="text-sm text-slate-400">
                        Agent: {selectedChat.agentName} ({selectedChat.agentUserId})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedChat.status)}
                      {selectedChat.status !== 'closed' && (
                        <button
                          onClick={handleCloseChat}
                          className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <FiX className="w-4 h-4" /> Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.sender === 'admin' ? 'You (Admin)' : selectedChat.agentName}
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
                        placeholder="Type your reply..."
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
    </div>
  );
};

export default AgentChats;
