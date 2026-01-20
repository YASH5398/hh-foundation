import React from 'react';
import { getPasswordStrength } from '../../utils/validation';

const PasswordStrengthIndicator = ({ password }) => {
  const { strength, label, color } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2" style={{ fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 w-8 rounded-full transition-all duration-300 ${
                level <= strength ? color : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          strength <= 1 ? 'text-red-600' :
          strength === 2 ? 'text-yellow-600' :
          strength === 3 ? 'text-blue-600' :
          'text-green-600'
        }`} style={{ fontWeight: 400 }}>
          {label}
        </span>
      </div>
      <div className="text-xs text-gray-500" style={{ fontWeight: 400 }}>
        {strength < 3 && (
          <span>Password should contain uppercase, lowercase, numbers, and special characters</span>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator; 