import React, { useState, useEffect, useRef } from 'react';
import { 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { ChatService } from '../../services/chatService';

const Chat = ({ chatId, recipientId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient information
  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (recipientId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', recipientId));
          if (userDoc.exists()) {
            setRecipientInfo(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching recipient info:', error);
        }
      }
    };

    fetchRecipientInfo();
  }, [recipientId]);

  // Listen to real-time messages from Firestore
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = ChatService.subscribeToDirectMessages(chatId, (msgs) => {
      setMessages(msgs || []);
      setLoading(false);

      if (user?.uid) {
        ChatService.markDirectMessagesAsRead(chatId, user.uid);
      }
    });

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chatId || !user?.uid || sending) return;

    setSending(true);
    
    try {
      const result = await ChatService.sendDirectMessage({
        chatId,
        senderUid: user.uid,
        receiverUid: recipientId,
        message: newMessage.trim(),
        senderProfileImage: user.photoURL || ''
      });

      if (result?.success) setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            {recipientInfo?.name ? recipientInfo.name.charAt(0).toUpperCase() : 
             recipientInfo?.email ? recipientInfo.email.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {recipientInfo?.name || recipientInfo?.email || 'Chat'}
            </h3>
            <p className="text-blue-100 text-sm">
              {recipientInfo?.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: '400px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.uid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === user?.uid ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                  {message.senderId === user?.uid && (
                    <span className="ml-1">
                      {message.readStatus ? '✓✓' : '✓'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                Sending...
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;