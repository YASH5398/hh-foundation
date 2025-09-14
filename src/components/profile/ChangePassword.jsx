import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const ChangePassword = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      toast.error('Current password is required');
      return false;
    }

    if (!formData.newPassword.trim()) {
      toast.error('New password is required');
      return false;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return false;
    }

    if (formData.newPassword === formData.currentPassword) {
      toast.error('New password must be different from current password');
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      toast.error('Please confirm your new password');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        formData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, formData.newPassword);
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log in again to change your password');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'gray', text: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    
    const strengthMap = {
      1: { color: 'red', text: 'Very Weak' },
      2: { color: 'orange', text: 'Weak' },
      3: { color: 'yellow', text: 'Fair' },
      4: { color: 'lightgreen', text: 'Good' },
      5: { color: 'green', text: 'Strong' }
    };
    
    return { strength, ...strengthMap[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="flex justify-center items-center w-full min-h-[60vh]">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2 text-2xl font-bold text-white">
              <FiLock className="text-blue-300 text-3xl" />
              Change Password
            </div>
            <div className="text-white/70 text-sm">Update your account password</div>
        </div>
          {/* Current Password */}
          <div className="relative mb-2">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" />
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base shadow-inner peer placeholder-white"
                required
              placeholder="Current Password"
            />
            <label className="absolute left-10 top-2 text-blue-200 text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 bg-white/20 px-1 rounded pointer-events-none">Current Password</label>
            <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200">
              {showPasswords.current ? <FiEyeOff /> : <FiEye />}
              </button>
          </div>
          {/* New Password */}
          <div className="relative mb-2">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" />
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base shadow-inner peer placeholder-white"
                required
              placeholder="New Password"
            />
            <label className="absolute left-10 top-2 text-blue-200 text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 bg-white/20 px-1 rounded pointer-events-none">New Password</label>
            <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200">
              {showPasswords.new ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          {/* Password Strength Meter */}
          <div className="w-full mb-2">
            <div className={`h-2 rounded transition-all duration-300 ${passwordStrength.strength === 0 ? 'bg-gray-200' : passwordStrength.strength <= 2 ? 'bg-red-400' : passwordStrength.strength === 3 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
            <div className="text-xs text-gray-500 mt-1">{passwordStrength.text}</div>
          </div>
          {/* Confirm New Password */}
          <div className="relative mb-2">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" />
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base shadow-inner peer placeholder-white"
                required
              placeholder="Confirm New Password"
            />
            <label className="absolute left-10 top-2 text-blue-200 text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 bg-white/20 px-1 rounded pointer-events-none">Confirm New Password</label>
            <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200">
              {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
          </div>
            <button
              type="submit"
              disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg transition-all duration-200 disabled:opacity-60"
            >
            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <FiLock className="text-xl" />}
            Change Password
            </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChangePassword;