import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const isAgentPath = location.pathname.includes('/agent');
  const dashboardPath = isAgentPath ? '/agent-dashboard' : '/dashboard';
  const dashboardLabel = isAgentPath ? 'Go to Agent Dashboard' : 'Go to Dashboard';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-2xl text-gray-600 mb-4">Page Not Found</p>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to={dashboardPath} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
          {dashboardLabel}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
