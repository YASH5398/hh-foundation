import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  showOnline = false, 
  isOnline = false,
  className = '',
  animate = false,
  fallbackBg = 'bg-gradient-to-br from-indigo-400 to-purple-500',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const onlineSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const avatarContent = (
    <div className={`relative inline-block ${className}`} {...props}>
      <div className={`${sizes[size]} rounded-full overflow-hidden border-2 border-white shadow-lg relative`}>
        {src && !imageError ? (
          <>
            {imageLoading && (
              <div className={`${sizes[size]} ${fallbackBg} flex items-center justify-center text-white font-semibold`}>
                <div className="animate-pulse">
                  {getInitials(name)}
                </div>
              </div>
            )}
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className={`${sizes[size]} object-cover transition-opacity duration-200 ${
                imageLoading ? 'opacity-0 absolute inset-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className={`${sizes[size]} ${fallbackBg} flex items-center justify-center text-white font-semibold`}>
            {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
          </div>
        )}
      </div>
      
      {/* Online Indicator */}
      {showOnline && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -bottom-0.5 -right-0.5 ${onlineSizes[size]} rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        >
          {isOnline && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`${onlineSizes[size]} rounded-full bg-green-400 opacity-75`}
            />
          )}
        </motion.div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        className="inline-block"
      >
        {avatarContent}
      </motion.div>
    );
  }

  return avatarContent;
};

// Avatar Group Component
export const AvatarGroup = ({ 
  avatars = [], 
  max = 3, 
  size = 'md', 
  className = '',
  showCount = true 
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const spacingClasses = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-3',
    xl: '-space-x-4',
    '2xl': '-space-x-5'
  };

  return (
    <div className={`flex items-center ${spacingClasses[size]} ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id || index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
          style={{ zIndex: displayAvatars.length - index }}
        />
      ))}
      
      {showCount && remainingCount > 0 && (
        <div className={`${Avatar.sizes?.[size] || 'w-12 h-12'} rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-medium text-sm`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Static sizes for external access
Avatar.sizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24'
};

export default Avatar;