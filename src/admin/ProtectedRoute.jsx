import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  
  console.log('AdminProtectedRoute: user?', !!user, 'isAdmin?', isAdmin, 'loading?', loading);

  // Show loader while auth/claims are loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  // Redirect to access denied if not admin
  if (!isAdmin) {
    return <Navigate to="/access-denied" />;
  }

  return children;
};

export default AdminProtectedRoute;