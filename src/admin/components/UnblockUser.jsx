import React, { useState } from 'react';
import { db, collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from '../../config/firebase';
import { FiUser, FiSearch, FiUnlock, FiAlertCircle, FiCheckCircle, FiLoader, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UnblockUser = () => {
    const { user: adminUser } = useAuth();
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [unblocking, setUnblocking] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!userId.trim()) return;

        setLoading(true);
        setFoundUser(null);
        try {
            const q = query(collection(db, 'users'), where('userId', '==', userId.trim().toUpperCase()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("User not found");
            } else {
                const userDoc = snapshot.docs[0];
                setFoundUser({ id: userDoc.id, ...userDoc.data() });
            }
        } catch (error) {
            console.error(error);
            toast.error("Error searching user");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async () => {
        if (!foundUser || !adminUser) return;
        setUnblocking(true);
        try {
            const userRef = doc(db, 'users', foundUser.id);
            await updateDoc(userRef, {
                isBlocked: false,
                blockReason: null,
                blockRefId: null,
                blockedAt: null,
                blockedBySystem: false,
                blockedHelpRef: null,
                unblockedAt: serverTimestamp(),
                unblockedBy: adminUser.uid
            });

            toast.success("User unblocked successfully!");
            setFoundUser(prev => ({
                ...prev,
                isBlocked: false,
                blockReason: null,
                blockedAt: null,
                blockedBySystem: false
            }));
            setShowConfirm(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to unblock user");
        } finally {
            setUnblocking(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 bg-slate-900 min-h-screen">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <FiUnlock className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Unblock User</h1>
                        <p className="text-slate-400 text-sm">Search and restore account access</p>
                    </div>
                </div>

                {/* Search Box */}
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                placeholder="Enter User ID (e.g. HH001)"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? <FiLoader className="animate-spin" /> : 'Search'}
                        </button>
                    </form>
                </div>

                <AnimatePresence>
                    {foundUser && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                                            <FiUser className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{foundUser.fullName || foundUser.displayName || 'Unnamed User'}</h3>
                                            <p className="text-slate-500 text-sm font-mono uppercase tracking-wider">{foundUser.userId}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${foundUser.isBlocked
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                        {foundUser.isBlocked ? 'Blocked' : 'Active'}
                                    </div>
                                </div>

                                <div className="space-y-6 mb-10">
                                    <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1 tracking-widest">Email Address</span>
                                                <span className="text-slate-300 text-sm font-medium">{foundUser.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1 tracking-widest">Current Status</span>
                                                <span className={`text-sm font-bold ${foundUser.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {foundUser.isBlocked ? 'Access Restricted' : 'Active Account'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1 tracking-widest">Block Reason</span>
                                                <span className="text-slate-300 text-sm font-medium">{foundUser.blockReason || 'No violations'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1 tracking-widest">Blocked At</span>
                                                <span className="text-slate-300 text-sm font-medium">
                                                    {foundUser.blockedAt ? new Date(foundUser.blockedAt.toDate ? foundUser.blockedAt.toDate() : foundUser.blockedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {foundUser.isBlocked ? (
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        <FiUnlock className="w-5 h-5" />
                                        Unblock Account
                                    </button>
                                ) : (
                                    <div className="py-5 bg-slate-900/50 rounded-2xl text-center border border-slate-700 border-dashed">
                                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">User access is already restored</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowConfirm(false)}
                                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-sm w-full relative z-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
                            >
                                <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/10">
                                    <FiAlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Confirm Reset?</h3>
                                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
                                    This will immediately restore access for <span className="text-slate-100 font-bold">{foundUser.userId}</span>. Are you absolutely certain?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="py-4 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest border border-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUnblock}
                                        disabled={unblocking}
                                        className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                                    >
                                        {unblocking ? <FiLoader className="animate-spin" /> : 'Proceed'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UnblockUser;
