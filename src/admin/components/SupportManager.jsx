import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { 
  FiMessageSquare, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiSend, 
  FiEdit3 
} from 'react-icons/fi';
// import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Support Manager</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage agent chats and support tickets</p>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('agent-chats');
                  setChatType('agent');
                  setSelectedChat(null);
                }}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'agent-chats'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiMessageSquare className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Agent Chats ({chatRooms.length})</span>
                <span className="sm:hidden">Agents ({chatRooms.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('chatbot-chats');
                  setChatType('chatbot');
                  setSelectedChat(null);
                }}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'chatbot-chats'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiMessageSquare className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Chatbot Chats ({chatbotChats.length})</span>
                <span className="sm:hidden">Chatbot ({chatbotChats.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'tickets'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiFileText className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Support Tickets ({tickets.length})</span>
                <span className="sm:hidden">Tickets ({tickets.length})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {(activeTab === 'agent-chats' || activeTab === 'chatbot-chats') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Chat List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {activeTab === 'agent-chats' ? 'Agent Chat Rooms' : 'Chatbot Conversations'}
                  </h3>
                </div>
                <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                  {(activeTab === 'agent-chats' ? chatRooms : chatbotChats).map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{chat.userName}</h4>
                        {getStatusBadge(chat.status, 'chat')}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">User ID: {chat.userId}</p>
                      {chat.agentName && (
                        <p className="text-sm text-blue-600">Agent: {chat.agentName}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {chat.createdAt?.toDate?.()?.toLocaleString()}
                      </p>
                      {chat.status === 'waiting' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignAgent(chat.id);
                          }}
                          className="mt-2 w-full bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                        >
                          Assign Me
                        </button>
                      )}
                    </div>
                  ))}
                  {(activeTab === 'agent-chats' ? chatRooms : chatbotChats).length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{activeTab === 'agent-chats' ? 'No agent chat rooms found' : 'No chatbot conversations found'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedChat.userName}</h3>
                      <p className="text-sm text-gray-600">Chat with {selectedChat.userId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedChat.status, 'chat')}
                      {selectedChat.status === 'active' && (
                        <button
                          onClick={() => closeChat(selectedChat.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                        >
                          Close Chat
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === 'agent' ? 'justify-end' : 
                          message.senderType === 'system' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'agent'
                              ? 'bg-purple-600 text-white'
                              : message.senderType === 'system'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : message.senderType === 'chatbot'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {message.senderType === 'system' && (
                            <p className="text-xs font-medium mb-1">System Message</p>
                          )}
                          {message.senderType === 'chatbot' && (
                            <p className="text-xs font-medium mb-1">Chatbot</p>
                          )}
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {message.timestamp?.toDate?.()?.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  {selectedChat.status === 'active' && chatType === 'agent' && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <FiSend className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {chatType === 'chatbot' && (
                    <div className="p-4 border-t border-gray-200 bg-blue-50">
                      <p className="text-sm text-blue-600 text-center">
                        This is a chatbot conversation. Messages are handled automatically by AI.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a chat room to view messages</p>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedTicket?.id === ticket.id ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{ticket.subject}</h4>
                        {getStatusBadge(ticket.status, 'ticket')}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">By: {ticket.userName}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {ticket.createdAt?.toDate?.()?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tickets found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              {selectedTicket ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h3>
                      {getStatusBadge(selectedTicket.status, 'ticket')}
                    </div>
                    <p className="text-sm text-gray-600">Ticket #{selectedTicket.id.slice(-8)}</p>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                      <p className="text-sm text-gray-600">Name: {selectedTicket.userName}</p>
                      <p className="text-sm text-gray-600">User ID: {selectedTicket.userId}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedTicket.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status Management</h4>
                      <div className="flex gap-2">
                        {Object.keys(TICKET_STATUSES).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateTicketStatus(selectedTicket.id, status)}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              selectedTicket.status === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {TICKET_STATUSES[status].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Add Comment</h4>
                      <div className="space-y-2">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment for this ticket..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                        />
                        <button
                          onClick={() => addTicketComment(selectedTicket.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>

                    {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
                        <div className="space-y-2">
                          {selectedTicket.comments.map((comment, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-blue-800 text-sm">{comment.message}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                {comment.adminName} • {comment.timestamp?.toDate?.()?.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a ticket to view details</p>
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