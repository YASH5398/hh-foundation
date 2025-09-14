import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const allowedPaths = [
    "/login",
    "/admin/login",
    "/agent/login",
    "/forgot-password",
    "/register",
    "/signup",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If authenticated and on allowed path, show the page
  if (user && allowedPaths.includes(location.pathname)) {
    return children;
  }

  // If authenticated and not on allowed path, redirect to agent-dashboard
  if (user) {
    return <Navigate to="/agent-dashboard" replace />;
  }

  // If not authenticated and not on allowed path, redirect to home
  if (!allowedPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated and on allowed path, show the page
  return children;
};

export default PublicRoute;
