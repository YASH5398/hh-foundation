import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AgentAuthProvider } from './context/AgentAuthContext';
import { router } from './App'; // Import the router from App.js
import NotificationPermissionPopup from './components/notifications/NotificationPermissionPopup';
import FCMHandler from './components/FCMHandler';
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

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <AgentAuthProvider>
        <NotificationProvider>
          <FCMHandler>
            <Toaster position="top-center" reverseOrder={false} />
            <NotificationPermissionPopup />
            <RouterProvider router={router} />
          </FCMHandler>
        </NotificationProvider>
      </AgentAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);