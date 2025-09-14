import React from 'react';

const BlockedOverlay = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div classNameName="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Account Blocked</h2>
        <p className="text-gray-800 text-lg mb-6">{message}</p>
        <p className="text-gray-600 text-sm">Please contact support for assistance.</p>
      </div>
    </div>
  );
};

export default BlockedOverlay;