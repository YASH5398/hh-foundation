import React from 'react';
import { useAuth } from '../../context/AuthContext';
import BlockScreen from '../common/BlockScreen';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardWrapper = ({ children }) => {
  const { isBlocked, loading, user, userProfile } = useAuth();

  console.log("🔍 DASHBOARD WRAPPER:", {
    loading: loading,
    user: !!user,
    userProfile: !!userProfile,
    isBlocked: isBlocked
  });

  // CRITICAL: Wait for block check to complete before rendering anything
  if (loading) {
    console.log("🔍 DASHBOARD WRAPPER: Still loading, showing spinner");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <LoadingSpinner />
          <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">Verifying Account Status...</h3>
          <p className="text-gray-500">Please wait while we check your account security.</p>
        </div>
      </div>
    );
  }

  // If user is blocked, show full-screen block page instead of dashboard
  if (isBlocked) {
    console.log("🔍 DASHBOARD WRAPPER: User is blocked, showing block screen");
    return <BlockScreen />;
  }

  console.log("🔍 DASHBOARD WRAPPER: User verified, rendering dashboard");
  // If user is not blocked, show normal dashboard
  return children;
};

export default DashboardWrapper;
