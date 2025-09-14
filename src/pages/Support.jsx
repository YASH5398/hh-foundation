import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const initialState = {
  userName: '',
  userEmail: '',
  userPhone: '',
  platform: '',
  category: '',
  priority: '',
  title: '',
  message: '',
  attachments: [],
};

const platformOptions = [
  { value: '', label: 'Select Platform', icon: '📱' },
  { value: 'Web', label: 'Web', icon: '💻' },
  { value: 'Android', label: 'Android', icon: '🤖' },
  { value: 'iOS', label: 'iOS', icon: '🍏' },
];
const categoryOptions = [
  { value: '', label: 'Select Category', icon: '📂' },
  { value: 'Payment', label: 'Payment', icon: '💳' },
  { value: 'Login', label: 'Login', icon: '🔑' },
  { value: 'Referral', label: 'Referral', icon: '👥' },
  { value: 'E-PIN', label: 'E-PIN', icon: '🔢' },
  { value: 'Other', label: 'Other', icon: '❓' },
];
const priorityOptions = [
  { value: 'Low', label: 'Low', icon: '🟢' },
  { value: 'Medium', label: 'Medium', icon: '🟡' },
  { value: 'High', label: 'High', icon: '🟠' },
];

const stepTitles = [
  'Contact Information',
  'Issue Details',
  'Ticket Details',
];

const Support = () => {
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  // Autofill from user context if available
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setForm(f => ({
        ...f,
        userName: f.userName || user.displayName || '',
        userEmail: f.userEmail || user.email || '',
      }));
    }
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setForm({ ...form, attachments: Array.from(e.target.files) });
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user && user.uid ? user.uid : '';
      // For now, attachments are not uploaded, just file names are stored. You can add upload logic later.
      const docRef = await addDoc(collection(db, 'supportTickets'), {
        ticketId: '', // Firestore auto-id, will update after creation
        userName: form.userName,
        userEmail: form.userEmail,
        userPhone: form.userPhone,
        platform: form.platform,
        category: form.category,
        priority: form.priority,
        title: form.title,
        message: form.message,
        attachments: form.attachments.map(f => f.name),
        status: 'pending',
        agentId: null,
        adminReply: '',
        adminReplyHistory: [],
        adminStatusNote: '',
        feedback: '',
        resolution: '',
        userId: userId, // Always include userId for Firestore rules
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });
      setTicketId(docRef.id);
      setSuccess('Thank you! Your ticket has been submitted.');
      setForm(initialState);
      setStep(0);

      // Update user profile only if logged in
      if (user && user.uid) {
        await setDoc(doc(db, "users", user.uid), {
          lastTicketId: docRef.id,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        // Check user profile
        const userDoc = await getDoc(doc(db, "users", userId));
      }
      // else do nothing (user not logged in)

      // Add notification
      await addDoc(collection(db, 'notifications'), {
        ...form,
        userId: auth.currentUser.uid, // REQUIRED
      });

      await addDoc(collection(db, 'epinRequests'), {
        ...form,
        requestedBy: auth.currentUser.uid, // REQUIRED
      });
    } catch (err) {
      setError('Error submitting ticket.');
    }
    setLoading(false);
  };

  // Step content
  const stepContent = [
    // Step 1: Contact Info
    <motion.div key={0} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1 text-black">Full Name</label>
        <input name="userName" value={form.userName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" required />
      </div>
      <div>
        <label className="block font-semibold mb-1 text-black">Email</label>
        <input name="userEmail" value={form.userEmail} onChange={handleChange} type="email" className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" required />
      </div>
      <div>
        <label className="block font-semibold mb-1 text-black">Phone Number</label>
        <input name="userPhone" value={form.userPhone} onChange={handleChange} type="tel" className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" required />
      </div>
    </motion.div>,
    // Step 2: Issue Details
    <motion.div key={1} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1 text-black">Platform</label>
        <select name="platform" value={form.platform} onChange={handleChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 bg-white shadow-sm text-black" required>
          {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
        </select>
      </div>
      {form.platform && (
        <div>
          <label className="block font-semibold mb-1 text-black">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 bg-white shadow-sm text-black" required>
            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block font-semibold mb-1 text-black">Priority</label>
        <div className="flex gap-4">
          {priorityOptions.map(opt => (
            <label key={opt.value} className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 shadow-sm ${form.priority === opt.value ? 'bg-blue-100 border-blue-400' : 'bg-white'} text-black`}>
              <input
                type="radio"
                name="priority"
                value={opt.value}
                checked={form.priority === opt.value}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-lg">{opt.icon}</span>
              <span className="font-medium text-black">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </motion.div>,
    // Step 3: Ticket Details
    <motion.div key={2} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1 text-black">Title</label>
        <input name="title" value={form.title} onChange={handleChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" required />
      </div>
      <div>
        <label className="block font-semibold mb-1 text-black">Message</label>
        <textarea name="message" value={form.message} onChange={handleChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" rows={4} required />
      </div>
      <div>
        <label className="block font-semibold mb-1 text-black">Attachments (optional)</label>
        <input name="attachments" type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 p-2 text-black" />
        {form.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.attachments.map((file, idx) => (
              <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs text-black">{file.name}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white animate-gradient-slow py-8 px-2">
      <div className="bg-white/30 backdrop-blur-md shadow-md rounded-xl p-6 w-full max-w-2xl mx-auto mt-8">
        <div className="mb-6">
          <div className="text-sm font-semibold text-black mb-2">Step {step + 1} of 3 • {stepTitles[step]}</div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛟</span>
            <h2 className="text-xl font-extrabold text-black">Support / Raise Ticket</h2>
          </div>
        </div>
        {success && (
          <motion.div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-xl">✅</span>
            <span>{success} Ticket ID: <b>{ticketId}</b></span>
          </motion.div>
        )}
        {error && (
          <motion.div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {stepContent[step]}
          </AnimatePresence>
          <div className="flex justify-between mt-6">
            {step > 0 && (
              <button type="button" onClick={handleBack} className="px-6 py-2 rounded-full font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition">Back</button>
            )}
            {step < 2 && (
              <button type="button" onClick={handleNext} className="ml-auto px-6 py-2 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition">Next</button>
            )}
            {step === 2 && (
            <button
              type="submit"
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-sm transition"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
                ) : (
                  'Submit Ticket'
                )}
            </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Support;