import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiSearch, FiX, FiActivity, FiClock, FiSettings } from 'react-icons/fi';

const SpamMonitor = () => {
    const [isActive, setIsActive] = useState(true);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
    const [showAlertsTable, setShowAlertsTable] = useState(false);
    const [queueStatus, setQueueStatus] = useState('Processing'); // Processing, Idle, Error
    const [protectionLevel, setProtectionLevel] = useState('Maximum'); // Low, Medium, High, Maximum

    // Mock auto-sync effect
    useEffect(() => {
        const interval = setInterval(() => {
            setLastSync(new Date().toLocaleTimeString());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const protectionColors = {
        Low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        Maximum: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Spam Monitor</h2>
                    <p className="text-slate-400">Detect and manage suspicious user activities</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        <span className="text-xs font-bold uppercase tracking-wider">{isActive ? 'System Active' : 'System Paused'}</span>
                    </div>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all font-bold text-xs"
                    >
                        {isActive ? 'Pause' : 'Resume'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <p className="text-[10px] font-mono text-slate-500">LAST SYNC: {lastSync}</p>
                </div>

                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <FiShield className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Monitor {isActive ? 'Running' : 'Offline'}</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    Heuristic analysis engine is scanning real-time transaction streams for anomalies.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                    {/* Recent Alerts Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAlertsTable(true)}
                        className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group text-left w-full"
                    >
                        <FiAlertTriangle className="text-amber-400 w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-white mb-1">Recent Alerts</h4>
                        <p className="text-sm text-slate-500">0 flagged dossiers in queue</p>
                    </motion.button>

                    {/* Queue Status Card */}
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 cursor-default">
                        <FiActivity className={`${queueStatus === 'Error' ? 'text-red-400' : 'text-blue-400'} w-6 h-6 mb-3`} />
                        <h4 className="font-bold text-white mb-1">Queue Status</h4>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${queueStatus === 'Processing' ? 'text-blue-400' : queueStatus === 'Idle' ? 'text-slate-500' : 'text-red-400'}`}>
                                {queueStatus}
                            </span>
                            {queueStatus === 'Processing' && <div className="flex gap-1"><div className="w-1 h-1 bg-blue-400 animate-bounce"></div><div className="w-1 h-1 bg-blue-400 animate-bounce delay-75"></div><div className="w-1 h-1 bg-blue-400 animate-bounce delay-150"></div></div>}
                        </div>
                        <div className="mt-4 flex gap-2">
                            {['Processing', 'Idle', 'Error'].map(s => (
                                <button key={s} onClick={() => setQueueStatus(s)} className={`px-2 py-1 text-[8px] uppercase font-bold rounded border transition-colors ${queueStatus === s ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-slate-950/50 border-slate-800 text-slate-600'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Protection Level Card */}
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <FiShield className={`${protectionColors[protectionLevel].split(' ')[0]} w-6 h-6 mb-3`} />
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-white">Protection</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${protectionColors[protectionLevel]}`}>{protectionLevel}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-1">
                            {['Low', 'Medium', 'High', 'Maximum'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setProtectionLevel(l)}
                                    className={`py-1 text-[8px] uppercase font-bold rounded border transition-all ${protectionLevel === l ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                                    title={`${l} Security`}
                                >
                                    {l[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Overlay Table */}
            <AnimatePresence>
                {showAlertsTable && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FiAlertTriangle className="text-amber-400 w-5 h-5" />
                                    <h3 className="text-xl font-bold text-white">Security Violation Logs</h3>
                                </div>
                                <button onClick={() => setShowAlertsTable(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-12 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                    <FiSearch className="text-slate-600 w-8 h-8" />
                                </div>
                                <h4 className="text-white font-bold mb-2">No Threats Detected</h4>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">The heuristic engine has not flagged any suspicious signatures in the current session window.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpamMonitor;
