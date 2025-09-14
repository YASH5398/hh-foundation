import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const isAdminByEmail = user && user.email === 'hellosuman765@gmail.com';
  console.log('AdminProtectedRoute: isAdmin?', isAdmin, 'isAdminByEmail?', isAdminByEmail, 'userClaims:', userClaims);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (!isAdmin && !isAdminByEmail) {
    return <Navigate to="/access-denied" />;
  }

  return children;
};

export default AdminProtectedRoute;