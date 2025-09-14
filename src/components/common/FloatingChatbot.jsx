import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { FiSend, FiMessageCircle, FiUser, FiX, FiMinus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Note: In production, store API key in environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAII33W1SnpTpH0lL8ilbTuGC46ntaA5JM';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const FloatingChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const [lastResponses, setLastResponses] = useState(new Set());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize or get existing chat room
  useEffect(() => {
    if (!user?.uid) return;

    const initializeChatRoom = async () => {
      const chatbotChatRef = doc(db, 'chatbotChats', user.uid);
      const chatbotChatDoc = await getDoc(chatbotChatRef);
      
      if (!chatbotChatDoc.exists()) {
        // Create new chat room for chatbot
        await setDoc(chatbotChatRef, {
          userId: user.uid,
          userName: user.displayName || user.email,
          agentId: 'CHATBOT',
          agentName: 'AI Assistant',
          status: 'active',
          createdAt: serverTimestamp(),
          closedAt: null
        });
      }
      
      setChatRoomId(user.uid);
    };

    initializeChatRoom();
  }, [user?.uid, user?.displayName, user?.email]);

  // Load messages from subcollection
  useEffect(() => {
    if (!chatRoomId) return;

    const messagesRef = collection(db, 'chatbotChats', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  const getGeminiResponse = async (userMessage) => {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-api-key-here') {
        return getLocalResponse(userMessage);
      }

      // Build conversation context for better responses
      const contextMessages = conversationContext.slice(-6); // Last 6 messages for context
      const contextText = contextMessages.length > 0 
        ? `Previous conversation context: ${contextMessages.map(msg => `${msg.type}: ${msg.text}`).join(' | ')} | Current message: ${userMessage}`
        : userMessage;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful customer support assistant for HH Foundation MLM platform. Provide varied, contextual responses and avoid repeating previous answers. Context: ${contextText}. Please provide a helpful, unique, and concise response.`
            }]
          }]
        })
      });

      if (!response.ok) {
        console.error('API Response Error:', response.status, response.statusText);
        return getLocalResponse(userMessage);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getLocalResponse(userMessage);
      
      // Update conversation context
      setConversationContext(prev => [
        ...prev.slice(-5), // Keep last 5 messages
        { type: 'user', text: userMessage },
        { type: 'assistant', text: aiResponse }
      ]);
      
      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return getLocalResponse(userMessage);
    }
  };

  const getLocalResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    const greetingResponses = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "Hi there! Welcome to HH Foundation support. What can I assist you with?",
      "Greetings! I'm here to help with any questions about our platform."
    ];
    
    const helpResponses = [
      "I'm here to help! You can ask me about account issues, payments, referrals, or any other questions about our platform.",
      "I can assist with various topics including account management, payment processing, referral systems, and general platform questions. What would you like to know?"
    ];
    
    const paymentResponses = [
      "For payment-related issues, please check your payment history in the dashboard or contact our support team for assistance.",
      "Payment concerns? You can view your transaction history in the dashboard. For specific issues, our support team is available to help."
    ];
    
    const referralResponses = [
      "You can find your referral link in the dashboard. Share it with others to earn commissions when they join!",
      "Your unique referral link is available in the dashboard. Share it to earn rewards when others join through your link!"
    ];
    
    const defaultResponses = [
      "Thank you for your message. For complex issues, please consider contacting our live support agents for personalized assistance.",
      "I appreciate your question. For detailed support, our live agents are available to provide personalized help."
    ];
    
    let selectedResponse;
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      selectedResponse = getUniqueResponse(greetingResponses);
    } else if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
      selectedResponse = getUniqueResponse(helpResponses);
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('money') || lowerMessage.includes('transaction')) {
      selectedResponse = getUniqueResponse(paymentResponses);
    } else if (lowerMessage.includes('referral') || lowerMessage.includes('refer') || lowerMessage.includes('commission')) {
      selectedResponse = getUniqueResponse(referralResponses);
    } else {
      selectedResponse = getUniqueResponse(defaultResponses);
    }
    
    // Update conversation context for local responses too
    setConversationContext(prev => [
      ...prev.slice(-5),
      { type: 'user', text: userMessage },
      { type: 'assistant', text: selectedResponse }
    ]);
    
    return selectedResponse;
  };
  
  const getUniqueResponse = (responses) => {
    const availableResponses = responses.filter(response => !lastResponses.has(response));
    
    if (availableResponses.length === 0) {
      setLastResponses(new Set());
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    const selectedResponse = availableResponses[Math.floor(Math.random() * availableResponses.length)];
    
    setLastResponses(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedResponse);
      if (newSet.size > 3) {
        const firstItem = newSet.values().next().value;
        newSet.delete(firstItem);
      }
      return newSet;
    });
    
    return selectedResponse;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || isLoading || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add user message
      const userMessageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), userMessageData);

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get AI response
      const aiResponse = await getGeminiResponse(messageText);

      // Add AI response
      const aiMessageData = {
        senderUid: 'CHATBOT',
        senderType: 'agent',
        senderName: 'AI Assistant',
        text: aiResponse,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), aiMessageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start space-x-2 mb-2"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <FiMessageCircle className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white text-gray-800 rounded-lg rounded-bl-sm shadow-sm px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </motion.div>
  );

  // Don't render if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
          >
            <FiMessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FiMessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Assistant</h3>
                  <p className="text-sm opacity-90">Online - Ready to help</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  <FiMinus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiMessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-lg text-gray-600">Hi! How can I help you today?</p>
                      <p className="text-sm text-gray-500 mt-2">Ask me anything and I'll do my best to assist you.</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((message) => {
                      const isUser = message.senderType === 'user';
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex items-end space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiMessageCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          <div className={`max-w-[60%] px-4 py-3 rounded-lg text-base ${
                            isUser 
                              ? 'bg-blue-500 text-white rounded-br-sm' 
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                          }`}>
                            <p className="leading-relaxed break-words">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              isUser ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                          
                          {isUser && (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiUser className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && <TypingIndicator />}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 border-t bg-white">
                  <div className="flex items-center space-x-4 max-w-4xl mx-auto">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <FiSend className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;