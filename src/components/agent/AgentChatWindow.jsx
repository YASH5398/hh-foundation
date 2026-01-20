import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiSend, FiArrowLeft, FiUser, FiX, FiRefreshCw } from 'react-icons/fi';

const AgentChatWindow = ({ ticket, onClose, agent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages in real-time
  useEffect(() => {
    if (!ticket?.id) return;

    const messagesQuery = query(
      collection(db, 'supportTickets', ticket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
      setLoadingMessages(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [ticket?.id]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'supportTickets', ticket.id, 'messages'), {
        senderUid: agent.uid || agent.id,
        senderType: 'agent',
        senderName: agent.fullName || agent.name || 'Agent',
        text: messageText,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Close chat
  const handleCloseChat = async () => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticket.id), {
        status: 'closed',
        closedAt: serverTimestamp(),
        closedBy: agent.uid || agent.id
      });

      // Add system message
      await addDoc(collection(db, 'supportTickets', ticket.id, 'messages'), {
        senderUid: 'system',
        senderType: 'system',
        text: `Chat closed by agent ${agent.fullName || agent.name || 'Agent'}.`,
        timestamp: serverTimestamp()
      });

      toast.success('Chat closed successfully');
      onClose();
    } catch (error) {
      console.error('Error closing chat:', error);
      toast.error('Failed to close chat');
    }
  };

  // Reopen chat
  const handleReopenChat = async () => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticket.id), {
        status: 'in-progress',
        reopenedAt: serverTimestamp(),
        reopenedBy: agent.uid || agent.id
      });

      // Add system message
      await addDoc(collection(db, 'supportTickets', ticket.id, 'messages'), {
        senderUid: 'system',
        senderType: 'system',
        text: `Chat reopened by agent ${agent.fullName || agent.name || 'Agent'}.`,
        timestamp: serverTimestamp()
      });

      toast.success('Chat reopened successfully');
    } catch (error) {
      console.error('Error reopening chat:', error);
      toast.error('Failed to reopen chat');
    }
  };

  const getMessageStyle = (message) => {
    switch (message.senderType) {
      case 'agent':
        return 'bg-blue-600 text-white ml-auto';
      case 'user':
        return 'bg-gray-200 text-gray-800 mr-auto';
      case 'system':
        return 'bg-yellow-100 text-yellow-800 mx-auto text-center';
      default:
        return 'bg-gray-200 text-gray-800 mr-auto';
    }
  };

  const getSenderLabel = (message) => {
    switch (message.senderType) {
      case 'agent':
        return 'You';
      case 'user':
        return ticket.userName || 'User';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="flex items-center space-x-2">
            <FiUser className="text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900">
                {ticket.userName || 'Anonymous User'}
              </h3>
              <p className="text-sm text-gray-500">
                {ticket.subject || 'Support Chat'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            ticket.status === 'in-progress' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {ticket.status === 'in-progress' ? '🟢 Active' : '⚫ Closed'}
          </span>
          
          {ticket.status === 'in-progress' ? (
            <button
              onClick={handleCloseChat}
              className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Close Chat"
            >
              <FiX />
            </button>
          ) : (
            <button
              onClick={handleReopenChat}
              className="text-green-600 hover:text-green-700 transition-colors p-2 rounded-lg hover:bg-green-50"
              title="Reopen Chat"
            >
              <FiRefreshCw />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-1">
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle(message)}`}>
                <p className="text-sm">{message.text}</p>
              </div>
              <div className={`text-xs text-gray-500 ${
                message.senderType === 'agent' ? 'text-right' : 
                message.senderType === 'system' ? 'text-center' : 'text-left'
              }`}>
                {getSenderLabel(message)} • {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {ticket.status === 'in-progress' && (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <FiSend />
              )}
            </button>
          </div>
        </form>
      )}
      
      {ticket.status === 'closed' && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-center text-gray-600 text-sm">
            This chat has been closed. Click the reopen button to continue the conversation.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentChatWindow;