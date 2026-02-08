import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AgentAuthProvider } from './context/AgentAuthContext';
import { router } from './App'; // Import the router from App.js
import BlockScreen from './components/common/BlockScreen';
import FullPageLoader from './components/common/FullPageLoader';
import './index.css';

/**
 * FINAL HARD BLOCK GATEKEEPER SERVICE
 * This component ensures that the Router NEVER mounts if the user is restricted.
 */
const AppGuard = () => {
  const { user, userProfile, loading, profileLoading } = useAuth();

  // 1. HARD LOADING PROTECTION
  // We MUST wait for both Auth state AND User Document (Profile) if a user is detected.
  // This prevents the "flash" of the dashboard or premature router access.
  if (loading || (user && (userProfile === undefined || profileLoading))) {
    return <FullPageLoader />;
  }

  // 2. TRUE HARD BLOCK CHECK
  // We derive the block status directly from the user's Firestore data.
  // isBlocked and isOnHold are the terminal flags.
  const isBlocked = userProfile?.isBlocked === true || userProfile?.isOnHold === true;

  if (user && isBlocked) {
    console.warn("BLOCKED: Rendering BlockScreen only");
    return <BlockScreen isHardBlock={true} />;
  }

  // 3. ACCESS GRANTED: Mounted only after all checks pass.
  console.log("✅ ACCESS GRANTED: Mounting Application Router");
  return <RouterProvider router={router} />;
};

// Messaging Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js').
    then((registration) => {
      console.log(String('Firebase Messaging Service Worker registered successfully:') + " " + String(registration));
    }).
    catch((error) => {
      console.error(String('Firebase Messaging Service Worker registration failed:') + " " + String(error));
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Bootstrap the application
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AgentAuthProvider>
        <NotificationProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AppGuard />
        </NotificationProvider>
      </AgentAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);