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
    <div className="flex h-screen bg-slate-900 w-full overflow-x-hidden">
      <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Hamburger Menu */}
        <header className="lg:hidden bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between z-30 shadow-lg">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
