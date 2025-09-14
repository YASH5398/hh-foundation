import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiInfo, FiArrowLeft } from 'react-icons/fi';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSubmitted(true);
        toast.success('Password reset link sent to your email!');
      } else {
        toast.error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-4">
              We've sent a password reset link to:
            </p>
            <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg p-3 mb-6">
              {email}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="text-sm font-medium text-blue-800 mb-2">What to do next:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Check your email inbox (and spam folder)
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Click the reset link in the email
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Create a new password
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-500">
              <p>Didn't receive the email? Check your spam folder or try again.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Send Another Email
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
            <div className="flex items-center gap-2 text-2xl font-bold text-black">
              Forgot Password
            </div>
            <div className="flex items-center gap-2 text-black/70 text-sm">
              <FiInfo className="text-blue-700" />
              We'll send you an email with a link to reset your password. Check your spam folder if you don't see it.
            </div>
          </div>
          {/* Email Field */}
          <div className="relative mb-2">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              className="w-full pl-10 pt-6 pb-2 pr-3 bg-white text-black border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base shadow-inner peer placeholder-black"
              required
              placeholder="Email Address"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <FiMail className="text-xl" />}
            Send Reset Link
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full mt-4 text-blue-600 hover:underline text-base font-medium bg-transparent border-none outline-none"
          >
            <FiArrowLeft />
            Back to Login
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ForgotPassword; 