import React, { useState, useEffect, useRef } from 'react';
import {
  FiMessageSquare, FiUsers, FiSearch, FiSend, FiUser, FiClock,
  FiCheck, FiCheckCircle, FiPhone, FiVideo, FiMoreVertical,
  FiX, FiPaperclip, FiSmile, FiRefreshCw, FiPlus, FiEdit3, FiMaximize2, FiCpu
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, addDoc, serverTimestamp, getDoc,
  limit, startAfter
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
import UserProfileView from '../../components/agent/UserProfileView';

const Communication = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [activeTab, setActiveTab] = useState('support'); // support, agent-chat, templates
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch support ticket conversations
  useEffect(() => {
    if (!user?.uid || activeTab !== 'support') return;

    const conversationsQuery = query(
      collection(db, 'supportTickets'),
      where('agentId', '==', user.uid),
      where('status', 'in', ['open', 'in-progress', 'pending']),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'support',
        lastMessageAt: doc.data().updatedAt?.toDate?.() || new Date(),
        participantName: doc.data().userName || 'Unknown User',
        participantId: doc.data().userId
      }));

      setConversations(conversationData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching support conversations:', error);
      toast.error('Telemetry uplink failure');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, activeTab]);

  // Fetch agent chat conversations
  useEffect(() => {
    if (!user?.uid || activeTab !== 'agent-chat') return;

    const conversationsQuery = query(
      collection(db, 'agentChats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationData = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find(p => p !== user.uid);

        return {
          id: doc.id,
          ...data,
          type: 'agent-chat',
          lastMessageAt: data.lastMessageAt?.toDate?.() || new Date(),
          participantName: data.participantNames?.[otherParticipant] || 'Unknown Agent',
          participantId: otherParticipant
        };
      });

      setConversations(conversationData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching agent conversations:', error);
      toast.error('Agent mesh sync failed');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, activeTab]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    let messagesQuery;

    if (selectedConversation.type === 'support') {
      messagesQuery = query(
        collection(db, 'supportTickets', selectedConversation.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
    } else {
      messagesQuery = query(
        collection(db, 'agentChats', selectedConversation.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      setMessages(messageData);
      scrollToBottom();
    }, (error) => {
      console.error('Error fetching messages:', error);
      toast.error('Packet loss in stream');
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);

      const messageData = {
        content: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderRole: 'agent',
        createdAt: serverTimestamp(),
        read: false
      };

      let collectionPath;
      if (selectedConversation.type === 'support') {
        collectionPath = `supportTickets/${selectedConversation.id}/messages`;
      } else {
        collectionPath = `agentChats/${selectedConversation.id}/messages`;
      }

      await addDoc(collection(db, collectionPath), messageData);

      const conversationPath = selectedConversation.type === 'support'
        ? `supportTickets/${selectedConversation.id}`
        : `agentChats/${selectedConversation.id}`;

      await updateDoc(doc(db, conversationPath), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Transmission failure');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Active';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return (
      conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 text-center">
        <FiCpu className="w-12 h-12 text-blue-500 animate-spin mx-auto opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Opening Comm Channels</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-950/20 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/40 ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-8 border-b border-slate-800 space-y-6">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Communications</h1>

            <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              {[
                { key: 'support', icon: FiMessageSquare },
                { key: 'agent-chat', icon: FiUsers },
                { key: 'templates', icon: FiEdit3 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedConversation(null);
                  }}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Find frequency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-700 outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredConversations.map(conv => (
                <motion.div
                  layout
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileChat(true);
                  }}
                  className={`p-6 cursor-pointer border-b border-white/5 transition-all relative group ${selectedConversation?.id === conv.id ? 'bg-blue-600/10 border-l-4 border-l-blue-600' : 'hover:bg-slate-800/20'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight truncate flex-1 pr-4">{conv.participantName}</h3>
                    <span className="text-[9px] font-black text-slate-500 font-mono">{formatTimestamp(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate lowercase">{conv.lastMessage || 'Channel established'}</p>
                  {conv.status && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${conv.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">{conv.status}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredConversations.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-4 stroke-[1]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Silence on bandwidth</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className={`flex-1 flex flex-col bg-slate-950/40 relative ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-8 border-b border-slate-800 bg-slate-900/20 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowMobileChat(false)} className="lg:hidden text-slate-500"><FiX /></button>
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                    <FiUser className="text-blue-500 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedConversation.participantName}</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Encrypted Connection
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedUserId(selectedConversation.participantId); setShowUserProfile(true); }} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><FiUser /></button>
                  <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><FiMoreVertical /></button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.senderId === user.uid ? 'flex flex-row-reverse' : 'flex'}`}>
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${msg.senderId === user.uid ? 'bg-blue-600/20 border-blue-600/30 ml-3' : 'bg-slate-800 border-slate-700 mr-3'
                        }`}>
                        <FiUser className={`w-4 h-4 ${msg.senderId === user.uid ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className={`p-4 rounded-[1.5rem] ${msg.senderId === user.uid
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}>
                          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        </div>
                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 font-mono ${msg.senderId === user.uid ? 'text-right text-blue-500' : 'text-slate-600'}`}>
                          {msg.senderName} • {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.senderId === user.uid && (msg.read ? ' • SYNCED' : ' • SENT')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-8 bg-slate-900/40 border-t border-slate-800">
                <div className="relative flex gap-4 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner group focus-within:border-blue-500/50 transition-all">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Broadcast message..."
                    className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2 text-sm placeholder:text-slate-700 font-medium resize-none"
                    rows={1}
                  />
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-500 hover:text-white transition-all"><FiPaperclip /></button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-900/40 disabled:opacity-50"
                    >
                      {sendingMessage ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
              <FiMaximize2 className="w-24 h-24 mb-6 stroke-[1]" />
              <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Select Vector</h2>
              <p className="text-sm font-bold uppercase tracking-widest mt-2 text-white">Awaiting signal from communications stream</p>
            </div>
          )}
        </div>
      </div>

      {showUserProfile && selectedUserId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-3xl"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">User Dossier</h3>
              <button
                onClick={() => { setShowUserProfile(false); setSelectedUserId(null); }}
                className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:text-white transition-all"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <UserProfileView userId={selectedUserId} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Communication;