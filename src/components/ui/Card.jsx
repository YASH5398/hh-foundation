import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-6 hover:bg-[#eff6ff] hover:shadow-md transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
} 