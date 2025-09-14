import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Success = () => {
  const location = useLocation();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (location.state && location.state.userDetails) {
      setUserDetails(location.state.userDetails);
    }
  }, [location]);

  if (!userDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2 sm:px-3 lg:px-4">
        <p className="text-gray-600">No user details found. Please register first.</p>
      </div>
    );
  }

  const formatJoiningDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2 sm:px-3 lg:px-4"
    >
      <div className="max-w-md w-full space-y-8 bg-white p-1 sm:p-2 lg:p-3 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-green-600">
            🎉 Welcome to HH Foundation Helping Plan!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your account has been successfully created.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Sponsor ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.sponsorId}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.fullName || userDetails.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.phone}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">WhatsApp Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.whatsapp}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Custom User ID</dt>
              <dd className="mt-1 text-sm font-mono text-green-600 font-semibold">{userDetails.userId}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Firebase UID</dt>
              <dd className="mt-1 text-sm text-gray-500 font-mono text-xs">{userDetails.uid}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Account Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userDetails.isActivated ? '✅ Activated' : '⏳ Pending Activation'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Level</dt>
              <dd className="mt-1 text-sm text-gray-900">{userDetails.levelStatus || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white p-6 rounded-full shadow-2xl border-4 border-white hover:shadow-2xl transition-all duration-300 scale-110"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Success;