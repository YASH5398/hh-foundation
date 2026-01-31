import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorDetails('');
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setIsLoggingIn(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful! Verifying admin status...');
        // AdminPublicRoute will handle redirect to /admin/dashboard
      } else {
        setErrorDetails('Admin login failed');
        toast.error('Login failed');
      }
    } catch (error) {
      setErrorDetails('Login failed: ' + (error.message || 'Unknown error'));
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-10">
        <div>
          {/* Add logo or icon if needed */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to access the administrative dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-400 mb-2">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-600 placeholder-slate-500 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-600 placeholder-slate-500 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Show detailed error in development */}
          {errorDetails && process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 p-2 rounded">
              Debug Error: {errorDetails}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              {isLoggingIn ? 'Logging in...' : 'Sign in as Admin'}
            </button>
          </div>

          {/* Development helper text */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-slate-500 text-center">
              <p>Default Admin Credentials (Development Only):</p>
              <p>Email: admin@hhfoundation.com</p>
              <p>Password: admin123456</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;