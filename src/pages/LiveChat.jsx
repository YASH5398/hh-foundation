import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, User, Bot, Clock, Phone, Mail, Loader, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../config/firebase'; // Ensure storage is exported from firebase config
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { createAgentNotification, AGENT_NOTIF_TYPES, AGENT_NOTIF_PRIORITIES } from '../services/agentNotificationService';

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
  const [chatStatus, setChatStatus] = useState('waiting');
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messageTimestamps, setMessageTimestamps] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSpamNotifTime = useRef(0);
  const emojiPickerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUploading]);

  // Handle outside click for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            name: data.assignedAgentName || 'Agent',
            photo: data.assignedAgentPhoto
          });

          const systemMessage = {
            id: Date.now(),
            type: 'system',
            message: `Connected to ${data.assignedAgentName || 'Agent'}. You can now chat in real-time.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
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

      const agentMessages = chatMessages.filter(msg => msg.senderType === 'agent');

      setMessages(prev => {
        const userMessages = prev.filter(msg => msg.senderType !== 'agent');
        return [...userMessages, ...agentMessages].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return unsubscribe;
  };

  // Image Upload Handler
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `chat-images/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Send Message with Image URL
      await handleSendMessage(null, imageUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleSendMessage = async (e, imageUrl = null) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !user?.uid) return;

    const messageText = newMessage.trim();
    if (!imageUrl) setNewMessage(''); // Only clear text input if it was a text message
    setShowEmojiPicker(false);

    // Spam Detection: Check if more than 5 messages in 10 seconds
    const now = Date.now();
    const newTimestamps = [...messageTimestamps, now].filter(t => now - t < 10000);
    setMessageTimestamps(newTimestamps);

    if (newTimestamps.length > 5) {
      const timeSinceLastNotif = now - lastSpamNotifTime.current;

      if (timeSinceLastNotif > 30000) {
        await createAgentNotification({
          type: AGENT_NOTIF_TYPES.SPAM,
          title: 'Spam Detected',
          message: `User ${user.displayName || user.email} is sending messages rapidly. Potential bot or spammer.`,
          userId: user.uid,
          userName: user.displayName || user.email,
          priority: AGENT_NOTIF_PRIORITIES.HIGH
        });
        lastSpamNotifTime.current = now;
      }

      toast.error('Messaging too fast. Please slow down.');
      return;
    }

    // Initial Chat Request Logic (Only supports text for now to keep simple)
    if (chatStatus === 'waiting' && !chatRequestId) {
      if (imageUrl) {
        toast.error("Please wait for an agent to connect before sending images.");
        return;
      }
      await createChatRequest(messageText);
      return;
    }

    // Connected Logic
    if (chatStatus === 'connected' && chatRequestId) {
      await sendMessageToChatRoom(messageText, imageUrl);
    } else if (chatStatus === 'connecting') {
      // Queueing logic could be added here, but for now simple toast
      toast.error('Please wait for agent connection...');
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

      // Trigger Agent Notification
      await createAgentNotification({
        type: AGENT_NOTIF_TYPES.CHAT_REQUEST,
        title: 'New Chat Request',
        message: `User ${user.displayName || user.email} is waiting for support: "${firstMessage.substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}"`,
        userId: user.uid,
        userName: user.displayName || user.email,
        priority: AGENT_NOTIF_PRIORITIES.MEDIUM
      });

      const userMessage = {
        id: Date.now(),
        type: 'user',
        senderType: 'user',
        senderName: user.displayName || user.email,
        message: firstMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

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

  const sendMessageToChatRoom = async (messageText, imageUrl = null) => {
    try {
      const messageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        imageUrl: imageUrl, // Add image URL to document
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'agentChats', chatRequestId, 'messages'), messageData);

      // Optimistic Update
      const userMessage = {
        id: Date.now(),
        type: 'user',
        senderType: 'user',
        senderName: user.displayName || user.email,
        message: messageText,
        imageUrl: imageUrl,
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
              {/* Welcome UI */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Live Support!</h3>
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
                  className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                      {isAgent && (assignedAgent?.photo || message.senderPhoto) ? (
                        <img
                          src={message.senderPhoto || assignedAgent?.photo}
                          alt="Agent"
                          className="w-full h-full object-cover"
                        />
                      ) : isAgent ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] sm:max-w-[60%] px-4 py-3 rounded-2xl shadow-sm ${isUser
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                    }`}>

                    {/* Image Render */}
                    {message.imageUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                        <img
                          src={message.imageUrl}
                          alt="Shared attachment"
                          className="max-w-full h-auto object-cover max-h-64"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Text Render */}
                    {(message.message || message.text) && (
                      <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                        {message.message || message.text}
                      </p>
                    )}

                    <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'
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

          {/* Uploading Indicator */}
          {isUploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end pr-12">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-br-sm text-xs text-gray-500 flex items-center gap-2">
                <Loader className="w-3 h-3 animate-spin" /> Uploading image...
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto relative">

          {/* Emoji Picker Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-xl"
                ref={emojiPickerRef}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                  searchDisabled={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                disabled={chatStatus !== 'connected' || isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={chatStatus !== 'connected' || isUploading}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
                title="Upload Image"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-full transition-all ${showEmojiPicker ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                title="Insert Emoji"
              >
                <Smile className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={chatStatus === 'connected' ? "Type a message..." : "Type to start chat..."}
                className="w-full resize-none outline-none text-gray-800 placeholder-gray-500 bg-transparent max-h-32 min-h-[24px]"
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
              onClick={(e) => handleSendMessage(e)}
              disabled={(!newMessage.trim() && !isUploading)}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
            >
              {isUploading ? <Loader className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;