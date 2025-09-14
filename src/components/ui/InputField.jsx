import React from 'react';

function InputField({ label, id, type = 'text', value, onChange, required = false, className = '', ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        id={id}
        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </div>
  );
}

export default InputField;