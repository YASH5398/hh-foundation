import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAgentAuth } from '../context/AgentAuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const AgentProtectedRoute = ({ children }) => {
  const { currentUser, isAgent, loading } = useAgentAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not an agent
  if (!currentUser || !isAgent) {
    return (
      <Navigate 
        to="/agent/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if phone number is verified (for additional security)
  if (!currentUser.phoneNumber) {
    return (
      <Navigate 
        to="/agent/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Render protected content
  return children;
};

export default AgentProtectedRoute;