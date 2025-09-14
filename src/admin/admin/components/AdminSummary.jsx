import React from 'react';

const AdminSummary = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total E-PINs Card */}
      <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Total E-PINs</h3>
        <p className="text-3xl font-bold">{stats?.totalEpins || 0}</p>
      </div>

      {/* Used E-PINs Card */}
      <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Used E-PINs</h3>
        <p className="text-3xl font-bold">{stats?.usedEpins || 0}</p>
      </div>

      {/* Unused E-PINs Card */}
      <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Unused E-PINs</h3>
        <p className="text-3xl font-bold">{stats?.unusedEpins || 0}</p>
      </div>
    </div>
  );
};

export default AdminSummary;