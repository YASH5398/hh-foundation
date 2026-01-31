import React, { useState } from 'react';
import { db, collection, getDocs, writeBatch, doc } from '../../config/firebase';
import { FiDatabase, FiPlay, FiCheckCircle, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MigrationPage = () => {
    const [status, setStatus] = useState('idle'); // idle, running, completed, error
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ scanned: 0, updated: 0 });

    const addLog = (msg) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const runMigration = async () => {
        if (!window.confirm("Are you sure you want to run the User Block Fields Migration? This will update all user documents missing block fields.")) return;

        setStatus('running');
        setLogs([]);
        setProgress({ scanned: 0, updated: 0 });
        addLog("Starting migration process...");

        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const totalDocs = snapshot.size;
            addLog(`Found ${totalDocs} users in collection.`);

            let scannedCount = 0;
            let updatedCount = 0;
            let batch = writeBatch(db);
            let batchCount = 0;

            for (const userDoc of snapshot.docs) {
                scannedCount++;
                const data = userDoc.data();

                // Check if migration is needed
                const needsMigration =
                    data.isBlocked === undefined ||
                    data.blockReason === undefined ||
                    data.blockRefId === undefined ||
                    data.blockedAt === undefined;

                if (needsMigration) {
                    batch.update(doc(db, 'users', userDoc.id), {
                        isBlocked: data.isBlocked ?? false,
                        blockReason: data.blockReason ?? null,
                        blockRefId: data.blockRefId ?? null,
                        blockedAt: data.blockedAt ?? null
                    });
                    updatedCount++;
                    batchCount++;
                }

                // Periodic progress report
                if (scannedCount % 100 === 0) {
                    setProgress({ scanned: scannedCount, updated: updatedCount });
                }

                // Firestore batch limit is 500
                if (batchCount === 500) {
                    addLog(`Committing batch of 500 updates...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            }

            // Commit final batch
            if (batchCount > 0) {
                addLog(`Committing final batch of ${batchCount} updates...`);
                await batch.commit();
            }

            setProgress({ scanned: scannedCount, updated: updatedCount });
            addLog(`Migration completed successfully!`);
            addLog(`Stats: Scanned ${scannedCount}, Updated ${updatedCount}`);
            setStatus('completed');
        } catch (error) {
            console.error(error);
            addLog(`ERROR: ${error.message}`);
            setStatus('error');
        }
    };

    return (
        <div className="p-6 lg:p-10 bg-slate-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <FiDatabase className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Migration</h1>
                        <p className="text-slate-400 text-sm">One-time User Block Fields Alignment</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Operations Control</h3>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            This script scans the <code className="text-blue-400">users</code> collection and ensures all documents have the standard block control fields. Existing values will not be overwritten.
                        </p>

                        <button
                            onClick={runMigration}
                            disabled={status === 'running'}
                            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${status === 'running'
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {status === 'running' ? <FiLoader className="animate-spin" /> : <FiPlay />}
                            {status === 'running' ? 'Migration in Progress...' : 'Execute Migration'}
                        </button>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Live Progress</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-slate-500 text-xs block mb-1">Users Scanned</span>
                                    <span className="text-2xl font-black text-white">{progress.scanned.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-500 text-xs block mb-1">Fields Normalized</span>
                                    <span className="text-2xl font-black text-emerald-500">{progress.updated.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: status === 'completed' ? '100%' : '50%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-slate-800 bg-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Process Logs</span>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2">
                        {logs.length === 0 && (
                            <div className="text-slate-600 italic">Waiting for execution...</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={`pb-1 border-b border-slate-800/30 ${log.includes('ERROR') ? 'text-red-400' : 'text-slate-400'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-semibold"
                        >
                            <FiCheckCircle />
                            Migration completed. All user records are now aligned with the block system.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MigrationPage;
