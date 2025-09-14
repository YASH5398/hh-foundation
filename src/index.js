import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AgentAuthProvider } from './context/AgentAuthContext';
import { router } from './App'; // Import the router from App.js
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <AgentAuthProvider>
        <NotificationProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <RouterProvider router={router} />
        </NotificationProvider>
      </AgentAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);