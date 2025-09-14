import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Send, ArrowRightLeft, History, Plus, Users } from "lucide-react";
import { generateEpins } from '../../../services/epin/epinService';
import { toast } from "react-hot-toast";

const EPinManagement = () => {
  const [availableEpins, setAvailableEpins] = useState(0);
  const [requestForm, setRequestForm] = useState({ count: 1, reason: '' });
  const [transferForm, setTransferForm] = useState({ recipientId: '', count: 1 });
  const [loading, setLoading] = useState({ request: false, transfer: false, generate: false });
  const [generatedEpins, setGeneratedEpins] = useState([]);
  const [epinHistory, setEpinHistory] = useState([
    { id: 1, date: '2024-01-15', type: 'Request', count: 5, status: 'success' },
    { id: 2, date: '2024-01-14', type: 'Transfer', count: 2, status: 'success' },
    { id: 3, date: '2024-01-13', type: 'Request', count: 10, status: 'failed' },
  ]);

  useEffect(() => {
    // Simulate fetching available E-PINs
    setAvailableEpins(25);
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, request: true }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Requested ${requestForm.count} E-PINs successfully`);
      setRequestForm({ count: 1, reason: '' });
    } catch (error) {
      toast.error('Failed to request E-PINs');
    } finally {
      setLoading(prev => ({ ...prev, request: false }));
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, transfer: true }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Transferred ${transferForm.count} E-PINs to ${transferForm.recipientId}`);
      setTransferForm({ recipientId: '', count: 1 });
    } catch (error) {
      toast.error('Failed to transfer E-PINs');
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
        toast.success(result.message);
        setAvailableEpins(prev => prev + quantity);
      } else {
        toast.error(result.message || "Failed to generate E-PINs");
      }
    } catch (err) {
      toast.error("Failed to generate E-PINs");
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <motion.div
        className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          variants={cardVariants}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            E-PIN Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your E-PIN requests, transfers, and history</p>
        </motion.div>

        {/* Available E-PINs Card */}
        <motion.div
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white backdrop-blur-sm bg-opacity-90"
          variants={cardVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                Available E-PINs
              </h2>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{availableEpins}</p>
              <p className="text-emerald-100 text-sm sm:text-base mt-1">Ready for distribution</p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Request E-PIN Section */}
          <motion.div
            className="bg-white backdrop-blur-sm bg-opacity-80 rounded-2xl shadow-lg p-6 sm:p-8 border border-white border-opacity-20"
            variants={cardVariants}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Request E-PIN
            </h3>
            <form onSubmit={handleRequestSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-PIN Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={requestForm.count}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Enter count"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Purpose of request"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  disabled={loading.request}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading.request ? 'Requesting...' : 'Submit Request'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setRequestForm({ count: 1, reason: '' })}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Transfer E-PIN Section */}
          <motion.div
            className="bg-white backdrop-blur-sm bg-opacity-80 rounded-2xl shadow-lg p-6 sm:p-8 border border-white border-opacity-20"
            variants={cardVariants}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              Transfer E-PIN
            </h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient User ID
                  </label>
                  <input
                    type="text"
                    value={transferForm.recipientId}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, recipientId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Enter recipient user ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={availableEpins}
                    value={transferForm.count}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Enter count"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Transfers are immediate and cannot be undone. Please verify the recipient ID carefully.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  disabled={loading.transfer || !transferForm.recipientId}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading.transfer ? 'Transferring...' : 'Transfer E-PINs'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setTransferForm({ recipientId: '', count: 1 })}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Generate E-PINs Section */}
        <motion.div
          className="bg-white backdrop-blur-sm bg-opacity-80 rounded-2xl shadow-lg p-6 sm:p-8 border border-white border-opacity-20"
          variants={cardVariants}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            Generate New E-PINs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 5, 10, 25].map((qty) => (
              <motion.button
                key={qty}
                onClick={() => handleGenerate(qty)}
                disabled={loading.generate}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading.generate ? 'Generating...' : `Generate ${qty}`}
              </motion.button>
            ))}
          </div>
          {generatedEpins.length > 0 && (
            <motion.div
              className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-semibold text-gray-800 mb-3">Generated E-PINs:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {generatedEpins.map((epin, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm text-blue-700 break-all">
                    {epin}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* E-PIN History Section */}
        <motion.div
          className="bg-white backdrop-blur-sm bg-opacity-80 rounded-2xl shadow-lg p-6 sm:p-8 border border-white border-opacity-20"
          variants={cardVariants}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            E-PIN History
          </h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full rounded-xl overflow-hidden shadow-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Count</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {epinHistory.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === 'Request' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'Request' ? <Plus className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.count}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'success' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {item.status === 'success' ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {epinHistory.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-900">{item.date}</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'success' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {item.status === 'success' ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    item.type === 'Request' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type === 'Request' ? <Plus className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                    {item.type}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{item.count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EPinManagement;