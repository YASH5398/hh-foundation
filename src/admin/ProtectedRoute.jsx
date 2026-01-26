import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin, userProfile } = useAuth();
  
  console.log('AdminProtectedRoute: user?', !!user, 'isAdmin?', isAdmin, 'loading?', loading, 'profile?', !!userProfile);

  // Show loader while auth/profile are loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('AdminProtectedRoute: No user, redirecting to login');
    return <Navigate to="/admin/login" />;
  }

  // CRITICAL: Wait for userProfile to be resolved (undefined -> still loading)
  if (typeof userProfile === 'undefined') {
    console.log('AdminProtectedRoute: Waiting for userProfile to resolve...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  // Treat only explicit userProfile.role === "admin" as admin
  // This checks the actual field in user Firestore documents
  const explicitIsAdmin = userProfile && userProfile.role === 'admin';
  if (!explicitIsAdmin) {
    console.log('AdminProtectedRoute: User is not admin (role is not admin), redirecting to access denied');
    return <Navigate to="/access-denied" />;
  }

  console.log('AdminProtectedRoute: Admin access granted, rendering children');
  return children;
};

export default AdminProtectedRoute;