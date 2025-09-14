import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert" style={{
      fontFamily: "'Poppins', 'Roboto', sans-serif",
      fontWeight: 400
    }}>
      <strong className="font-bold" style={{ fontWeight: 600 }}>Error!</strong>
      <span className="block sm:inline"> {message}</span>
    </div>
  );
};

export default ErrorMessage;