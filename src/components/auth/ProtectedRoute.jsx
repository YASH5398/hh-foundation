import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
<<<<<<< HEAD
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();

  console.log("🔍 PROTECTED ROUTE:", {
    path: location.pathname,
    user: !!user,
    loading: loading,
    userProfile: !!userProfile
  });

  if (loading) {
    console.log("🔍 PROTECTED ROUTE: Still loading, showing spinner");
=======
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    // While the auth state is loading, show a spinner or a blank screen.
    // This prevents a flash of the login page before the user is authenticated.
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
<<<<<<< HEAD
    console.log("🔍 PROTECTED ROUTE: No user, redirecting to login from:", location.pathname);
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    // If the user is not authenticated, redirect them to the login page.
    // We save the current location so we can redirect them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

<<<<<<< HEAD
  console.log("🔍 PROTECTED ROUTE: User authenticated, rendering children");
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  // If the user is authenticated, render the children components.
  return children;
};

export default ProtectedRoute;
