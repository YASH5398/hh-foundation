import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

const AgentProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAgent(userData.role === 'agent');
        } else {
          setIsAgent(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAgent(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShield className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              You don't have permission to access this area. This section is restricted to authorized agents only.
            </p>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AgentProtectedRoute;