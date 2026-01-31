import React, { useState, useEffect, useRef } from 'react';
import {
  FiSearch, FiFilter, FiUser, FiClock, FiMessageSquare,
  FiX, FiSend, FiCheckCircle, FiRefreshCw, FiAlertCircle,
  FiFlag, FiBox, FiCheck, FiChevronRight, FiMaximize2, FiArrowLeft
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, addDoc, serverTimestamp, getDoc, limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'assigned', 'all'
  const [sendingMessage, setSendingMessage] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch tickets based on tab
  useEffect(() => {
    if (!user?.uid) return;

    let ticketsQuery;
    if (activeTab === 'pending') {
      ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
    } else if (activeTab === 'assigned') {
      ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('assignedAgent', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      // 'all' tab now shows Pending tickets (available to claim) AND My Assigned tickets
      // Complex OR queries are hard in Firestore, so we'll fetch PENDING tickets for now in 'all' view
      // effectively making 'all' similar to 'pending' but perhaps with a different sorting or limit.
      // Alternatively, we can just show global pending stream.
      ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      toast.error('Protocol breach in data fetch');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, activeTab]);

  // Fetch messages for selected ticket
  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'supportTickets', selectedTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })));
    });

    return () => unsubscribe();
  }, [selectedTicket?.id]);

  const handleAssignToMe = async (ticketId) => {
    if (!user?.uid) return;
    try {
      // Logic: Atomic update to claim the ticket
      // Check if already assigned (optional but good for safety)
      const ticketRef = doc(db, 'supportTickets', ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists() && ticketSnap.data().assignedAgent) {
        toast.error("Ticket already intercepted by another agent.");
        return;
      }

      await updateDoc(ticketRef, {
        assignedAgent: user.uid,
        agentName: user.displayName || user.email,
        status: 'accepted',
        updatedAt: serverTimestamp(),
        // Add a specialized field to track when it was claimed
        claimedAt: serverTimestamp()
      });
      toast.success('Ticket accepted');
      // We automatically select it to open details
      setSelectedTicket({ ...ticketSnap.data(), id: ticketId, status: 'accepted', assignedAgent: user.uid });
    } catch (err) {
      console.error(err);
      toast.error('Assignment failed');
    }
  };

  const handleConfirmAssignment = async (ticketId) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: 'assigned',
        updatedAt: serverTimestamp()
      });
      toast.success('Ticket officially assigned');
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm assignment');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Status update failed');
    }
  };

  const handleSolveTicket = async (ticketId) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: 'solved',
        updatedAt: serverTimestamp(),
        solvedAt: serverTimestamp()
      });
      toast.success('Ticket solved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to solve ticket');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'supportTickets', selectedTicket.id, 'messages'), {
        content: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderType: 'agent',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        updatedAt: serverTimestamp(),
        lastMessage: newMessage
      });

      // Notify the user
      if (selectedTicket.userId) {
        try {
          await addDoc(collection(db, 'notifications'), {
            uid: selectedTicket.userId,
            type: 'support',
            title: 'Support Update',
            message: `Support Agent replied to your ticket #${selectedTicket.id.slice(-6)}: "${newMessage.substring(0, 30)}${newMessage.length > 30 ? '...' : ''}"`,
            ticketId: selectedTicket.id,
            createdAt: serverTimestamp(),
            isRead: false
          });
        } catch (noteErr) {
          console.error("Failed to send notification", noteErr);
          // Don't block the message flow if notification fails
        }
      }

      setNewMessage('');
    } catch (err) {
      toast.error('Transmission failed');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-950/20 lg:rounded-[2.5rem] rounded-xl overflow-hidden border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar: Ticket List */}
        <div className={`w-full lg:w-96 border-r border-slate-800 flex-col bg-slate-900/40 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-800 space-y-4">
            <h1 className="text-2xl font-black text-white px-1 tracking-tight">Support Node</h1>
            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {['pending', 'assigned', 'all'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticket stream..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredTickets.map(ticket => (
                <motion.div
                  layout
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (ticket.assignedAgent === user.uid) {
                      setSelectedTicket(ticket);
                    }
                  }}
                  className={`p-5 border-b border-slate-800/50 transition-all relative group ${selectedTicket?.id === ticket.id ? 'bg-blue-600/10 border-l-4 border-l-blue-600' : 'hover:bg-slate-800/30'} ${!ticket.assignedAgent ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter font-mono">#{ticket.id.slice(-6)}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      ticket.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                      {ticket.priority || 'medium'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 truncate pr-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{ticket.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.lastMessage || ticket.description}</p>
                  <div className="flex items-center gap-3 mt-3 justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ticket.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                        ticket.status === 'in-progress' ? 'bg-blue-500' :
                          ticket.status === 'solved' ? 'bg-emerald-500' :
                            'bg-slate-600'
                        }`}></div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{ticket.status}</span>
                    </div>

                    {!ticket.assignedAgent && ticket.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToMe(ticket.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/40 z-10"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredTickets.length === 0 && !loading && (
              <div className="py-20 text-center opacity-20">
                <FiBox className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Buffer Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Ticket View */}
        <div className={`flex-1 flex-col bg-slate-950/40 relative ${selectedTicket ? 'flex' : 'hidden lg:flex'}`}>
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 lg:p-8 border-b border-slate-800 bg-slate-900/20 backdrop-blur-md sticky top-0 z-20">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-white mb-2"
                    >
                      <FiArrowLeft /> <span className="text-xs font-bold uppercase">Back</span>
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase leading-none">{selectedTicket.subject}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                      <span className="text-slate-500 flex items-center gap-1"><FiUser className="text-blue-500" /> {selectedTicket.userId}</span>
                      <span className="text-slate-500 flex items-center gap-1"><FiClock className="text-indigo-500" /> {selectedTicket.createdAt.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {selectedTicket.assignedAgent === user.uid && selectedTicket.status === 'accepted' && (
                      <button
                        onClick={() => handleConfirmAssignment(selectedTicket.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
                      >
                        Assign to Me
                      </button>
                    )}

                    {selectedTicket.assignedAgent === user.uid && selectedTicket.status !== 'accepted' && selectedTicket.status !== 'solved' && selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleSolveTicket(selectedTicket.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40"
                      >
                        Solve Ticket
                      </button>
                    )}
                    {selectedTicket.assignedAgent === user.uid && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                          className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat View */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar">
                {/* Initial Dossier */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] max-w-2xl mx-auto mb-8 shadow-inner"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FiFlag className="text-red-500 w-4 h-4" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Incident Report</span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">{selectedTicket.description}</p>
                </motion.div>

                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.senderType === 'agent' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] lg:max-w-[80%] ${msg.senderType === 'agent' ? 'flex flex-row-reverse' : 'flex'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${msg.senderType === 'agent' ? 'bg-blue-600/20 border-blue-600/30 ml-3' : 'bg-slate-800 border-slate-700 mr-3'
                        }`}>
                        {msg.senderType === 'agent' ? <FiUser className="w-4 h-4 text-blue-400" /> : <FiUser className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <div className={`p-4 rounded-[1.5rem] shadow-sm ${msg.senderType === 'agent'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}>
                          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        </div>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${msg.senderType === 'agent' ? 'text-right text-blue-500' : 'text-slate-600'}`}>
                          {msg.senderName} • {msg.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input Area */}
              {selectedTicket.assignedAgent === user.uid && selectedTicket.status !== 'closed' && (
                <div className="p-4 lg:p-8 bg-slate-900/40 border-t border-slate-800">
                  <form onSubmit={handleSendMessage} className="relative">
                    <div className="absolute inset-0 bg-blue-600/5 blur-xl pointer-events-none"></div>
                    <div className="relative flex gap-4 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner group focus-within:border-blue-500/50 transition-all">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Encrypted reply to user..."
                        className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2 text-sm placeholder:text-slate-700 font-medium w-full min-w-0"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-900/40 disabled:opacity-50 shrink-0"
                      >
                        {sendingMessage ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
              <FiMaximize2 className="w-24 h-24 mb-6 stroke-[1]" />
              <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Select Intercept</h2>
              <p className="text-sm font-bold uppercase tracking-widest mt-2">Awaiting target selection from the left stream</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;