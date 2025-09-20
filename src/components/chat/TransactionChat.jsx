import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X, User } from 'lucide-react';
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
    unsubscribeRef.current = ChatService.subscribeToMessages(
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
      const result = await ChatService.sendMessage(
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                <img
                  src={otherUser?.profileImage || '/images/default-avatar.png'}
                  alt={otherUser?.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {otherUser?.name || 'User'}
                </h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.senderId === user?.uid;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-indigo-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionChat;