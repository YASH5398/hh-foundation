import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AgentLogin = () => {
  const [step, setStep] = useState(1); // 1: Email/Password, 2: Phone OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // reCAPTCHA state management
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  const { loginWithEmail, sendOTP, verifyOTP, currentUser, isAgent, checkFirebaseConfig } = useAgentAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Note: Removed auto-redirect to allow direct access to /agent/login

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Initialize reCAPTCHA - Firebase v9+ syntax
  useEffect(() => {
    // Guard against double execution
    if (recaptchaVerifierRef.current) {
      console.log('reCAPTCHA already initialized');
      return;
    }

    const initializeRecaptcha = () => {
      try {
        // Check if container exists (should exist since component is mounted)
        const container = document.getElementById('recaptcha-container');
        if (!container) {
          console.error('reCAPTCHA container not found');
          return;
        }

        // Debug: Check auth object
        console.log('Auth object check:', {
          auth: !!auth,
          authType: typeof auth,
          authApp: auth?.app?.name,
          authConfig: auth?.app?.options?.projectId
        });

        // Firebase v10 RecaptchaVerifier - pass auth as first parameter
        // This is the correct v10 syntax
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth, // auth as first parameter in v10
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response) => {
              console.log('reCAPTCHA verified successfully');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
            },
            'error-callback': (error) => {
              console.error('reCAPTCHA error:', error);
            }
          }
        );

        console.log('reCAPTCHA initialized successfully');
        setRecaptchaReady(true);

      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    };

    // Initialize immediately since component is mounted and container exists
    initializeRecaptcha();

    // Cleanup on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.log('Error cleaning up reCAPTCHA:', e);
        }
        recaptchaVerifierRef.current = null;
      }
      setRecaptchaReady(false);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(formData.email, formData.password);
      setTempUser(user);
      setStep(2);
      toast.success('Email verified! Please enter your phone number for OTP verification.');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    // Check if reCAPTCHA is ready
    if (!recaptchaReady) {
      toast.error('Please wait for reCAPTCHA to load, then try again');
      return;
    }

    // Format phone number to E.164 format (+91XXXXXXXXXX)
    let phoneNumber = formData.phoneNumber.trim().replace(/\s+/g, '');

    // Remove all non-digit characters
    phoneNumber = phoneNumber.replace(/\D/g, '');

    // Validate it's exactly 10 digits
    if (phoneNumber.length !== 10) {
      toast.error('Please enter exactly 10 digits for mobile number');
      return;
    }

    // Validate starts with valid Indian mobile prefix (6-9)
    if (!phoneNumber.match(/^[6-9]/)) {
      toast.error('Please enter a valid Indian mobile number starting with 6-9');
      return;
    }

    // Add +91 prefix for E.164 format
    phoneNumber = '+91' + phoneNumber;

    setLoading(true);
    try {
      const result = await sendOTP(phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setOtpSent(true);
      setCountdown(60);
      // Update form data with formatted number
      setFormData(prev => ({ ...prev, phoneNumber }));
      toast.success('OTP sent to your phone number');
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Validate OTP input
    if (!formData.otp || formData.otp.trim().length === 0) {
      toast.error('Please enter the OTP');
      return;
    }
    
    if (formData.otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    
    if (!/^\d{6}$/.test(formData.otp)) {
      toast.error('OTP must contain only numbers');
      return;
    }

    if (!confirmationResult) {
      toast.error('Please request OTP first');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(confirmationResult, formData.otp, tempUser);
      toast.success('Login successful! Redirecting to dashboard...');
      // Small delay to show success message
      setTimeout(() => {
        navigate('/agent-dashboard', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP has expired. Please request a new one.');
        setOtpSent(false);
        setConfirmationResult(null);
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        toast.error(error.message || 'OTP verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    setFormData(prev => ({ ...prev, otp: '' }));
    setOtpSent(false);
    setConfirmationResult(null);
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtpSent(false);
    setConfirmationResult(null);
    setTempUser(null);
    setFormData(prev => ({ ...prev, phoneNumber: '', otp: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* reCAPTCHA container - ALWAYS mounted */}
      <div id="recaptcha-container" className="fixed top-4 right-4 z-50"></div>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <FiShield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Agent Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? 'Sign in to your agent account' : 'Verify your phone number'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {step === 1 ? (
            /* Step 1: Email/Password */
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Continue to Phone Verification'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Phone OTP */
            <div className="space-y-6">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter 10-digit mobile number (without +91)"
                        maxLength="10"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter 10 digits only (e.g., 9876543210). Country code (+91) will be added automatically.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !recaptchaReady}
                        className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <LoadingSpinner size="sm" /> :
                         !recaptchaReady ? 'Initializing reCAPTCHA...' : 'Send OTP'}
                      </button>
                    </div>

                    {/* Troubleshooting Tips */}
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Troubleshooting Tips:</h4>
                      <ul className="text-xs text-amber-700 space-y-1">
                        <li>• Wait for "reCAPTCHA ready" message to appear</li>
                        <li>• Complete the reCAPTCHA challenge if prompted</li>
                        <li>• Ensure stable internet connection</li>
                        <li>• Disable ad blockers if reCAPTCHA fails to load</li>
                        <li>• Try refreshing the page if issues persist</li>
                      </ul>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Enter OTP
                    </label>
                    <div className="mt-1">
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        maxLength="6"
                        required
                        value={formData.otp}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg tracking-widest"
                        placeholder="000000"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter the 6-digit code sent to {formData.phoneNumber}
                    </p>
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      ⚠️ OTP verification is mandatory to complete login
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={countdown > 0 ? undefined : handleResendOTP}
                      disabled={countdown > 0}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Verify & Login'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* reCAPTCHA status */}
        <div className="text-center">
          {recaptchaReady ? (
            <div className="text-xs text-green-600 mb-2">
              ✅ reCAPTCHA ready - you can send OTP
            </div>
          ) : (
            <div className="text-xs text-blue-600 mb-2">
              🔄 Initializing reCAPTCHA...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Secure agent portal powered by Firebase Authentication
          </p>
          <button
            type="button"
            onClick={() => {
              const config = checkFirebaseConfig();
              console.log('Firebase Config Check:', config);
              toast.info('Check browser console for Firebase configuration details');
            }}
            className="text-xs text-blue-600 hover:text-blue-500 underline"
          >
            Run Firebase Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;