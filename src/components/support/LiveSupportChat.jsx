import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiSend, FiMessageCircle, FiX, FiUser, FiUserPlus } from 'react-icons/fi';

const LiveSupportChat = ({ onClose }) => {
  const { user } = useAuth();
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [agentJoined, setAgentJoined] = useState(false);
  const [showAgentNotification, setShowAgentNotification] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Find or create chat room
  useEffect(() => {
    if (!user?.uid) return;

    const initializeChatRoom = async () => {
      try {
        // Check if chat room already exists for this user
        const chatRoomsQuery = query(
          collection(db, 'chatRooms'),
          where('participants', 'array-contains', user.uid)
        );
        
        const chatRoomsSnapshot = await getDocs(chatRoomsQuery);
        let existingChatRoom = null;
        
        // Find the most recent chat room for this user
        chatRoomsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!existingChatRoom || data.createdAt > existingChatRoom.createdAt) {
            existingChatRoom = { id: doc.id, ...data };
          }
        });

        if (existingChatRoom) {
          setChatRoom(existingChatRoom);
          // Check if agent has joined (more than 1 participant)
          setAgentJoined(existingChatRoom.participants.length > 1);
        } else {
          // Create new chat room with only user initially
          const newChatRoomRef = await addDoc(collection(db, 'chatRooms'), {
            participants: [user.uid],
            createdAt: serverTimestamp(),
            status: 'waiting',
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            userInfo: {
              uid: user.uid,
              name: user.fullName || user.name || 'User',
              email: user.email
            }
          });
          
          const newChatRoom = {
            id: newChatRoomRef.id,
            participants: [user.uid],
            status: 'waiting'
          };
          
          setChatRoom(newChatRoom);
          toast.success('Support request created! Waiting for agent...');
        }
      } catch (error) {
        console.error('Error initializing chat room:', error);
        toast.error('Failed to connect to support');
      } finally {
        setLoading(false);
      }
    };

    initializeChatRoom();
  }, [user]);

  // Listen to chat room changes (for agent joining)
  useEffect(() => {
    if (!chatRoom?.id) return;

    const unsubscribeChatRoom = onSnapshot(doc(db, 'chatRooms', chatRoom.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const updatedChatRoom = { id: doc.id, ...data };
        setChatRoom(updatedChatRoom);
        
        // Check if agent just joined
        const hasAgent = data.participants.length > 1;
        if (hasAgent && !agentJoined) {
          setAgentJoined(true);
          setShowAgentNotification(true);
          toast.success('Agent has joined the chat!');
          // Hide notification after 3 seconds
          setTimeout(() => setShowAgentNotification(false), 3000);
        }
      }
    });

    return () => unsubscribeChatRoom();
  }, [chatRoom?.id, agentJoined]);

  // Listen to messages in real-time
  useEffect(() => {
    if (!chatRoom?.id) return;

    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoom.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatRoom]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chatRoom?.id) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chatRooms', chatRoom.id, 'messages'), {
        senderUid: user.uid,
        senderName: user.fullName || user.name || 'User',
        text: messageText,
        timestamp: serverTimestamp()
      });

      // Update last message in chat room
      await updateDoc(doc(db, 'chatRooms', chatRoom.id), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Connecting to support...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Live Support</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="text-center text-gray-600">
            <FiMessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Unable to connect to support at this time.</p>
            <p className="text-sm mt-2">Please try again later or contact support directly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-[90vw] h-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FiMessageCircle className="text-blue-600 mr-2" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Live Support</h3>
              <p className="text-sm text-gray-500">
                {agentJoined ? 'Agent is online' : 'Waiting for agent...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Agent Joined Notification */}
        {showAgentNotification && (
          <div className="bg-green-100 border-l-4 border-green-500 p-3 mx-4 mt-2 rounded">
            <div className="flex items-center">
              <FiUserPlus className="text-green-600 mr-2" size={16} />
              <p className="text-green-700 text-sm font-medium">Agent has joined the conversation!</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <FiUser size={32} className="mx-auto mb-2 text-gray-400" />
              <p>Start a conversation with our support team</p>
              {!agentJoined && (
                <p className="text-xs mt-2 text-gray-400">Your request is in queue. An agent will join shortly.</p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderUid === user.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.senderUid === user.uid
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderUid === user.uid
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.senderName} • {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Sending...'}
                  </p>
                </div>
              </div>
            ))
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
              placeholder={agentJoined ? "Type your message..." : "Type your message (agent will see when they join)..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FiSend size={16} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveSupportChat;