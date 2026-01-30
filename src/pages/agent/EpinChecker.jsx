import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiUser, FiCalendar, FiRefreshCw, FiCreditCard, FiHash, FiShield, FiAlertOctagon } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const EpinChecker = () => {
  const [epinCode, setEpinCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchEpin = async (e) => {
    if (e) e.preventDefault();
    if (!epinCode.trim()) {
      toast.error('Please enter an E-PIN code');
      return;
    }

    setLoading(true);
    setSearchResult(null);
    setHasSearched(true);

    try {
      const epinsRef = collection(db, 'epins');
      const q = query(epinsRef, where('code', '==', epinCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchResult({ found: false });
      } else {
        const epinDoc = querySnapshot.docs[0];
        const epinData = { id: epinDoc.id, ...epinDoc.data() };
        setSearchResult({ found: true, data: epinData });
      }
    } catch (error) {
      console.error('Error searching E-PIN:', error);
      toast.error('Search Integrity Failed');
    } finally {
      setLoading(false);
    }
  };

  /* Helper Functions */
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const StatusBadge = ({ status }) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
            <FiCheckCircle /> Active / Unused
          </div>
        );
      case 'used':
        return (
          <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-blue-500/10 border-blue-500/20 text-blue-500">
            <FiCheckCircle /> Redeemed
          </div>
        );
      case 'expired':
        return (
          <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-red-500/10 border-red-500/20 text-red-500">
            <FiXCircle /> Expired
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-slate-500/10 border-slate-500/20 text-slate-500">
            <FiAlertOctagon /> Unknown
          </div>
        );
    }
  };


  return (
    <div className="space-y-12 pb-20">
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 px-8 rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FiCreditCard className="w-64 h-64" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">E-PIN Scanner</h1>
          <p className="text-slate-400 mb-8 font-medium">Verify authenticity and track usage history of generated Electronic PINs.</p>

          <form onSubmit={searchEpin} className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 blur-xl group-focus-within:bg-blue-600/30 transition-all opacity-0 group-focus-within:opacity-100"></div>
            <div className="relative flex gap-3 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner">
              <div className="flex-1 flex items-center px-4 gap-3">
                <FiSearch className="text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter 16-Digit E-PIN Code"
                  value={epinCode}
                  onChange={(e) => setEpinCode(e.target.value)}
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 font-mono tracking-wider uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40 disabled:opacity-50"
              >
                {loading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                Scan
              </button>
            </div>
          </form>
        </div>
      </motion.section>

      {/* Results Deck */}
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 opacity-30"
          >
            <FiHash className="w-24 h-24 mx-auto mb-6" />
            <p className="text-xl font-bold text-white uppercase tracking-widest">Awaiting Code Input</p>
          </motion.div>
        ) : loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 gap-6"
          >
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-400 font-black animate-pulse uppercase tracking-[0.3em]">Validating Hash...</p>
          </motion.div>
        ) : searchResult?.found ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Main Card: Status & Code */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div className="flex justify-between items-start mb-8 relative">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-PIN Status</p>
                  <StatusBadge status={searchResult.data.status} />
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <FiShield className={`w-8 h-8 ${searchResult.data.status === 'active' ? 'text-emerald-500' : 'text-slate-500'}`} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-8 relative">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Encrypted Code String</p>
                <p className="text-2xl sm:text-3xl font-mono font-black text-center text-white tracking-widest select-all">
                  {searchResult.data.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Value / Amount</p>
                  <p className="text-2xl font-black text-emerald-400">₹{searchResult.data.value || searchResult.data.amount || '0'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Package Level</p>
                  <p className="text-2xl font-black text-purple-400">Lvl {searchResult.data.level || '1'}</p>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="space-y-6">
              {/* Creation Log */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FiCalendar className="text-blue-500" /> Creation Log
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Generated On" value={formatDate(searchResult.data.createdAt)} />
                  <InfoRow label="Generated By" value={searchResult.data.createdBy || 'System Admin'} />
                  <InfoRow label="Batch ID" value={searchResult.data.id} copy />
                </div>
              </div>

              {/* Purchase/Usage Log */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FiUser className="text-purple-500" /> Usage History
                </h3>
                <div className="space-y-4">
                  {searchResult.data.purchasedBy ? (
                    <>
                      <InfoRow label="Purchased By" value={searchResult.data.purchasedByName || searchResult.data.purchasedBy} />
                      <InfoRow label="Purchase Date" value={formatDate(searchResult.data.purchasedAt)} />
                    </>
                  ) : (
                    <div className="py-2 text-center text-slate-500 text-xs italic">No purchase record found</div>
                  )}

                  <div className="h-px bg-slate-800 my-2"></div>

                  {searchResult.data.status === 'used' ? (
                    <>
                      <InfoRow label="Used By" value={searchResult.data.usedByName || searchResult.data.usedBy} highlight />
                      <InfoRow label="Used Date" value={formatDate(searchResult.data.usedAt)} />
                    </>
                  ) : (
                    <div className="py-2 text-center text-emerald-500/60 text-xs font-bold uppercase tracking-widest">TOKEN IS CURRENTLY UNUSED</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-red-400 opacity-60"
          >
            <FiAlertOctagon className="w-16 h-16 mx-auto mb-4" />
            <p className="font-bold uppercase tracking-widest">Invalid Hash</p>
            <p className="text-sm opacity-60">Authentication failed. Code does not exist.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Micro Components */
const InfoRow = ({ label, value, copy, highlight }) => (
  <div className="flex justify-between items-center group min-h-[1.5rem]">
    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm truncate max-w-[200px] text-right ${highlight ? 'text-white font-bold' : 'text-slate-300'}`}>{value || '-'}</span>
      {copy && value && (
        <FiRefreshCw
          className="opacity-0 group-hover:opacity-100 text-slate-500 cursor-pointer w-3 h-3 hover:text-white transition-opacity"
          onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); }}
        />
      )}
    </div>
  </div>
);

export default EpinChecker;