import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  FiMessageSquare, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiSend, 
  FiEdit3 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CHAT_STATUSES = {
  waiting: { label: 'Waiting', color: 'yellow', icon: FiClock },
  active: { label: 'Active', color: 'blue', icon: FiMessageSquare },
  closed: { label: 'Closed', color: 'green', icon: FiCheckCircle }
};

const TICKET_STATUSES = {
  open: { label: 'Open', color: 'yellow', icon: FiClock },
  'in-progress': { label: 'In Progress', color: 'blue', icon: FiEdit3 },
  closed: { label: 'Closed', color: 'green', icon: FiCheckCircle }
};

const SupportManager = () => {
  const { user, userClaims } = useAuth();
  const [activeTab, setActiveTab] = useState('agent-chats');
  const [chatRooms, setChatRooms] = useState([]);
  const [chatbotChats, setChatbotChats] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatType, setChatType] = useState('agent'); // 'agent' or 'chatbot'

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = userClaims && userClaims.admin === true;
      setIsAdmin(adminStatus);
      setLoading(false);
    };

    if (userClaims !== undefined) {
      checkAdminStatus();
    }
  }, [userClaims]);

  // Load agent chat rooms
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('status', '!=', null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Load chatbot chats
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'chatbotChats'),
      where('status', '!=', null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatbotChats(chats);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Load tickets
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'tickets'),
      where('status', '!=', null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat || !isAdmin) return;

    const collectionName = chatType === 'agent' ? 'chatRooms' : 'chatbotChats';
    const q = query(
      collection(db, collectionName, selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [selectedChat, isAdmin, chatType]);

  const assignAgent = async (chatId) => {
    try {
      const collectionName = chatType === 'agent' ? 'chatRooms' : 'chatbotChats';
      const chatRef = doc(db, collectionName, chatId);
      await updateDoc(chatRef, {
        agentId: user.uid,
        agentName: user.displayName || user.email,
        status: 'active'
      });
      toast.success('Agent assigned successfully!');
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const collectionName = chatType === 'agent' ? 'chatRooms' : 'chatbotChats';
      await addDoc(collection(db, collectionName, selectedChat.id, 'messages'), {
        senderId: user.uid,
        senderType: 'agent',
        message: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const closeChat = async (chatId) => {
    try {
      const collectionName = chatType === 'agent' ? 'chatRooms' : 'chatbotChats';
      const chatRef = doc(db, collectionName, chatId);
      await updateDoc(chatRef, {
        status: 'closed',
        closedAt: serverTimestamp()
      });
      toast.success('Chat closed successfully!');
      setSelectedChat(null);
    } catch (error) {
      console.error('Error closing chat:', error);
      toast.error('Failed to close chat');
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success('Ticket status updated!');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const addTicketComment = async (ticketId) => {
    if (!newComment.trim()) return;

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      const currentComments = ticketDoc.data()?.comments || [];
      
      const newCommentObj = {
        message: newComment.trim(),
        timestamp: serverTimestamp(),
        adminId: user.uid,
        adminName: user.displayName || user.email
      };

      await updateDoc(ticketRef, {
        comments: [...currentComments, newCommentObj],
        updatedAt: serverTimestamp()
      });
      
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getStatusBadge = (status, type = 'chat') => {
    const statusConfig = type === 'chat' ? CHAT_STATUSES[status] : TICKET_STATUSES[status];
    if (!statusConfig) return null;
    
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access Support Manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">Support Manager</h1>
          <p className="text-slate-400 text-sm md:text-base">Manage agent chats and support tickets</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-700/50">
            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab('agent-chats');
                  setChatType('agent');
                  setSelectedChat(null);
                }}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'agent-chats'
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <FiMessageSquare className="inline w-4 h-4 mr-2" />
                <span>Agent Chats ({chatRooms.length})</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab('chatbot-chats');
                  setChatType('chatbot');
                  setSelectedChat(null);
                }}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'chatbot-chats'
                    ? 'border-green-500 text-green-400 bg-green-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <FiMessageSquare className="inline w-4 h-4 mr-2" />
                <span>Chatbot Chats ({chatbotChats.length})</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('tickets')}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'tickets'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <FiFileText className="inline w-4 h-4 mr-2" />
                <span>Support Tickets ({tickets.length})</span>
              </motion.button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {(activeTab === 'agent-chats' || activeTab === 'chatbot-chats') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Chat List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-lg font-semibold text-slate-100">
                    {activeTab === 'agent-chats' ? 'Agent Chat Rooms' : 'Chatbot Conversations'}
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {(activeTab === 'agent-chats' ? chatRooms : chatbotChats).map((chat) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-800/40 transition-all duration-200 ${
                          selectedChat?.id === chat.id ? 'bg-blue-500/10 border-blue-500/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-100 truncate">{chat.userName}</h4>
                          {getStatusBadge(chat.status, 'chat')}
                        </div>
                        <p className="text-sm text-slate-400 mb-2 font-mono">ID: {chat.userId}</p>
                        {chat.agentName && (
                          <p className="text-sm text-blue-400 mb-2">Agent: {chat.agentName}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {chat.createdAt?.toDate?.()?.toLocaleString()}
                        </p>
                        {chat.status === 'waiting' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              assignAgent(chat.id);
                            }}
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200 touch-manipulation"
                          >
                            Assign Me
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {(activeTab === 'agent-chats' ? chatRooms : chatbotChats).length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No conversations found</p>
                      <p className="text-sm mt-1">Check back later for new messages</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-96 flex flex-col shadow-xl">
                  <div className="p-4 border-b border-slate-600 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{selectedChat.userName}</h3>
                      <p className="text-sm text-slate-400 font-mono">Chat with {selectedChat.userId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedChat.status, 'chat')}
                      {selectedChat.status === 'active' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => closeChat(selectedChat.id)}
                          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-red-500/25 transition-all duration-200 touch-manipulation"
                        >
                          Close Chat
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.senderType === 'agent' ? 'justify-end' :
                            message.senderType === 'system' ? 'justify-center' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                              message.senderType === 'agent'
                                ? 'bg-blue-600 text-white shadow-blue-500/20'
                                : message.senderType === 'system'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : message.senderType === 'chatbot'
                                ? 'bg-slate-700 text-slate-200 border border-slate-600'
                                : 'bg-slate-700/50 text-slate-100 border border-slate-600'
                            }`}
                          >
                            {message.senderType === 'system' && (
                              <p className="text-xs font-medium mb-1 text-green-300">System Message</p>
                            )}
                            {message.senderType === 'chatbot' && (
                              <p className="text-xs font-medium mb-1 text-slate-400">Chatbot</p>
                            )}
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <p className="text-xs opacity-75 mt-2 text-right">
                              {message.timestamp?.toDate?.()?.toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Message Input */}
                  {selectedChat.status === 'active' && chatType === 'agent' && (
                    <div className="p-4 border-t border-slate-600">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={sendMessage}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-200 touch-manipulation"
                        >
                          <FiSend className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {chatType === 'chatbot' && (
                    <div className="p-4 border-t border-slate-600 bg-slate-800/60">
                      <p className="text-sm text-slate-300 text-center">
                        🤖 This is a chatbot conversation. Messages are handled automatically by AI.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-96 flex items-center justify-center shadow-xl">
                  <div className="text-center text-slate-400">
                    <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm mt-1">Choose a chat room to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets List */}
            <div>
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-lg font-semibold text-slate-100">Support Tickets</h3>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <AnimatePresence>
                    {tickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-800/40 transition-all duration-200 ${
                          selectedTicket?.id === ticket.id ? 'bg-purple-500/10 border-purple-500/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-100 truncate">{ticket.subject}</h4>
                          {getStatusBadge(ticket.status, 'ticket')}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">By: {ticket.userName}</p>
                        <p className="text-sm text-slate-300 line-clamp-2">{ticket.description}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {ticket.createdAt?.toDate?.()?.toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {tickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No tickets found</p>
                      <p className="text-sm mt-1">Support tickets will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              {selectedTicket ? (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 shadow-xl">
                  <div className="p-4 border-b border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-100">{selectedTicket.subject}</h3>
                      {getStatusBadge(selectedTicket.status, 'ticket')}
                    </div>
                    <p className="text-sm text-slate-400 font-mono">Ticket #{selectedTicket.id.slice(-8)}</p>
                  </div>

                  <div className="p-4 space-y-6">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h4 className="font-medium text-slate-200 mb-3 flex items-center">
                        <FiMessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                        User Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Name:</span> <span className="text-slate-100">{selectedTicket.userName}</span></p>
                        <p><span className="text-slate-400">User ID:</span> <span className="text-slate-100 font-mono">{selectedTicket.userId}</span></p>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h4 className="font-medium text-slate-200 mb-3 flex items-center">
                        <FiFileText className="w-5 h-5 mr-2 text-green-400" />
                        Description
                      </h4>
                      <p className="text-sm text-slate-300 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                        {selectedTicket.description}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h4 className="font-medium text-slate-200 mb-3 flex items-center">
                        <FiEdit3 className="w-5 h-5 mr-2 text-purple-400" />
                        Status Management
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(TICKET_STATUSES).map((status) => (
                          <motion.button
                            key={status}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateTicketStatus(selectedTicket.id, status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                              selectedTicket.status === status
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
                            }`}
                          >
                            {TICKET_STATUSES[status].label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h4 className="font-medium text-slate-200 mb-3 flex items-center">
                        <FiSend className="w-5 h-5 mr-2 text-blue-400" />
                        Add Comment
                      </h4>
                      <div className="space-y-3">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment for this ticket..."
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          rows={3}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addTicketComment(selectedTicket.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200 touch-manipulation"
                        >
                          <FiSend className="inline mr-2 w-4 h-4" />
                          Add Comment
                        </motion.button>
                      </div>
                    </div>

                    {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                        <h4 className="font-medium text-slate-200 mb-3 flex items-center">
                          <FiMessageSquare className="w-5 h-5 mr-2 text-green-400" />
                          Comments ({selectedTicket.comments.length})
                        </h4>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {selectedTicket.comments.map((comment, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-slate-700/50 border border-slate-600 rounded-lg p-3"
                              >
                                <p className="text-slate-200 text-sm leading-relaxed">{comment.message}</p>
                                <p className="text-xs text-slate-400 mt-2 flex items-center">
                                  <FiClock className="w-3 h-3 mr-1" />
                                  {comment.adminName} • {comment.timestamp?.toDate?.()?.toLocaleString()}
                                </p>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-96 flex items-center justify-center shadow-xl">
                  <div className="text-center text-slate-400">
                    <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a ticket</p>
                    <p className="text-sm mt-1">Choose a ticket to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportManager;