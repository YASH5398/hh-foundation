import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { MdLock, MdAdd, MdSwapHoriz, MdHistory, MdSearch, MdFilterList } from 'react-icons/md';

const STATUS_OPTIONS = ['unused', 'used'];

function randomEpin() {
  return 'EPIN-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

const EpinManager = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [editModal, setEditModal] = useState(null); // {epin: {...}}
  const [userCache, setUserCache] = useState({});
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ epin: '', assignedTo: '', status: 'unused', transferredTo: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkGenerated, setBulkGenerated] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const isMounted = useRef(true);

  // User name lookup with cache
  const getUserName = async (uid) => {
    if (!uid) return '';
    if (userCache[uid]) return userCache[uid];
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      const name = userDoc.exists() ? userDoc.data().fullName || userDoc.data().username || uid : uid;
      setUserCache((prev) => ({ ...prev, [uid]: name }));
      return name;
    } catch {
      return uid;
    }
  };

  // Real-time E-PIN sync
  useEffect(() => {
    isMounted.current = true;
    const q = query(collection(db, 'epins'), where('status', '!=', null));
    const unsub = onSnapshot(q, async (snapshot) => {
      const pins = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        pins.push({ id: docSnap.id, ...data });
        // Preload user names for assignedTo and transferredTo
        if (data.assignedTo) getUserName(data.assignedTo);
        if (data.transferredTo) getUserName(data.transferredTo);
      }
      if (isMounted.current) setEpins(pins);
      setLoading(false);
    });
    return () => { isMounted.current = false; unsub(); };
  }, []);

  // Admin-only protection (must be after all hooks)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <div className="text-center py-8 text-red-600 font-bold">Access Denied: Admins only</div>;
  }

  // Filter, search, sort
  const filteredEpins = epins
    .filter((epin) => {
      const matchesStatus = filterStatus === 'all' || epin.status === filterStatus;
      const matchesSearch =
        epin.epin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (epin.assignedTo && epin.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (userCache[epin.assignedTo] && userCache[epin.assignedTo].toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      } else if (sortBy === 'status') {
        return sortDir === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

  // Edit modal handlers
  const openEditModal = (epin) => setEditModal({ ...epin });
  const closeEditModal = () => setEditModal(null);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const updateObj = {
        assignedTo: editModal.assignedTo,
        transferredTo: editModal.transferredTo,
        status: editModal.status,
      };
      await updateDoc(doc(db, 'epins', editModal.id), updateObj);
      toast.success('E-PIN updated successfully!');
      closeEditModal();
    } catch (err) {
      toast.error('Failed to update E-PIN');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this E-PIN?')) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'epins', id));
      toast.success('E-PIN deleted');
    } catch {
      toast.error('Failed to delete E-PIN');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Create new E-PIN
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleGenerateEpin = () => {
    setCreateForm((prev) => ({ ...prev, epin: randomEpin() }));
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    if (!createForm.epin || !createForm.assignedTo) {
      toast.error('E-PIN code and Assigned To are required');
      setCreateLoading(false);
      return;
    }
    try {
      await addDoc(collection(db, 'epins'), {
        epin: createForm.epin,
        assignedTo: createForm.assignedTo,
        status: createForm.status,
        transferredTo: createForm.transferredTo || '',
        createdAt: serverTimestamp(),
      });
      toast.success('E-PIN created!');
      setCreateForm({ epin: '', assignedTo: '', status: 'unused', transferredTo: '' });
      setCreateModal(false);
    } catch {
      toast.error('Failed to create E-PIN');
    } finally {
      setCreateLoading(false);
    }
  };

  // Bulk E-PIN generation handler
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    if (bulkQuantity < 1 || bulkQuantity > 100) {
      toast.error('Please enter a quantity between 1 and 100.');
      return;
    }
    setBulkLoading(true);
    setBulkGenerated([]);
    try {
      const generated = [];
      for (let i = 0; i < bulkQuantity; i++) {
        const epin = randomEpin();
        await addDoc(collection(db, 'epins'), {
          epin,
          status: 'unused',
          assignedTo: '',
          transferredTo: '',
          createdAt: serverTimestamp(),
        });
        generated.push(epin);
      }
      setBulkGenerated(generated);
      toast.success(`${bulkQuantity} E-PIN${bulkQuantity > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error('Failed to generate E-PINs');
    } finally {
      setBulkLoading(false);
      setBulkQuantity(1);
    }
  };

  const tabs = [
    { id: 'available', label: 'Available E-PINs', icon: MdLock },
    { id: 'request', label: 'Request E-PIN', icon: MdAdd },
    { id: 'transfer', label: 'Transfer E-PIN', icon: MdSwapHoriz },
    { id: 'history', label: 'E-PIN History', icon: MdHistory }
  ];

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          <span className="ml-3 text-slate-400">Loading E-PINs...</span>
        </div>
      </div>
    );
  }

  const availableEpinsCount = epins.filter(epin => epin.status === 'unused').length;
  const usedEpinsCount = epins.filter(epin => epin.status === 'used').length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-700"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-blue-900/30 rounded-xl backdrop-blur-sm">
            <MdLock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">E-PIN Management</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage and monitor E-PIN distribution</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 mb-4 sm:mb-6 overflow-hidden"
      >
        <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap touch-manipulation ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-900/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-800 rounded-xl shadow-sm border border-slate-700"
      >
        {activeTab === 'available' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Cards */}
            <div className="p-3 sm:p-4 md:p-6 border-b border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">Available E-PINs</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{availableEpinsCount}</p>
                    </div>
                    <MdLock className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-slate-600" />
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">Used E-PINs</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{usedEpinsCount}</p>
                    </div>
                    <MdHistory className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-slate-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="p-3 sm:p-4 md:p-6 border-b border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation"
                  >
                    <option value="all">All Status</option>
                    <option value="unused">Available</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Search E-PINs</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by E-PIN or User ID"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="epin">E-PIN Code</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>

            {/* E-PINs List */}
            <div className="p-6">
              {filteredEpins.length === 0 ? (
                <div className="text-center py-12">
                  <MdHistory className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-medium">No E-PINs Found</p>
                  <p className="text-slate-500">No E-PINs match your current filters.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-700">
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">E-PIN</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned To</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {filteredEpins.map((epin, index) => (
                          <tr key={epin.id} className={`${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900/20'} hover:bg-slate-700/50 transition-colors`}>
                            <td className="px-4 py-4 text-sm font-mono text-white">{epin.epin}</td>
                            <td className="px-4 py-4 text-sm text-slate-400">
                              {epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                {epin.transferredTo ? 'Transfer' : 'Request'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${epin.status === 'used' ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                {epin.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-400">
                              {userCache[epin.assignedTo] || epin.assignedTo || 'Unassigned'}
                            </td>
                            <td className="px-4 py-4 text-sm space-x-2">
                              <button
                                onClick={() => openEditModal(epin)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(epin.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {filteredEpins.map((epin) => (
                      <div key={epin.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-mono text-sm font-medium text-gray-900">{epin.epin}</p>
                            <p className="text-xs text-gray-500">
                              {epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${epin.status === 'used' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {epin.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium">{epin.transferredTo ? 'Transfer' : 'Request'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Assigned To:</span>
                            <span className="font-medium">{userCache[epin.assignedTo] || epin.assignedTo || 'Unassigned'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => openEditModal(epin)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(epin.id)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'request' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <MdAdd className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Bulk Generate E-PINs</h2>
                <p className="text-slate-400">Generate multiple E-PINs at once for distribution</p>
              </div>

              <form onSubmit={handleBulkGenerate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Quantity (max 100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkQuantity}
                    onChange={e => setBulkQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-slate-500"
                    placeholder="Enter quantity (1-100)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {bulkLoading ? 'Generating...' : `Generate ${bulkQuantity} E-PIN${bulkQuantity > 1 ? 's' : ''}`}
                </button>
              </form>

              {bulkGenerated.length > 0 && (
                <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-4">Generated E-PINs:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {bulkGenerated.map((epin, idx) => (
                      <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <code className="text-blue-400 font-mono text-sm break-all">{epin}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'transfer' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <MdAdd className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Create Single E-PIN</h2>
                <p className="text-slate-400">Create a single E-PIN with optional user assignment</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">E-PIN Code</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="epin"
                      className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-slate-500"
                      placeholder="E-PIN code"
                      value={createForm.epin}
                      onChange={handleCreateChange}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateEpin}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Assign To (UID, optional)</label>
                  <input
                    type="text"
                    name="assignedTo"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-slate-500"
                    placeholder="User UID"
                    value={createForm.assignedTo}
                    onChange={handleCreateChange}
                  />
                  {createForm.assignedTo && userCache[createForm.assignedTo] && (
                    <p className="text-sm text-slate-400 mt-2">{userCache[createForm.assignedTo]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                  <select
                    name="status"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    value={createForm.status}
                    onChange={handleCreateChange}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Transferred To (UID, optional)</label>
                  <input
                    type="text"
                    name="transferredTo"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-slate-500"
                    placeholder="User UID (optional)"
                    value={createForm.transferredTo}
                    onChange={handleCreateChange}
                  />
                  {createForm.transferredTo && userCache[createForm.transferredTo] && (
                    <p className="text-sm text-slate-400 mt-2">{userCache[createForm.transferredTo]}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {createLoading ? 'Creating...' : 'Create E-PIN'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="text-center mb-8">
              <MdHistory className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">E-PIN History</h2>
              <p className="text-slate-400">View all E-PIN transactions and activities</p>
            </div>

            {/* This would contain the history view - for now showing the same table */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-500">E-PIN history functionality coming soon...</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit E-PIN</h3>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">E-PIN Code</label>
                  <input
                    type="text"
                    value={editModal.epin}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Assigned To (UID)</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={editModal.assignedTo}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
                    placeholder="Enter user UID"
                  />
                  {editModal.assignedTo && userCache[editModal.assignedTo] && (
                    <p className="text-sm text-slate-400 mt-1">{userCache[editModal.assignedTo]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Transferred To (UID)</label>
                  <input
                    type="text"
                    name="transferredTo"
                    value={editModal.transferredTo || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
                    placeholder="Optional - Enter user UID"
                  />
                  {editModal.transferredTo && userCache[editModal.transferredTo] && (
                    <p className="text-sm text-slate-400 mt-1">{userCache[editModal.transferredTo]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                  <select
                    name="status"
                    value={editModal.status}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editLoading}
                    className="flex-1 px-4 py-3 text-slate-300 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(editModal.id)}
                    disabled={editLoading || deleteLoading}
                    className="px-4 py-3 bg-red-900/40 border border-red-500/50 hover:bg-red-900/60 text-red-400 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EpinManager;