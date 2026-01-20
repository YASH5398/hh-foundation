import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, User, Bot, Clock, Phone, Mail, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
=======
import { motion } from 'framer-motion';
import { Send, MessageCircle, User, Bot, Clock, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const LiveChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
<<<<<<< HEAD
      type: 'system',
      message: 'Please wait 5–10 minutes, an agent will connect with you.',
=======
      type: 'bot',
      message: 'Hello! Welcome to HH Foundation Live Chat Support. How can I help you today?',
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
<<<<<<< HEAD
  const [chatRequestId, setChatRequestId] = useState(null);
  const [chatStatus, setChatStatus] = useState('waiting'); // waiting, connecting, connected
  const [assignedAgent, setAssignedAgent] = useState(null);
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

<<<<<<< HEAD
  // Listen for chat request status changes
  useEffect(() => {
    if (!chatRequestId) return;

    const chatRequestRef = doc(db, 'agentChatRequests', chatRequestId);
    const unsubscribe = onSnapshot(chatRequestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.status === 'accepted' && data.assignedAgentId) {
          setChatStatus('connected');
          setAssignedAgent({
            id: data.assignedAgentId,
            name: data.assignedAgentName || 'Agent'
          });

          // Add system message
          const systemMessage = {
            id: Date.now(),
            type: 'system',
            message: `Connected to ${data.assignedAgentName || 'Agent'}. You can now chat in real-time.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);

          // Start listening to the chat room
          startChatRoomListener(chatRequestId);
        }
      }
    });

    return () => unsubscribe();
  }, [chatRequestId]);

  const startChatRoomListener = (requestId) => {
    const chatRoomRef = collection(db, 'agentChats', requestId, 'messages');
    const q = query(chatRoomRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Filter out messages from current user (we already have them)
      const agentMessages = chatMessages.filter(msg => msg.senderType === 'agent');

      setMessages(prev => {
        // Remove old agent messages and add new ones
        const userMessages = prev.filter(msg => msg.senderType !== 'agent');
        return [...userMessages, ...agentMessages];
      });
    });

    return unsubscribe;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // If this is the first message, create a chat request
    if (chatStatus === 'waiting' && !chatRequestId) {
      await createChatRequest(messageText);
      return;
    }

    // If connected to agent, send message to chat room
    if (chatStatus === 'connected' && chatRequestId) {
      await sendMessageToChatRoom(messageText);
    }
  };

  const createChatRequest = async (firstMessage) => {
    try {
      const chatRequestData = {
        userId: user.uid,
        userName: user.displayName || user.email || 'User',
        firstMessage: firstMessage,
        status: 'pending',
        createdAt: serverTimestamp(),
        assignedAgentId: null,
        assignedAgentName: null,
        acceptedAt: null
      };

      const docRef = await addDoc(collection(db, 'agentChatRequests'), chatRequestData);
      setChatRequestId(docRef.id);
      setChatStatus('connecting');

      // Add user message to local state
      const userMessage = {
        id: Date.now(),
        type: 'user',
        senderType: 'user',
        senderName: user.displayName || user.email,
        message: firstMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Add connecting message
      const connectingMessage = {
        id: Date.now() + 1,
        type: 'system',
        message: 'Connecting you to a live agent...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, connectingMessage]);

    } catch (error) {
      console.error('Error creating chat request:', error);
      toast.error('Failed to connect to agent. Please try again.');
    }
  };

  const sendMessageToChatRoom = async (messageText) => {
    try {
      const messageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'agentChats', chatRequestId, 'messages'), messageData);

      // Add to local messages
      const userMessage = {
        id: Date.now(),
        type: 'user',
        senderType: 'user',
        senderName: user.displayName || user.email,
        message: messageText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
=======
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        message: getBotResponse(newMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('payment') || message.includes('pay')) {
      return 'For payment issues, please ensure you have completed your KYC verification and are using the correct payment details. You can also contact our payment support team at support@helpinghandsfoundation.in';
    }
    if (message.includes('upgrade') || message.includes('level')) {
      return 'To upgrade your level, you need to complete the current level requirements and make the upgrade payment. Each level has specific benefits and requirements. Would you like me to explain the level system?';
    }
    if (message.includes('help') || message.includes('support')) {
      return 'I\'m here to help! You can ask me about account issues, payment problems, level upgrades, or any other questions about the HH Foundation helping plan.';
    }
    if (message.includes('account') || message.includes('login')) {
      return 'For account-related issues, please check your email for verification links. If you\'re having trouble logging in, try resetting your password or contact our support team.';
    }
    
    return 'Thank you for your message. Our support team will assist you shortly. For immediate assistance, you can also call us at +91 6299261088 or email support@helpinghandsfoundation.in';
  };

  const quickActions = [
    { text: 'How to Start', action: () => setNewMessage('How do I get started with the helping plan?') },
    { text: 'Payment Issues', action: () => setNewMessage('I\'m having payment problems') },
    { text: 'Upgrade Help', action: () => setNewMessage('How do I upgrade my level?') },
    { text: 'Contact Support', action: () => setNewMessage('I need to speak with a support agent') }
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    });
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm sticky top-16 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Support</h1>
                <p className="text-sm text-gray-500">Online • Typically replies instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 min-h-0">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Live Support!</h3>
              <p className="text-gray-600 text-center leading-relaxed max-w-sm mx-auto">
                Start a conversation and our support team will assist you with any questions.
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => {
              const isUser = message.senderType === 'user' || message.type === 'user';
              const isSystem = message.type === 'system';
              const isAgent = message.senderType === 'agent';

              if (isSystem) {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm max-w-md text-center">
                      {message.message}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    layout: { duration: 0.2 }
                  }}
                  className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      {isAgent ? (
=======
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-4 border-b border-white/10"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <MessageCircle className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Live Chat Support
          </h1>
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Get instant help from our support team. We're here 24/7 to assist you with your helping plan journey.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">HH Foundation Support</h3>
                  <p className="text-blue-100 text-sm">Online • Typically replies instantly</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      {message.type === 'user' ? (
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
<<<<<<< HEAD
                  )}

                  <div className={`max-w-[75%] sm:max-w-[60%] px-4 py-3 rounded-2xl shadow-sm ${
                    isUser
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}>
                    <p className="text-sm sm:text-base leading-relaxed break-words">
                      {message.message || message.text}
                    </p>
                    <p className={`text-xs mt-2 ${
                      isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-end gap-3 justify-start"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 px-4 py-3 shadow-sm">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full resize-none outline-none text-gray-800 placeholder-gray-500 bg-transparent max-h-20"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
=======
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-gray-100 border border-white/20'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={action.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                  >
                    {action.text}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <a
                  href="tel:+916299261088"
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                  <span>+91 6299261088</span>
                </a>
                <a
                  href="mailto:support@helpinghandsfoundation.in"
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>support@helpinghandsfoundation.in</span>
                </a>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>24/7 Support Available</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">Your Account</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">Logged in as:</p>
                  <p className="text-white font-medium">{user.email}</p>
                  <p className="text-gray-400 text-sm">User ID: {user.uid?.slice(0, 8)}...</p>
                </div>
              </div>
            )}
          </motion.div>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        </div>
      </div>
    </div>
  );
};

export default LiveChat;