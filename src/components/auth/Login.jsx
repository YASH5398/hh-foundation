import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // Add useNavigate hook

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

      // Handle navigation in the UI component
      if (result.success) {
        toast.success("Login successful!");
        if (result.claims?.admin === true) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        // Error toast is already handled in the context's login function
      }
    } catch (error) {
      toast.error('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative font-inter" style={{
      backgroundImage: 'url(https://iili.io/FIiJfBR.md.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-black/70 z-0" />
      <div className="relative z-10 w-full flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mx-auto space-y-6 border border-white/20">
          <h2 className="text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label htmlFor="email" className="block text-white text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-1">Password</label>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
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
          <p className="text-center text-white text-sm mt-4">
            Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-200 font-semibold ml-1">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;