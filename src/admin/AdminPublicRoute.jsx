import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminPublicRoute = ({ children }) => {
    const { user, loading, profileLoading, isAdmin } = useAuth();

    // Show loading during initial auth check
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // If user is authenticated, check profile status
    if (user) {
        // Still loading profile, show spinner
        if (profileLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Verifying admin status...</p>
                    </div>
                </div>
            );
        }

        // Profile loaded - redirect admins to dashboard
        if (isAdmin) {
            return <Navigate to="/admin/dashboard" replace />;
        }

        // Not an admin - redirect to normal dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // Not authenticated - show login page
    return children;
};

export default AdminPublicRoute;
