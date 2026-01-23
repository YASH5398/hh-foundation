import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSend, FiUser, FiUsers, FiMessageCircle, FiClock, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatDate';
import { useAgentAuth } from '../../context/AgentAuthContext';

const AgentChat = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAgentAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const chatIdFromUrl = searchParams.get('chatId');

  useEffect(() => {
    // Real-time listener for agent chats
    const chatsQuery = query(
      collection(db, 'agentChats'),
      orderBy('startedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = [];
      snapshot.forEach((doc) => {
        chatsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setChats(chatsData);

      // If we have a chatId from URL and haven't selected a chat yet, find and select it
      if (chatIdFromUrl && !selectedChat) {
        const chatToSelect = chatsData.find(chat => chat.id === chatIdFromUrl);
        if (chatToSelect) {
          setSelectedChat(chatToSelect);
        }
      }

      setLoading(false);
    }, (error) => {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatIdFromUrl, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      // Real-time listener for messages in selected chat
      const messagesQuery = query(
        collection(db, 'agentChats', selectedChat.id, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = [];
        snapshot.forEach((doc) => {
          messagesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMessages(messagesData);
        scrollToBottom();
      }, (error) => {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      });

      return () => unsubscribe();
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      // Add message to messages subcollection
      await addDoc(collection(db, 'agentChats', selectedChat.id, 'messages'), {
        text: newMessage,
        senderUid: currentUser?.uid,
        senderType: 'agent',
        senderName: currentUser?.displayName || currentUser?.email || 'Agent Support',
        timestamp: serverTimestamp(),
        read: false
      });

      // Update chat's last message info
      await updateDoc(doc(db, 'agentChats', selectedChat.id), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: 'agent'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    return (
      chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Chat</h1>
          <p className="text-gray-600">Real-time messaging with users</p>
        </div>

        <div className="bg-white rounded-lg shadow-md h-[calc(100vh-200px)] flex">
          {/* Chat List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <FiMessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>No chats found</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                            {chat.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {chat.userName || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {chat.userEmail || 'No email'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(chat.lastMessageAt)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {chat.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {selectedChat.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedChat.userName || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedChat.userEmail || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <FiMessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === 'agent' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderType === 'agent'
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex space-x-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FiUsers className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;