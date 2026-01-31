import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiAlertTriangle, FiMessageCircle, FiFileText, FiUser,
    FiInfo, FiX, FiSend, FiArrowLeft, FiClock, FiCheckSquare,
    FiActivity, FiShield, FiHelpCircle, FiSearch, FiChevronRight, FiCheck
} from 'react-icons/fi';
import { auth, db } from '../../config/firebase';
import {
    doc, collection, addDoc, query, orderBy,
    onSnapshot, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- Sub-component: AI Chatbot (Embedded) ---
const IntegratedChatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

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
            const chatMessages = snapshot.docs.map(doc => ({
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
            // 1. Add User Message
            await addDoc(collection(db, 'chatbotChats', currentUser.uid, 'messages'), {
                senderUid: currentUser.uid,
                senderType: 'user',
                text,
                timestamp: serverTimestamp()
            });

            // 2. Call AI (Mocked for speed in this context, or use existing cloud function fetch)
            // For now, let's use the actual cloud function fetch to keep it real
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

            // 3. Add AI Message
            await addDoc(collection(db, 'chatbotChats', currentUser.uid, 'messages'), {
                senderUid: 'CHATBOT',
                senderType: 'agent',
                text: reply,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
            <div className="bg-slate-800 p-4 flex items-center gap-3">
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
                <div>
                    <h4 className="text-white font-bold text-sm">AI Support Assistant</h4>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active Resolution Mode</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.senderType === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-2xl flex gap-1">
                            <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                <div className="flex gap-2">
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your question..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-800 transition-all"
                    >
                        <FiSend className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Support Ticket Form ---
const IntegratedTicketForm = ({ onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        setIsSubmitting(true);

        try {
            const currentUser = auth.currentUser;
            await addDoc(collection(db, 'supportTickets'), {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                subject,
                message,
                status: 'open',
                priority: 'high',
                category: 'Account Blocked',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast.success("Ticket raised successfully! Our team will review it.");
            onClose();
        } catch (error) {
            toast.error("Failed to raise ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                <FiX className="w-6 h-6" />
            </button>
            <div className="mb-8">
                <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-4">
                    <FiFileText className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Raise Support Ticket</h3>
                <p className="text-slate-500 text-sm">Our agents will review your block status manually.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Subject</label>
                    <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g. Identity Verification / Technical Delay"
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        required
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Message</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Please provide details about your situation..."
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
                >
                    {isSubmitting ? <FiClock className="animate-spin" /> : <FiSend className="group-hover:translate-x-1 transition-transform" />}
                    Submit Ticket
                </button>
            </form>
        </div>
    );
};

const BlockedUserPopup = ({ user, blockedHelpRef }) => {
    const [view, setView] = useState('summary'); // 'summary', 'chatbot', 'ticket'

    if (!user?.isBlocked) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
                {view === 'summary' && (
                    <motion.div
                        key="summary"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        className="bg-slate-900 border-x border-b sm:border border-red-500/10 rounded-none sm:rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative min-h-screen sm:min-h-0"
                    >
                        {/* Ambient Background */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 blur-[120px] -z-10 rounded-full"></div>

                        <div className="p-6 sm:p-10 md:p-14 text-center">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-600/10 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-red-500/10">
                                <FiAlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 animate-pulse" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight uppercase">
                                Account <span className="text-red-500">Blocked</span>
                            </h2>

                            <div className="space-y-4 mb-8 sm:mb-10">
                                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed px-4 sm:px-0">
                                    Your account has been temporarily restricted for policy violations. To restore access, please follow the steps below.
                                </p>

                                <div className="bg-slate-950/50 rounded-2xl p-4 sm:p-6 border border-slate-800 w-full max-w-md mx-auto text-left">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FiActivity className="text-slate-500 w-4 h-4" />
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Security Analysis</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-slate-600 text-[10px] font-bold uppercase block mb-1">Violation Type</span>
                                            <span className="text-white text-sm font-semibold break-words leading-tight block">
                                                {user.blockReason || 'Manual Admin Suspension'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 gap-2">
                                            <div className="min-w-0">
                                                <span className="text-slate-600 text-[10px] font-bold uppercase block mb-0.5">Reference ID</span>
                                                <span className="text-slate-300 text-xs font-mono font-bold uppercase tracking-wider break-all">
                                                    {blockedHelpRef || 'SYS-LOCK-772'}
                                                </span>
                                            </div>
                                            <FiSearch className="text-slate-700 w-4 h-4 self-end sm:self-auto" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <button
                                    onClick={() => setView('chatbot')}
                                    className="group flex items-center sm:flex-col sm:items-center p-4 sm:p-6 bg-slate-950/50 border border-slate-800 rounded-2xl sm:rounded-3xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left sm:text-center gap-4 sm:gap-0"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <FiMessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-bold uppercase tracking-wider mb-0.5 truncate">AI Chatbot</span>
                                        <span className="text-[10px] text-slate-500">Instant Help</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setView('ticket')}
                                    className="group flex items-center sm:flex-col sm:items-center p-4 sm:p-6 bg-slate-950/50 border border-slate-800 rounded-2xl sm:rounded-3xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left sm:text-center gap-4 sm:gap-0"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-bold uppercase tracking-wider mb-0.5 truncate">Support Ticket</span>
                                        <span className="text-[10px] text-slate-500">Manual Review</span>
                                    </div>
                                </button>

                                <button
                                    className="group flex items-center sm:flex-col sm:items-center p-4 sm:p-6 bg-slate-950/50 border border-slate-800 rounded-2xl sm:rounded-3xl transition-all text-left sm:text-center opacity-60 cursor-not-allowed gap-4 sm:gap-0 sm:col-span-2 lg:col-span-1"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-4 flex-shrink-0">
                                        <FiUser className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-bold uppercase tracking-wider mb-0.5 truncate">Live Agent</span>
                                        <span className="text-[10px] text-slate-500">Offline</span>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-center gap-6 opacity-40">
                                <FiShield className="w-5 h-5 text-slate-400" />
                                <FiCheckSquare className="w-5 h-5 text-slate-400" />
                                <FiActivity className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'chatbot' && (
                    <motion.div
                        key="chatbot"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-2xl"
                    >
                        <IntegratedChatbot onClose={() => setView('summary')} />
                    </motion.div>
                )}

                {view === 'ticket' && (
                    <motion.div
                        key="ticket"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-md"
                    >
                        <IntegratedTicketForm onClose={() => setView('summary')} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BlockedUserPopup;
