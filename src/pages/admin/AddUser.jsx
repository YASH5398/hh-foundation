import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

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
    return 'HHF' + Math.floor(100000 + Math.random() * 900000);
  };

  const validate = () => {
    if (!form.fullName || !form.email || !form.phone || !form.sponsorId) {
      setError('Full Name, Email, Phone, and Sponsor ID are required.');
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
        level: 1,
        levelStatus: 'Star',
        referralCount: 0,
        totalTeam: 0,
        isActivated: true,
        paymentBlocked: false,
        isBlocked: false,
        totalEarnings: 0,
        totalSent: 0,
        totalReceived: 0,
        registrationTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        bank: {},
        paymentMethod: {},
        referredUsers: [],
      });
      setSuccess('User created successfully.');
      setForm(initialState);
    } catch (err) {
      setError('Error registering user.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Add New User</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name*" className="w-full p-2 border rounded" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email*" className="w-full p-2 border rounded" required type="email" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone*" className="w-full p-2 border rounded" required />
        <input name="sponsorId" value={form.sponsorId} onChange={handleChange} placeholder="Sponsor ID*" className="w-full p-2 border rounded" required />
        <input name="uplineId" value={form.uplineId} onChange={handleChange} placeholder="Upline ID" className="w-full p-2 border rounded" />
        <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp" className="w-full p-2 border rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Registering...' : 'Register User'}</button>
      </form>
    </div>
  );
};

export default AddUser; 