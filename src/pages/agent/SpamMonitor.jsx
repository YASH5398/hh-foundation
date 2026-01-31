import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiSearch } from 'react-icons/fi';

const SpamMonitor = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Spam Monitor</h2>
                    <p className="text-slate-400">Detect and manage suspicious user activities</p>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <FiShield className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">System Initialized</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    The spam monitor is active. No immediate threats detected in the last synchronized interval.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <FiAlertTriangle className="text-amber-400 w-6 h-6 mb-3" />
                        <h4 className="font-bold text-white mb-1">Recent Alerts</h4>
                        <p className="text-sm text-slate-500">0 suspicious accounts flagged</p>
                    </div>
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <FiSearch className="text-blue-400 w-6 h-6 mb-3" />
                        <h4 className="font-bold text-white mb-1">Queue Status</h4>
                        <p className="text-sm text-slate-500">Processing real-time stream</p>
                    </div>
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <FiShield className="text-emerald-400 w-6 h-6 mb-3" />
                        <h4 className="font-bold text-white mb-1">Protection Level</h4>
                        <p className="text-sm text-slate-500">Maximum security active</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpamMonitor;
