import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Camera,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FirebaseChatService from '../../services/firebaseChat';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = ({ 
  isOpen, 
  onClose, 
  receiverId, 
  senderId,
  receiverName, 
  senderName,
  receiverAvatar,
  receiverPhone,
  receiverWhatsapp
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);
  const unsubscribeTypingRef = useRef(null);
  const unsubscribeUnreadRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat and subscribe to messages
  useEffect(() => {
    if (!isOpen || !receiverId || !senderId) return;

    const initializeChat = async () => {
      try {
        // Initialize chat document
        await FirebaseChatService.initializeChat(receiverId, senderId, receiverName, senderName);
        
        // Subscribe to messages
        unsubscribeMessagesRef.current = FirebaseChatService.subscribeToMessages(
          receiverId, 
          senderId, 
          (newMessages) => {
            setMessages(newMessages);
          }
        );

        // Subscribe to typing status
        unsubscribeTypingRef.current = FirebaseChatService.subscribeToTypingStatus(
          receiverId,
          senderId,
          receiverId === user?.uid ? senderId : receiverId,
          (typing) => {
            setOtherUserTyping(typing);
          }
        );

        // Subscribe to unread count
        unsubscribeUnreadRef.current = FirebaseChatService.subscribeToUnreadCount(
          receiverId,
          senderId,
          user?.uid,
          (count) => {
            setUnreadCount(count);
          }
        );

        // Mark messages as read when chat opens
        await FirebaseChatService.markMessagesAsRead(receiverId, senderId, user?.uid);

      } catch (error) {
        console.error('Error initializing chat:', error);
        toast.error('Failed to load chat');
      }
    };

    initializeChat();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
      }
      if (unsubscribeUnreadRef.current) {
        unsubscribeUnreadRef.current();
      }
    };
  }, [isOpen, receiverId, senderId, user?.uid, receiverName, senderName]);

  // Handle typing indicator
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (!user?.uid) return;

    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        FirebaseChatService.setTypingStatus(receiverId, senderId, user.uid, true);
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        FirebaseChatService.setTypingStatus(receiverId, senderId, user.uid, false);
      }, 2000);
    } else {
      setIsTyping(false);
      FirebaseChatService.setTypingStatus(receiverId, senderId, user.uid, false);
    }
  };

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || uploading) return;
    
    try {
      const result = await FirebaseChatService.sendMessage(
        receiverId,
        senderId,
        newMessage.trim(),
        'text'
      );
      
      if (result.success) {
        setNewMessage('');
        setShowEmojiPicker(false);
        // Clear typing status
        setIsTyping(false);
        FirebaseChatService.setTypingStatus(receiverId, senderId, user.uid, false);
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
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

    setUploading(true);
    setUploadProgress(0);

    try {
      const chatId = FirebaseChatService.getChatId(receiverId, senderId);
      const imageUrl = await FirebaseChatService.uploadImage(file, chatId);
      
      const result = await FirebaseChatService.sendMessage(
        receiverId,
        senderId,
        '📷 Image',
        'image',
        imageUrl
      );
      
      if (result.success) {
        toast.success('Image sent successfully');
      } else {
        toast.error('Failed to send image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen recently';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  // Get message status icon
  const getStatusIcon = (message) => {
    if (message.senderId !== user?.uid) return null;
    
    switch (message.status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[90vh] sm:h-[600px] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={onClose}
                className="p-1 hover:bg-green-700 rounded-full transition-colors sm:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white bg-opacity-20">
                  <img
                    src={receiverAvatar || '/images/default-avatar.png'}
                    alt={receiverName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{receiverName}</h3>
                <p className="text-xs text-green-100">
                  {otherUserTyping ? 'typing...' : (isOnline ? 'Online' : formatLastSeen(lastSeen))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {receiverPhone && (
                <a
                  href={`tel:${receiverPhone}`}
                  className="p-2 hover:bg-green-700 rounded-full transition-colors hidden sm:block"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-green-700 rounded-full transition-colors hidden sm:block"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 bg-opacity-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium">Start your conversation!</p>
                <p className="text-sm">Send a message to begin chatting</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user?.uid;
                const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2 mt-auto">
                        <img
                          src={receiverAvatar || '/images/default-avatar.png'}
                          alt={receiverName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/default-avatar.png';
                          }}
                        />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-green-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border'
                      } ${!isOwn && !showAvatar ? 'ml-10' : ''}`}
                    >
                      {message.type === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={message.imageUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.imageUrl, '_blank')}
                            loading="lazy"
                          />
                          <div className="flex items-center justify-between">
                            <p className={`text-xs ${
                              isOwn ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                            {isOwn && (
                              <div className="ml-2">
                                {getStatusIcon(message)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="break-words whitespace-pre-wrap">{message.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              isOwn ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                            {isOwn && (
                              <div className="ml-2">
                                {getStatusIcon(message)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {otherUserTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-2 ml-10">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={receiverAvatar || '/images/default-avatar.png'}
                        alt={receiverName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/default-avatar.png';
                        }}
                      />
                    </div>
                    <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm border">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 bg-blue-50 border-t"
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Uploading image...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-4 right-4 z-10"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width="100%"
                  height={300}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-20 min-h-[40px]"
                  disabled={uploading}
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!newMessage.trim() || uploading}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatWindow;