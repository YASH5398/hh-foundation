import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const initialState = {
  fullName: '',
  email: '',
  phone: '',
  sponsorId: '',
  uplineId: '',
  whatsapp: '',
};

const AddUser = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateUserId = () => {
    return 'HHF' + Math.floor(10000000 + Math.random() * 90000000);
  };

  const validate = () => {
    if (!form.fullName || !form.email || !form.phone) {
      setError('Full Name, Email, and Phone are required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;
    setLoading(true);
    let userId = generateUserId();
    // Ensure userId is unique
    let exists = true;
    while (exists) {
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (snap.empty) exists = false;
      else userId = generateUserId();
    }
    try {
      await addDoc(collection(db, 'users'), {
        ...form,
        userId,
        referralCount: 0,
        totalTeam: 0,
        level: 1,
        levelStatus: 'Star',
        isActivated: true,
        paymentBlocked: false,
        createdAt: serverTimestamp(),
        registrationTime: serverTimestamp(),
        totalEarnings: 0,
        totalSent: 0,
        totalReceived: 0,
        isBlocked: false,
        bank: {},
        paymentMethod: {},
        referredUsers: [],
      });
      setSuccess('User registered successfully!');
      setForm(initialState);
    } catch (err) {
      setError('Error registering user.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 mx-auto py-4 sm:py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 text-center sm:text-left">Add New User</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input 
                name="fullName" 
                value={form.fullName} 
                onChange={handleChange} 
                placeholder="Enter full name" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="Enter email address" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
                required 
                type="email" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                placeholder="Enter phone number" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor ID</label>
              <input 
                name="sponsorId" 
                value={form.sponsorId} 
                onChange={handleChange} 
                placeholder="Enter sponsor ID" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upline ID</label>
              <input 
                name="uplineId" 
                value={form.uplineId} 
                onChange={handleChange} 
                placeholder="Enter upline ID" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
              <input 
                name="whatsapp" 
                value={form.whatsapp} 
                onChange={handleChange} 
                placeholder="Enter WhatsApp number" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg text-sm sm:text-base touch-manipulation" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Registering...
              </span>
            ) : (
              'Register User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUser;