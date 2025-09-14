import React from 'react';
import { motion } from 'framer-motion';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '',
  animate = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = `inline-flex items-center font-medium rounded-full border transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`;

  const badgeContent = (
    <span className={baseClasses} {...props}>
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05 }}
        className="inline-block"
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
};

// Specialized badge components
export const StatusBadge = ({ status, ...props }) => {
  const statusConfig = {
    pending: { variant: 'warning', children: 'Pending' },
    confirmed: { variant: 'success', children: 'Confirmed' },
    blocked: { variant: 'danger', children: 'Blocked' },
    received: { variant: 'success', children: 'Received' },
    expired: { variant: 'danger', children: 'Expired' }
  };

  const config = statusConfig[status?.toLowerCase()] || { variant: 'default', children: status };
  
  return <Badge {...config} {...props} />;
};

export const LevelBadge = ({ level, ...props }) => {
  const levelConfig = {
    star: { variant: 'warning', children: '⭐ Star' },
    silver: { variant: 'default', children: '🥈 Silver' },
    gold: { variant: 'warning', children: '🥇 Gold' },
    platinum: { variant: 'purple', children: '💎 Platinum' },
    diamond: { variant: 'info', children: '💠 Diamond' }
  };

  const config = levelConfig[level?.toLowerCase()] || { variant: 'default', children: level };
  
  return <Badge {...config} {...props} />;
};

export const CountBadge = ({ count, label, ...props }) => {
  return (
    <Badge variant="primary" {...props}>
      {count} {label}
    </Badge>
  );
};

export default Badge;