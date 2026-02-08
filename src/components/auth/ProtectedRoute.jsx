import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FullPageLoader from '../common/FullPageLoader';

const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading, userProfile, profileLoading } = useAuth();
  const location = useLocation();

  // 1. Initial Loading (Auth or Profile)
  if (authLoading || (user && !userProfile && profileLoading)) {
    return <FullPageLoader />;
  }

  // 2. Redirect if No User
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Render content
  return children || <Outlet />;
};

export default ProtectedRoute;