import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, AlertTriangle, MessageCircle, Ticket, ExternalLink, LogOut, MessageSquare, Headset, Send, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createSupportTicket } from '../../services/supportService';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// --- Sub-component: AI Chatbot (Embedded) ---
const IntegratedChatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = collection(db, 'chatbotChats', currentUser.uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    const text = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const currentUser = auth.currentUser;
      await addDoc(collection(db, 'chatbotChats', currentUser.uid, 'messages'), {
        senderUid: currentUser.uid,
        senderType: 'user',
        text,
        timestamp: serverTimestamp()
      });

      const token = await currentUser.getIdToken(true);
      const response = await fetch(
        'https://us-central1-hh-foundation.cloudfunctions.net/handleChatbotMessage',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        }
      );

      const data = await response.json().catch(() => ({}));
      const reply = data.reply || "I'm processing your request. One moment...";

      await addDoc(collection(db, 'chatbotChats', currentUser.uid, 'messages'), {
        senderUid: 'CHATBOT',
        senderType: 'agent',
        text: reply,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error(String(error));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
      <div className="bg-blue-600 p-4 flex items-center gap-3">
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">🤖</div>
        <div>
          <h4 className="text-white font-bold text-sm">AI Support Assistant</h4>
          <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Instant Resolution</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.senderType === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-100 text-gray-700 shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl flex gap-1 shadow-sm border border-gray-100">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your question..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-200 transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Support Ticket Form ---
const IntegratedTicketForm = ({ onClose, userData, blockReason, formatBlockTime, blockedAt }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const ticketData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || userData?.fullName,
        subject,
        message: `${message}\n\n--- Block Context ---\nReason: ${blockReason}\nBlocked At: ${formatBlockTime(blockedAt)}\nUser ID: ${userData?.userId}`,
        status: 'open',
        priority: 'high',
        category: 'Account Blocked',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'supportTickets'), ticketData);
      toast.success("Ticket raised successfully! Our team will review it.");
      onClose();
    } catch (error) {
      toast.error("Failed to raise ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">
        <X className="w-6 h-6" />
      </button>
      <div className="mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Ticket className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Raise Support Ticket</h3>
        <p className="text-gray-500 text-sm">Our agents will review your block status manually.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Identity Verification Request"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            required />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details about your situation..."
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all resize-none"
            required />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg active:scale-95 disabled:bg-gray-200"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="group-hover:translate-x-1 transition-transform w-5 h-5" />}
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

const BlockScreen = (props) => {
  // Try to get from context, but allow props override for isolated rendering
  // If rendered in isolation (hard block), useAuth will be undefined/null
  let context = {};
  try {
    context = useAuth() || {};
  } catch (e) {
    context = {};
  }

  const user = props.user || context.user;
  const userProfile = props.userProfile || context.userProfile;
  const blockReason = props.blockReason || context.blockReason || userProfile?.blockReason || userProfile?.blockedReason;
  const blockedAt = props.blockedAt || context.blockedAt || userProfile?.blockedAt;
  const logout = context.logout;

  // Use state for view switching (allowed as per 'No state loops', but 'No useEffect')
  const [view, setView] = useState('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getReadableReason = (reason) => {
    const mapping = {
      'send_help_timeout': 'Payment deadline missed',
      'not_activated': 'Account not activated',
      'manual_admin_block': 'Blocked by administrator'
    };
    return mapping[reason] || reason;
  };

  const handleLogout = async () => {
    try {
      console.log("BlockScreen: Logging out...");
      await auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.reload();
    }
  };

  const formatBlockTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleChatSupport = () => {
    // Lead to WhatsApp or support page as "AI Agent / Human Support"
    window.open("https://wa.me/91XXXXXXXXXX", "_blank"); // Replace with actual support contact
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {view === 'summary' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            {/* Header Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-10 py-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                  <Shield className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Account Blocked</h1>
                <p className="text-red-100 font-medium">Access to platform restricted</p>
              </div>

              <div className="px-10 py-10">
                {/* Main Warning */}
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest mb-6 border border-red-100">
                    <AlertTriangle className="w-4 h-4" />
                    Security Restriction Active
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">
                    Your account is <span className="text-red-600">Locked</span>
                  </h2>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md mx-auto">
                    {getReadableReason(blockReason)}
                  </p>
                  {userProfile?.userId && (
                    <div className="mt-4 inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <p className="text-slate-500 text-xs font-mono font-bold">
                        User ID: {userProfile.userId}
                      </p>
                    </div>
                  )}
                </div>

                {/* Support Features Grid */}
                {!props.isHardBlock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => setView('chatbot')}
                      className="group flex flex-col items-center justify-center p-8 bg-blue-50/50 border border-blue-100 rounded-3xl hover:bg-blue-50 transition-all active:scale-95"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-blue-900 font-bold uppercase tracking-widest text-xs">AI Chatbot</span>
                      <span className="text-blue-600/60 text-[10px] font-bold mt-1">Instant Help</span>
                    </button>

                    <button
                      onClick={handleChatSupport}
                      className="group flex flex-col items-center justify-center p-8 bg-green-50/50 border border-green-100 rounded-3xl hover:bg-green-50 transition-all active:scale-95"
                    >
                      <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">
                        <Headset className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-green-900 font-bold uppercase tracking-widest text-xs">AI Agent</span>
                      <span className="text-green-600/60 text-[10px] font-bold mt-1">Human Support</span>
                    </button>

                    <button
                      onClick={() => setView('ticket')}
                      className="group flex flex-col items-center justify-center p-8 bg-amber-50/50 border border-amber-100 rounded-3xl hover:bg-amber-50 transition-all active:scale-95 md:col-span-2"
                    >
                      <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                        <Ticket className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-amber-900 font-bold uppercase tracking-widest text-xs">Raise Support Ticket</span>
                      <span className="text-amber-600/60 text-[10px] font-bold mt-1">Manual Review By Team</span>
                    </button>
                  </div>
                )}

                {/* Manual Contact (Shown in Hard Block as fallback for Chat) */}
                {props.isHardBlock && (
                  <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center">
                    <p className="text-sm text-slate-600 mb-4">Support features are restricted. Please contact your administrator or use the manual support line.</p>
                    <button
                      onClick={handleChatSupport}
                      className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                    >
                      <Headset className="w-4 h-4" />
                      Contact WhatsApp Support
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                >
                  <LogOut className="w-5 h-5" />
                  Logout from Account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!props.isHardBlock && view === 'chatbot' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center">
            <IntegratedChatbot onClose={() => setView('summary')} />
          </motion.div>
        )}

        {!props.isHardBlock && view === 'ticket' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center">
            <IntegratedTicketForm
              onClose={() => setView('summary')}
              userData={userProfile}
              blockReason={getReadableReason(blockReason)}
              formatBlockTime={formatBlockTime}
              blockedAt={blockedAt}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlockScreen;