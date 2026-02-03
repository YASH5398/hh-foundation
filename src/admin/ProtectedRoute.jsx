import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin, userProfile } = useAuth();

  console.log('🔍 AdminProtectedRoute: ===== ADMIN ACCESS CHECK =====');
  console.log(String('🔍 AdminProtectedRoute: user?') + " " + String(!!user) + " " + String(user?.uid));
  console.log(String('🔍 AdminProtectedRoute: user email:') + " " + String(user?.email));
  console.log(String('🔍 AdminProtectedRoute: loading?') + " " + String(loading));
  console.log(String('🔍 AdminProtectedRoute: userProfile type:') + " " + String(typeof userProfile));
  console.log(String('🔍 AdminProtectedRoute: userProfile?') + " " + String(!!userProfile));
  console.log(String('🔍 AdminProtectedRoute: userProfile.role:') + " " + String(userProfile?.role));
  console.log(String('🔍 AdminProtectedRoute: isAdmin (derived)?') + " " + String(isAdmin));
  console.log(String('🔍 AdminProtectedRoute: Firebase project:') + " " + String(typeof window !== 'undefined' && window.__FIREBASE_APP_OPTIONS__?.projectId));
  console.log('🔍 AdminProtectedRoute: =====================================');

  // Show loader while auth/profile are loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading authentication...</p>
        </div>
      </div>);

  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('AdminProtectedRoute: No user, redirecting to login');
    return <Navigate to="/admin/login" />;
  }

  // CRITICAL: Handle profile state properly
  // undefined = still loading or fetch error (show spinner, no redirect)
  // null = document doesn't exist (actual access denied)
  // object = has profile data (check role)
  if (typeof userProfile === 'undefined') {
    console.log('AdminProtectedRoute: Profile still loading or fetch error, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin profile...</p>
        </div>
      </div>);

  }

  // Treat only explicit userProfile.role === "admin" as admin
  // userProfile can be: null (document doesn't exist) or object (has data)
  // Both non-admin cases should deny access
  const explicitIsAdmin = userProfile && userProfile.role === 'admin';
  console.log(String('🔍 AdminProtectedRoute: explicitIsAdmin check:') + " " + String(explicitIsAdmin));
  console.log(String('🔍 AdminProtectedRoute: userProfile exists?') + " " + String(!!userProfile));
  console.log(String('🔍 AdminProtectedRoute: userProfile.role === "admin"?') + " " + String(userProfile?.role === 'admin'));

  if (!explicitIsAdmin) {
    console.log('🔍 AdminProtectedRoute: ❌ ADMIN ACCESS DENIED');
    console.log('🔍 AdminProtectedRoute: Reason: User is not admin (role is not admin or profile is null)');
    console.log('🔍 AdminProtectedRoute: Redirecting to /access-denied');
    return <Navigate to="/access-denied" />;
  }

  console.log('🔍 AdminProtectedRoute: ✅ ADMIN ACCESS GRANTED');
  console.log('🔍 AdminProtectedRoute: Rendering admin children');
  return children;
};

export default AdminProtectedRoute;