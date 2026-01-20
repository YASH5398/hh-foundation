import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, User, Bot, Clock, Phone, Mail, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

const LiveChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      message: 'Please wait 5–10 minutes, an agent will connect with you.',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [chatStatus, setChatStatus] = useState('waiting'); // waiting, connecting, connected
  const [assignedAgent, setAssignedAgent] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    });
  };

  return (
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
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
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
        </div>
      </div>
    </div>
  );
};

export default LiveChat;