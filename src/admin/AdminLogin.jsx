import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
  const { login, isAdmin, loading: authLoading } = useAuth();
=======
  const { login, userClaims, loading: authLoading } = useAuth();
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorDetails('');
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
<<<<<<< HEAD
      if (result.success && result.claims?.admin === true) {
=======
      if (result.success && email === 'hellosuman765@gmail.com') {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        toast.success('Admin login successful!');
        navigate('/admin/dashboard', { replace: true });
      } else if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setErrorDetails('Login failed: ' + (error.message || 'Unknown error'));
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Login
        </h2>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Show detailed error in development */}
          {errorDetails && process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Debug Error: {errorDetails}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Logging in...' : 'Sign in as Admin'}
            </button>
          </div>

          {/* Development helper text */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-500 text-center">
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