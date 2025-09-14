import React, { useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { MdPersonAdd, MdSearch } from 'react-icons/md';

const MakeAgent = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a valid User ID');
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      // Search for user by userId field
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', userId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('User not found with the provided User ID');
        setSearchResult(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() };
        setSearchResult(userData);
        
        if (userData.role === 'agent') {
          toast.success('This user is already an agent');
        }
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error('Failed to search for user. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleMakeAgent = async () => {
    if (!searchResult) {
      toast.error('Please search for a user first');
      return;
    }

    if (searchResult.role === 'agent') {
      toast.error('This user is already an agent');
      return;
    }

    setLoading(true);
    try {
      // Update user role to agent
      await updateDoc(doc(db, 'users', searchResult.id), {
        role: 'agent',
        status: searchResult.status || 'active',
        updatedAt: new Date().toISOString()
      });

      toast.success(`User ${searchResult.fullName || searchResult.name} has been made an agent successfully!`);
      
      // Update search result to reflect the change
      setSearchResult({
        ...searchResult,
        role: 'agent',
        updatedAt: new Date().toISOString()
      });
      
      setUserId('');
    } catch (error) {
      console.error('Error making user an agent:', error);
      toast.error('Failed to make user an agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUserId('');
    setSearchResult(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MdPersonAdd className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Make Agent</h1>
              <p className="text-sm sm:text-base text-purple-100 mt-1">Promote users to agent role</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdSearch className="w-5 h-5 text-gray-600" />
              Search User
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching || loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || loading || !userId.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <MdSearch className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* User Details Section */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                    <p className="text-gray-900 font-medium">{searchResult.fullName || searchResult.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900">{searchResult.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <p className="text-gray-900">{searchResult.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Current Role</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      searchResult.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                      searchResult.role === 'agent' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {searchResult.role || 'user'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      searchResult.status === 'active' ? 'bg-green-100 text-green-800' :
                      searchResult.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {searchResult.status || 'active'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">User ID</label>
                    <p className="text-gray-900 font-mono text-sm">{searchResult.userId}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            <button
              onClick={handleMakeAgent}
              disabled={loading || !searchResult || searchResult.role === 'agent'}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Making Agent...
                </>
              ) : (
                <>
                  <MdPersonAdd className="w-4 h-4" />
                  Make Agent
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
            >
              Reset
            </button>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">About Agent Role</h4>
                <p className="text-sm text-blue-700">
                  Agents have special privileges to access the agent dashboard and perform specific administrative tasks. 
                  Once promoted, users can log in and access agent-specific features.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MakeAgent;