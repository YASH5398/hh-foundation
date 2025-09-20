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
  Clock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  where,
  limit
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import fcmService from '../../services/fcmService';

import { getProfileImageUrl } from '../../utils/profileUtils';

const ChatModal = ({ 
  isOpen, 
  onClose, 
  transactionId, 
  otherUserId, 
  otherUserName, 
  otherUserAvatar 
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time messages listener
  useEffect(() => {
    if (!isOpen || !transactionId) return;

    const messagesRef = collection(db, 'chats', transactionId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [isOpen, transactionId]);

  // Online status and typing indicators
  useEffect(() => {
    if (!isOpen || !user?.uid || !otherUserId) return;

    // Set current user as online
    const userStatusRef = doc(db, 'userStatus', user.uid);
    setDoc(userStatusRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      currentChat: transactionId
    }, { merge: true });

    // Listen to other user's status
    const otherUserStatusRef = doc(db, 'userStatus', otherUserId);
    const unsubscribe = onSnapshot(otherUserStatusRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsOnline(data.isOnline || false);
        setLastSeen(data.lastSeen?.toDate());
        setOtherUserTyping(data.isTyping && data.currentChat === transactionId);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      setDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        currentChat: null,
        isTyping: false
      }, { merge: true });
    };
  }, [isOpen, user?.uid, otherUserId, transactionId]);

  // Handle typing indicator
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (!user?.uid) return;

    const userStatusRef = doc(db, 'userStatus', user.uid);
    
    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        setDoc(userStatusRef, {
          isTyping: true,
          currentChat: transactionId
        }, { merge: true });
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setDoc(userStatusRef, {
          isTyping: false
        }, { merge: true });
      }, 2000);
    } else {
      setIsTyping(false);
      setDoc(userStatusRef, {
        isTyping: false
      }, { merge: true });
    }
  };



  // Send text message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid) return;

    try {
      const messagesRef = collection(db, 'chats', transactionId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        receiverId: otherUserId,
        message: newMessage.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
        read: false
      });

      setNewMessage('');
      
      // Clear typing status
      const userStatusRef = doc(db, 'userStatus', user.uid);
      setDoc(userStatusRef, {
        isTyping: false
      }, { merge: true });
      
      // Send push notification if other user is offline
      if (!isOnline) {
        try {
          await fcmService.sendNotificationToUser(otherUserId, {
            title: `New message from ${user.displayName || 'Someone'}`,
            body: newMessage.trim(),
            data: {
              type: 'chat_message',
              transactionId: transactionId,
              senderId: user.uid,
              senderName: user.displayName || 'Someone'
            }
          });
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
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

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for chat images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image is too large (max 10MB)');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-images/${transactionId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Progress can be shown here if needed
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      
      // Send image message
      const messagesRef = collection(db, 'chats', transactionId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        receiverId: otherUserId,
        message: downloadURL,
        type: 'image',
        createdAt: serverTimestamp(),
        read: false
      });

      // Send push notification if other user is offline
      if (!isOnline) {
        try {
          await fcmService.sendNotificationToUser(otherUserId, {
            title: `New image from ${user.displayName || 'Someone'}`,
            body: '📷 Image',
            data: {
              type: 'chat_message',
              transactionId: transactionId,
              senderId: user.uid,
              senderName: user.displayName || 'Someone'
            }
          });
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }

      toast.success('Image sent successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to send image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format last seen
  const formatLastSeen = (date) => {
    if (!date) return 'Last seen recently';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Last seen just now';
    if (minutes < 60) return `Last seen ${minutes}m ago`;
    if (hours < 24) return `Last seen ${hours}h ago`;
    if (days < 7) return `Last seen ${days}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  // Get message status icon
  const getMessageStatusIcon = (message) => {
    if (message.senderId !== user.uid) return null;
    
    if (message.read) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-700 rounded-full transition-colors sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <img
                  src={getProfileImageUrl({ profileImage: otherUserAvatar })}
                  alt={otherUserName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src = getProfileImageUrl(null);
                  }}
                />
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{otherUserName}</h3>
                <p className="text-xs text-green-100">
                  {isOnline ? 'Online' : formatLastSeen(lastSeen)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-green-700 rounded-full transition-colors hidden sm:block">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-green-700 rounded-full transition-colors hidden sm:block">
                <Video className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-green-700 rounded-full transition-colors hidden sm:block"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <p>Start your conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user.uid;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-green-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {message.type === 'image' ? (
                         <div className="space-y-2">
                           <img
                             src={message.message}
                             alt="Shared image"
                             className="rounded-lg max-w-full h-auto cursor-pointer"
                             onClick={() => window.open(message.message, '_blank')}
                           />
                           <p className={`text-xs ${
                             isOwn ? 'text-green-100' : 'text-gray-500'
                           }`}>
                             {formatTime(message.createdAt)}
                           </p>
                         </div>
                      ) : (
                        <div>
                          <p className="break-words">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            
            {/* Typing indicator */}
            {otherUserTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="px-4 py-2 bg-blue-50 border-t">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
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
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={uploading}
                />
              </div>
              
              <button
                type="submit"
                disabled={!newMessage.trim() || uploading}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ChatModal;