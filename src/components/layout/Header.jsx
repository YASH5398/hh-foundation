import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Header = () => {
  const { currentUser } = useAuth();
  const user = currentUser || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Get first letter of user's name (fallback)
  const getInitial = () => {
    if (user.fullName && user.fullName.length > 0) {
      return user.fullName[0].toUpperCase();
    }
    if (user.displayName && user.displayName.length > 0) {
      return user.displayName[0].toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 bg-gradient-to-r from-violet-900/95 via-purple-800/90 to-indigo-900/95 backdrop-blur-xl border-b border-white/20 text-white shadow-2xl">
      <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">Helping Hands Foundation</h1>
      <div className="flex items-center gap-x-6">
        <NotificationDropdown />
        <div className="relative" ref={profileRef}>
          <button
            className="focus:outline-none group transition-all duration-300 hover:scale-110"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Profile menu"
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white/30 object-cover bg-white cursor-pointer shadow-xl group-hover:border-amber-400/60 group-hover:shadow-2xl transition-all duration-300"
              />
            ) : (
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold text-lg border-2 border-white/30 cursor-pointer select-none shadow-xl group-hover:border-amber-400/60 group-hover:shadow-2xl group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-indigo-500 transition-all duration-300">
                {getInitial()}
              </span>
            )}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-xl text-gray-800 rounded-2xl shadow-2xl border border-white/30 z-50 py-3 animate-fade-in">
              <div className="px-5 py-3 text-sm font-medium text-gray-600 border-b border-gray-200/50">Profile Menu (coming soon)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;