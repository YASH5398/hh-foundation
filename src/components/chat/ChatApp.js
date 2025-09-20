import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import messagingService from '../../config/firebase-messaging';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import Chat from './Chat';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const ChatApp = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Initialize chat notifications hook
  useChatNotifications();

  // Initialize FCM when component mounts
  useEffect(() => {
    if (user?.uid) {
      initializeFCMForUser();
    }
  }, [user]);

  // Listen for service worker messages (navigation from notifications)
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      const { data } = event;
      
      if (data.type === 'NAVIGATE_TO_CHAT' && data.chatId) {
        setChatId(data.chatId);
        setShowChat(true);
      }
      
      if (data.type === 'MARK_MESSAGE_READ' && data.chatId) {
        // Handle marking message as read
        console.log('Mark message as read:', data);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const initializeFCMForUser = async () => {
    try {
      const token = await messagingService.requestPermission();
      if (token) {
        await messagingService.storeTokenInFirestore(user.uid, token);
        messagingService.onForegroundMessage(handleForegroundMessage);
        setFcmToken(token);
        console.log('FCM initialized for user:', user.uid, 'Token:', token);
      }
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
    }
  };

  const handleForegroundMessage = (payload) => {
    console.log('Foreground message received in ChatApp:', payload);
    
    // Handle foreground message (could update UI, show toast, etc.)
    const { data } = payload;
    
    if (data?.type === 'chat_message' && data.chatId) {
      // If chat is not currently open, show notification
      if (chatId !== data.chatId) {
        // Could show a toast notification or update UI
        console.log('New message in different chat:', data);
      }
    }
  };

  const startChat = async (targetUserId) => {
    if (!user?.uid || !targetUserId) return;

    try {
      // Create or get existing chat ID
      const participants = [user.uid, targetUserId].sort();
      const generatedChatId = participants.join('_');
      
      // Create chat document if it doesn't exist
      const chatRef = doc(db, 'chats', generatedChatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: participants,
          createdAt: new Date(),
          createdBy: user.uid,
          lastMessage: '',
          lastMessageTime: null,
          lastMessageSender: null
        });
      }
      
      setChatId(generatedChatId);
      setRecipientId(targetUserId);
      setShowChat(true);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  // Mock function to get available users (replace with actual user fetching)
  const fetchAvailableUsers = async () => {
    // This would typically fetch from Firestore users collection
    // For demo purposes, using mock data
    const mockUsers = [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'admin', name: 'Admin User', email: 'admin@hhfoundation.com' }
    ];
    
    // Filter out current user
    const filtered = mockUsers.filter(u => u.id !== user?.uid);
    setAvailableUsers(filtered);
  };

  useEffect(() => {
    if (user?.uid) {
      fetchAvailableUsers();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to use chat</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">HH Foundation Chat</h1>
          <p className="text-blue-100 mt-1">
            Real-time messaging with push notifications
          </p>
          {fcmToken && (
            <p className="text-xs text-blue-200 mt-2">
              ✓ Push notifications enabled
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!showChat ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Start a Conversation</h2>
              
              {availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading available users...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableUsers.map((availableUser) => (
                    <div
                      key={availableUser.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                          {availableUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium">{availableUser.name}</h3>
                          <p className="text-sm text-gray-500">{availableUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => startChat(availableUser.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Chat</h2>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
                >
                  ← Back to Contacts
                </button>
              </div>
              
              <Chat
                currentUserId={user.uid}
                chatId={chatId}
                recipientId={recipientId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;