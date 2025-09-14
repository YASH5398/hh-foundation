import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { FiShield, FiArrowLeft, FiAlertCircle, FiZap } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';

const AgentProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setError('User data not found');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch user data when auth is not loading and we have a user
    if (!authLoading && user) {
      fetchUserData();
    } else if (!authLoading && !user) {
      // Auth finished loading but no user found
      setLoading(false);
    }
  }, [user, authLoading]);

  // Show premium loading spinner while auth is loading or user data is being fetched
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 80, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div className="relative z-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (only after auth loading is complete)
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  // Show premium error page if failed to load user data
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center max-w-md mx-4"
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <FiAlertCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Data</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Check if user has agent role - Premium Access Denied Page (only after loading is complete)
  if (!authLoading && !loading && (!userData || userData.role !== 'agent')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 80, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center max-w-md mx-4"
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <FiShield className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-2 text-lg">Agent Access Required</p>
          <p className="text-white/60 mb-8 text-sm">Only users with agent role can access this dashboard.</p>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
              <FiZap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Need Agent Access?</span>
            </div>
            <p className="text-white/50 text-xs">
              Contact your administrator to request agent privileges
            </p>
          </div>
          
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Render agent dashboard if user is authenticated and has agent role
  return <Outlet />;
};

export default AgentProtectedRoute;