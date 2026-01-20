import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { FiSend, FiMessageCircle, FiUser, FiArrowLeft, FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
<<<<<<< HEAD
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { requireFreshIdToken } from '../../services/authReady';
=======

// Note: In production, store API key in environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAII33W1SnpTpH0lL8ilbTuGC46ntaA5JM';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const ChatbotSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
<<<<<<< HEAD
=======
  const [lastResponses, setLastResponses] = useState(new Set());
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Typing Indicator Component
  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start space-x-3 mb-4"
    >
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
          🤖
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

<<<<<<< HEAD
  const getChatbotReply = async (userMessage) => {
    const fallbackMessages = {
      network: 'Unable to connect to support. Please check your internet connection and try again.',
      timeout: 'Your request is taking longer than expected. Please try again with a shorter message.',
      server: 'Our support system is currently experiencing issues. Please try again in a few moments.',
      generic: 'Support is temporarily unavailable. Please try again later or contact our support team directly.'
    };

    try {
      // Prepare conversation history
      const history = Array.isArray(conversationContext)
        ? conversationContext.slice(-10).filter((m) => m && typeof m === 'object')
        : [];
      
      const payload = { 
        message: userMessage.trim(),
        history 
      };
      
      console.log('[chatbotReply] request', {
        messageLength: userMessage.length,
        historyLength: history.length,
        timestamp: new Date().toISOString()
      });

      // Make HTTP request to Cloud Function with proper error handling
      const response = await fetch('https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply', {
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
<<<<<<< HEAD
        body: JSON.stringify(payload),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(25000) // 25 second timeout
      });

      console.log('[chatbotReply] response status', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[chatbotReply] HTTP error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          timestamp: new Date().toISOString()
        });

        // Return specific error messages based on status
        if (response.status === 400) {
          return errorData.reply || 'Please check your message and try again.';
        } else if (response.status === 408) {
          return errorData.reply || fallbackMessages.timeout;
        } else if (response.status >= 500) {
          return errorData.reply || fallbackMessages.server;
        } else {
          return errorData.reply || fallbackMessages.generic;
        }
      }

      const data = await response.json();
      console.log('[chatbotReply] success', {
        hasReply: !!data.reply,
        replyLength: data.reply?.length || 0,
        timestamp: new Date().toISOString()
      });

      const reply = data?.reply;
      if (typeof reply === 'string' && reply.trim()) {
        return reply.trim();
      } else {
        console.warn('[chatbotReply] empty or invalid reply', data);
        return fallbackMessages.generic;
      }

    } catch (error) {
      console.error('[chatbotReply] error', {
        error: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      });

      // Handle specific error types
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return fallbackMessages.timeout;
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return fallbackMessages.network;
      } else {
        return fallbackMessages.generic;
      }
    }
  };

=======
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
    
    // Dynamic responses based on context and previous interactions
    const greetingResponses = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "Hi there! Welcome to HH Foundation support. What can I assist you with?",
      "Greetings! I'm here to help with any questions about our platform.",
      "Hello! Ready to assist you with your HH Foundation queries."
    ];
    
    const helpResponses = [
      "I'm here to help! You can ask me about account issues, payments, referrals, or any other questions about our platform.",
      "I can assist with various topics including account management, payment processing, referral systems, and general platform questions. What would you like to know?",
      "Happy to help! Whether it's about your account, earnings, referrals, or technical issues, I'm here for you.",
      "I'm ready to assist! Feel free to ask about payments, referrals, account settings, or any other platform-related questions."
    ];
    
    const paymentResponses = [
      "For payment-related issues, please check your payment history in the dashboard or contact our support team for assistance.",
      "Payment concerns? You can view your transaction history in the dashboard. For specific issues, our support team is available to help.",
      "Regarding payments: Check your dashboard for transaction details. If you need further assistance, our team is here to help.",
      "For payment queries, your dashboard contains detailed transaction information. Contact support for any specific concerns."
    ];
    
    const referralResponses = [
      "You can find your referral link in the dashboard. Share it with others to earn commissions when they join!",
      "Your unique referral link is available in the dashboard. Share it to earn rewards when others join through your link!",
      "Check your dashboard for your personal referral link. Sharing it helps you earn commissions from new member registrations.",
      "Your referral link in the dashboard is your key to earning. Share it with friends and family to grow your network!"
    ];
    
    const defaultResponses = [
      "Thank you for your message. For complex issues, please consider contacting our live support agents for personalized assistance.",
      "I appreciate your question. For detailed support, our live agents are available to provide personalized help.",
      "Thanks for reaching out! For more specific assistance, our support team can provide detailed guidance.",
      "I understand your concern. Our live support agents can offer more comprehensive help for complex issues."
    ];
    
    // Select response based on message content and avoid recent duplicates
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
    // Filter out recently used responses
    const availableResponses = responses.filter(response => !lastResponses.has(response));
    
    // If all responses have been used recently, reset the set
    if (availableResponses.length === 0) {
      setLastResponses(new Set());
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Select a random response from available ones
    const selectedResponse = availableResponses[Math.floor(Math.random() * availableResponses.length)];
    
    // Add to recent responses and limit the set size
    setLastResponses(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedResponse);
      // Keep only the last 3 responses to allow variety
      if (newSet.size > 3) {
        const firstItem = newSet.values().next().value;
        newSet.delete(firstItem);
      }
      return newSet;
    });
    
    return selectedResponse;
  };

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

<<<<<<< HEAD
    let aiResponse = 'Support is temporarily unavailable. Please try again later.';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    try {
      // Add user message
      const userMessageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        timestamp: serverTimestamp()
      };
<<<<<<< HEAD
      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), userMessageData);

      // Simulate typing delay with enhanced visual feedback
      await new Promise(resolve => setTimeout(resolve, 600));

      // Get AI response (server-side ChatGPT via Cloud Function)
      aiResponse = await getChatbotReply(messageText);
      setConversationContext(prev => [
        ...(Array.isArray(prev) ? prev.slice(-10) : []),
        { role: 'user', content: messageText },
        { role: 'assistant', content: aiResponse }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }

    try {
      // Always append a bot message (success or fallback)
=======

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), userMessageData);

      // Simulate typing delay with enhanced visual feedback
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get AI response
      const aiResponse = await getGeminiResponse(messageText);

      // Add AI response
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      const aiMessageData = {
        senderUid: 'CHATBOT',
        senderType: 'agent',
        senderName: 'AI Assistant',
        text: aiResponse,
        timestamp: serverTimestamp()
      };
<<<<<<< HEAD
      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), aiMessageData);
    } catch (error) {
      console.error('Error appending bot reply:', error);
=======

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), aiMessageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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

  const TypingIndicatorBubble = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 mb-4"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <FiMessageCircle className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* WhatsApp-style Header */}
<<<<<<< HEAD
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg fixed top-0 left-0 right-0 z-[100] w-full" style={{height: 64}}>
        <button
          onClick={() => {
            console.log('ChatbotSupport: Back button clicked, dispatching open-dashboard-sidebar event');
            // Open sidebar in DashboardLayout
            if (window && window.dispatchEvent) {
              const event = new CustomEvent('open-dashboard-sidebar');
              const dispatched = window.dispatchEvent(event);
              console.log('ChatbotSupport: Event dispatched successfully:', dispatched);
            } else {
              console.error('ChatbotSupport: window.dispatchEvent not available');
            }
          }}
          className="p-2 hover:bg-green-700 rounded-full transition-colors"
          title="Open sidebar"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiMessageCircle className="w-5 h-5 text-white" />
        </div>
=======
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => navigate('/dashboard/support')}
          className="p-2 hover:bg-green-700 rounded-full transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiMessageCircle className="w-5 h-5 text-white" />
        </div>
        
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        <div className="flex-1">
          <h1 className="font-semibold text-lg">AI Assistant</h1>
          <p className="text-green-100 text-sm">Online • Always available</p>
        </div>
<<<<<<< HEAD
=======
        
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
<<<<<<< HEAD
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 min-h-0" style={{marginTop: 64}}>
=======
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 min-h-0">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to AI Support!</h3>
            <p className="text-gray-600">Start a conversation and I'll help you with any questions.</p>
          </div>
        )}

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
                    <FiMessageCircle className="w-4 h-4 text-white" />
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

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator />}
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
              placeholder="Type a message..."
              className="w-full resize-none outline-none text-gray-800 placeholder-gray-500 max-h-20"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
          >
            <FiSend className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSupport;