import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Sparkles,
  TrendingUp
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-red-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-400/10 to-orange-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-sm sm:max-w-md"
        >
          {/* Main Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Logo Section */}
              <motion.div 
                className="text-center mb-6 sm:mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="relative inline-block">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <img
                    src="https://iili.io/FIQ0fZ7.md.png"
                    alt="Company Logo"
                    className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-2xl mx-auto border-2 border-white/30"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }}
                  />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </motion.div>
                </div>
                
                <motion.h1 
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mt-3 sm:mt-4 mb-1 sm:mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Welcome Back
                </motion.h1>
                
                <motion.p 
                  className="text-white/70 text-xs sm:text-sm flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Sign in to your MLM dashboard
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <motion.div 
                  className="space-y-4 sm:space-y-5"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 text-white/90 mb-4 sm:mb-6">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="font-semibold text-sm sm:text-base">Secure Login</span>
                  </div>

                  {/* Email Field */}
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-white/90 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-3 sm:px-4 sm:py-4 pl-10 sm:pl-12 rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                        placeholder="Enter your email address"
                        required
                      />
                      <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-blue-400 transition-colors" />
                      <motion.div 
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        layoutId="inputGlow"
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-white/90 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-3 sm:px-4 sm:py-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                        placeholder="Enter your password"
                        required
                      />
                      <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </motion.button>
                      <motion.div 
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        layoutId="inputGlow2"
                      />
                    </div>
                  </motion.div>

                  {/* Forgot Password */}
                  <div className="text-right">
                    <motion.button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-white/70 hover:text-white text-xs sm:text-sm font-medium transition-colors duration-200 hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Forgot Password?
                    </motion.button>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden text-sm sm:text-base"
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                  >
                    {/* Button Glow Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                          Sign In to Dashboard
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </motion.div>
              </form>

              {/* Register Link */}
              <motion.div 
                className="mt-6 sm:mt-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-white/10 text-white/70 rounded-full backdrop-blur-sm border border-white/20">
                      New to our MLM platform?
                    </span>
                  </div>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center gap-2 sm:gap-3 text-white font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 group text-sm sm:text-base"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                    Create Your Account
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;