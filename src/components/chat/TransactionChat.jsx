import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X, User, ArrowLeft, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatService } from '../../services/chatService';
import { UnreadMessageService } from '../../services/unreadMessageService';
import { toast } from 'react-hot-toast';

const TransactionChat = ({ 
  transactionType, 
  transactionId, 
  otherUser, 
  isOpen, 
  onClose 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to messages when component mounts or transaction changes
  useEffect(() => {
    if (!transactionId || !transactionType) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to messages
    unsubscribeRef.current = ChatService.subscribeToTransactionMessages(
      transactionType,
      transactionId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [transactionType, transactionId]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && transactionId && transactionType && user?.uid) {
      const markAsRead = async () => {
        await UnreadMessageService.markMessagesAsRead(
          transactionType,
          transactionId,
          user.uid
        );
      };
      markAsRead();
    }
  }, [isOpen, transactionId, transactionType, user?.uid]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    
    try {
      const result = await ChatService.sendTransactionMessage(
        transactionType,
        transactionId,
        user.uid,
        newMessage
      );
      
      if (result.success) {
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  // Helper function to get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full h-full md:h-[600px] md:max-w-md md:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* WhatsApp-style Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white relative">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded-full transition-colors mr-2 md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Profile Section */}
            <div className="flex items-center flex-1 min-w-0">
              {/* Profile Avatar */}
              <div className="relative mr-3">
                {otherUser?.profileImage ? (
                  <img
                    src={otherUser.profileImage}
                    alt={otherUser?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#128C7E] border-2 border-white/30 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {getUserInitials(otherUser?.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate text-base">
                  {otherUser?.name || 'Unknown User'}
                </h3>
                <p className="text-xs text-green-100 truncate">
                  ID: {otherUser?.id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Menu Button */}
            <button className="p-2 hover:bg-black/20 rounded-full transition-colors ml-2">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* WhatsApp-style Messages Area */}
          <div className="flex-1 overflow-y-auto bg-[#E5DDD5] relative">
            {/* WhatsApp background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M13 18c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2s-2-.895-2-2v-2c0-1.105.895-2 2-2zM13 6c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2s-2-.895-2-2V8c0-1.105.895-2 2-2zM6 13c0-1.105-.895-2-2-2s-2 .895-2 2  .895 2 2 2 2-.895 2-2zm14 0c0-1.105-.895-2-2-2s-2 .895-2 2 .895 2 2 2 2-.895 2-2zM8.5 8.5c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm9 0c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm-9 9c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm9 0c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '26px 26px'
              }} />
            </div>

            <div className="relative z-10 p-4 pb-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-[#DCF8C6] rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-[#25D366]" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No messages yet</p>
                  <p className="text-gray-500 text-sm">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.uid;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                          <div
                            className={`px-3 py-2 rounded-lg shadow-sm ${
                              isOwnMessage
                                ? 'bg-[#DCF8C6] text-gray-800 rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {message.text}
                            </p>
                          </div>
                          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                            <span className="text-xs text-gray-500 px-1">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* WhatsApp-style Input Area */}
          <div className="bg-[#F0F0F0] border-t border-gray-300 px-4 py-3">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent text-gray-800 placeholder-gray-500 resize-none"
                  disabled={sending}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                  newMessage.trim() && !sending
                    ? 'bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionChat;