import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Eye, EyeOff, User, Users, RefreshCw, Edit, XCircle, List, Eye as EyeIcon, EyeOff as EyeOffIcon, AlertTriangle, CheckCircle, Ban, Search, Filter, MoreHorizontal, TrendingUp, Activity, Zap, Clock, Target, ChevronDown, ChevronUp, Star, Award, Crown, Diamond, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

function getStatusColor(assigned, max) {
  if (assigned <= max) return 'text-green-600';
  return 'text-red-600';
}

function getStatusIcon(assigned, max) {
  if (assigned <= max) return '✅';
  return '⚠️';
}

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

export default function ManageHelpAssignments() {
  const [receivers, setReceivers] = useState([]);
  const [sendHelpMap, setSendHelpMap] = useState({});
  const [confirmedHelpMap, setConfirmedHelpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(null);
  const [unassignModal, setUnassignModal] = useState(null);
  const [confirmVisibility, setConfirmVisibility] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibilityAction, setVisibilityAction] = useState('hide');
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Get all receivers (helpVisibility !== false)
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
      // 4. Get all confirmed receiveHelp docs
      const receiveHelpSnap = await getDocs(query(collection(db, 'receiveHelp'), where('confirmedByReceiver', '==', true)));
      const confirmedMap = {};
      receiveHelpSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!confirmedMap[data.receiverId]) confirmedMap[data.receiverId] = 0;
        confirmedMap[data.receiverId]++;
      });
      setConfirmedHelpMap(confirmedMap);
      setReceivers(users);
      setLoading(false);
    }
    fetchData();
  }, [refreshKey, showHidden]);

  // Filtering and sorting logic
  const filteredAndSortedReceivers = receivers
    .filter(r => {
      const matchesSearch = searchTerm === '' ||
        r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = levelFilter === 'All' || r.levelStatus === levelFilter;

      const assigned = confirmedHelpMap[r.userId] || 0;
      const maxAllowed = getMaxAllowed(r.levelStatus);
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Within Limit' && assigned <= maxAllowed) ||
        (statusFilter === 'Exceeded' && assigned > maxAllowed) ||
        (statusFilter === 'Hidden' && r.helpVisibility === false) ||
        (statusFilter === 'Visible' && r.helpVisibility !== false);

      return matchesSearch && matchesLevel && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case 'name':
          aVal = (a.fullName || a.name || '').toLowerCase();
          bVal = (b.fullName || b.name || '').toLowerCase();
          break;
        case 'level':
          const levels = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];
          aVal = levels.indexOf(a.levelStatus);
          bVal = levels.indexOf(b.levelStatus);
          break;
        case 'assigned':
          aVal = confirmedHelpMap[a.userId] || 0;
          bVal = confirmedHelpMap[b.userId] || 0;
          break;
        case 'userId':
          aVal = a.userId.toLowerCase();
          bVal = b.userId.toLowerCase();
          break;
        default:
          return 0;
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedReceivers.length === filteredAndSortedReceivers.length) {
      setSelectedReceivers([]);
    } else {
      setSelectedReceivers(filteredAndSortedReceivers.map(r => r.uid));
    }
  };

  const handleSelectReceiver = (receiverId) => {
    setSelectedReceivers(prev =>
      prev.includes(receiverId)
        ? prev.filter(id => id !== receiverId)
        : [...prev, receiverId]
    );
  };

  const handleBulkVisibilityToggle = async (action) => {
    const selectedData = receivers.filter(r => selectedReceivers.includes(r.uid));
    for (const receiver of selectedData) {
      try {
        if (action === 'hide') {
          await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: false, isReceivingHeld: true });
          toast.success(`Hidden ${receiver.userId}`);
        } else {
          await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: true, isReceivingHeld: false });
          toast.success(`Shown ${receiver.userId}`);
        }
      } catch (error) {
        toast.error(`Failed to update ${receiver.userId}`);
      }
    }
    setSelectedReceivers([]);
    setRefreshKey(k => k + 1);
  };

  // Statistics calculations
  const stats = receivers.reduce((acc, r) => {
    const assigned = confirmedHelpMap[r.userId] || 0;
    const maxAllowed = getMaxAllowed(r.levelStatus);
    const isExceeded = assigned > maxAllowed;

    acc.total++;
    if (isExceeded) acc.exceeded++;
    if (r.helpVisibility === false) acc.hidden++;
    acc.totalAssigned += assigned;
    acc.totalCapacity += maxAllowed;

    return acc;
  }, { total: 0, exceeded: 0, hidden: 0, totalAssigned: 0, totalCapacity: 0 });

  // Toggle helpVisibility with confirmation
  const handleToggleVisibility = (receiver) => {
    setConfirmVisibility(receiver);
    setVisibilityAction(receiver.helpVisibility === false ? 'show' : 'hide');
  };

  const confirmToggleVisibility = async (receiver) => {
    if (receiver.helpVisibility === false) {
      // Show receiver
      await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: true, isReceivingHeld: false });
      toast.success(`Receiver ${receiver.userId} is now visible and eligible for assignments.`);
    } else {
      // Hide receiver
      await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: false, isReceivingHeld: true });
      toast.success(`Receiver ${receiver.userId} is now hidden and held.`);
    }
    setConfirmVisibility(null);
    setRefreshKey(k => k + 1);
  };

  // Unassign sender and trigger reassignment
  const handleUnassignSender = async (sendHelp) => {
    await deleteDoc(doc(db, 'sendHelp', sendHelp.id));
    await deleteDoc(doc(db, 'receiveHelp', sendHelp.id));
    toast.success(`Sender ${sendHelp.senderId} unassigned from ${sendHelp.receiverId}`);
    setUnassignModal(null);
    setRefreshKey(k => k + 1);
  };

  // Toggle isHidden for sendHelp doc
  const handleToggleHideSendHelp = async (sendHelp) => {
    const newHidden = !sendHelp.isHidden;
    await updateDoc(doc(db, 'sendHelp', sendHelp.id), { isHidden: newHidden });
    toast.success(`SendHelp ${newHidden ? 'hidden' : 'unhidden'}`);
    setRefreshKey(k => k + 1);
  };

  // Quick view modal for receiver
  const ReceiverProfileModal = ({ receiver, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-6 relative">
        <button
          className="absolute top-4 right-4 rounded-full bg-slate-700 hover:bg-slate-600 shadow-lg border border-slate-600 text-xl text-slate-400 hover:text-white focus:text-white focus:outline-none transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-110"
          onClick={onClose}
          aria-label="Close"
        >
          <XCircle size={20} />
        </button>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <User className="text-white w-5 h-5" />
          </div>
          {receiver.fullName || receiver.name || '-'} ({receiver.userId})
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Level:</span>
            <span className="text-white font-semibold">{receiver.levelStatus}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Referral Count:</span>
            <span className="text-white font-semibold">{receiver.referralCount}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Help Received:</span>
            <span className="text-white font-semibold">{receiver.helpReceived}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Activation Status:</span>
            <span className={`font-semibold ${receiver.isActivated ? 'text-green-400' : 'text-red-400'}`}>
              {receiver.isActivated ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Blocked:</span>
            <span className={`font-semibold flex items-center gap-1 ${receiver.isBlocked ? 'text-red-400' : 'text-green-400'}`}>
              {receiver.isBlocked ? <><Ban className="w-4 h-4" /> Yes</> : <><CheckCircle className="w-4 h-4" /> No</>}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium">Help Visibility:</span>
            <span className={`font-semibold ${receiver.helpVisibility === false ? 'text-orange-400' : 'text-green-400'}`}>
              {receiver.helpVisibility === false ? 'Hidden' : 'Visible'}
            </span>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 font-medium block mb-1">Assigned Senders:</span>
            <span className="text-white text-sm">
              {(sendHelpMap[receiver.userId] || []).length === 0 ? 'None' : (sendHelpMap[receiver.userId] || []).map(sh => sh.senderId).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Unassign modal
  const UnassignModal = ({ receiver, onClose }) => {
    const assigned = sendHelpMap[receiver.userId] || [];
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full p-6 relative">
          <button
            className="absolute top-4 right-4 rounded-full bg-slate-700 hover:bg-slate-600 shadow-lg border border-slate-600 text-xl text-slate-400 hover:text-white focus:text-white focus:outline-none transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-110"
            onClick={onClose}
            aria-label="Close"
          >
            <XCircle size={20} />
          </button>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Users className="text-white w-5 h-5" />
            </div>
            Assigned Senders for {receiver.userId}
          </h3>
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full text-sm text-left border border-slate-700 bg-slate-800/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                  <th className="px-4 py-3 font-semibold">Sender ID</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {assigned.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 bg-slate-900/30">
                      No senders assigned
                    </td>
                  </tr>
                ) : (
                  assigned.map(sh => (
                    <tr key={sh.id} className="border-b border-slate-700/50 last:border-0 bg-slate-900/20 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{sh.senderId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          sh.status === 'completed' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                          sh.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                          'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}>
                          {sh.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {sh.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">₹{sh.amount?.toLocaleString() || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <button
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all duration-200 hover:shadow-lg hover:scale-105"
                          onClick={() => handleUnassignSender(sh)}
                        >
                          Remove & Reassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation modal for visibility
  const ConfirmVisibilityModal = ({ receiver, onClose, onConfirm, action }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-xl text-slate-400 hover:text-white transition-colors"
          onClick={onClose}
        >
          <XCircle size={24} />
        </button>
        <div className="mb-4">
          <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${action === 'hide' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
              {action === 'hide' ? <EyeOff className="text-white w-5 h-5" /> : <Eye className="text-white w-5 h-5" />}
            </div>
            {action === 'hide' ? 'Hide Receiver?' : 'Show Receiver?'}
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {action === 'hide'
              ? `Are you sure you want to hide ${receiver.userId} from assignment? They will not receive any new help.`
              : `Show ${receiver.userId} in assignment lists?`
            }
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              action === 'hide'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            }`}
            onClick={() => onConfirm(receiver)}
          >
            {action === 'hide' ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Users className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Manage Help Assignments
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Monitor and manage help assignment limits and visibility</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Receivers</h3>
            <p className="text-slate-500 text-xs mt-1">Active help receivers</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-300">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.exceeded}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Limit Exceeded</h3>
            <p className="text-slate-500 text-xs mt-1">Over-assigned receivers</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                <EyeOff className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.hidden}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Hidden Receivers</h3>
            <p className="text-slate-500 text-xs mt-1">Not visible for assignments</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">{Math.round((stats.totalAssigned / Math.max(stats.totalCapacity, 1)) * 100)}%</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Capacity Used</h3>
            <p className="text-slate-500 text-xs mt-1">{stats.totalAssigned} / {stats.totalCapacity} assignments</p>
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
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
              >
                <Filter className="w-5 h-5" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedReceivers.length > 0 && (
              <div className="flex gap-2">
                <span className="text-slate-400 text-sm self-center mr-2">
                  {selectedReceivers.length} selected
                </span>
                <button
                  onClick={() => handleBulkVisibilityToggle('hide')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                >
                  <EyeOff className="w-4 h-4" />
                  Hide All
                </button>
                <button
                  onClick={() => handleBulkVisibilityToggle('show')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  Show All
                </button>
              </div>
            )}

            <button
              className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg"
              onClick={() => setRefreshKey(k => k + 1)}
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Level</label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="All">All Levels</option>
                    <option value="Star">Star</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="All">All Status</option>
                    <option value="Within Limit">Within Limit</option>
                    <option value="Exceeded">Exceeded</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Visible">Visible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="name">Name</option>
                    <option value="userId">User ID</option>
                    <option value="level">Level</option>
                    <option value="assigned">Assigned Count</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Responsive Table/Card Layout */
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                      <th className="px-4 py-4 font-semibold text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectedReceivers.length === filteredAndSortedReceivers.length && filteredAndSortedReceivers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                      <th className="px-6 py-4 font-semibold text-left">Receiver Name</th>
                      <th className="px-6 py-4 font-semibold text-left">Receiver ID</th>
                      <th className="px-6 py-4 font-semibold text-center">Level</th>
                      <th className="px-6 py-4 font-semibold text-center">Assignment Progress</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">Visibility</th>
                      <th className="px-6 py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedReceivers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-slate-400 bg-slate-900/30">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-slate-500" />
                            <p>No receivers found matching your criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedReceivers.map(r => {
                        const assigned = confirmedHelpMap[r.userId] || 0;
                        const maxAllowed = getMaxAllowed(r.levelStatus);
                        const isExceeded = assigned > maxAllowed;
                        const progressPercent = Math.min((assigned / maxAllowed) * 100, 100);
                        const isSelected = selectedReceivers.includes(r.uid);

                        return (
                          <tr key={r.uid} className={`border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-all duration-200 ${isExceeded ? 'bg-red-900/10' : ''} ${isSelected ? 'bg-blue-900/20 border-blue-700/50' : ''}`}>
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
                                  <div className="text-slate-400 text-xs">{r.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                className="font-mono text-blue-400 hover:text-blue-300 underline transition-colors"
                                onClick={() => setProfileModal(r)}
                              >
                                {r.userId}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {getLevelIcon(r.levelStatus)}
                                <span className="inline-flex items-center px-3 py-1 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-full text-xs font-medium">
                                  {r.levelStatus}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-white font-semibold">{assigned}</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-slate-300">{maxAllowed}</span>
                                </div>
                                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      isExceeded
                                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                                        : progressPercent > 75
                                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                          : 'bg-gradient-to-r from-green-500 to-green-600'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                                isExceeded
                                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                                  : 'bg-green-900/50 text-green-300 border border-green-700'
                              }`}>
                                {isExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                {isExceeded ? 'Exceeded' : 'Within Limit'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                  onClick={() => handleToggleVisibility(r)}
                                >
                                  {r.helpVisibility === false ? (
                                    <EyeOff className="w-5 h-5 text-orange-400 hover:text-orange-300" />
                                  ) : (
                                    <Eye className="w-5 h-5 text-green-400 hover:text-green-300" />
                                  )}
                                </button>
                                <span className={`text-xs ${r.helpVisibility === false ? 'text-orange-400' : 'text-green-400'}`}>
                                  {r.helpVisibility === false ? 'Hidden' : 'Visible'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                                  onClick={() => setUnassignModal(r)}
                                >
                                  <List className="w-4 h-4" />
                                  View
                                </button>
                                {isExceeded && (
                                  <button
                                    className="flex items-center gap-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                                    onClick={() => setUnassignModal(r)}
                                  >
                                    <Edit className="w-4 h-4" />
                                    Reassign
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

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {filteredAndSortedReceivers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-slate-500" />
                    <p>No receivers found matching your criteria</p>
                  </div>
                </div>
              ) : (
                filteredAndSortedReceivers.map(r => {
                  const assigned = confirmedHelpMap[r.userId] || 0;
                  const maxAllowed = getMaxAllowed(r.levelStatus);
                  const isExceeded = assigned > maxAllowed;
                  const progressPercent = Math.min((assigned / maxAllowed) * 100, 100);
                  const isSelected = selectedReceivers.includes(r.uid);

                  return (
                    <div key={r.uid} className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border p-6 transition-all duration-200 ${isExceeded ? 'border-red-700/50' : 'border-slate-700'} ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : ''}`}>
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
                              {getLevelIcon(r.levelStatus)}
                              <h3 className="text-lg font-semibold text-white">{r.fullName || r.name || '-'}</h3>
                            </div>
                            <button
                              className="font-mono text-blue-400 hover:text-blue-300 underline transition-colors text-sm"
                              onClick={() => setProfileModal(r)}
                            >
                              {r.userId}
                            </button>
                            <div className="text-slate-400 text-xs mt-1">{r.email}</div>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                          isExceeded
                            ? 'bg-red-900/50 text-red-300 border border-red-700'
                            : 'bg-green-900/50 text-green-300 border border-green-700'
                        }`}>
                          {isExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isExceeded ? 'Exceeded' : 'Within Limit'}
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-400">Assignment Progress</span>
                          <span className="text-sm text-white font-medium">{assigned} / {maxAllowed}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isExceeded
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : progressPercent > 75
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Level and Visibility */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <div className="text-slate-400 mb-1">Level</div>
                          <div className="flex items-center gap-2">
                            {getLevelIcon(r.levelStatus)}
                            <span className="text-white font-medium">{r.levelStatus}</span>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <div className="text-slate-400 mb-1">Visibility</div>
                          <div className="flex items-center gap-2">
                            {r.helpVisibility === false ? (
                              <EyeOff className="w-4 h-4 text-orange-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-green-400" />
                            )}
                            <span className={`font-medium ${r.helpVisibility === false ? 'text-orange-400' : 'text-green-400'}`}>
                              {r.helpVisibility === false ? 'Hidden' : 'Visible'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button
                          className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-slate-700/50"
                          onClick={() => handleToggleVisibility(r)}
                        >
                          {r.helpVisibility === false ? (
                            <EyeOff className="w-5 h-5 text-orange-400 hover:text-orange-300" />
                          ) : (
                            <Eye className="w-5 h-5 text-green-400 hover:text-green-300" />
                          )}
                          <span className="text-sm text-slate-300">
                            {r.helpVisibility === false ? 'Show' : 'Hide'}
                          </span>
                        </button>
                        <div className="flex gap-2">
                          <button
                            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                            onClick={() => setUnassignModal(r)}
                          >
                            <List className="w-4 h-4" />
                            View
                          </button>
                          {isExceeded && (
                            <button
                              className="flex items-center gap-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                              onClick={() => setUnassignModal(r)}
                            >
                              <Edit className="w-4 h-4" />
                              Reassign
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Modals */}
        {profileModal && <ReceiverProfileModal receiver={profileModal} onClose={() => setProfileModal(null)} />}
        {unassignModal && <UnassignModal receiver={unassignModal} onClose={() => setUnassignModal(null)} />}
        {confirmVisibility && <ConfirmVisibilityModal receiver={confirmVisibility} onClose={() => setConfirmVisibility(null)} onConfirm={confirmToggleVisibility} action={visibilityAction} />}
      </div>
    </div>
  );
} 