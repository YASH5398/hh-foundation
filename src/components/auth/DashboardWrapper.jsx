import React from 'react';
import { useAuth } from '../../context/AuthContext';
import BlockScreen from '../common/BlockScreen';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardWrapper = ({ children }) => {
  const { loading, user, userProfile } = useAuth();

  console.log(String("🔍 DASHBOARD WRAPPER:") + " " + String({
    loading: loading,
    user: !!user,
    userProfile: !!userProfile
  }));

  // Blocking is now handled globally in index.js at the AppWrapper level
  // This component now only handles dashboard-specific loading states if needed
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <LoadingSpinner />
          <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">Verifying Dashboard Data...</h3>
          <p className="text-gray-500">Preparing your personalized dashboard.</p>
        </div>
      </div>);
  }

  console.log("🔍 DASHBOARD WRAPPER: User verified, rendering dashboard");
  // If user is not blocked, show normal dashboard
  return children;
};

export default DashboardWrapper;