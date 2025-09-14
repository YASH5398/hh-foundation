import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiUsers, FiUserPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiMail, FiPhone, FiCalendar, FiUser, FiEye, FiX, FiSave, FiUserCheck, FiUserX, FiDollarSign, FiStar, FiShield, FiLock, FiUnlock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, edit, create
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    address: '',
    dateOfBirth: '',
    emergencyContact: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    admins: 0,
    agents: 0,
    users: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedUserForLevel, setSelectedUserForLevel] = useState(null);
  const [newLevel, setNewLevel] = useState(1);

  useEffect(() => {
    // Real-time listener for users
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = [];
      let active = 0, inactive = 0, suspended = 0;
      let admins = 0, agents = 0, regularUsers = 0;

      snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        usersData.push(userData);
        
        // Count by status
        switch (userData.status?.toLowerCase()) {
          case 'active': active++; break;
          case 'inactive': inactive++; break;
          case 'suspended': suspended++; break;
        }
        
        // Count by role
        switch (userData.role?.toLowerCase()) {
          case 'admin': admins++; break;
          case 'agent': agents++; break;
          default: regularUsers++; break;
        }
      });

      setUsers(usersData);
      setStats({
        total: usersData.length,
        active,
        inactive,
        suspended,
        admins,
        agents,
        users: regularUsers
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm) ||
                         user.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActivated) ||
                         (statusFilter === 'inactive' && !user.isActivated);
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        address: '',
        dateOfBirth: '',
        emergencyContact: ''
      });
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        status: user.status || 'active',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        emergencyContact: user.emergencyContact || ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalMode('view');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await addDoc(collection(db, 'users'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('User created successfully');
      } else if (modalMode === 'edit' && selectedUser) {
        await updateDoc(doc(db, 'users', selectedUser.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('User updated successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleLevelChange = (user) => {
    setSelectedUserForLevel(user);
    setNewLevel(user.level || 1);
    setShowLevelModal(true);
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm('Are you sure you want to block this user?')) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isActivated: false,
          blockedAt: new Date()
        });
        toast.success('User blocked successfully');
      } catch (error) {
        console.error('Error blocking user:', error);
        toast.error('Failed to block user');
      }
    }
  };

  const handleUnblockUser = async (userId) => {
    if (window.confirm('Are you sure you want to unblock this user?')) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isActivated: true,
          unblockedAt: new Date()
        });
        toast.success('User unblocked successfully');
      } catch (error) {
        console.error('Error unblocking user:', error);
        toast.error('Failed to unblock user');
      }
    }
  };

  const handleLevelUpdate = async () => {
    if (!selectedUserForLevel) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUserForLevel.id), {
        level: parseInt(newLevel),
        levelUpdatedAt: new Date()
      });
      toast.success('User level updated successfully');
      setShowLevelModal(false);
      setSelectedUserForLevel(null);
    } catch (error) {
      console.error('Error updating user level:', error);
      toast.error('Failed to update user level');
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`User ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <button
              onClick={() => openModal('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiUserPlus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUsers className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <FiUserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <FiUser className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <FiUserX className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <FiUser className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-blue-600">{stats.agents}</p>
              </div>
              <FiUser className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-gray-600">{stats.users}</p>
              </div>
              <FiUsers className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiFilter className="w-4 h-4 mr-1" />
                Showing {filteredUsers.length} of {stats.total} users
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {/* Profile Image */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profileImage ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={user.profileImage} alt={user.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Full Name */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    </td>
                    {/* User ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{user.userId || user.id.substring(0, 8)}</div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                    </td>
                    {/* WhatsApp */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.whatsapp || user.phone || 'N/A'}</div>
                    </td>
                    {/* Sponsor ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{user.sponsorId || 'N/A'}</div>
                    </td>
                    {/* Level */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <FiStar className="w-3 h-3 mr-1" />
                        {user.level || 1}
                      </span>
                    </td>
                    {/* Referral Count */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.referralCount || 0}</div>
                    </td>
                    {/* Status (isActivated) */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActivated ? <FiUnlock className="w-3 h-3 mr-1" /> : <FiLock className="w-3 h-3 mr-1" />}
                        {user.isActivated ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Registration Time */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt || user.registrationTime)}
                    </td>
                    {/* Total Earnings */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ₹{user.totalEarnings || 0}
                      </div>
                    </td>
                    {/* Total Sent */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        ₹{user.totalSent || 0}
                      </div>
                    </td>
                    {/* Total Received */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        ₹{user.totalReceived || 0}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openModal('view', user)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                          title="View Full Details"
                        >
                          <FiEye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openModal('edit', user)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                          title="Edit Profile"
                        >
                          <FiEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleLevelChange(user)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50"
                          title="Change Level"
                        >
                          <FiStar className="w-3 h-3" />
                        </button>
                        {user.isActivated ? (
                          <button
                            onClick={() => handleBlockUser(user.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-600 hover:text-red-900 hover:bg-red-50"
                            title="Block User"
                          >
                            <FiLock className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-600 hover:text-green-900 hover:bg-green-50"
                            title="Unblock User"
                          >
                            <FiUnlock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new user.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of{' '}
                    <span className="font-medium">{filteredUsers.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level Change Modal */}
        {showLevelModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Change User Level</h3>
                <button
                  onClick={() => setShowLevelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Changing level for: <span className="font-medium">{selectedUserForLevel?.name}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLevelModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLevelUpdate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiStar className="w-4 h-4 mr-2" />
                  Update Level
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalMode === 'create' ? 'Add New User' : 
                   modalMode === 'edit' ? 'Edit User' : 'User Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="user">User</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                
                {modalMode !== 'view' && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiSave className="w-4 h-4 mr-2" />
                      {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;