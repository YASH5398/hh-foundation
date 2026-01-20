import React from 'react';
import { formatDate } from '../../utils/formatDate';

const DashboardProfileCard = ({ userId, name, joiningDate, levelStatus, level, isActivated, referralCount }) => {

  // Helper function to truncate long text
  const truncateText = (text, maxLength = 20) => {
    if (!text || text === 'N/A') return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 mb-6 border border-indigo-100 min-w-0 hover:bg-[#eff6ff] hover:shadow-md transition-all duration-300">
      <h3 className="text-base font-semibold text-gray-800 mb-4">User Profile</h3>
      {/* 2-column grid on all screen sizes, never stacked */}
      <div className="grid grid-cols-2 gap-4 min-w-0">
          {/* User ID & Name */}
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm min-w-0 flex items-center gap-4">
          <span className="text-indigo-500 text-2xl">🆔</span>
          <div className="min-w-0">
            <p className="text-sm font-mono text-indigo-600 font-semibold truncate">{truncateText(userId, 12)}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{truncateText(name, 15)}</p>
            </div>
          </div>
          {/* Joining Date */}
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm min-w-0 flex items-center gap-4">
          <span className="text-indigo-500 text-2xl">📅</span>
            <div>
              <p className="text-xs font-medium text-gray-600">Joining Date</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{formatDate(joiningDate)}</p>
          </div>
        </div>
          {/* Level */}
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm min-w-0 flex items-center gap-4">
          <span className="text-indigo-500 text-2xl">⭐</span>
            <div>
              <p className="text-xs font-medium text-gray-600">Level</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{levelStatus || 'N/A'} {level && `(${level})`}</p>
            </div>
          </div>
          {/* Status */}
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm min-w-0 flex items-center gap-4">
          <span className="text-indigo-500 text-2xl">✓</span>
            <div>
              <p className="text-xs font-medium text-gray-600">Status</p>
              <div className="flex items-center gap-2">
                {isActivated ? (
                  <>
                  <span className="text-green-500 text-base">●</span>
                  <p className="text-sm font-semibold text-green-600">Activated</p>
                  </>
                ) : (
                  <>
                  <span className="text-yellow-500 text-base">●</span>
                  <p className="text-sm font-semibold text-yellow-600">Pending</p>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for profile card
export const DashboardProfileCardSkeleton = () => (
  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-md p-4 mb-6 border border-indigo-100 animate-pulse">
    <div className="h-4 w-32 bg-indigo-100 rounded mb-4" />
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-6 w-6 bg-indigo-100 rounded-full mr-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-indigo-100 rounded" />
            <div className="h-3 w-16 bg-indigo-100 rounded" />
        </div>
        </div>
      ))}
    </div>
  </div>
);

export default DashboardProfileCard;