import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAssignedEpins, transferEpin, getAllEpinsForUser } from '../../services/epin/epinService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiSend, FiClock, FiRepeat, FiKey, FiInbox } from 'react-icons/fi';

const TABS = [
  { key: 'available', label: 'Available' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'history', label: 'History' },
];

const UserEpins = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [epinToTransfer, setEpinToTransfer] = useState('');
  const [receiverUserId, setReceiverUserId] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchAssignedEpins = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    const result = await getAssignedEpins(currentUser.uid);
    if (result.success) {
      setEpins(result.epins);
    } else {
      setError(result.message);
      toast.error(result.message);
    }
    setLoading(false);
  };

  const fetchAllEpinsForUser = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    const result = await getAllEpinsForUser(currentUser.uid);
    if (result.success) {
      setEpins(result.epins);
    } else {
      setError(result.message);
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAssignedEpins();
    } else if (activeTab === 'history') {
      fetchAllEpinsForUser();
    }
  }, [currentUser, activeTab]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to transfer E-PINs.');
      return;
    }
    if (!epinToTransfer || !receiverUserId) {
      toast.error('Please enter both E-PIN and Receiver User ID.');
      return;
    }
    setLoading(true);
    const result = await transferEpin(epinToTransfer, currentUser.uid, receiverUserId);
    setLoading(false);
    if (result.success) {
      toast.success(result.message);
      setEpinToTransfer('');
      setReceiverUserId('');
      fetchAssignedEpins();
    } else {
      toast.error(result.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('E-PIN copied to clipboard!');
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Card renderers
  const renderAvailable = () => (
    <motion.div
      key="available"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
    >
      {epins.filter(epin => epin.status === 'unused').length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16">
          <FiInbox className="text-5xl text-blue-300 mb-4" />
          <div className="text-xl font-bold text-blue-700 mb-2">No available E-PINs found.</div>
          <div className="text-gray-500 mb-4">You currently have no unused E-PINs assigned.</div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg"
            onClick={() => setActiveTab('transfer')}
          >Request or Transfer</motion.button>
              </div>
            ) : (
        epins.filter(epin => epin.status === 'unused').map((epin) => (
          <motion.div
            key={epin.id}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px 0 rgba(59,130,246,0.18)' }}
            className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-2xl shadow-blue-500/20 rounded-2xl border border-gray-200 p-6 flex flex-col gap-3 transition-all hover:ring-2 hover:ring-blue-400"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiKey className="text-2xl text-blue-400" />
              <span className="font-mono text-lg text-blue-700 font-bold tracking-wider">{epin.epin}</span>
              <motion.button
                onClick={() => copyToClipboard(epin.epin, epin.id)}
                whileTap={{ scale: 0.9 }}
                className="ml-auto px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs shadow transition relative"
                title="Copy E‑PIN"
              >
                {copiedId === epin.id ? (
                  <span className="text-green-500 font-bold">Copied!</span>
                ) : (
                  <FiCopy className="inline-block" />
                )}
              </motion.button>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs shadow">Unused</span>
              <span className="text-xs text-gray-400 ml-auto">{epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleString() : ''}</span>
              </div>
          </motion.div>
        ))
            )}
    </motion.div>
        );

  const renderTransfer = () => (
    <motion.div
      key="transfer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="flex justify-center"
    >
      <form onSubmit={handleTransferSubmit} className="bg-gradient-to-br from-white via-purple-50 to-purple-100 shadow-2xl shadow-purple-500/20 rounded-2xl border border-gray-200 p-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2 mb-2"><FiSend /> Transfer E-PIN</h2>
              <div>
                <label htmlFor="epinToTransfer" className="block text-sm font-medium text-gray-700">E-PIN to Transfer</label>
                <input
                  type="text"
                  id="epinToTransfer"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-inner focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2"
                  placeholder="Enter E-PIN code"
                  value={epinToTransfer}
                  onChange={(e) => setEpinToTransfer(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div>
                <label htmlFor="receiverUserId" className="block text-sm font-medium text-gray-700">Receiver's User ID</label>
                <input
                  type="text"
                  id="receiverUserId"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-inner focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2"
                  placeholder="Enter receiver's User ID"
                  value={receiverUserId}
                  onChange={(e) => setReceiverUserId(e.target.value)}
                  required
                />
              </div>
        <motion.button
                type="submit"
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold shadow-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400 border-0 select-none disabled:opacity-50"
                disabled={loading}
              >
          {loading ? <FiClock className="animate-spin inline-block mr-2" /> : <FiRepeat className="inline-block mr-2" />} Transfer E-PIN
        </motion.button>
            </form>
    </motion.div>
        );

  const renderHistory = () => (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
    >
            {epins.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16">
          <FiInbox className="text-5xl text-gray-300 mb-4" />
          <div className="text-xl font-bold text-gray-700 mb-2">No E-PIN History</div>
          <div className="text-gray-500">You have no E-PIN history to display.</div>
              </div>
            ) : (
        epins.map((epin) => (
          <motion.div
            key={epin.id}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px 0 rgba(16,185,129,0.18)' }}
            className={`bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-2xl rounded-2xl border border-gray-200 p-6 flex flex-col gap-3 transition-all hover:ring-2 ${epin.status === 'unused' ? 'hover:ring-blue-400' : epin.status === 'used' ? 'hover:ring-emerald-400' : 'hover:ring-yellow-400'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FiKey className="text-xl text-gray-400" />
              <span className="font-mono text-lg font-bold text-gray-700">{epin.epin}</span>
              <span className={`ml-auto text-xs font-bold ${epin.status === 'unused' ? 'text-blue-500' : epin.status === 'used' ? 'text-green-500' : 'text-yellow-500'}`}>{epin.status.charAt(0).toUpperCase() + epin.status.slice(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Assigned: {epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleString() : 'N/A'}</span>
              <span className="ml-auto">{epin.usedAt?.toDate ? `Used: ${epin.usedAt.toDate().toLocaleString()}` : ''}</span>
              </div>
            {epin.transferredTo && (
              <div className="text-xs text-gray-500 mt-1">Transferred To: <span className="font-mono text-gray-700">{epin.transferredTo}</span></div>
            )}
          </motion.div>
        ))
      )}
    </motion.div>
        );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-100/70 via-indigo-100/60 to-white/80 py-8 px-2 sm:px-4"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Glassmorphism Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl border border-white/30 bg-white/60 bg-clip-padding backdrop-blur-xl px-8 py-6 flex flex-col items-center mb-4"
        style={{ boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.12)', border: '1.5px solid rgba(255,255,255,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <FiKey className="text-3xl text-blue-500 drop-shadow" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight text-center drop-shadow select-none">E-PIN Management</h1>
        </div>
      </motion.div>
      <div className="w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-white/30 bg-white/60 bg-clip-padding backdrop-blur-xl p-0 sm:p-0 relative overflow-hidden" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)', border: '1.5px solid rgba(255,255,255,0.25)'}}>
        {/* Tab Navigation */}
        <div className="flex gap-2 px-8 pt-8 pb-2 justify-center">
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-7 py-2 rounded-full font-semibold text-base transition-all duration-200 focus:outline-none select-none shadow ${activeTab === tab.key ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_16px_2px_rgba(99,102,241,0.4)] scale-105' : 'bg-white/70 text-blue-700 shadow-inner'}`}
              whileHover={{ scale: 1.09 }}
              whileTap={{ scale: 0.97 }}
        >
              {tab.label}
            </motion.button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="p-8 min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === 'available' && renderAvailable()}
            {activeTab === 'transfer' && renderTransfer()}
            {activeTab === 'history' && renderHistory()}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default UserEpins;