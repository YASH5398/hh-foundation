import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllEpins } from '../services/adminService';

const EpinTable = () => {
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'used', 'unused'
  const [filterType, setFilterType] = useState('all'); // 'all', 'Normal', 'Upgrade'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEpins();
  }, []);

  const fetchEpins = async () => {
    setLoading(true);
    try {
      const result = await getAllEpins();
      if (result.success) {
        setEpins(result.epins);
      } else {
        toast.error(`Failed to fetch E-PINs: ${result.message}`);
      }
    } catch (error) {
      console.error('Error fetching E-PINs:', error);
      toast.error('An unexpected error occurred while fetching E-PINs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEpins = epins.filter(epin => {
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'used' ? epin.isUsed : !epin.isUsed);
    const matchesType = filterType === 'all' || epin.type === filterType;
    const matchesSearch = (epin.epin?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (epin.usedBy?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading) {
    return <div className="p-4 text-center">Loading E-PINs...</div>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">E-PIN List</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="all">All</option>
            <option value="used">Used</option>
            <option value="unused">Unused</option>
          </select>
        </div>
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
          <select
            id="typeFilter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="all">All</option>
            <option value="Normal">Normal</option>
            <option value="Upgrade">Upgrade</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">Search E-PIN / Used By</label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search E-PIN or User ID"
            className="w-full p-3 rounded-lg border border-gray-300 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {filteredEpins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-base">No E-PINs found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">E-PIN</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Type</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Status</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Used By</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEpins.map((epin) => (
                <tr key={epin.epin} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 break-all">{epin.epin}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{epin.type}</td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${epin.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {epin.isUsed ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 break-all">{epin.usedBy || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{epin.createdAt?.toDate().toLocaleString() || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EpinTable;