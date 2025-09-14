import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <img
        src="https://freeimage.host/i/FVH54Jn"
        alt="Loading..."
        className="w-12 h-12 rounded-full animate-spin"
      />
    </div>
  );
};

export default LoadingSpinner;