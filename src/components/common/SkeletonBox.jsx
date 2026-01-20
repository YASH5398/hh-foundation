import React from 'react';

const SkeletonBox = ({ className = '', style = {} }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-100 rounded ${className}`}
    style={style}
  />
);

export default SkeletonBox; 