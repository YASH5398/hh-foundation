import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAgentAuth } from '../context/AgentAuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const AgentProtectedRoute = ({ children }) => {
  const { currentUser, isAgent, loading: authLoading } = useAgentAuth();
  const [isReloading, setIsReloading] = useState(false);
  const hasReloadedRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const verifyEmailStatus = async () => {
      // 1. If auth is loading, or user not logged in, or already verified, do nothing
      if (authLoading || !currentUser || !isAgent || currentUser.emailVerified) {
        return;
      }

      // 2. If we haven't tried reloading yet, try once
      if (!hasReloadedRef.current) {
        hasReloadedRef.current = true;
        if (mounted) setIsReloading(true);

        try {
          // Force fetch latest user data from Firebase
          await currentUser.reload();
          // Force refresh of the ID token to ensure claims are up to date
          await currentUser.getIdToken(true);
        } catch (error) {
          console.error("Error reloading user credentials:", error);
        } finally {
          if (mounted) setIsReloading(false);
        }
      }
    };

    verifyEmailStatus();

    return () => {
      mounted = false;
    };
  }, [currentUser, isAgent, authLoading]);

  // 1. Show Loading State (Auth Loading OR Reloading/Verifying)
  if (authLoading || isReloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying agent access...</p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In OR Not Agent -> Redirect
  if (!currentUser || !isAgent) {
    return <Navigate to="/agent-login" state={{ from: location }} replace />;
  }

  // 3. Email Not Verified (even after reload attempt) -> Redirect
  if (!currentUser.emailVerified) {
    return <Navigate to="/agent-login" state={{ from: location }} replace />;
  }

  // 4. Authorized -> Render Children
  return children;
};

export default AgentProtectedRoute;