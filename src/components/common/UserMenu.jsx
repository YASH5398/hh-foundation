import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut } from 'react-icons/fi';

const UserMenu = ({ user, onLogout, showEmail }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 focus:outline-none group"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold uppercase group-hover:ring-2 group-hover:ring-blue-400 transition">
          {initial}
        </div>
        {showEmail && user?.email && (
          <span className="hidden md:block text-sm text-gray-700 font-medium">
            {user.email}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-44 bg-white shadow-xl rounded-md py-2 z-50">
          <button
            onClick={() => {
              navigate('/profile-settings');
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
          >
            <FiUser size={16} className="text-gray-600" />
            Profile
          </button>
          <button
            onClick={() => {
              onLogout();
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
          >
            <FiLogOut size={16} className="text-gray-600" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;