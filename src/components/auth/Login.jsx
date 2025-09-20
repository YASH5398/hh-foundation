import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-black/20 z-0" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mx-auto border border-white/20 transition-all duration-300 hover:shadow-3xl">
          
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <img
                src="https://iili.io/FIQ0fZ7.md.png"
                alt="Company Logo"
                className="h-20 w-auto rounded-full shadow-lg mx-auto transition-transform duration-300 hover:scale-110"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }}
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mt-4 mb-2 drop-shadow-lg">
              Welcome Back
            </h2>
            <p className="text-white/80 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Login Form */}
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Account Login
              </h3>

              {/* Email */}
              <div className="relative group">
                <label htmlFor="email" className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your email address"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                </div>
              </div>

              {/* Password */}
              <div className="relative group">
                <label htmlFor="password" className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-200 underline decoration-white/40 hover:decoration-white"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg backdrop-blur-sm border border-white/30 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/10 text-white/80 rounded-full backdrop-blur-sm">
                  New to HH Foundation?
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold text-sm transition-all duration-200 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/20 hover:border-white/40"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;