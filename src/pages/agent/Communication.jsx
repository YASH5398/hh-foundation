import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageSquare, FiUsers, FiSearch, FiSend, FiUser, FiClock,
  FiCheck, FiCheckCircle, FiPhone, FiVideo, FiMoreVertical,
  FiX, FiPaperclip, FiSmile, FiRefreshCw, FiPlus, FiEdit3
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, serverTimestamp, getDoc,
  limit, startAfter
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
import UserProfileView from '../../components/agent/UserProfileView';

const Communication = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [activeTab, setActiveTab] = useState('support'); // support, agent-chat, templates
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch support ticket conversations
  useEffect(() => {
    if (!user?.uid || activeTab !== 'support') return;

    const conversationsQuery = query(
      collection(db, 'supportTickets'),
      where('agentId', '==', user.uid),
      where('status', 'in', ['open', 'in-progress', 'pending']),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'support',
        lastMessageAt: doc.data().updatedAt?.toDate?.() || new Date(),
        participantName: doc.data().userName || 'Unknown User',
        participantId: doc.data().userId
      }));
      
      setConversations(conversationData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching support conversations:', error);
      toast.error('Failed to load conversations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, activeTab]);

  // Fetch agent chat conversations
  useEffect(() => {
    if (!user?.uid || activeTab !== 'agent-chat') return;

    const conversationsQuery = query(
      collection(db, 'agentChats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationData = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find(p => p !== user.uid);
        
        return {
          id: doc.id,
          ...data,
          type: 'agent-chat',
          lastMessageAt: data.lastMessageAt?.toDate?.() || new Date(),
          participantName: data.participantNames?.[otherParticipant] || 'Unknown Agent',
          participantId: otherParticipant
        };
      });
      
      setConversations(conversationData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching agent conversations:', error);
      toast.error('Failed to load agent conversations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, activeTab]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    let messagesQuery;
    
    if (selectedConversation.type === 'support') {
      messagesQuery = query(
        collection(db, 'supportTickets', selectedConversation.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
    } else {
      messagesQuery = query(
        collection(db, 'agentChats', selectedConversation.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setMessages(messageData);
      scrollToBottom();
    }, (error) => {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        content: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderRole: 'agent',
        createdAt: serverTimestamp(),
        read: false
      };

      let collectionPath;
      if (selectedConversation.type === 'support') {
        collectionPath = `supportTickets/${selectedConversation.id}/messages`;
      } else {
        collectionPath = `agentChats/${selectedConversation.id}/messages`;
      }

      // Add message
      await addDoc(collection(db, collectionPath), messageData);

      // Update conversation last message
      const conversationPath = selectedConversation.type === 'support' 
        ? `supportTickets/${selectedConversation.id}`
        : `agentChats/${selectedConversation.id}`;
        
      await updateDoc(doc(db, conversationPath), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const getMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return (
      conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border h-96">
                <div className="h-full flex items-center justify-center">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Chat with users and other agents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'support', label: 'Support Chats', icon: FiMessageSquare },
              { key: 'agent-chat', label: 'Agent Chat', icon: FiUsers },
              { key: 'templates', label: 'Templates', icon: FiEdit3 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedConversation(null);
                  setShowMobileChat(false);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'templates' ? (
        // Templates View
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <FiEdit3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Message Templates</p>
            <p className="text-sm text-gray-400">Quick responses for common inquiries</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <FiPlus className="w-4 h-4 inline mr-2" />
              Add Template
            </button>
          </div>
        </div>
      ) : (
        // Chat Interface
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Conversations List */}
          <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
            showMobileChat ? 'hidden lg:block' : 'block'
          }`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto h-full">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setShowMobileChat(true);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {conversation.type === 'support' ? (
                            <FiMessageSquare className="w-5 h-5 text-gray-600" />
                          ) : (
                            <FiUsers className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participantName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(conversation.lastMessageAt)}
                          </span>
                        </div>
                        
                        {conversation.subject && (
                          <p className="text-xs text-gray-600 mb-1 truncate">
                            {conversation.subject}
                          </p>
                        )}
                        
                        {conversation.status && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mb-1 ${getStatusColor(conversation.status)}`}>
                            {conversation.status}
                          </span>
                        )}
                        
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations found</p>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'support' ? 'Support tickets will appear here' : 'Agent chats will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col ${
            !showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                    
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FiUser className="w-4 h-4 text-gray-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.participantName}
                      </h3>
                      {selectedConversation.subject && (
                        <p className="text-sm text-gray-500">
                          {selectedConversation.subject}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedConversation.type === 'support' && (
                      <button
                        onClick={() => {
                          setSelectedUserId(selectedConversation.participantId);
                          setShowUserProfile(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        <FiUser className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <FiMoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          message.senderId === user.uid ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user.uid
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 text-xs ${
                            message.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span>{getMessageTime(message.createdAt)}</span>
                            {message.senderId === user.uid && (
                              <span className="ml-2">
                                {message.read ? (
                                  <FiCheckCircle className="w-3 h-3" />
                                ) : (
                                  <FiCheck className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400">Start the conversation below</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                      />
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiSend className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation</p>
                  <p className="text-sm text-gray-400">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
                <button
                  onClick={() => {
                    setShowUserProfile(false);
                    setSelectedUserId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <UserProfileView userId={selectedUserId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;