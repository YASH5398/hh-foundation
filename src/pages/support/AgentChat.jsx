import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { FiSend, FiUser, FiHeadphones, FiArrowLeft, FiMoreVertical, FiClock, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AgentChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState('waiting'); // waiting, connected, ended
  const [agentInfo, setAgentInfo] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Connecting Loader Component
  const ConnectingLoader = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-8 space-y-4"
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FiUser className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Connecting to agent...</h3>
        <p className="text-gray-600 text-sm">Please wait while we find an available agent</p>
      </div>
    </motion.div>
  );

  // Agent Typing Indicator Component
  const AgentTypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start space-x-3 mb-4"
    >
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
          {agentInfo?.agentName?.charAt(0) || 'A'}
        </div>
      </div>
      <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </motion.div>
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing chat room or create new one
  useEffect(() => {
    if (!user?.uid) return;

    const checkExistingChatRoom = async () => {
      try {
        const chatRoomsRef = collection(db, 'agentChats');
        const q = query(
          chatRoomsRef,
          where('userId', '==', user.uid),
          where('status', 'in', ['waiting', 'connected'])
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Found existing active chat room
          const existingChatRoom = querySnapshot.docs[0];
          setChatRoom({ id: existingChatRoom.id, ...existingChatRoom.data() });
          setChatStatus(existingChatRoom.data().status);
          
          if (existingChatRoom.data().agentId && existingChatRoom.data().agentName) {
            setAgentInfo({
              id: existingChatRoom.data().agentId,
              name: existingChatRoom.data().agentName
            });
          }
        } else {
          // No existing chat room, will create one when user sends first message
          setChatStatus('waiting');
        }
      } catch (error) {
        console.error('Error checking existing chat room:', error);
      }
    };

    checkExistingChatRoom();
  }, [user?.uid]);

  // Listen for real-time chat room updates
  useEffect(() => {
    if (!chatRoom?.id) return;

    const chatRoomRef = doc(db, 'agentChats', chatRoom.id);
    const unsubscribe = onSnapshot(chatRoomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setChatRoom({ id: doc.id, ...data });
        setChatStatus(data.status);
        
        if (data.agentId && data.agentName) {
          setAgentInfo({
            id: data.agentId,
            name: data.agentName
          });
        }
      }
    });

    return () => unsubscribe();
  }, [chatRoom?.id]);

  // Load messages when chat room exists
  useEffect(() => {
    if (!chatRoom?.id) return;

    const messagesRef = collection(db, 'agentChats', chatRoom.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [chatRoom?.id]);

  const requestAgent = async () => {
    if (!user?.uid) return;

    setIsConnecting(true);
    setIsLoading(true);
    try {
      const chatRoomData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        agentId: null,
        agentName: null,
        status: 'waiting',
        createdAt: serverTimestamp(),
        connectedAt: null,
        closedAt: null
      };

      const docRef = await addDoc(collection(db, 'agentChats'), chatRoomData);
      setChatRoom({ id: docRef.id, ...chatRoomData });
      setChatStatus('waiting');
      
      toast.success('Request sent! Waiting for an available agent...');
    } catch (error) {
      console.error('Error requesting agent:', error);
      toast.error('Failed to request agent');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsConnecting(false), 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    // If no chat room exists, create one first
    if (!chatRoom) {
      await requestAgent();
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      const messageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'agentChats', chatRoom.id, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = () => {
    switch (chatStatus) {
      case 'waiting':
        return {
          text: 'Waiting for agent...',
          color: 'text-yellow-100',
          icon: FiClock
        };
      case 'connected':
        return {
          text: `Connected to ${agentInfo?.name || 'Agent'}`,
          color: 'text-green-100',
          icon: FiCheck
        };
      case 'ended':
        return {
          text: 'Chat ended',
          color: 'text-gray-100',
          icon: FiClock
        };
      default:
        return {
          text: 'Live Support',
          color: 'text-green-100',
          icon: FiHeadphones
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  const ConnectingLoaderUI = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <FiHeadphones className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Connecting to agent...</h3>
      <p className="text-gray-600 text-center max-w-sm">
        Please wait while we connect you to an available support agent.
      </p>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* WhatsApp-style Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => navigate('/support')}
          className="p-2 hover:bg-green-700 rounded-full transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiHeadphones className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <h1 className="font-semibold text-lg">
            {agentInfo?.name || 'Live Support'}
          </h1>
          <div className="flex items-center gap-2">
            <StatusIcon className="w-3 h-3" />
            <p className={`text-sm ${statusDisplay.color}`}>
              {statusDisplay.text}
            </p>
          </div>
        </div>
        
        <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 min-h-0">
        {/* Show connecting loader when requesting agent */}
        <AnimatePresence>
          {isConnecting && <ConnectingLoaderUI />}
        </AnimatePresence>
        
        {/* Show waiting message when no chat room exists */}
        {!chatRoom && !isConnecting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHeadphones className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect with Live Support</h3>
            <p className="text-gray-600 mb-6">Get instant help from our support team.</p>
            <button
              onClick={requestAgent}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Start Chat
            </button>
          </div>
        )}

        {/* Show waiting message when chat room exists but no agent connected */}
        {chatRoom && chatStatus === 'waiting' && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FiClock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Waiting for agent...</h3>
            <p className="text-gray-600">An agent will join the chat shortly.</p>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message) => {
            const isUser = message.senderType === 'user';
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiHeadphones className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                  isUser 
                    ? 'bg-green-500 text-white rounded-br-md' 
                    : 'bg-white text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm sm:text-base leading-relaxed break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    isUser ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                
                {isUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Agent Typing Indicator */}
        <AnimatePresence>
          {agentTyping && <AgentTypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input */}
      <div className="bg-gray-50 px-2 sm:px-4 py-3 border-t safe-area-bottom">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 bg-white rounded-3xl border border-gray-200 px-3 sm:px-4 py-2 shadow-sm">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={chatRoom ? "Type a message..." : "Start a conversation..."}
              className="w-full resize-none outline-none text-gray-800 placeholder-gray-500 max-h-20"
              rows={1}
              disabled={isLoading || isConnecting || chatStatus === 'ended'}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || isConnecting || chatStatus === 'ended'}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
          >
            <FiSend className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;