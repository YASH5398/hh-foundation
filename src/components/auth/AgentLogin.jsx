import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { FiShield, FiUser, FiLock } from 'react-icons/fi';

function getFirebaseAuthErrorMessage(error) {
  if (!error || !error.code) return null;
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/internal-error':
      return 'Internal error. Please try again.';
    default:
      return null;
  }
}

const AgentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    const emailPrompt = prompt("Enter your registered email:");
    if (!emailPrompt) return toast.error("Email is required");
    try {
      await sendPasswordResetEmail(auth, emailPrompt);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error) || 'Something went wrong. Please try again in a few moments. If the problem persists, contact support.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!email || !password) {
      toast.error("Please fill all required fields");
      setLoading(false);
      return;
    }
    
    try {
      if (!login) throw new Error('Auth context not initialized');
      
      const result = await login(email, password);

      if (result.success) {
        // Check role immediately without delay
        if (user?.role === 'agent') {
          toast.success("Agent login successful!");
          navigate("/agent-dashboard", { replace: true });
        } else {
          toast.error("Access denied. Only users with agent role can access this dashboard.");
          // Optionally redirect to regular dashboard
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (error) {
      toast.error('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative font-inter" style={{
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="absolute inset-0 bg-black/20 z-0" />
      <div className="relative z-10 w-full flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mx-auto space-y-6 border border-white/20">
          {/* Agent Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Agent Login</h2>
            <p className="text-white/80 text-sm">Access your agent dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label htmlFor="email" className="block text-white text-sm font-semibold mb-1">
                <FiUser className="inline w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your agent email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-1">
                <FiLock className="inline w-4 h-4 mr-2" />
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex flex-col items-center justify-between gap-4 mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FiShield className="w-4 h-4" />
                    <span>Login as Agent</span>
                  </div>
                )}
              </button>
              
              <p
                onClick={handleForgotPassword}
                style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline", marginTop: "10px" }}
                className="inline-block align-baseline font-bold text-sm text-blue-400 hover:text-blue-200"
              >
                Forgot Password?
              </p>
            </div>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-white/60 text-xs">
              Only users with agent role can access the dashboard
            </p>
            <p className="text-center text-white text-sm">
              Not an agent? <Link to="/login" className="text-blue-400 hover:text-blue-200 font-semibold ml-1">Regular Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;