import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cookie, Shield, Settings, Eye, Clock, Globe, CheckCircle, XCircle } from 'lucide-react';

const CookiePolicy = () => {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always required
    analytics: false,
    preferences: false,
    security: true // Always required
  });

  const cookieData = [
    {
      id: 'essential-cookies',
      title: 'Essential Cookies',
      icon: Shield,
      required: true,
      content: [
        'Session Management: Cookies that maintain your login session and keep you authenticated while using the platform.',
        'Security Tokens: CSRF tokens and other security measures to protect against unauthorized access and attacks.',
        'Platform Functionality: Cookies required for basic platform operations, form submissions, and user interactions.',
        'Load Balancing: Technical cookies that ensure proper distribution of server load for optimal performance.',
        'Error Handling: Cookies that help us identify and resolve technical issues you may encounter.',
        'These cookies are essential for platform operation and cannot be disabled.'
      ]
    },
    {
      id: 'security-cookies',
      title: 'Security Cookies',
      icon: Shield,
      required: true,
      content: [
        'Fraud Detection: Cookies that help identify suspicious activities and prevent unauthorized access.',
        'Account Protection: Cookies that monitor for unusual login patterns and potential security threats.',
        'Device Recognition: Cookies that help recognize trusted devices and reduce security prompts.',
        'Brute Force Protection: Cookies that prevent automated attacks on user accounts.',
        'Session Security: Cookies that ensure secure communication between your device and our servers.',
        'These security cookies are mandatory and cannot be disabled for your protection.'
      ]
    },
    {
      id: 'analytics-cookies',
      title: 'Analytics Cookies (Optional)',
      icon: Eye,
      required: false,
      content: [
        'Usage Analytics: Cookies that help us understand how members use the platform and which features are most popular.',
        'Performance Monitoring: Cookies that track page load times, errors, and overall platform performance.',
        'User Journey Tracking: Cookies that show us how members navigate through the platform to improve user experience.',
        'Feature Usage: Cookies that help us understand which platform features are used most frequently.',
        'Error Reporting: Cookies that help us identify and fix bugs or issues members encounter.',
        'These cookies help us improve the platform but are not required for basic functionality.'
      ]
    },
    {
      id: 'preference-cookies',
      title: 'Preference Cookies (Optional)',
      icon: Settings,
      required: false,
      content: [
        'UI Preferences: Cookies that remember your preferred language, theme, and display settings.',
        'Notification Settings: Cookies that store your preferences for email and platform notifications.',
        'Dashboard Layout: Cookies that remember your preferred dashboard configuration and layout.',
        'Form Data: Cookies that temporarily store form information to prevent data loss during sessions.',
        'Accessibility Settings: Cookies that remember accessibility preferences like font size and contrast.',
        'These cookies enhance your experience but are not required for platform functionality.'
      ]
    },
    {
      id: 'cookie-management',
      title: 'Cookie Management',
      icon: Settings,
      required: false,
      content: [
        'Browser Controls: You can manage cookies through your browser settings to block or delete cookies.',
        'Platform Settings: Use our cookie preference center below to control optional cookies.',
        'Selective Consent: You can choose which types of optional cookies to allow or block.',
        'Regular Review: You can change your cookie preferences at any time through this page.',
        'Cookie Expiration: Different cookies have different expiration periods, from session-only to long-term.',
        'Third-Party Cookies: We do not use third-party advertising or tracking cookies on our platform.'
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Privacy',
      icon: Shield,
      required: false,
      content: [
        'Data Minimization: We only collect cookie data that is necessary for platform functionality and improvement.',
        'Encryption: Cookie data is encrypted and securely transmitted between your device and our servers.',
        'No Personal Data: Most cookies contain only technical identifiers, not personal information.',
        'Limited Retention: Cookies are automatically deleted after their expiration period.',
        'No Sharing: Cookie data is not shared with third parties for advertising or marketing purposes.',
        'Privacy Rights: You have the right to access, modify, or delete cookie data as outlined in our Privacy Policy.'
      ]
    }
  ];

  const handleCookiePreference = (type, value) => {
    setCookiePreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const savePreferences = () => {
    // In a real implementation, this would save to localStorage or send to server
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    alert('Cookie preferences saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Cookie className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Cookie
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Policy</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Learn about how we use cookies on the HH Foundation platform, what data we collect, 
              and how you can control your cookie preferences.
            </p>
          </motion.div>

          {/* Cookie Consent Notice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-12"
          >
            <div className="flex items-start gap-4">
              <Cookie className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-2">Cookie Usage Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  We use cookies to ensure platform security, maintain your login sessions, and improve your experience. 
                  Essential and security cookies are required for platform operation, while analytics and preference cookies are optional.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cookie Preference Center */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              Cookie Preference Center
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Essential Cookies</h3>
                  <p className="text-gray-300 text-sm">Required for platform functionality and security</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Always On</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Security Cookies</h3>
                  <p className="text-gray-300 text-sm">Required for fraud detection and account protection</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Always On</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Analytics Cookies</h3>
                  <p className="text-gray-300 text-sm">Help us improve platform performance and user experience</p>
                </div>
                <button
                  onClick={() => handleCookiePreference('analytics', !cookiePreferences.analytics)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    cookiePreferences.analytics 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {cookiePreferences.analytics ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {cookiePreferences.analytics ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Preference Cookies</h3>
                  <p className="text-gray-300 text-sm">Remember your settings and preferences</p>
                </div>
                <button
                  onClick={() => handleCookiePreference('preferences', !cookiePreferences.preferences)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    cookiePreferences.preferences 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {cookiePreferences.preferences ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {cookiePreferences.preferences ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            <button
              onClick={savePreferences}
              className="mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Save Cookie Preferences
            </button>
          </motion.div>

          {/* Cookie Policy Sections */}
          <div className="space-y-8">
            {cookieData.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                      {section.required && (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-gray-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Browser Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Browser Cookie Controls</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              You can also manage cookies directly through your browser settings. Most browsers allow you to 
              view, delete, and block cookies. However, disabling essential cookies may affect platform functionality.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-semibold mb-2">Chrome & Edge</h4>
                <p className="text-gray-300 text-sm">Settings → Privacy and Security → Cookies</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-semibold mb-2">Firefox & Safari</h4>
                <p className="text-gray-300 text-sm">Preferences → Privacy → Cookies and Site Data</p>
              </div>
            </div>
          </motion.div>

          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 text-center text-gray-400"
          >
            <p>Last updated: January 2025</p>
            <p className="mt-2">© 2025 HH Foundation. All rights reserved.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicy;