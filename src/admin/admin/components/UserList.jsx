import React, { useState } from 'react';
import { FaEdit, FaTrash, FaLock, FaUnlock, FaSyncAlt, FaLevelUpAlt } from 'react-icons/fa';

const UserList = ({ users, onUserAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterActivated, setFilterActivated] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm) ||
      (user.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const matchesLevel = filterLevel ? String(user.level) === filterLevel : true;
    const matchesActivated = filterActivated ? String(user.isActivated) === filterActivated : true;

    return matchesSearch && matchesLevel && matchesActivated;
  });

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">User Management</h2>

      {/* Search and Filter */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-4">
        <div className="sm:col-span-1 lg:col-span-1">
          <input
            type="text"
            placeholder="Search by Name, Email, Phone, User ID..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            value={filterActivated}
            onChange={(e) => setFilterActivated(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="true">Activated</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Full Name</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Email</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Phone</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">WhatsApp</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">User ID</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Level</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Activated</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">Blocked</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Join Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Sponsor ID</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Referral Count</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 break-words">{user.fullName}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 break-all">{user.email}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.phone}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.whatsapp}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 break-all">{user.userId}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.level}</td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActivated ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.isBlocked ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.joinDate?.toDate().toLocaleDateString() || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.sponsorId || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{user.referralCount || 0}</td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <button
                        onClick={() => onUserAction(user.id, user.isActivated ? 'deactivate' : 'activate')}
                        className={`p-2 sm:p-3 rounded-lg text-white transition-all duration-200 hover:scale-105 touch-manipulation ${user.isActivated ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                        title={user.isActivated ? 'Deactivate User' : 'Activate User'}
                      >
                        <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onUserAction(user.id, user.isBlocked ? 'unblock' : 'block')}
                        className={`p-2 sm:p-3 rounded-lg text-white transition-all duration-200 hover:scale-105 touch-manipulation ${user.isBlocked ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                      >
                        {user.isBlocked ? <FaUnlock className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaLock className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => onUserAction(user.id, 'resetPassword')}
                        className="p-2 sm:p-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-200 hover:scale-105 touch-manipulation"
                        title="Reset Password"
                      >
                        <FaSyncAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newLevel = prompt(`Enter new level for ${user.fullName} (current: ${user.level}):`);
                          if (newLevel && !isNaN(newLevel) && newLevel >= 1 && newLevel <= 5) {
                            onUserAction(user.id, 'setLevel', parseInt(newLevel));
                          } else if (newLevel) {
                            alert('Invalid level. Please enter a number between 1 and 5.');
                          }
                        }}
                        className="p-2 sm:p-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 hover:scale-105 touch-manipulation"
                        title="Set Level"
                      >
                        <FaLevelUpAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) {
                            onUserAction(user.id, 'delete');
                          }
                        }}
                        className="p-2 sm:p-3 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100 touch-manipulation"
                        title="Delete User"
                        disabled={user.isActivated} // Disable if activated
                      >
                        <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="px-3 sm:px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-base font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search criteria or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;