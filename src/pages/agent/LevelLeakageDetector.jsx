import React, { useState } from 'react';
import {
    db,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    orderBy
} from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch,
    FiAlertCircle,
    FiCheckCircle,
    FiArrowRight,
    FiUser,
    FiActivity,
    FiTrendingUp,
    FiClock,
    FiShield
} from 'react-icons/fi';

const LEVEL_CONFIG = {
    'Star': { expected: 3, amount: 300 },
    'Silver': { expected: 9, amount: 600 },
    'Gold': { expected: 27, amount: 2000 },
    'Platinum': { expected: 81, amount: 20000 },
    'Diamond': { expected: 243, amount: 200000 }
};

const LevelLeakageDetector = () => {
    const [userIdInput, setUserIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const detectLeakage = async () => {
        if (!userIdInput.trim()) {
            setError('Please enter a User ID');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('userId', '==', userIdInput.trim().toUpperCase()));
            const userSnap = await getDocs(q);

            if (userSnap.empty) {
                throw new Error('User not found');
            }

            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();
            const userUid = userDoc.id;

            const receiveHelpRef = collection(db, 'receiveHelp');
            const rhQuery = query(receiveHelpRef, where('receiverUid', '==', userUid));
            const rhSnap = await getDocs(rhQuery);
            const allReceiveRecords = rhSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const confirmedReceive = allReceiveRecords.filter(r => r.status === 'confirmed');
            const assignedReceive = allReceiveRecords.filter(r => ['assigned', 'payment_done', 'payment_requested', 'disputed'].includes(r.status));

            const sendHelpRef = collection(db, 'sendHelp');
            const shQuery = query(sendHelpRef, where('senderUid', '==', userUid));
            const shSnap = await getDocs(shQuery);
            const allSendRecords = shSnap.docs.map(d => d.data());

            const currentLevel = userData.levelStatus || 'Star';
            const config = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG['Star'];

            const expectedCount = config.expected;
            const actualReceivedCount = confirmedReceive.length;
            const totalAssignedCount = assignedReceive.length + actualReceivedCount;

            let status = "Blue";
            let rootCause = "Normal progress";
            let actionRequired = "No action required";
            let confidence = "High";

            // SPECIAL STAR LEVEL LOGIC
            if (currentLevel === 'Star') {
                const initialSendHelp = allSendRecords.find(r => r.amount === 300);
                const isInitialSendHelpDone = initialSendHelp?.status === 'confirmed';

                if (!isInitialSendHelpDone) {
                    status = "Yellow";
                    rootCause = "Initial Send Help not completed";
                    actionRequired = "Ask user to complete Send Help ₹300";
                } else if (totalAssignedCount < 3) {
                    const now = new Date();
                    const createdAt = userData.createdAt?.toDate() || now;
                    const hoursSinceJoined = (now - createdAt) / (1000 * 60 * 60);

                    if (hoursSinceJoined > 48) {
                        status = "Red";
                        rootCause = "System Assignment Gap (Delayed > 48h)";
                        actionRequired = "Escalate to admin: sender assignment delayed";
                        confidence = "Medium";
                    } else {
                        status = "Blue";
                        rootCause = `Receiving in progress (${totalAssignedCount} of 3 senders assigned)`;
                        actionRequired = "No issue. Receiving is ongoing.";
                    }
                } else if (actualReceivedCount < 3) {
                    status = "Yellow";
                    rootCause = "Waiting for senders to complete payment";
                    actionRequired = "Ask user to wait. Payments will arrive.";
                } else {
                    status = "Green";
                    rootCause = "Level completed successfully";
                    actionRequired = "User is ready for next level (Silver)";
                }
            } else {
                // Higher levels logic
                if (userData.isOnHold || userData.isReceivingHeld) {
                    status = "Red";
                    rootCause = "Receiving Held";
                    actionRequired = "Receiving blocked by system - Verify user activity";
                } else if (userData.isBlocked) {
                    status = "Red";
                    rootCause = "Silent Block";
                    actionRequired = "No block flag but payments stopped - Check logs";
                } else {
                    const helpReceived = userData.helpReceived || actualReceivedCount;
                    const levelConfig = {
                        'Silver': { block: [4, 7], upgrade: 4, sponsor: 7, uAmt: 1800, sAmt: 1200 },
                        'Gold': { block: [11, 25], upgrade: 11, sponsor: 25, uAmt: 20000, sAmt: 4000 },
                        'Platinum': { block: [11, 80], upgrade: 11, sponsor: 80, uAmt: 200000, sAmt: 40000 },
                        'Diamond': { block: [242], sponsor: 242, sAmt: 600000 }
                    };

                    const m = levelConfig[currentLevel];
                    if (m && m.block.includes(helpReceived)) {
                        status = "Yellow";
                        if (helpReceived === m.upgrade) {
                            rootCause = "Upgrade Pending";
                            actionRequired = `User must complete upgrade ₹${m.uAmt}`;
                        } else {
                            rootCause = "Sponsor/Upline Payment Pending";
                            actionRequired = `User must pay upline ₹${m.sAmt}`;
                        }
                    } else if (totalAssignedCount < expectedCount) {
                        status = "Red";
                        rootCause = "System Assignment Gap";
                        actionRequired = "No new senders assigned despite eligibility";
                    } else {
                        status = "Yellow";
                        rootCause = `${totalAssignedCount - actualReceivedCount} senders are assigned, payment from them is pending`;
                        actionRequired = "Ask user to wait. Payments will arrive.";
                    }
                }
            }

            setResult({
                user: {
                    name: userData.fullName || 'Unknown',
                    level: currentLevel,
                },
                stats: {
                    expectedCount,
                    totalAssignedCount,
                    actualReceivedCount,
                    remaining: Math.max(0, expectedCount - actualReceivedCount),
                    actualAmount: confirmedReceive.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
                },
                timeline: Array.from({ length: expectedCount }).map((_, i) => {
                    const record = allReceiveRecords[i];
                    return {
                        id: i + 1,
                        status: record ? (record.status === 'confirmed' ? 'Paid' : 'Assigned') : 'Not Assigned'
                    };
                }),
                status,
                rootCause,
                confidence,
                actionRequired
            });

        } catch (err) {
            console.error('Leakage Detection Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Level Leakage Detector</h2>
                    <p className="text-slate-400">Identify why a user is not receiving payments</p>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Enter User ID (e.g. HHF123456)"
                                value={userIdInput}
                                onChange={(e) => setUserIdInput(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                onKeyPress={(e) => e.key === 'Enter' && detectLeakage()}
                            />
                        </div>
                    </div>
                    <button
                        onClick={detectLeakage}
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiActivity className="w-5 h-5" />}
                        Analyze Status
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
                        <FiAlertCircle className="flex-shrink-0" />
                        <p>{error}</p>
                    </motion.div>
                )}

                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 h-full">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <FiUser className="text-blue-400" /> {result.user.name}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                        <span className="text-slate-400 text-sm font-medium">Level</span>
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm font-bold">{result.user.level}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                        <span className="text-slate-400 text-sm font-medium">Leakage Status</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.status === 'Green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                result.status === 'Yellow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    result.status === 'Blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>{result.status === 'Blue' ? 'Waiting' : result.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><FiActivity className="text-indigo-400" /> Receiving Status</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between p-3 bg-slate-800/40 rounded-xl">
                                            <span className="text-slate-400 text-sm">Total Expected</span>
                                            <span className="text-white font-bold">{result.stats.expectedCount}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-slate-800/40 rounded-xl">
                                            <span className="text-slate-400 text-sm">Assigned Senders</span>
                                            <span className="text-blue-400 font-bold">{result.stats.totalAssignedCount}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-slate-800/40 rounded-xl">
                                            <span className="text-slate-400 text-sm">Payments Received</span>
                                            <span className="text-emerald-400 font-bold">{result.stats.actualReceivedCount}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-slate-800/40 rounded-xl border-t border-slate-700 mt-2">
                                            <span className="text-slate-400 text-sm">Remaining</span>
                                            <span className="text-white font-bold">{result.stats.remaining}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><FiClock className="text-emerald-400" /> Payment Timeline</h3>
                                    <div className="space-y-3">
                                        {result.timeline.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                                                <div className={`w-2 h-2 rounded-full ${item.status === 'Paid' ? 'bg-emerald-500' : item.status === 'Assigned' ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                                <span className="text-slate-300 text-sm">Sender {item.id}</span>
                                                <span className={`ml-auto text-xs font-bold uppercase ${item.status === 'Paid' ? 'text-emerald-400' : item.status === 'Assigned' ? 'text-blue-400' : 'text-slate-600'}`}>{item.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                                    <span className="font-bold text-white flex items-center gap-2"><FiShield className="text-blue-400" /> Diagnostic Report</span>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Root Cause</label>
                                        <p className="text-lg font-bold text-white">{result.rootCause}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Action Required</label>
                                        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                                            <FiArrowRight className="text-blue-400 mt-1 flex-shrink-0" />
                                            <span className="text-blue-100 font-medium">{result.actionRequired}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LevelLeakageDetector;
