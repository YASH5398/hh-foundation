import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiUser, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const EpinChecker = () => {
  const [epinCode, setEpinCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentEpins, setRecentEpins] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0
  });

  useEffect(() => {
    // Real-time listener for recent E-PINs
    const epinsQuery = query(
      collection(db, 'epins'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(epinsQuery, (snapshot) => {
      const epinsData = [];
      snapshot.forEach((doc) => {
        epinsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRecentEpins(epinsData);
    }, (error) => {
      console.error('Error fetching recent E-PINs:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch E-PIN statistics
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const epinsRef = collection(db, 'epins');
      const snapshot = await getDocs(epinsRef);
      
      let total = 0;
      let active = 0;
      let used = 0;
      let expired = 0;

      snapshot.forEach((doc) => {
        const epin = doc.data();
        total++;
        
        if (epin.status === 'active') active++;
        else if (epin.status === 'used') used++;
        else if (epin.status === 'expired') expired++;
      });

      setStats({ total, active, used, expired });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const searchEpin = async () => {
    if (!epinCode.trim()) {
      toast.error('Please enter an E-PIN code');
      return;
    }

    setLoading(true);
    setSearchResult(null);

    try {
      const epinsRef = collection(db, 'epins');
      const q = query(epinsRef, where('code', '==', epinCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchResult({ found: false });
        toast.error('E-PIN not found');
      } else {
        const epinDoc = querySnapshot.docs[0];
        const epinData = { id: epinDoc.id, ...epinDoc.data() };
        setSearchResult({ found: true, data: epinData });
        toast.success('E-PIN found successfully');
      }
    } catch (error) {
      console.error('Error searching E-PIN:', error);
      toast.error('Failed to search E-PIN');
    } finally {
      setLoading(false);
    }
  };

  const updateEpinStatus = async (epinId, newStatus) => {
    try {
      await updateDoc(doc(db, 'epins', epinId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'used' && { usedAt: new Date() })
      });
      
      // Update local search result
      if (searchResult?.data?.id === epinId) {
        setSearchResult({
          ...searchResult,
          data: {
            ...searchResult.data,
            status: newStatus,
            ...(newStatus === 'used' && { usedAt: new Date() })
          }
        });
      }
      
      toast.success(`E-PIN marked as ${newStatus}`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating E-PIN:', error);
      toast.error('Failed to update E-PIN status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <FiCheckCircle className="w-4 h-4" />;
      case 'used': return <FiClock className="w-4 h-4" />;
      case 'expired': return <FiXCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-PIN Checker</h1>
          <p className="text-gray-600">Validate and manage E-PIN codes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total E-PINs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
              </div>
              <FiClock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <FiXCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* E-PIN Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Search E-PIN</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-PIN Code
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={epinCode}
                    onChange={(e) => setEpinCode(e.target.value.toUpperCase())}
                    placeholder="Enter E-PIN code (e.g., EPIN123456)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchEpin()}
                  />
                  <button
                    onClick={searchEpin}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSearch className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div className="mt-6 p-4 border rounded-lg">
                  {searchResult.found ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">E-PIN Details</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(searchResult.data.status)}`}>
                          {getStatusIcon(searchResult.data.status)}
                          <span className="ml-1">{searchResult.data.status?.toUpperCase()}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Code</p>
                          <p className="text-sm text-gray-900 font-mono">{searchResult.data.code}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Value</p>
                          <p className="text-sm text-gray-900">${searchResult.data.value || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Created</p>
                          <p className="text-sm text-gray-900">{formatDate(searchResult.data.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Expires</p>
                          <p className="text-sm text-gray-900">{formatDate(searchResult.data.expiresAt)}</p>
                        </div>
                        {searchResult.data.usedBy && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Used By</p>
                            <p className="text-sm text-gray-900">{searchResult.data.usedBy}</p>
                          </div>
                        )}
                        {searchResult.data.usedAt && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Used At</p>
                            <p className="text-sm text-gray-900">{formatDate(searchResult.data.usedAt)}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {searchResult.data.status === 'active' && (
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={() => updateEpinStatus(searchResult.data.id, 'used')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Mark as Used
                          </button>
                          <button
                            onClick={() => updateEpinStatus(searchResult.data.id, 'expired')}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Mark as Expired
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FiXCircle className="mx-auto h-12 w-12 text-red-400 mb-2" />
                      <h3 className="text-lg font-medium text-gray-900">E-PIN Not Found</h3>
                      <p className="text-sm text-gray-500">The E-PIN code you entered does not exist in our database.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent E-PINs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent E-PINs</h2>
            
            {recentEpins.length === 0 ? (
              <div className="text-center py-8">
                <FiDollarSign className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No E-PINs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEpins.map((epin) => (
                  <div key={epin.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-mono text-sm font-medium text-gray-900 mr-3">
                          {epin.code}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(epin.status)}`}>
                          {getStatusIcon(epin.status)}
                          <span className="ml-1">{epin.status?.toUpperCase()}</span>
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${epin.value || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <FiCalendar className="w-3 h-3 mr-1" />
                        <span>{formatDate(epin.createdAt)}</span>
                      </div>
                      {epin.usedBy && (
                        <div className="flex items-center">
                          <FiUser className="w-3 h-3 mr-1" />
                          <span>{epin.usedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpinChecker;