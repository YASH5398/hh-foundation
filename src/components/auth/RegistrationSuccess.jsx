import React from 'react';
import { Link } from 'react-router-dom';

export default function RegistrationSuccess() {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 text-center max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold text-green-600 mb-4">🎉 Registration Successful!</h2>
      <p className="mb-4">Welcome to HH Foundation. Your account has been created successfully.</p>
      <Link to="/dashboard">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Go to Dashboard
                    </button>
      </Link>
    </div>
  );
} 