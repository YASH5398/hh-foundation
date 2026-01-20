import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
// import EmailVerification from './EmailVerification';

const Auth = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'forgot-password'

  const handleSwitchToSignup = () => {
    setCurrentView('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  // After signup, go to login (or dashboard if you want)
  const handleSignupSuccess = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = () => {
    onAuthSuccess();
  };

  // Render the appropriate component based on current view
  switch (currentView) {
    case 'signup':
      return <Signup onSwitchToLogin={handleSwitchToLogin} onSignupSuccess={handleSignupSuccess} />;
    case 'forgot-password':
      return <ForgotPassword onBackToLogin={handleBackToLogin} />;
    case 'login':
    default:
      return (
        <Login 
          onSwitchToSignup={handleSwitchToSignup} 
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
          // onLoginSuccess={handleLoginSuccess} // Remove this prop
        />
      );
  }
};

export default Auth; 