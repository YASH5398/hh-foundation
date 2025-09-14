import React, { useState, useEffect, useMemo } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getAuth, getIdToken, getIdTokenResult, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import AdminProtectedRoute from '../admin/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(defaultEditUser);
  const [originalUser, setOriginalUser] = useState({});
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <img 
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" 
                            src={user.profileImage || '/images/default-avatar.png'} 
                            alt="Profile" 
                          />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{user.fullName}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500">{user.whatsapp}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActivated ? 'Active' : 'Inactive'}
                        </span>
                        {user.isBlocked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-900">{user.levelStatus || 'Star'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                          title="Edit User"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative overflow-y-auto max-h-[95vh] flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Edit User</h2>
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors touch-manipulation" 
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 sm:p-6 flex-1">
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
                      const auth = getAuth();
                      const idToken = await getIdToken(auth.currentUser);
                      const idTokenResult = await getIdTokenResult(auth.currentUser);
                      
                      if (!idTokenResult.claims.admin) {
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
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Profile Section */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Profile Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                        <input
                          type="text"
                          value={editUser.id || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editUser.fullName || ''}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editUser.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editUser.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                        <input
                          type="tel"
                          value={editUser.whatsapp || ''}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor ID</label>
                        <input
                          type="text"
                          value={editUser.sponsorId || ''}
                          onChange={(e) => handleInputChange('sponsorId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Payment Methods</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PhonePe</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.phonePe || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'phonePe')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GPay</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.gpay || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'gpay')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                        <input
                          type="text"
                          value={editUser.paymentMethod?.upiId || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value, 'upiId')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Bank Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.accountHolder || ''}
                            onChange={(e) => handleBankChange('accountHolder', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.accountNumber || ''}
                            onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                          <input
                            type="text"
                            value={editUser.paymentMethod?.bank?.ifsc || ''}
                            onChange={(e) => handleBankChange('ifsc', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Access */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Status & Access</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActivated"
                          checked={editUser.isActivated || false}
                          onChange={(e) => handleInputChange('isActivated', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActivated" className="ml-2 block text-sm text-gray-900">
                          Account Activated
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isBlocked"
                          checked={editUser.isBlocked || false}
                          onChange={(e) => handleInputChange('isBlocked', e.target.checked)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isBlocked" className="ml-2 block text-sm text-gray-900">
                          Account Blocked
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                        <select
                          value={editUser.role || 'user'}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        >
                          <option value="user">User</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer */}
                  <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 z-10">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-60 touch-manipulation" onClick={() => setIsModalOpen(false)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="button" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-60 touch-manipulation" onClick={() => setResetConfirm(true)} disabled={saving}>
                      Reset Progress
                    </button>
                  </div>
                </form>
                
                {resetConfirm && (
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-700 mb-4 text-base">Are you sure you want to reset this user's progress? This cannot be undone.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation" onClick={handleResetProgress}>Yes, Reset</button>
                      <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation" onClick={() => setResetConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}

export default UserManager;