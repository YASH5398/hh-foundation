import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, User, Mail, Phone, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const UserDetails = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for user profile to load
    if (userProfile) {
      setLoading(false);
    } else if (!user) {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [user, userProfile, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your account details...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Details</h2>
          <p className="text-gray-600 text-sm mb-6">Please try logging in again to access your account.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Welcome!</h1>
            <p className="text-xs text-gray-600">Your account details</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          userProfile.isActivated
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {userProfile.isActivated ? 'Active' : 'Pending'}
        </span>
      </div>

      {/* Main Content - Compact Grid */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* User Info Cards - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <User className="w-3 h-3 text-blue-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Name</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{userProfile.fullName || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <CreditCard className="w-3 h-3 text-purple-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">User ID</span>
            </div>
            <p className="text-xs font-mono font-semibold text-gray-800">{userProfile.userId || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <Phone className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Phone</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{userProfile.phone || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <Mail className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Email</span>
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate">{userProfile.email || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <User className="w-3 h-3 text-orange-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Sponsor</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{userProfile.sponsorId || 'None'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center mb-1">
              <Calendar className="w-3 h-3 text-indigo-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Joined</span>
            </div>
            <p className="text-xs font-semibold text-gray-800">{formatDate(userProfile.createdAt)}</p>
          </div>
        </div>

        {/* Quick Stats - Compact */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">Your Stats</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{userProfile.referralCount || 0}</div>
              <div className="text-xs text-gray-600">Refs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">₹{(userProfile.totalEarnings || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-600">Earned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{userProfile.helpReceived || 0}</div>
              <div className="text-xs text-gray-600">Rcvd</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{userProfile.totalSent || 0}</div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button - Always Visible */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
        <p className="text-gray-500 text-xs text-center mt-2">
          Start your journey with Helping Hands Foundation
        </p>
      </div>
    </div>
  );
};

export default UserDetails;