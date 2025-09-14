import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="mt-4 px-2">
      <ul className="flex justify-center flex-wrap gap-1 sm:gap-2">
        {pageNumbers.map(number => (
          <li key={number} className="mx-0.5 sm:mx-1 my-0.5 sm:my-1">
            <button
              onClick={() => onPageChange(number)}
              className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-200 min-w-[32px] sm:min-w-[36px]
                ${currentPage === number ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;