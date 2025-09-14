import React from 'react';
import { FaTimes } from 'react-icons/fa';

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className={`relative p-5 border shadow-lg rounded-md bg-white transform transition-all sm:my-8 sm:align-middle ${wide ? 'max-w-2xl w-full' : 'sm:max-w-lg sm:w-full w-96'}`}>
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;