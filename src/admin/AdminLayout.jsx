import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import AdminSidebar from '../components/layout/AdminSidebar';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Hamburger Menu */}
        <header className="lg:hidden bg-white shadow-md px-4 py-3 flex items-center justify-between z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <FiMenu size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-blue-800">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:pt-2 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
