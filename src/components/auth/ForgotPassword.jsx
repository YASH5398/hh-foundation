import React, { useState } from 'react';
import { auth } from "../../config/firebase";
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Please check your inbox.');
      setEmail('');
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-2 bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Forgot Password</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-800 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-white/10 backdrop-blur border-b border-white/30 text-black/90 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter your email"
            />
          </div>
          <button type="submit" className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
