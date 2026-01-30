import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSend, FiUser, FiUsers, FiMessageCircle, FiClock, FiSearch, FiMoreVertical, FiPaperclip, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAgentAuth } from '../../context/AgentAuthContext';

const AgentChat = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAgentAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const chatIdFromUrl = searchParams.get('chatId');

  useEffect(() => {
    const chatsQuery = query(collection(db, 'agentChats'), orderBy('startedAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);

      if (chatIdFromUrl && !selectedChat) {
        const chatToSelect = chatsData.find(chat => chat.id === chatIdFromUrl);
        if (chatToSelect) setSelectedChat(chatToSelect);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching chats:', error);
      toast.error('Sync failed');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatIdFromUrl, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      const messagesQuery = query(collection(db, 'agentChats', selectedChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(200));
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messagesData);
        scrollToBottom();
      });
      return () => unsubscribe();
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      const text = newMessage;
      setNewMessage('');
      await addDoc(collection(db, 'agentChats', selectedChat.id, 'messages'), {
        text,
        senderUid: currentUser?.uid,
        senderType: 'agent',
        senderName: currentUser?.displayName || 'Agent Support',
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'agentChats', selectedChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: 'agent'
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Message failed');
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(chat =>
    !searchTerm ||
    chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Decrypting Channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-1 overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex relative">

        {/* Sidebar */}
        <div className={`w-full lg:w-96 border-r border-slate-800/50 flex-col bg-slate-900/20 ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-800/50">
            <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search dossiers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {filteredChats.map(chat => (
              <motion.button
                layout
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-[1.5rem] transition-all flex items-center gap-4 ${selectedChat?.id === chat.id ? 'bg-blue-600/10 border border-blue-500/20 shadow-lg' : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner ${selectedChat?.id === chat.id ? 'bg-blue-600' : 'bg-slate-800'
                  }`}>
                  {chat.userName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-bold truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-slate-300'}`}>
                      {chat.userName || 'Anonymous'}
                    </p>
                    <span className="text-[10px] font-medium text-slate-500">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.lastMessage || 'Waiting for signal...'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex-col bg-slate-950/20 relative ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div
                key={selectedChat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="p-4 lg:p-6 border-b border-slate-800/50 flex items-center justify-between backdrop-blur-md bg-slate-900/10">
                  <div className="flex items-center gap-4">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shrink-0">
                      {selectedChat.userName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{selectedChat.userName}</h3>
                      <p className="text-xs text-slate-500 font-mono tracking-tighter truncate">{selectedChat.userEmail}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                    <FiMoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar">
                  {messages.map((msg, idx) => {
                    const isSelf = msg.senderType === 'agent';
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: isSelf ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id + idx}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-[1.5rem] p-4 shadow-xl ${isSelf
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                          }`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={`text-[10px] mt-2 font-medium ${isSelf ? 'text-blue-100/60' : 'text-slate-500'}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-6 border-t border-slate-800/50">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <button className="p-3 text-slate-500 hover:text-slate-300 rounded-xl transition-colors hidden sm:block">
                      <FiPaperclip className="w-5 h-5" />
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Secure message link..."
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none text-slate-200 py-2.5 text-sm resize-none placeholder:text-slate-600 px-2"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 opacity-50">
                  <div className="w-20 h-20 bg-slate-800/50 border border-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <FiMessageCircle className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Initialize Communication</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm">Select an active dossier from the left panel to establish a secure link.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;