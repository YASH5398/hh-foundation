import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatList from './ChatList';
import Chat from './Chat';

const ChatApp = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleChatSelect = (chatId, userId) => {
    setSelectedChatId(chatId);
    setSelectedUserId(userId);
  };

  const handleCloseChat = () => {
    setSelectedChatId(null);
    setSelectedUserId(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Please log in to access chat</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <ChatList 
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChatId}
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedChatId && selectedUserId ? (
            <Chat
              chatId={selectedChatId}
              recipientId={selectedUserId}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;