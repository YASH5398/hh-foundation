import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { CheckCircle, User, Mail, Phone, MessageCircle, CreditCard, Calendar, ArrowRight, Edit, Headphones, Star, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/formatDate';

const UserDetails = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    console.log("🔍 USER DETAILS:", {
      user: !!user,
      userProfile: !!userProfile,
      authLoading: authLoading,
      loading: loading,
      userUid: user?.uid,
      profileUid: userProfile?.uid
    });

    // If no user, redirect to login
    if (!user && !authLoading) {
      console.log("🔍 USER DETAILS: No user, redirecting to login");
      navigate('/login');
      return;
    }

    // If user exists but no profile yet, start timeout
    if (user && !userProfile && !loadTimeout) {
      console.log("🔍 USER DETAILS: User exists but no profile, starting timeout");
      const timeout = setTimeout(() => {
        console.log("🔍 USER DETAILS: Profile load timeout reached, showing form anyway");
        setLoadTimeout(true);
        setLoading(false);
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    }

    // If user and profile both exist, or user exists and timeout reached
    if (user && (userProfile || loadTimeout)) {
      console.log("🔍 USER DETAILS: Ready to show form", {
        hasProfile: !!userProfile,
        timeoutReached: loadTimeout
      });
      setLoading(false);
    }
  }, [user, userProfile, authLoading, navigate, loadTimeout]);
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

<<<<<<< HEAD
  const handleEditProfile = () => {
    navigate('/dashboard/profile');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  // Show loading only during initial auth check
  if (loading && authLoading) {
=======
  if (loading) {
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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

<<<<<<< HEAD
  // If still loading but user exists, show a different loading state
  if (loading && user && !loadTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your profile data...</h2>
          <p className="text-gray-600">Almost ready</p>
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  // At this point, user exists, so we can show the form
  // userProfile may still be loading, but we show defaults

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Profile Photo */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {userProfile.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{userProfile.fullName || 'Welcome!'}</h1>
              <p className="text-sm text-gray-600">ID: {userProfile.userId || 'HHF00000'}</p>
            </div>
          </div>
          {/* Level Badge */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-semibold">{userProfile.levelStatus || 'Star'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
            <h2 className="text-white font-semibold flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Details
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Phone */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-600">Phone</span>
              </div>
              <span className="font-semibold text-gray-800">{userProfile.phone || 'Not set'}</span>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-600">WhatsApp</span>
              </div>
              <span className="font-semibold text-gray-800">{userProfile.whatsapp || 'Not set'}</span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-500 mr-3" />
                <span className="text-gray-600">Email</span>
              </div>
              <span className="font-semibold text-gray-800 text-sm">{userProfile.email || 'Not set'}</span>
            </div>

            {/* Sponsor ID */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <User className="w-5 h-5 text-purple-500 mr-3" />
                <span className="text-gray-600">Sponsor ID</span>
              </div>
              <span className="font-semibold text-gray-800">{userProfile.sponsorId || 'None'}</span>
            </div>

            {/* Registration Date */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-indigo-500 mr-3" />
                <span className="text-gray-600">Registration Date</span>
              </div>
              <span className="font-semibold text-gray-800 text-sm">{formatDate(userProfile.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-4 py-3">
            <h2 className="text-white font-semibold flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Account Status
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Account Status */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${userProfile.isActivated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-gray-600">Account Status</span>
              </div>
              <span className={`font-semibold ${userProfile.isActivated ? 'text-green-600' : 'text-yellow-600'}`}>
                {userProfile.isActivated ? 'Active' : 'Pending Activation'}
              </span>
            </div>

            {/* Help Status */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${userProfile.isBlocked ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <span className="text-gray-600">Help Status</span>
              </div>
              <span className={`font-semibold ${userProfile.isBlocked ? 'text-red-600' : 'text-blue-600'}`}>
                {userProfile.isBlocked ? 'On Hold' : 'Eligible'}
              </span>
            </div>

            {/* Active Assignment Status */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-600">Active Assignment</span>
              </div>
              <span className="font-semibold text-gray-800">
                {userProfile.hasActiveHelp ? 'In Progress' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Your Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userProfile.referralCount || 0}</div>
              <div className="text-sm text-gray-600">Referrals</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">₹{(userProfile.totalEarnings || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userProfile.helpReceived || 0}</div>
              <div className="text-sm text-gray-600">Helps Received</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{userProfile.totalSent || 0}</div>
              <div className="text-sm text-gray-600">Helps Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleEditProfile}
            className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Headphones className="w-5 h-5" />
            <span>Support</span>
          </button>
        </div>
        <button
          onClick={handleGoToDashboard}
          className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md flex items-center justify-center"
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      </div>
    </div>
  );
};

export default UserDetails;