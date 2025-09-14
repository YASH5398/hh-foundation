import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

const PublicRoute = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  const allowedPaths = [
    "/login",
    "/admin/login",
    "/forgot-password",
    "/register",
  ];

  const isRegisterSuccess = pathname.includes("/register-success");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (user && !allowedPaths.includes(pathname) && !isRegisterSuccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
