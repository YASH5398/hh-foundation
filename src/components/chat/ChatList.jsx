import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const ChatList = ({ onChatSelect, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState({});

  // Fetch user info and cache it
  const getUserInfo = async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }

    return { name: 'Unknown User', email: '' };
  };

  // Fetch user's chats
  const fetchChats = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`http://localhost:3001/api/user/${user.uid}/chats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const result = await response.json();
      
      if (result.success) {
        // Fetch user info for each chat
        const chatsWithUserInfo = await Promise.all(
          result.chats.map(async (chat) => {
            const otherUserInfo = await getUserInfo(chat.otherParticipantId);
            return {
              ...chat,
              otherUserInfo
            };
          })
        );
        
        setChats(chatsWithUserInfo);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Refresh chats every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    
    return () => clearInterval(interval);
  }, [user?.uid]);

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
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading chats...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => onChatSelect(chat.chatId, chat.otherParticipantId)}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedChatId === chat.chatId ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {chat.otherUserInfo?.name 
                    ? chat.otherUserInfo.name.charAt(0).toUpperCase()
                    : chat.otherUserInfo?.email 
                    ? chat.otherUserInfo.email.charAt(0).toUpperCase()
                    : '?'
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {chat.otherUserInfo?.name || chat.otherUserInfo?.email || 'Unknown User'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastSenderId === user?.uid ? 'You: ' : ''}
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
      return FirebaseChatService.subscribeToUnreadCount(
        otherUserId,
        user.uid,
        user.uid,
        (count) => {
          setUnreadCounts(prev => ({
            ...prev,
            [chat.id]: count
          }));
        }
      );
    });

    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user?.uid, chats]);

  // Filter and search chats
  useEffect(() => {
    let filtered = [...chats];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat =>
        chat.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(chat => unreadCounts[chat.id] > 0);
        break;
      case 'recent':
        filtered = filtered.filter(chat => {
          const lastMessageTime = chat.lastMessage?.timestamp;
          if (!lastMessageTime) return false;
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(lastMessageTime) > dayAgo;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Sort by last message timestamp
    filtered.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return new Date(bTime) - new Date(aTime);
    });

    setFilteredChats(filtered);
  }, [chats, searchQuery, filter, unreadCounts]);

  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get message status icon
  const getStatusIcon = (message) => {
    if (!message || message.senderId !== user?.uid) return null;
    
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

  // Handle chat selection
  const handleChatSelect = (chat) => {
    const otherUserId = chat.participants.find(p => p !== user.uid);
    setSelectedChat({
      receiverId: otherUserId,
      senderId: user.uid,
      receiverName: chat.otherUserName,
      senderName: user?.name || user?.displayName,
      receiverAvatar: chat.otherUserAvatar,
      receiverPhone: chat.otherUserPhone,
      receiverWhatsapp: chat.otherUserWhatsapp
    });
  };

  // Handle chat close
  const handleChatClose = () => {
    setSelectedChat(null);
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Chats</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-blue-600 bg-opacity-50 text-white placeholder-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-opacity-70"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-3">
              {[
                { key: 'all', label: 'All', icon: MessageCircle },
                { key: 'unread', label: 'Unread', icon: Users },
                { key: 'recent', label: 'Recent', icon: Clock }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-600 bg-opacity-50 text-blue-100 hover:bg-opacity-70'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                  {key === 'unread' && Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                      {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No chats found' : 'No chats yet'}
                </h3>
                <p className="text-sm text-center">
                  {searchQuery 
                    ? 'Try searching with a different name'
                    : 'Start a conversation from the Send Help section'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredChats.map((chat) => {
                  const unreadCount = unreadCounts[chat.id] || 0;
                  const lastMessage = chat.lastMessage;
                  
                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleChatSelect(chat)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                            <img
                              src={chat.otherUserAvatar || '/images/default-avatar.png'}
                              alt={chat.otherUserName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/images/default-avatar.png';
                              }}
                            />
                          </div>
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-medium truncate ${
                              unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {chat.otherUserName || 'Unknown User'}
                            </h3>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(lastMessage)}
                              <span className="text-xs text-gray-500">
                                {formatTime(lastMessage?.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                            }`}>
                              {lastMessage?.type === 'image' ? '📷 Image' : lastMessage?.message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Selected Chat Window */}
      {selectedChat && (
        <ChatWindow
          isOpen={true}
          onClose={handleChatClose}
          receiverId={selectedChat.receiverId}
          senderId={selectedChat.senderId}
          receiverName={selectedChat.receiverName}
          senderName={selectedChat.senderName}
          receiverAvatar={selectedChat.receiverAvatar}
          receiverPhone={selectedChat.receiverPhone}
          receiverWhatsapp={selectedChat.receiverWhatsapp}
        />
      )}
    </AnimatePresence>
  );
};

export default ChatList;