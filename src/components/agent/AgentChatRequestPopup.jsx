import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiUser, FiX, FiCheck, FiClock, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AgentChatRequestPopup = ({ request, onClose, currentAgent }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!request || !currentAgent) return;
    setIsAccepting(true);
    try {
      // 1. Fetch Agent Profile Details (for name & photo)
      let agentName = currentAgent.displayName || currentAgent.email;
      let agentPhoto = currentAgent.photoURL || null;

      try {
        const agentDocRef = doc(db, 'users', currentAgent.uid);
        const agentDocSnap = await getDoc(agentDocRef);
        if (agentDocSnap.exists()) {
          const agentData = agentDocSnap.data();
          // Prefer fullName, then displayName, then name, then email
          agentName = agentData.fullName || agentData.displayName || agentData.name || agentName;
          agentPhoto = agentData.photoURL || agentData.profileImage || agentPhoto;
        }
      } catch (err) {
        console.warn('Failed to fetch full agent profile, using auth defaults', err);
      }

      // 2. Update Request Status
      const requestRef = doc(db, 'agentChatRequests', request.id);
      await updateDoc(requestRef, {
        status: 'accepted',
        assignedAgentId: currentAgent.uid,
        assignedAgentName: agentName,
        assignedAgentPhoto: agentPhoto, // Store photo for user side
        acceptedAt: serverTimestamp()
      });

      // 3. Create Chat Room
      const chatRoomRef = doc(db, 'agentChats', request.id);
      await setDoc(chatRoomRef, {
        requestId: request.id,
        userId: request.userId,
        userName: request.userName,
        agentId: currentAgent.uid,
        agentName: agentName,
        agentPhoto: agentPhoto,
        status: 'active',
        createdAt: serverTimestamp(),
        startedAt: serverTimestamp()
      });

      // 4. Send Initial Message (Personalized)
      await addDoc(collection(db, 'agentChats', request.id, 'messages'), {
        senderUid: currentAgent.uid,
        senderType: 'agent',
        senderName: agentName,
        senderPhoto: agentPhoto,
        text: `Hi ${request.userName}! I'm ${agentName}. How can I help you today?`,
        timestamp: serverTimestamp()
      });

      toast.success('Channel Established');
      onClose();
      navigate(`/agent-dashboard/agent-chat?chatId=${request.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Sync failed');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-800/80 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <FiMessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Incoming Link</h3>
                <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">Real-time Support</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiUser className="w-4 h-4" />
                </div>
                <h4 className="font-bold">{request.userName || 'Anonymous User'}</h4>
              </div>
              <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 shadow-inner">
                <p className="text-blue-100/60 text-[10px] font-bold uppercase mb-2">Subject</p>
                <p className="text-white text-sm font-medium leading-relaxed italic">"{request.firstMessage || 'No initial message provided'}"</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-8 space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 transition-all"
            >
              {isAccepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  <span>Accept Channel</span>
                </>
              )}
            </motion.button>

            <button
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white py-4 px-6 rounded-2xl font-bold text-sm transition-all border border-slate-700/50"
            >
              Close Dossier
            </button>

            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                <FiClock className="w-3 h-3 text-amber-500" />
                Wait Time: <span className="text-amber-500 underline">2.4s</span>
              </div>
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                <FiActivity className="w-3 h-3 text-emerald-500" />
                Link Quality: <span className="text-emerald-500 underline">Stable</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentChatRequestPopup;
