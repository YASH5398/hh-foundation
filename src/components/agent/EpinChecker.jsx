import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiSearch, FiUser, FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

const EpinChecker = () => {
  const [searchCode, setSearchCode] = useState('');
  const [epinData, setEpinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error('Please enter an E-PIN code');
      return;
    }

    setLoading(true);
    setSearched(true);
    setEpinData(null);

    try {
      // Search in epins collection
      const epinQuery = query(
        collection(db, 'epins'),
        where('epin', '==', searchCode.trim().toUpperCase())
      );

      const epinSnapshot = await getDocs(epinQuery);
      
      if (!epinSnapshot.empty) {
        const epinDoc = epinSnapshot.docs[0];
        const data = { id: epinDoc.id, ...epinDoc.data() };
        
        // If E-PIN is assigned to a user, get user details
        if (data.assignedTo) {
          const userQuery = query(
            collection(db, 'users'),
            where('userId', '==', data.assignedTo)
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            data.userDetails = {
              name: userData.fullName,
              email: userData.email,
              userId: userData.userId
            };
          }
        }
        
        setEpinData(data);
      } else {
        setEpinData(null);
        toast.error('E-PIN not found');
      }
    } catch (error) {
      console.error('Error searching E-PIN:', error);
      toast.error('Failed to search E-PIN');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unused':
        return <FiAlertCircle className="text-blue-500" />;
      case 'used':
        return <FiCheck className="text-green-500" />;
      case 'expired':
        return <FiX className="text-red-500" />;
      default:
        return <FiAlertCircle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unused':
        return 'bg-blue-100 text-blue-800';
      case 'used':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="epinCode" className="block text-sm font-medium text-gray-700 mb-2">
            E-PIN Code
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              id="epinCode"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Enter E-PIN code (e.g., HHF12345)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !searchCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <FiSearch />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Search Results */}
      {searched && (
        <div className="border border-gray-200 rounded-lg">
          {epinData ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">E-PIN Details</h3>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(epinData.status)}`}>
                  {getStatusIcon(epinData.status)}
                  <span className="capitalize">{epinData.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* E-PIN Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">E-PIN Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">E-PIN Code</label>
                      <p className="font-mono text-lg font-bold text-gray-900">{epinData.epin}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="capitalize font-medium">{epinData.status}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-gray-900">
                        {epinData.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    
                    {epinData.type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-gray-900">{epinData.type}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Usage Information</h4>
                  
                  <div className="space-y-3">
                    {epinData.assignedTo ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Assigned To</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <FiUser className="text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {epinData.userDetails?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                ID: {epinData.assignedTo}
                              </p>
                              {epinData.userDetails?.email && (
                                <p className="text-sm text-gray-500">
                                  {epinData.userDetails.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {epinData.assignedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Assigned At</label>
                            <p className="text-gray-900">
                              {epinData.assignedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <FiAlertCircle className="mx-auto text-gray-400 text-3xl mb-2" />
                        <p className="text-gray-500">Not assigned to any user</p>
                      </div>
                    )}
                    
                    {epinData.status === 'used' && (
                      <>
                        {epinData.usedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Used At</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <FiClock className="text-gray-400" />
                              <p className="text-gray-900">
                                {epinData.usedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {epinData.transactionId && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                            <p className="font-mono text-gray-900">{epinData.transactionId}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {epinData.transferredTo && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Transferred To</label>
                        <p className="font-mono text-gray-900">{epinData.transferredTo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FiSearch className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">E-PIN Not Found</h3>
              <p className="text-gray-600">The E-PIN code you searched for does not exist in our system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EpinChecker;