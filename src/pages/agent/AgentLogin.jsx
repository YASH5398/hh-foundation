import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AgentLogin = () => {
  const [step, setStep] = useState(1); // 1: Email/Password, 2: Email Verification
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  const { loginWithEmail, sendVerificationEmail, currentUser, loading: authLoading } = useAgentAuth();
  const navigate = useNavigate();

  // Redirect if already fully authenticated
  // Dependency strictly on currentUser's existence and verification status
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.emailVerified) {
      navigate('/agent-dashboard', { replace: true });
    }
  }, [currentUser?.uid, currentUser?.emailVerified, authLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(formData.email, formData.password);

      // Check immediate verification status
      if (user.emailVerified) {
        toast.success('Login successful! Redirecting...');
        // Let useEffect handle redirect to avoid race conditions
      } else {
        setTempUser(user);
        setStep(2);
        // Attempt to auto-send email
        try {
          await sendVerificationEmail(user);
          toast.success('Verification email sent.');
        } catch (err) {
          console.warn('Auto-send warning:', err);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!tempUser) return;
    setLoading(true);
    try {
      await sendVerificationEmail(tempUser);
      toast.success('Verification email resent.');
    } catch (error) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!tempUser) return;
    setVerifying(true);
    try {
      await tempUser.reload();
      if (tempUser.emailVerified) {
        toast.success('Email verified! Accessing dashboard...');
        navigate('/agent-dashboard', { replace: true });
      } else {
        toast.error('Email not yet verified. Please check your inbox.');
      }
    } catch (error) {
      console.error('Verification check error:', error);
      toast.error('Failed to check status. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Prevent flicker while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <FiShield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Agent Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? 'Sign in to your agent account' : 'Verify your email address'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {step === 1 ? (
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                <FiMail className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Verify your email</h3>
                <p className="text-sm text-gray-500">
                  Verification sent to <strong>{formData.email}</strong>.
                  <br />Check your inbox and click the link.
                </p>
              </div>
              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={verifying}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {verifying ? <LoadingSpinner size="sm" /> :
                    <span className="flex items-center gap-2"><FiCheckCircle /> I have verified my email</span>}
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="sm" color="text-gray-600" /> :
                    <span className="flex items-center gap-2"><FiRefreshCw /> Resend Verification Email</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;