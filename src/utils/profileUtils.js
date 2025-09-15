/**
 * Utility functions for handling user profile images
 */

// Default profile image URL
export const DEFAULT_PROFILE_IMAGE = '/default-mlm-logo.svg';

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