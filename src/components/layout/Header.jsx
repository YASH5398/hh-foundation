import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { Menu, X } from "lucide-react"; // added X for close
import { getProfileImageUrl } from '../../utils/profileUtils';

const Header = () => {
  const { currentUser } = useAuth();
  const user = currentUser || {};
  const [menuOpen, setMenuOpen] = useState(false); // profile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // mobile menu
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const getInitial = () => {
    if (user.fullName) return user.fullName[0].toUpperCase();
    if (user.displayName) return user.displayName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 bg-gradient-to-r from-violet-900/95 via-purple-800/90 to-indigo-900/95 backdrop-blur-xl border-b border-white/20 text-white shadow-2xl relative">
      {/* Logo */}
      <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
        Helping Hands Foundation
      </h1>

      {/* Desktop Right Section */}
      <div className="hidden md:flex items-center gap-x-6">
        <NotificationDropdown />
        <div className="relative" ref={profileRef}>
          <button
            className="focus:outline-none group transition-all duration-300 hover:scale-110"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Profile menu"
          >
            <img
              src={getProfileImageUrl(user)}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white/30 object-cover bg-white cursor-pointer shadow-xl group-hover:border-amber-400/60 group-hover:shadow-2xl transition-all duration-300"
              onError={(e) => {
                e.target.src = getProfileImageUrl(null); // Fallback to default
              }}
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-xl text-gray-800 rounded-2xl shadow-2xl border border-white/30 z-50 py-3 animate-fade-in">
              <div className="px-5 py-3 text-sm font-medium text-gray-600 border-b border-gray-200/50">
                Profile Menu (coming soon)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden focus:outline-none"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-8 h-8 text-white" /> // show close when open
        ) : (
          <Menu className="w-8 h-8 text-white" /> // show menu when closed
        )}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-violet-900/95 backdrop-blur-xl text-white py-4 px-6 flex flex-col gap-4 shadow-2xl md:hidden z-50">
          <NotificationDropdown />
          {/* Add mobile nav links here */}
        </div>
      )}
    </div>
  );
};

export default Header;
