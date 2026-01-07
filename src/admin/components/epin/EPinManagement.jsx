import React, { useState, useEffect } from "react";
import { CreditCard, Send, ArrowRightLeft, History, Plus, Users, CheckCircle, AlertTriangle, Loader2, RefreshCw, Search, Eye, EyeOff, Trash2, User } from "lucide-react";
import { generateEpins, getAllEpins, transferEpin } from '../../../services/epin/epinService';
import { toast } from "react-hot-toast";
import { useAuth } from '../../../context/AuthContext';

const EPinManagement = () => {
  const { user } = useAuth();
  const [availableEpins, setAvailableEpins] = useState(0);
  const [allEpins, setAllEpins] = useState([]);
  const [transferForm, setTransferForm] = useState({
    epinCode: '',
    recipientId: ''
  });
  const [loading, setLoading] = useState({
    transfer: false,
    generate: false,
    fetch: true
  });
  const [generatedEpins, setGeneratedEpins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerated, setShowGenerated] = useState(false);

  // Fetch all E-PINs and calculate available count
  const fetchEpins = async () => {
    try {
      setLoading(prev => ({ ...prev, fetch: true }));
      const result = await getAllEpins();
      if (result.success) {
        setAllEpins(result.epins);
        const available = result.epins.filter(epin => epin.status === 'unused').length;
        setAvailableEpins(available);
      } else {
        toast.error('Failed to fetch E-PINs');
      }
    } catch (error) {
      console.error('Error fetching E-PINs:', error);
      toast.error('Failed to fetch E-PINs');
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  useEffect(() => {
    fetchEpins();
  }, []);


  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    if (!transferForm.epinCode || !transferForm.recipientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(prev => ({ ...prev, transfer: true }));
    try {
      const result = await transferEpin(
        transferForm.epinCode.trim(),
        user.uid,
        transferForm.recipientId.trim()
      );

      if (result.success) {
        toast.success(result.message);
        setTransferForm({ epinCode: '', recipientId: '' });
        // Refresh E-PIN data
        await fetchEpins();
      } else {
        toast.error(result.message || 'Failed to transfer E-PIN');
      }
    } catch (error) {
      console.error('Error transferring E-PIN:', error);
      toast.error('Failed to transfer E-PIN');
    } finally {
      setLoading(prev => ({ ...prev, transfer: false }));
    }
  };

  const handleGenerate = async (quantity) => {
    setLoading(prev => ({ ...prev, generate: true }));
    setGeneratedEpins([]);
    try {
      const result = await generateEpins(quantity);
      if (result.success) {
        setGeneratedEpins(result.generated);
        setShowGenerated(true);
        toast.success(result.message);
        // Refresh E-PIN data
        await fetchEpins();
      } else {
        toast.error(result.message || "Failed to generate E-PINs");
      }
    } catch (err) {
      console.error('Error generating E-PINs:', err);
      toast.error("Failed to generate E-PINs");
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  // Filter E-PINs based on search
  const filteredEpins = allEpins.filter(epin =>
    epin.epin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    epin.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    epin.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <CreditCard className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              E-PIN Management
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Manage E-PIN generation, requests, transfers, and tracking</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              {loading.fetch ? (
                <div className="animate-pulse bg-slate-600 rounded h-8 w-12"></div>
              ) : (
                <span className="text-3xl font-bold text-white">{availableEpins}</span>
              )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Available E-PINs</h3>
            <p className="text-slate-500 text-xs mt-1">Ready for assignment</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              {loading.fetch ? (
                <div className="animate-pulse bg-slate-600 rounded h-8 w-12"></div>
              ) : (
                <span className="text-3xl font-bold text-white">
                  {allEpins.filter(epin => epin.assignedTo && epin.status === 'unused').length}
                </span>
              )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Assigned E-PINs</h3>
            <p className="text-slate-500 text-xs mt-1">Currently in use</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              {loading.fetch ? (
                <div className="animate-pulse bg-slate-600 rounded h-8 w-12"></div>
              ) : (
                <span className="text-3xl font-bold text-white">
                  {allEpins.filter(epin => epin.status === 'used').length}
                </span>
              )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Used E-PINs</h3>
            <p className="text-slate-500 text-xs mt-1">Successfully activated</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-all duration-300">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              {loading.fetch ? (
                <div className="animate-pulse bg-slate-600 rounded h-8 w-12"></div>
              ) : (
                <span className="text-3xl font-bold text-white">{allEpins.length}</span>
              )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total E-PINs</h3>
            <p className="text-slate-500 text-xs mt-1">All time generated</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Transfer E-PIN Section */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <ArrowRightLeft className="text-white w-5 h-5" />
              </div>
              Transfer E-PIN
            </h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    E-PIN Code
                  </label>
                  <input
                    type="text"
                    value={transferForm.epinCode}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, epinCode: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono"
                    placeholder="Enter E-PIN code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Recipient User ID
                  </label>
                  <input
                    type="text"
                    value={transferForm.recipientId}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, recipientId: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter recipient user ID"
                    required
                  />
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
                <p className="text-sm text-red-300">
                  <strong>Warning:</strong> Transfers are immediate and cannot be undone. Please verify both the E-PIN code and recipient ID carefully.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading.transfer || !transferForm.epinCode || !transferForm.recipientId}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading.transfer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    'Transfer E-PIN'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTransferForm({ epinCode: '', recipientId: '' })}
                  className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 font-medium rounded-xl transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Generate E-PINs Section */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Plus className="text-white w-5 h-5" />
              </div>
              Generate New E-PINs
            </h3>
            <button
              onClick={() => setShowGenerated(!showGenerated)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
            >
              {showGenerated ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showGenerated ? 'Hide' : 'Show'} Generated
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 5, 10, 25].map((qty) => (
              <button
                key={qty}
                onClick={() => handleGenerate(qty)}
                disabled={loading.generate}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading.generate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate {qty}
                  </>
                )}
              </button>
            ))}
          </div>
          {generatedEpins.length > 0 && showGenerated && (
            <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Generated E-PINs ({generatedEpins.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {generatedEpins.map((epin, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 font-mono text-sm text-blue-300 break-all flex items-center justify-between">
                    <span>{epin}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(epin)}
                      className="text-slate-400 hover:text-blue-400 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* E-PIN Tracking Section */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg">
                <History className="text-white w-5 h-5" />
              </div>
              E-PIN Tracking
            </h3>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search E-PINs, users, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                    <th className="px-6 py-4 font-semibold text-left">E-PIN Code</th>
                    <th className="px-6 py-4 font-semibold text-left">Status</th>
                    <th className="px-6 py-4 font-semibold text-left">Assigned To</th>
                    <th className="px-6 py-4 font-semibold text-left">Transferred To</th>
                    <th className="px-6 py-4 font-semibold text-left">Created</th>
                    <th className="px-6 py-4 font-semibold text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading.fetch ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400 bg-slate-900/30">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading E-PINs...
                        </div>
                      </td>
                    </tr>
                  ) : filteredEpins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400 bg-slate-900/30">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-500" />
                          <p>No E-PINs found matching your search</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEpins.map((epin, index) => (
                      <tr key={epin.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-blue-400 font-semibold">{epin.epin}</div>
                            <button
                              onClick={() => navigator.clipboard.writeText(epin.epin)}
                              className="text-slate-400 hover:text-blue-400 transition-colors p-1 hover:bg-slate-700/50 rounded"
                              title="Copy E-PIN"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                            epin.status === 'unused'
                              ? 'bg-green-900/50 text-green-300 border border-green-700'
                              : epin.status === 'used'
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                : epin.status === 'transferred'
                                  ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                  : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          }`}>
                            {epin.status === 'unused' && <CheckCircle className="w-3 h-3" />}
                            {epin.status === 'used' && <CheckCircle className="w-3 h-3" />}
                            {epin.status === 'transferred' && <ArrowRightLeft className="w-3 h-3" />}
                            {epin.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {epin.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-white font-mono text-sm">{epin.assignedTo}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {epin.transferredTo ? (
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-300 font-mono text-sm">{epin.transferredTo}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">
                          {epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {epin.status === 'unused' && (
                              <button
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                title="Delete E-PIN"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {loading.fetch ? (
              <div className="text-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading E-PINs...
              </div>
            ) : filteredEpins.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-800/50 rounded-2xl">
                <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p>No E-PINs found matching your search</p>
              </div>
            ) : (
              filteredEpins.map((epin, index) => (
                <div key={epin.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-blue-400 font-semibold text-lg">{epin.epin}</div>
                      <button
                        onClick={() => navigator.clipboard.writeText(epin.epin)}
                        className="text-slate-400 hover:text-blue-400 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                        title="Copy E-PIN"
                      >
                        📋
                      </button>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                      epin.status === 'unused'
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : epin.status === 'used'
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          : epin.status === 'transferred'
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                      {epin.status === 'unused' && <CheckCircle className="w-3 h-3" />}
                      {epin.status === 'used' && <CheckCircle className="w-3 h-3" />}
                      {epin.status === 'transferred' && <ArrowRightLeft className="w-3 h-3" />}
                      {epin.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400 mb-1">Assigned To</div>
                      <div className="flex items-center gap-2">
                        {epin.assignedTo ? (
                          <>
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-white font-mono">{epin.assignedTo}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400 mb-1">Created</div>
                      <div className="text-white">
                        {epin.createdAt?.toDate ? epin.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {epin.transferredTo && (
                    <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-purple-300 text-sm">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Transferred to: <span className="font-mono">{epin.transferredTo}</span></span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {epin.status === 'unused' && (
                      <button
                        className="flex items-center gap-2 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 hover:text-white hover:bg-red-800/50 transition-all duration-200"
                        title="Delete E-PIN"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EPinManagement;