import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, Mail, Users, Key, Calendar, Star, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegisterSuccess = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white font-sans">
        <div className="w-full max-w-xl mx-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center rounded-t-2xl shadow-lg">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 rounded-full p-2 mb-4">
                <CheckCircle className="w-8 h-8 text-white animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white">Loading your registration details...</h1>
            </div>
          </div>
          <div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 p-8 min-h-[200px]" />
        </div>
      </div>
    );
  }

  // Format joining date from Firestore timestamp
  let joiningDate = '-';
  if (user.createdAt && user.createdAt.toDate) {
    const dateObj = user.createdAt.toDate();
    joiningDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } else if (user.registrationTime && user.registrationTime.toDate) {
    const dateObj = user.registrationTime.toDate();
    joiningDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Use fullName or name for display
  const fullName = user.fullName || user.name || '-';
  const firstName = fullName.split(' ')[0];
  const email = user.email || '-';
  const userId = user.userId || '-';
  const sponsorId = user.sponsorId || '-';
  const level = user.levelStatus || user.level || '-';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white font-sans">
      <div className="w-full max-w-xl mx-4">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center rounded-t-2xl shadow-lg">
          <div className="flex flex-col items-center">
            <div className="bg-white/20 rounded-full p-2 mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              🎉 Congratulations, {fullName}! You’ve successfully registered.
            </h1>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 p-8">
          <div className="space-y-4 mb-8">
            {/* Name */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="flex items-center gap-3 text-gray-600">
                <User className="w-5 h-5 text-blue-500" />
                Name
              </span>
              <span className="font-semibold text-gray-800">{fullName}</span>
            </div>
            {/* Email */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5 text-indigo-500" />
                Email
              </span>
              <span className="font-semibold text-gray-800">{email}</span>
            </div>
            {/* User ID */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="flex items-center gap-3 text-gray-600">
                <Users className="w-5 h-5 text-pink-500" />
                User ID
              </span>
              <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{userId}</span>
            </div>
            {/* Joining Date */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-green-500" />
                Joining Date
              </span>
              <span className="font-semibold text-gray-800">{joiningDate}</span>
            </div>
            {/* Sponsor ID */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="flex items-center gap-3 text-gray-600">
                <Key className="w-5 h-5 text-yellow-500" />
                Sponsor ID
              </span>
              <span className="font-semibold text-gray-800">{sponsorId}</span>
            </div>
            {/* Level */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-gray-600">
                <Star className="w-5 h-5 text-amber-500" />
                Level
              </span>
              <span className="font-bold text-blue-700 bg-blue-100 px-4 py-1 rounded-full text-sm">{level}</span>
            </div>
          </div>
          {/* Dashboard Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;