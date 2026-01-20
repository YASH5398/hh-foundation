import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, writeBatch, Timestamp, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
<<<<<<< HEAD
import { formatDate } from '../../utils/formatDate';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
import { Eye, EyeOff, Users, Target, CheckCircle, AlertTriangle, XCircle, Search, Filter, RefreshCw, Loader2, User, FileText, TrendingUp, Activity, Crown, Award, Diamond, Star, Settings, Zap, BarChart3, ClipboardList, Trash2, X, Send } from 'lucide-react';

const LEVEL_LIMITS = {
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243,
};

function getMaxAllowed(level) {
  return LEVEL_LIMITS[level] || 3;
}

<<<<<<< HEAD
=======
function formatDate(ts) {
  if (!ts) return '-';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return '-';
  }
}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

function getLevelIcon(level) {
  switch(level) {
    case 'Star': return <Star className="w-4 h-4 text-yellow-400" />;
    case 'Silver': return <Award className="w-4 h-4 text-gray-300" />;
    case 'Gold': return <Award className="w-4 h-4 text-yellow-500" />;
    case 'Platinum': return <Crown className="w-4 h-4 text-purple-400" />;
    case 'Diamond': return <Diamond className="w-4 h-4 text-blue-400" />;
    default: return <User className="w-4 h-4 text-slate-400" />;
  }
}

function getLevelColor(level) {
  switch(level) {
    case 'Star': return 'from-yellow-400 to-yellow-600';
    case 'Silver': return 'from-gray-300 to-gray-500';
    case 'Gold': return 'from-yellow-400 to-yellow-600';
    case 'Platinum': return 'from-purple-400 to-purple-600';
    case 'Diamond': return 'from-blue-400 to-blue-600';
    default: return 'from-slate-400 to-slate-600';
  }
}

function getStatusBadge(assigned, maxAllowed, confirmed) {
  if (assigned > maxAllowed) {
    return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700', label: 'Exceeded' };
  }
  if (confirmed >= 3) {
    return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700', label: 'Complete' };
  }
  if (assigned > 0) {
    return { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700', label: 'Active' };
  }
  return { icon: Users, color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-600', label: 'Available' };
}

export default function DocumentManager() {
  const [receivers, setReceivers] = useState([]);
  const [sendHelpMap, setSendHelpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [batchFixing, setBatchFixing] = useState(false);
  const [expandedReceiver, setExpandedReceiver] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [confirmedHelpCounts, setConfirmedHelpCounts] = useState({});
  const [expandedReceiveHelps, setExpandedReceiveHelps] = useState([]);
  const [forceConfirmingId, setForceConfirmingId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch all active receivers and their sendHelp assignments
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Get all active receivers
      const usersSnap = await getDocs(query(collection(db, 'users'), where('isActivated', '==', true)));
      const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
      // 2. Get all sendHelp docs
      let sendHelpQ = collection(db, 'sendHelp');
      if (!showHidden) {
        sendHelpQ = query(sendHelpQ, where('isHidden', '!=', true));
      }
      const sendHelpSnap = await getDocs(sendHelpQ);
      const sendHelps = sendHelpSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // 3. Map receiverId to senders
      const map = {};
      for (const sh of sendHelps) {
        if (!map[sh.receiverId]) map[sh.receiverId] = [];
        map[sh.receiverId].push(sh);
      }
      setSendHelpMap(map);
      setReceivers(users);
      // 4. Fetch confirmed receiveHelp counts for each user
      const confirmedCounts = {};
      for (const user of users) {
        const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', user.userId), where('status', '==', 'confirmed'));
        const snap = await getDocs(q);
        confirmedCounts[user.userId] = snap.size;
      }
      setConfirmedHelpCounts(confirmedCounts);
      // 5. Pending confirmations
      const pending = sendHelps.filter(sh => sh.status === 'Pending' && sh.paymentDetails && sh.paymentDetails.screenshotUrl);
      setPendingConfirmations(pending);
      setLoading(false);
    }
    fetchData();
  }, [showHidden]);

  // Fetch receiveHelp docs when expandedReceiver changes
  useEffect(() => {
    async function fetchReceiveHelpsForUser() {
      if (!expandedReceiver) {
        setExpandedReceiveHelps([]);
        return;
      }
      const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver));
      const snap = await getDocs(q);
      setExpandedReceiveHelps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchReceiveHelpsForUser();
  }, [expandedReceiver]);

  // Handler for Force Confirm
  async function handleForceConfirm(receiveHelpDoc, receiverUid) {
    setForceConfirmingId(receiveHelpDoc.id);
    try {
      // Get user doc to check helpReceived
      const userRef = doc(db, 'users', receiverUid);
      const userSnap = await getDoc(userRef);
      const helpReceived = userSnap.exists() ? (userSnap.data().helpReceived || 0) : 0;
      if (helpReceived >= 3) {
        toast.error('User already has 3 confirmed helps.');
        setForceConfirmingId(null);
        return;
      }
      const batch = writeBatch(db);
      // Update receiveHelp doc
      const receiveHelpRef = doc(db, 'receiveHelp', receiveHelpDoc.id);
      batch.update(receiveHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Update sendHelp doc (same ID)
      const sendHelpRef = doc(db, 'sendHelp', receiveHelpDoc.id);
      batch.update(sendHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Increment helpReceived for user
      batch.update(userRef, { helpReceived: helpReceived + 1 });
      await batch.commit();
      toast.success('Force Confirmed!');
      // Refresh receiveHelp docs and confirmed counts
      const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver));
      const snap = await getDocs(q);
      setExpandedReceiveHelps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Also refresh confirmedHelpCounts
      const confirmedQ = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver), where('status', '==', 'confirmed'));
      const confirmedSnap = await getDocs(confirmedQ);
      setConfirmedHelpCounts(prev => ({ ...prev, [expandedReceiver]: confirmedSnap.size }));
      await checkAndAutoHoldUser(receivers.find(u => u.userId === expandedReceiver)?.uid, expandedReceiver);
    } catch (err) {
      toast.error('Force Confirm failed.');
      console.error(err);
    } finally {
      setForceConfirmingId(null);
    }
  }

  // Add after handleForceConfirm and any other confirmation logic
  async function checkAndAutoHoldUser(receiverUid, receiverUserId) {
    // 1. Query all receiveHelp docs for this user with status == 'confirmed' and confirmedByReceiver == true
    const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', receiverUserId), where('status', '==', 'confirmed'), where('confirmedByReceiver', '==', true));
    const snap = await getDocs(q);
    if (snap.size === 3) {
      // 2. Get user doc
      const userRef = doc(db, 'users', receiverUid);
      // 3. Get all 3 doc IDs
      const docIds = snap.docs.map(d => d.id);
      // 4. Prepare batch
      const batch = writeBatch(db);
      // 5. Update user
      batch.update(userRef, {
        helpReceived: 3,
        isReceivingHeld: true,
        isOnHold: true,
      });
      // 6. For each doc, update receiveHelp and sendHelp if not already confirmed
      for (const docId of docIds) {
        const receiveHelpRef = doc(db, 'receiveHelp', docId);
        const receiveHelpSnap = await getDoc(receiveHelpRef);
        const rh = receiveHelpSnap.data();
        if (rh.status !== 'confirmed' || !rh.confirmedByReceiver) {
          batch.update(receiveHelpRef, {
            status: 'confirmed',
            confirmedByReceiver: true,
            confirmationTime: Timestamp.now(),
          });
        }
        const sendHelpRef = doc(db, 'sendHelp', docId);
        const sendHelpSnap = await getDoc(sendHelpRef);
        const sh = sendHelpSnap.exists() ? sendHelpSnap.data() : null;
        if (sh && (sh.status !== 'confirmed' || !sh.confirmedByReceiver)) {
          batch.update(sendHelpRef, {
            status: 'confirmed',
            confirmedByReceiver: true,
            confirmationTime: Timestamp.now(),
          });
        }
      }
      await batch.commit();
      toast.success('User auto-held and all helps confirmed!');
    }
  }

  // Statistics calculations
  const stats = receivers.reduce((acc, r) => {
    const assigned = sendHelpMap[r.userId]?.length || 0;
    const maxAllowed = getMaxAllowed(r.levelStatus);
    const confirmed = confirmedHelpCounts[r.userId] || 0;

    acc.total++;
    if (assigned > maxAllowed) acc.exceeded++;
    if (confirmed >= 3) acc.completed++;
    if (assigned > 0 && confirmed < 3) acc.active++;
    if (assigned === 0) acc.available++;
    acc.totalAssigned += assigned;
    acc.totalConfirmed += confirmed;

    return acc;
  }, { total: 0, exceeded: 0, completed: 0, active: 0, available: 0, totalAssigned: 0, totalConfirmed: 0 });

  // Filtered receivers
  const filteredReceivers = receivers.filter(r => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = r.userId?.toLowerCase().includes(searchLower) ||
                           r.fullName?.toLowerCase().includes(searchLower) ||
                           r.name?.toLowerCase().includes(searchLower) ||
                           r.email?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Level filter
    if (levelFilter && r.levelStatus !== levelFilter) return false;

    // Status filter
    if (statusFilter) {
      const assigned = sendHelpMap[r.userId]?.length || 0;
      const maxAllowed = getMaxAllowed(r.levelStatus);
      const confirmed = confirmedHelpCounts[r.userId] || 0;

      switch(statusFilter) {
        case 'exceeded':
          if (assigned <= maxAllowed) return false;
          break;
        case 'completed':
          if (confirmed < 3) return false;
          break;
        case 'active':
          if (assigned === 0 || confirmed >= 3) return false;
          break;
        case 'available':
          if (assigned > 0) return false;
          break;
      }
    }

    return true;
  });

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedReceivers.length === filteredReceivers.length) {
      setSelectedReceivers([]);
    } else {
      setSelectedReceivers(filteredReceivers.map(r => r.uid));
    }
  };

  const handleSelectReceiver = (receiverId) => {
    setSelectedReceivers(prev =>
      prev.includes(receiverId)
        ? prev.filter(id => id !== receiverId)
        : [...prev, receiverId]
    );
  };

  const handleBulkFixOverAssigned = async () => {
    if (selectedReceivers.length === 0) {
      toast.error('Please select receivers to fix');
      return;
    }

    const selectedData = receivers.filter(r => selectedReceivers.includes(r.uid));
    let fixedCount = 0;

    for (const receiver of selectedData) {
      const assigned = sendHelpMap[receiver.userId] || [];
      const maxAllowed = getMaxAllowed(receiver.levelStatus);
      if (assigned.length > maxAllowed) {
        await handleRemoveExcess(receiver);
        fixedCount++;
      }
    }

    setSelectedReceivers([]);
    toast.success(`Fixed ${fixedCount} over-assigned receiver(s)`);
  };

  // Remove excess senders for a receiver
  const handleRemoveExcess = async (receiver) => {
    const assigned = sendHelpMap[receiver.userId] || [];
    const maxAllowed = getMaxAllowed(receiver.levelStatus);
    const excess = assigned.slice(maxAllowed);

    for (const sh of excess) {
      await deleteDoc(doc(db, 'sendHelp', sh.id));
      await deleteDoc(doc(db, 'receiveHelp', sh.id));
    }

    toast.success(`Removed ${excess.length} excess sender(s) from ${receiver.userId}`);
    // Refresh data
    setTimeout(() => window.location.reload(), 500);
  };

  // Manual reassign sender
  const handleManualReassign = async (sendHelpId, senderUid) => {
    await deleteDoc(doc(db, 'sendHelp', sendHelpId));
    await deleteDoc(doc(db, 'receiveHelp', sendHelpId));
    toast.success(`Sender reassigned. Please run assignment for sender.`);
    // Optionally: reassign sender
    // await assignReceiverOnActivation(senderUid); // If callable from frontend
  };

  // Batch fix all over-assigned receivers
  const handleBatchFix = async () => {
    setBatchFixing(true);
    for (const r of receivers) {
      const assigned = sendHelpMap[r.userId]?.length || 0;
      const maxAllowed = getMaxAllowed(r.levelStatus);
      if (assigned > maxAllowed) {
        await handleRemoveExcess(r);
      }
    }
    setBatchFixing(false);
    toast.success('Batch fix complete!');
  };

  // Cleanup invalid receivers
  const handleCleanupInvalid = async () => {
    for (const r of receivers) {
      if (r.isBlocked || r.isReceivingHeld || r.paymentBlocked) {
        const assigned = sendHelpMap[r.userId] || [];
        for (const sh of assigned) {
          await deleteDoc(doc(db, 'sendHelp', sh.id));
          await deleteDoc(doc(db, 'receiveHelp', sh.id));
        }
      }
    }
    toast.success('Invalid receiver cleanup complete!');
  };

  // Toggle isHidden for sendHelp doc
  const handleToggleHideSendHelp = async (sendHelp) => {
    setActionLoading(prev => ({ ...prev, [sendHelp.id]: true }));
    try {
      const newHidden = !sendHelp.isHidden;
      await updateDoc(doc(db, 'sendHelp', sendHelp.id), { isHidden: newHidden });
      toast.success(`Assignment ${newHidden ? 'hidden' : 'unhidden'}`);
      // Update local state
      setSendHelpMap(prev => ({
        ...prev,
        [expandedReceiver]: prev[expandedReceiver]?.map(sh =>
          sh.id === sendHelp.id ? { ...sh, isHidden: newHidden } : sh
        ) || []
      }));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update assignment visibility');
    } finally {
      setActionLoading(prev => ({ ...prev, [sendHelp.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Document Manager
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Manage help assignments, receiver confirmations, and document tracking</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.total}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Receivers</h3>
            <p className="text-slate-500 text-xs mt-1">Active receivers</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.completed}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Completed</h3>
            <p className="text-slate-500 text-xs mt-1">3 confirms received</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.active}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Active</h3>
            <p className="text-slate-500 text-xs mt-1">In progress</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-300">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.exceeded}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Over-Assigned</h3>
            <p className="text-slate-500 text-xs mt-1">Need fixing</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-slate-500/20 to-slate-600/20 rounded-xl group-hover:from-slate-500/30 group-hover:to-slate-600/30 transition-all duration-300">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.available}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Available</h3>
            <p className="text-slate-500 text-xs mt-1">Ready for assignment</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, user ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="" className="bg-slate-800 text-white">All Levels</option>
                  {Object.keys(LEVEL_LIMITS).map(level => (
                    <option key={level} value={level} className="bg-slate-800 text-white">{level}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="" className="bg-slate-800 text-white">All Status</option>
                  <option value="exceeded" className="bg-slate-800 text-white">Over-Assigned</option>
                  <option value="completed" className="bg-slate-800 text-white">Completed</option>
                  <option value="active" className="bg-slate-800 text-white">Active</option>
                  <option value="available" className="bg-slate-800 text-white">Available</option>
                </select>
                <TrendingUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedReceivers.length > 0 && (
                <button
                  onClick={handleBulkFixOverAssigned}
                  disabled={batchFixing}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchFixing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  Fix Selected ({selectedReceivers.length})
                </button>
              )}

              <button
                onClick={handleCleanupInvalid}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                <Trash2 className="w-5 h-5" />
                Cleanup Invalid
              </button>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-slate-300 font-medium">Show hidden</span>
              </label>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                  <th className="px-4 py-4 font-semibold text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedReceivers.length === filteredReceivers.length && filteredReceivers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-left">Receiver</th>
                  <th className="px-6 py-4 font-semibold text-center">Level</th>
                  <th className="px-6 py-4 font-semibold text-center">Assignment Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Progress</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400 bg-slate-900/30">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading receivers...
                      </div>
                    </td>
                  </tr>
                ) : filteredReceivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400 bg-slate-900/30">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-slate-500" />
                        <p>No receivers found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReceivers.map(r => {
                    const assigned = sendHelpMap[r.userId]?.length || 0;
                    const maxAllowed = getMaxAllowed(r.levelStatus);
                    const confirmed = confirmedHelpCounts[r.userId] || 0;
                    const isSelected = selectedReceivers.includes(r.uid);
                    const statusBadge = getStatusBadge(assigned, maxAllowed, confirmed);

                    return (
                      <tr key={r.uid} className={`border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-all duration-200 ${isSelected ? 'bg-blue-900/20 border-blue-700/50' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectReceiver(r.uid)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{r.fullName || r.name || '-'}</div>
                              <div className="text-slate-400 text-sm font-mono">{r.userId}</div>
                              <div className="text-slate-500 text-xs">{r.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getLevelIcon(r.levelStatus)}
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getLevelColor(r.levelStatus)} text-white border border-slate-600`}>
                              {r.levelStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-white">
                            <div className="text-lg font-semibold">{assigned} / {maxAllowed}</div>
                            <div className="text-slate-400 text-sm">assigned</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-white font-medium">{confirmed}/3</div>
                            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                style={{ width: `${Math.min((confirmed / 3) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.border} border`}>
                            <statusBadge.icon className={`w-3 h-3 ${statusBadge.color}`} />
                            <span className={statusBadge.color}>{statusBadge.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {assigned > maxAllowed && (
                              <button
                                onClick={() => handleRemoveExcess(r)}
                                className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                              >
                                <Zap className="w-4 h-4" />
                                Fix
                              </button>
                            )}
                            {assigned > 0 && (
                              <button
                                onClick={() => setExpandedReceiver(expandedReceiver === r.userId ? null : r.userId)}
                                className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                              >
                                <Eye className="w-4 h-4" />
                                {expandedReceiver === r.userId ? 'Hide' : 'View'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4 mb-8">
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p>Loading receivers...</p>
            </div>
          ) : filteredReceivers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 text-lg">No receivers found</p>
              <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredReceivers.map(r => {
              const assigned = sendHelpMap[r.userId]?.length || 0;
              const maxAllowed = getMaxAllowed(r.levelStatus);
              const confirmed = confirmedHelpCounts[r.userId] || 0;
              const isSelected = selectedReceivers.includes(r.uid);
              const statusBadge = getStatusBadge(assigned, maxAllowed, confirmed);

              return (
                <div key={r.uid} className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border p-6 transition-all duration-200 ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700'}`}>
                  {/* Selection and Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectReceiver(r.uid)}
                        className="w-5 h-5 mt-1 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{r.fullName || r.name || '-'}</h3>
                          {confirmed >= 3 && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="text-slate-400 text-sm font-mono mb-1">{r.userId}</div>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(r.levelStatus)}
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getLevelColor(r.levelStatus)} text-white border border-slate-600`}>
                            {r.levelStatus}
                          </span>
                          <div className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.border} border`}>
                            <statusBadge.icon className={`w-3 h-3 ${statusBadge.color}`} />
                            <span className={statusBadge.color}>{statusBadge.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm">Assignments</span>
                      <span className="text-white font-medium">{assigned} / {maxAllowed}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          assigned > maxAllowed
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : assigned === maxAllowed
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${Math.min((assigned / maxAllowed) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Confirmation Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm">Confirmations</span>
                      <span className="text-white font-medium">{confirmed}/3</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{ width: `${Math.min((confirmed / 3) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {assigned > maxAllowed && (
                      <button
                        onClick={() => handleRemoveExcess(r)}
                        className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <Zap className="w-4 h-4" />
                        Fix Excess
                      </button>
                    )}
                    {assigned > 0 && (
                      <button
                        onClick={() => setExpandedReceiver(expandedReceiver === r.userId ? null : r.userId)}
                        className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        {expandedReceiver === r.userId ? 'Hide' : 'View'} Senders
                      </button>
                    )}
                  </div>

                  {/* Expanded Sender Details */}
                  {expandedReceiver === r.userId && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Assigned Senders
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(sendHelpMap[r.userId] || []).map(sh => (
                          <div key={sh.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-blue-400 font-medium">{sh.senderId}</span>
                              <button
                                onClick={() => handleToggleHideSendHelp(sh)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                  sh.isHidden
                                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                                }`}
                              >
                                {sh.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {sh.isHidden ? 'Hidden' : 'Visible'}
                              </button>
                            </div>
                            <div className="text-sm text-slate-300 space-y-1">
                              <div><span className="font-medium">Name:</span> {sh.senderName || 'N/A'}</div>
                              <div><span className="font-medium">Status:</span> {sh.status}</div>
                              <div><span className="font-medium">Assigned:</span> {formatDate(sh.createdAt || sh.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Receive Help Confirmations */}
                      {expandedReceiveHelps.length > 0 && (
                        <div className="mt-6">
                          <h5 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Confirmation Details
                          </h5>
                          <div className="space-y-2">
                            {expandedReceiveHelps.map(rh => (
                              <div key={rh.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                                <div className="text-sm">
                                  <div className="font-mono text-blue-400">{rh.id.slice(0, 8)}...</div>
                                  <div className="text-slate-300">₹{rh.amount} • {rh.status}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {rh.confirmedByReceiver ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                  ) : (
                                    receivers.find(u => u.userId === expandedReceiver)?.helpReceived < 3 && (
                                      <button
                                        onClick={() => handleForceConfirm(rh, receivers.find(u => u.userId === expandedReceiver)?.uid)}
                                        disabled={forceConfirmingId === rh.id}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                                      >
                                        {forceConfirmingId === rh.id ? 'Confirming...' : 'Force Confirm'}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sender Details Modal */}
        {expandedReceiver && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
              <div className="absolute top-4 right-4 z-50">
                <button
                  className="rounded-full bg-slate-700 hover:bg-slate-600 shadow-lg border border-slate-600 text-xl text-slate-400 hover:text-white focus:text-white focus:outline-none transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-110"
                  onClick={() => setExpandedReceiver(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Eye className="text-white w-5 h-5" />
                  </div>
                  Assignment Details for {expandedReceiver}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Send Help Assignments */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Send className="w-5 h-5 text-green-400" />
                      Send Help Assignments
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(sendHelpMap[expandedReceiver] || []).map(sh => (
                        <div key={sh.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-blue-400 font-medium">{sh.senderId}</span>
                            <button
                              onClick={() => handleToggleHideSendHelp(sh)}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                                sh.isHidden
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                              }`}
                            >
                              {sh.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {sh.isHidden ? 'Hidden' : 'Visible'}
                            </button>
                          </div>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div><span className="font-medium text-slate-400">Name:</span> {sh.senderName || 'N/A'}</div>
                            <div><span className="font-medium text-slate-400">Status:</span> {sh.status}</div>
                            <div><span className="font-medium text-slate-400">Amount:</span> ₹{sh.amount}</div>
                            <div><span className="font-medium text-slate-400">Assigned:</span> {formatDate(sh.createdAt || sh.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receive Help Confirmations */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                      Receive Help Confirmations
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {expandedReceiveHelps.map(rh => (
                        <div key={rh.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-purple-400 font-medium text-sm">{rh.id.slice(0, 12)}...</span>
                            <div className="flex items-center gap-2">
                              {rh.confirmedByReceiver ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                receivers.find(u => u.userId === expandedReceiver)?.helpReceived < 3 && (
                                  <button
                                    onClick={() => handleForceConfirm(rh, receivers.find(u => u.userId === expandedReceiver)?.uid)}
                                    disabled={forceConfirmingId === rh.id}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                                  >
                                    {forceConfirmingId === rh.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Force Confirm'
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div><span className="font-medium text-slate-400">Amount:</span> ₹{rh.amount}</div>
                            <div><span className="font-medium text-slate-400">Status:</span> {rh.status}</div>
                            <div><span className="font-medium text-slate-400">Confirmed:</span> {rh.confirmedByReceiver ? 'Yes' : 'No'}</div>
                            {rh.confirmationTime && (
                              <div><span className="font-medium text-slate-400">Confirmed At:</span> {formatDate(rh.confirmationTime)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 