import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
<<<<<<< HEAD
  const { user, loading, isAdmin } = useAuth();
  
  console.log('AdminProtectedRoute: user?', !!user, 'isAdmin?', isAdmin, 'loading?', loading);

  // Show loader while auth/claims are loading
=======
  const { user, loading, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const isAdminByEmail = user && user.email === 'hellosuman765@gmail.com';
  console.log('AdminProtectedRoute: isAdmin?', isAdmin, 'isAdminByEmail?', isAdminByEmail, 'userClaims:', userClaims);

>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

<<<<<<< HEAD
  // Redirect to login if not authenticated
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  if (!user) {
    return <Navigate to="/admin/login" />;
  }

<<<<<<< HEAD
  // Redirect to access denied if not admin
  if (!isAdmin) {
=======
  if (!isAdmin && !isAdminByEmail) {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    return <Navigate to="/access-denied" />;
  }

  return children;
};

export default AdminProtectedRoute;