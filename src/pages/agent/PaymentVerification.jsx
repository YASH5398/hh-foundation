import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiEye, FiCheck, FiX, FiClock,
  FiUser, FiDollarSign, FiDownload, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiCalendar, FiCopy, FiCreditCard, FiArrowLeft
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
import UserProfileView from '../../components/agent/UserProfileView';

const PaymentVerification = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [sendHelps, setSendHelps] = useState([]);
  const [receiveHelps, setReceiveHelps] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, send, receive
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalVerified: 0,
    totalAmount: 0,
    todayCount: 0
  });

  // Fetch sendHelp data
  useEffect(() => {
    if (!user?.uid) return;
    const sendHelpQuery = query(collection(db, 'sendHelp'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(sendHelpQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), type: 'send',
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      setSendHelps(data);
    }, (error) => toast.error('Failed to load send help requests'));
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch receiveHelp data
  useEffect(() => {
    if (!user?.uid) return;
    const receiveHelpQuery = query(collection(db, 'receiveHelp'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(receiveHelpQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), type: 'receive',
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      setReceiveHelps(data);
      setLoading(false);
    }, (error) => {
      toast.error('Failed to load receive help requests');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate stats and filter payments
  useEffect(() => {
    const allPayments = [...sendHelps, ...receiveHelps];
    const pending = allPayments.filter(p => p.status?.toLowerCase() === 'pending');
    const verified = allPayments.filter(p => p.status?.toLowerCase() === 'confirmed');
    const totalAmount = pending.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = pending.filter(p => {
      const paymentDate = p.createdAt instanceof Date ? p.createdAt : new Date();
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    }).length;

    setStats({ totalPending: pending.length, totalVerified: verified.length, totalAmount, todayCount });

    let filtered = allPayments;
    if (activeTab === 'send') filtered = sendHelps;
    else if (activeTab === 'receive') filtered = receiveHelps;

    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status?.toLowerCase() === statusFilter.toLowerCase());

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.utrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiverId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.amount?.toString().includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPayments(filtered);
  }, [sendHelps, receiveHelps, activeTab, statusFilter, searchTerm]);

  const handleVerifyPayment = async (paymentId, paymentType, action) => {
    try {
      setVerifyingPayment(true);
      const collectionName = paymentType === 'send' ? 'sendHelp' : 'receiveHelp';
      const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

      await updateDoc(doc(db, collectionName, paymentId), {
        status: newStatus,
        verifiedBy: user.uid,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification logic omitted for brevity, assuming service exists
      toast.success(`Payment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied'); };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-600/10 rounded-xl border border-emerald-600/20">
              <FiCreditCard className="w-5 h-5 text-emerald-400" />
            </span>
            Transaction Audit
          </h1>
          <p className="text-slate-400 mt-1 ml-1 text-sm font-medium">Verify incoming and outgoing financial requests</p>
        </div>
      </motion.div>

      {/* Stats - Hide on mobile when payment selected to focus on detail */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${selectedPayment ? 'hidden lg:grid' : 'grid'}`}>
        <StatCard label="Pending" value={stats.totalPending} icon={FiClock} color="amber" />
        <StatCard label="Verified" value={stats.totalVerified} icon={FiCheckCircle} color="emerald" />
        <StatCard label="Total Volume" value={formatCurrency(stats.totalAmount)} icon={FiDollarSign} color="blue" />
        <StatCard label="Today's Requests" value={stats.todayCount} icon={FiCalendar} color="purple" />
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* Left List */}
        <div className={`xl:col-span-7 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-[700px] ${selectedPayment ? 'hidden xl:flex' : 'flex'}`}>
          {/* Controls */}
          <div className="p-6 border-b border-slate-800 space-y-4">
            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { key: 'all', label: 'All Transactions' },
                { key: 'send', label: 'Send Help' },
                { key: 'receive', label: 'Receive Help' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search UTR, ID, Amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 font-bold uppercase tracking-wider"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredPayments.map(payment => (
                <motion.div
                  layout
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedPayment(payment)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${selectedPayment?.id === payment.id
                      ? 'bg-blue-600/10 border-blue-500/30'
                      : 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-600/50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${payment.type === 'send' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                        {payment.type === 'send' ? 'OUT' : 'IN'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{formatCurrency(payment.amount)}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[200px]">ID: {payment.id}</p>
                    </div>
                    <FiCreditCard className={`w-5 h-5 ${selectedPayment?.id === payment.id ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredPayments.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <FiDollarSign className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No Transactions Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className={`xl:col-span-5 ${selectedPayment ? 'block' : 'hidden xl:block'}`}>
          <AnimatePresence mode="wait">
            {selectedPayment ? (
              <motion.div
                key={selectedPayment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-2xl sticky top-6"
              >
                <div className="flex flex-col gap-4 mb-8">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="xl:hidden flex items-center gap-2 text-slate-400 hover:text-white self-start"
                  >
                    <FiArrowLeft /> <span className="text-xs font-bold uppercase">Back to List</span>
                  </button>

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Transaction Details</span>
                      <h2 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(selectedPayment.amount)}</h2>
                    </div>
                    <button onClick={() => setSelectedPayment(null)} className="hidden xl:block p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <DetailRow label="Transaction ID" value={selectedPayment.id} copy />
                    <DetailRow label="UTR Reference" value={selectedPayment.utrNumber || 'N/A'} copy={!!selectedPayment.utrNumber} />
                    <DetailRow label="User ID" value={selectedPayment.type === 'send' ? selectedPayment.senderId : (selectedPayment.receiverId || selectedPayment.userId)} copy />
                    <DetailRow label="Created At" value={selectedPayment.createdAt?.toLocaleString()} />
                  </div>

                  {selectedPayment.paymentScreenshot && (
                    <div className="group relative rounded-2xl overflow-hidden border border-slate-800">
                      <img src={selectedPayment.paymentScreenshot} alt="Proof" className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <FiEye /> Payment Proof
                        </p>
                      </div>
                      <a href={selectedPayment.paymentScreenshot} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors">
                        <FiDownload className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {selectedPayment.status?.toLowerCase() === 'pending' && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => handleVerifyPayment(selectedPayment.id, selectedPayment.type, 'reject')}
                        disabled={verifyingPayment}
                        className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <FiX className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(selectedPayment.id, selectedPayment.type, 'confirm')}
                        disabled={verifyingPayment}
                        className="py-3 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {verifyingPayment ? <FiRefreshCw className="animate-spin" /> : <FiCheck className="w-4 h-4" />}
                        Approve
                      </button>
                    </div>
                  )}

                  <div className="first:mt-0 mt-4">
                    <button
                      onClick={() => {
                        setSelectedUserId(selectedPayment.type === 'send' ? selectedPayment.senderId : selectedPayment.receiverId || selectedPayment.userId);
                        setShowUserProfile(true);
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <FiUser className="w-4 h-4" /> View User Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mb-6">
                  <FiSearch className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Select Transaction</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Click on a transaction from the list to view full details and verification options.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showUserProfile && selectedUserId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => { setShowUserProfile(false); setSelectedUserId(null); }}
              className="absolute top-6 right-6 p-2 bg-slate-950 rounded-xl text-slate-400 hover:text-white z-10"
            >
              <FiX />
            </button>
            <div className="p-8">
              <UserProfileView userId={selectedUserId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Components */
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex items-center justify-between`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-slate-950/20 backdrop-blur-md`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, copy }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-slate-300 truncate max-w-[200px]">{value}</span>
      {copy && (
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied'); }} className="text-slate-500 hover:text-white transition-colors">
          <FiCopy className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

export default PaymentVerification;