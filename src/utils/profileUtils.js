// Profile utility functions for handling user profile images and data
// Updated to use the new MLM logo fallback URL

// Default profile image - MLM logo from external URL
export const DEFAULT_PROFILE_IMAGE = 'https://iili.io/KYn4qFV.md.png';

// Default Tailwind classes for consistent profile image styling
export const PROFILE_IMAGE_CLASSES = {
  small: 'w-8 h-8 rounded-full object-cover',
  medium: 'w-12 h-12 rounded-full object-cover',
  large: 'w-16 h-16 rounded-full object-cover',
  xlarge: 'w-24 h-24 rounded-full object-cover'
};

/**
 * Get profile image URL with fallback to default
 * @param {Object} user - User object
 * @returns {string} Profile image URL
 */
export const getProfileImageUrl = (user) => {
  if (!user) return DEFAULT_PROFILE_IMAGE;
  
  // Check multiple possible field names for profile image
  const profileImage = user.profileImage || user.avatar || user.photoURL;
  
  return profileImage || DEFAULT_PROFILE_IMAGE;
};

/**
 * Check if user has a custom profile image
 * @param {Object} user - User object
 * @returns {boolean} True if user has custom image
 */
export const hasCustomProfileImage = (user) => {
  if (!user) return false;
  
  const profileImage = user.profileImage || user.avatar || user.photoURL;
  return profileImage && profileImage !== DEFAULT_PROFILE_IMAGE;
};

/**
 * Get user initials for fallback display
 * @param {Object} user - User object
 * @returns {string} User initials
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  const name = user.fullName || user.displayName || user.name || user.email;
  if (!name) return 'U';
  
  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  
  return name[0].toUpperCase();
};

/**
 * Handle image load errors by setting fallback image
 * @param {Event} e - Image error event
 */
export const handleImageError = (e) => {
  console.log('Image failed to load, using default MLM logo');
  e.target.src = DEFAULT_PROFILE_IMAGE;
  e.target.onerror = null; // Prevent infinite loop
};