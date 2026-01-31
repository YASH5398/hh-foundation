import React, { useState, useEffect } from 'react';
import { db, collection, query, where, or, onSnapshot, functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import {
    FiUser,
    FiUnlock,
    FiAlertCircle,
    FiCheckCircle,
    FiLoader,
    FiSearch,
    FiFilter,
    FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const UnblockUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        // Fetch users who have any blocking flag set to true
        const q = query(
            collection(db, 'users'),
            or(
                where('isBlocked', '==', true),
                where('isOnHold', '==', true),
                where('isReceivingHeld', '==', true)
            )
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const blockedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(blockedUsers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching blocked users:", error);
            toast.error("Failed to load blocked users");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUnblock = async (targetUid, userId) => {
        if (processingId) return;

        const confirmUnblock = window.confirm(`Are you sure you want to unblock user ${userId}?`);
        if (!confirmUnblock) return;

        setProcessingId(targetUid);
        try {
            const resumeBlockedReceives = httpsCallable(functions, 'resumeBlockedReceives');
            const result = await resumeBlockedReceives({ uid: targetUid });

            if (result.data?.ok) {
                toast.success(`User ${userId} unblocked successfully!`);
            } else {
                toast.error(result.data?.error || "Failed to unblock user");
            }
        } catch (error) {
            console.error("Unblock error:", error);
            toast.error(error.message || "An error occurred while unblocking");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <FiLoader className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Loading blocked users...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 min-h-screen text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <FiUnlock className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Blocked Users</h1>
                            <p className="text-slate-500 text-xs">Manage restricts and restore access</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-3 py-1.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total:</span>
                        <span className="text-sm font-black text-emerald-400">{users.length}</span>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="mb-6 relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by User ID, Name, or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                    />
                </div>

                {/* Users List */}
                <div className="space-y-2">
                    <AnimatePresence mode='popLayout'>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => (
                                <motion.div
                                    key={u.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 sm:p-4 hover:border-slate-600/50 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Profile Icon */}
                                            <div className="hidden xs:flex w-10 h-10 bg-slate-900 rounded-lg items-center justify-center border border-slate-700/50 text-slate-500 group-hover:text-emerald-500 transition-colors">
                                                <FiUser className="w-5 h-5" />
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">User Details</span>
                                                    <h3 className="text-sm font-bold text-white truncate">{u.fullName || 'Unnamed'}</h3>
                                                    <p className="text-[10px] font-mono text-slate-400 uppercase">{u.userId || 'No ID'}</p>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Level & Reason</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/10">
                                                            {u.level || u.levelStatus || 'Star'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                            {u.holdReason || u.blockReason || 'Manual Block'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block w-full mb-0.5">Status Flags</span>
                                                    {u.isBlocked && <span className="text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-md uppercase">Blocked</span>}
                                                    {u.isOnHold && <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1.5 py-0.5 rounded-md uppercase">On Hold</span>}
                                                    {u.isReceivingHeld && <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded-md uppercase">Rcv Held</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="flex sm:justify-end items-center">
                                            <button
                                                onClick={() => handleUnblock(u.id, u.userId)}
                                                disabled={processingId === u.id}
                                                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${processingId === u.id
                                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                        : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-900/20'
                                                    }`}
                                            >
                                                {processingId === u.id ? (
                                                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <FiUnlock className="w-3.5 h-3.5" />
                                                        Unblock
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-16 text-center bg-slate-800/20 border border-slate-700/30 border-dashed rounded-3xl"
                            >
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner">
                                    <FiCheckCircle className="w-8 h-8 text-slate-700" />
                                </div>
                                <h3 className="text-white font-bold mb-1">All Clear</h3>
                                <p className="text-slate-500 text-xs">No blocked or held users found.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default UnblockUser;
