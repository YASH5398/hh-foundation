import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AgentAuthProvider } from './context/AgentAuthContext';
import { router } from './App'; // Import the router from App.js
import BlockedUserPopup from './components/common/BlockedUserPopup';
import './index.css';

// Register Firebase Messaging Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase Messaging Service Worker registered successfully:', registration);
    })
    .catch((error) => {
      console.error('Firebase Messaging Service Worker registration failed:', error);
    });
}

const AppWrapper = () => {
  const { user, userProfile, isBlocked, blockReason, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is logged in and blocked, hard-block the entire app
  if (user && isBlocked) {
    // Only block if it's NOT an admin user (admins should be able to unblock themselves/others)
    if (userProfile?.role !== 'admin') {
      return <BlockedUserPopup user={{ isBlocked, blockReason }} blockedHelpRef={userProfile?.blockedHelpRef} />;
    }
  }

  return <RouterProvider router={router} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <AgentAuthProvider>
        <NotificationProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AppWrapper />
        </NotificationProvider>
      </AgentAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);