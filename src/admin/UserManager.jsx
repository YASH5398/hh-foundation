import React, { useState, useEffect, useMemo } from 'react';
import { FaEdit, FaUser, FaShieldAlt, FaUserCheck, FaUserTimes, FaSearch, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth } from "../config/firebase";
import { getIdToken, getIdTokenResult, signOut } from "firebase/auth";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { requireFreshIdToken } from '../services/authReady';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import AdminProtectedRoute from '../admin/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import EpinManager from '../admin/components/EpinManager';
import AccessDenied from './AccessDenied';

const LEVELS = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const defaultEditUser = {
  fullName: '',
  email: '',
  phone: '',
  whatsapp: '',
  sponsorId: '',
  levelStatus: '',
  referralCount: 0,
  totalTeam: 0,
  isActivated: false,
  isBlocked: false,
  profileImage: '',
  paymentMethod: {
    phonePe: '',
    gpay: '',
    upiId: '',
    bank: { accountHolder: '', accountNumber: '', ifsc: '' },
  },
  kycDetails: { pan: '', aadhaar: '' },
};

function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(defaultEditUser);
  const [originalUser, setOriginalUser] = useState({});
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isActivated', '!=', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.fullName?.toLowerCase().includes(term) ||
      user.userId?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const handleEdit = (user) => {
    setEditUser({
      ...user,
      paymentMethod: user.paymentMethod || {
        phonePe: '',
        gpay: '',
        upiId: '',
        bank: { accountHolder: '', accountNumber: '', ifsc: '' },
      },
      kycDetails: user.kycDetails || { pan: '', aadhaar: '' },
    });
    setOriginalUser(user);
    setIsModalOpen(true);
  };

  const handleResetProgress = async () => {
    try {
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, {
        levelStatus: 'Star',
        referralCount: 0,
        totalTeam: 0,
        isActivated: false
      });
      toast.success('User progress reset successfully!');
      setResetConfirm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress');
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await requireFreshIdToken();
      const callAdminDeleteUser = httpsCallable(functions, 'adminDeleteUser');
      const res = await callAdminDeleteUser({ userId: userToDelete.id });
      const result = res.data || {};

      if (result.success) {
        toast.success('User deleted successfully!');
        // Remove user from local state immediately
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setDeleteConfirm(false);
        setUserToDelete(null);
      } else {
        toast.error(result.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setEditUser(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nested]: value
        }
      }));
    } else {
      setEditUser(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBankChange = (field, value) => {
    setEditUser(prev => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        bank: {
          ...prev.paymentMethod.bank,
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-slate-900 flex justify-center items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-2 border-slate-700 border-t-slate-400"
          ></motion.div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-700 rounded-2xl">
                  <FaUser className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">User Management</h1>
                  <p className="text-slate-400 mt-1">Manage user accounts and permissions in your enterprise system</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-700">
              <div className="grid grid-cols-11 gap-4 text-sm font-medium text-slate-300">
                <div className="col-span-4">User</div>
                <div className="col-span-2">User ID</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <AnimatePresence>
              {filteredUsers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                </motion.div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      whileHover={{ backgroundColor: "rgba(51, 65, 85, 0.5)" }}
                      className="px-6 py-4 hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-11 gap-4 items-center">
                        {/* Avatar & Name */}
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {(user.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center border-2 border-slate-900">
                              {user.isActivated ? (
                                <FaUserCheck className="w-2 h-2 text-green-400" />
                              ) : (
                                <FaUserTimes className="w-2 h-2 text-red-400" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">{user.fullName}</div>
                          </div>
                        </div>

                        {/* User ID */}
                        <div className="col-span-2">
                          <span className="text-sm text-slate-300 font-mono bg-slate-700 px-2 py-1 rounded-lg">
                            {user.userId || 'HHF00000'}
                          </span>
                        </div>

                        {/* Level Badge */}
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {user.levelStatus || 'Star'}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                              user.isActivated
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {user.isActivated ? 'Active' : 'Inactive'}
                            </span>
                            {user.isBlocked && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                Blocked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center space-x-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(user)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors duration-200"
                            title="Edit User"
                          >
                            <FaEdit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors duration-200"
                            title="Delete User"
                          >
                            <FaTrash className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden border border-slate-700"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-6 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-600 rounded-xl">
                        <FaShieldAlt className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Edit User Profile</h2>
                        <p className="text-slate-400 text-sm">Modify user information and permissions</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      setSaving(true);
                      // Only send changed fields
                      const updateObj = {};
                      Object.keys(editUser).forEach(key => {
                        if (typeof editUser[key] === 'object' && editUser[key] !== null) {
                          if (JSON.stringify(editUser[key]) !== JSON.stringify(originalUser[key] || {})) {
                            updateObj[key] = editUser[key];
                          }
                        } else if (editUser[key] !== originalUser[key]) {
                          updateObj[key] = editUser[key];
                        }
                      });

                      if (Object.keys(updateObj).length === 0) {
                        toast.error('No changes detected');
                        setSaving(false);
                        return;
                      }

                      try {
                        const idToken = await getIdToken(auth.currentUser);
                        const idTokenResult = await getIdTokenResult(auth.currentUser);

                        if (!idTokenResult.claims.role || idTokenResult.claims.role !== 'admin') {
                          toast.error('Unauthorized: Admin access required');
                          setSaving(false);
                          return;
                        }

                        const userRef = doc(db, 'users', editUser.id);
                        await updateDoc(userRef, updateObj);
                        toast.success('User updated successfully!');
                        setIsModalOpen(false);
                      } catch (error) {
                        console.error('Error updating user:', error);
                        toast.error('Failed to update user');
                      }
                      setSaving(false);
                    }}
                    className="space-y-8"
                  >
                  {/* Profile Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FaUser className="w-5 h-5 text-slate-400" />
                      <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">User ID</label>
                        <input
                          type="text"
                          value={editUser.id || ''}
                          disabled
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-400 text-sm font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Full Name</label>
                        <input
                          type="text"
                          value={editUser.fullName || ''}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Email</label>
                        <input
                          type="email"
                          value={editUser.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Phone</label>
                        <input
                          type="tel"
                          value={editUser.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">WhatsApp</label>
                        <input
                          type="tel"
                          value={editUser.whatsapp || ''}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Sponsor ID</label>
                        <input
                          type="text"
                          value={editUser.sponsorId || ''}
                          onChange={(e) => handleInputChange('sponsorId', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FaShieldAlt className="w-5 h-5 text-slate-400" />
                      <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">PhonePe</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.phonePe || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'phonePe')}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">GPay</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.gpay || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'gpay')}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-slate-300">UPI ID</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.upiId || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'upiId')}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-slate-200">Bank Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-300">Account Holder</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.accountHolder || ''}
                            onChange={(e) => handleBankChange('accountHolder', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-300">Account Number</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.accountNumber || ''}
                            onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label className="block text-sm font-medium text-slate-300">IFSC Code</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.ifsc || ''}
                            onChange={(e) => handleBankChange('ifsc', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Access */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FaShieldAlt className="w-5 h-5 text-slate-400" />
                      <h3 className="text-lg font-semibold text-white">Status & Access Control</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center p-4 bg-slate-700 rounded-xl border border-slate-600">
                        <input
                          type="checkbox"
                          id="isActivated"
                          checked={editUser.isActivated || false}
                          onChange={(e) => handleInputChange('isActivated', e.target.checked)}
                          className="h-5 w-5 text-green-500 focus:ring-green-500 bg-slate-600 border-slate-500 rounded"
                        />
                        <label htmlFor="isActivated" className="ml-3 block text-sm font-medium text-white">
                          Account Activated
                        </label>
                      </div>

                      <div className="flex items-center p-4 bg-slate-700 rounded-xl border border-slate-600">
                        <input
                          type="checkbox"
                          id="isBlocked"
                          checked={editUser.isBlocked || false}
                          onChange={(e) => handleInputChange('isBlocked', e.target.checked)}
                          className="h-5 w-5 text-red-500 focus:ring-red-500 bg-slate-600 border-slate-500 rounded"
                        />
                        <label htmlFor="isBlocked" className="ml-3 block text-sm font-medium text-white">
                          Account Blocked
                        </label>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-slate-300">User Role</label>
                        <select
                          value={editUser.role || 'user'}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="user" className="bg-slate-700">User</option>
                          <option value="agent" className="bg-slate-700">Agent</option>
                          <option value="admin" className="bg-slate-700">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-600">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg hover:shadow-xl border border-slate-600"
                      onClick={() => setIsModalOpen(false)}
                      disabled={saving}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg hover:shadow-xl"
                      onClick={() => setResetConfirm(true)}
                      disabled={saving}
                    >
                      Reset Progress
                    </motion.button>
                  </div>
                </form>

                {/* Reset Confirmation */}
                <AnimatePresence>
                  {resetConfirm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-6"
                    >
                      <p className="text-red-400 mb-6 text-base font-medium">
                        Are you sure you want to reset this user's progress? This action cannot be undone.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
                          onClick={handleResetProgress}
                        >
                          Yes, Reset Progress
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors shadow-lg border border-slate-600"
                          onClick={() => setResetConfirm(false)}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delete Confirmation */}
                <AnimatePresence>
                  {deleteConfirm && userToDelete && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-6"
                    >
                      <div className="flex items-center mb-4">
                        <FaTrash className="w-6 h-6 text-red-500 mr-3" />
                        <h3 className="text-red-400 text-lg font-semibold">Delete User Permanently</h3>
                      </div>
                      <p className="text-red-400 mb-4 text-base font-medium">
                        Are you sure you want to permanently delete <strong>{userToDelete.fullName}</strong> (ID: {userToDelete.userId})?
                      </p>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
                        <p className="text-red-300 text-sm mb-2 font-medium">This will permanently delete:</p>
                        <ul className="text-red-300 text-sm space-y-1 ml-4">
                          <li>• User account and profile data</li>
                          <li>• All send help and receive help records</li>
                          <li>• Help history and notifications</li>
                          <li>• FCM tokens and chat data</li>
                          <li>• Firebase Authentication account</li>
                        </ul>
                        <p className="text-red-300 text-sm mt-3 font-medium">
                          ⚠️ This action cannot be undone!
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={confirmDeleteUser}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete User'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors shadow-lg border border-slate-600 disabled:opacity-60"
                          onClick={() => setDeleteConfirm(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminProtectedRoute>
  );
}

export default UserManager;