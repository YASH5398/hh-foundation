import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiSave, FiUser, FiBell, FiShield, FiMail, FiPhone } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AgentSettings = () => {
  const { currentUser } = useAgentAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      ticketAssignments: true,
      escalations: true
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });

  useEffect(() => {
    fetchAgentSettings();
  }, [currentUser]);

  const fetchAgentSettings = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const agentDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        setSettings({
          displayName: agentData.displayName || agentData.name || '',
          email: agentData.email || currentUser.email || '',
          phoneNumber: agentData.phoneNumber || '',
          notifications: {
            emailNotifications: agentData.notifications?.emailNotifications ?? true,
            pushNotifications: agentData.notifications?.pushNotifications ?? true,
            ticketAssignments: agentData.notifications?.ticketAssignments ?? true,
            escalations: agentData.notifications?.escalations ?? true
          },
          preferences: {
            theme: agentData.preferences?.theme || 'light',
            language: agentData.preferences?.language || 'en',
            timezone: agentData.preferences?.timezone || 'UTC'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching agent settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      setSaving(true);
      const agentRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(agentRef, {
        displayName: settings.displayName,
        phoneNumber: settings.phoneNumber,
        notifications: settings.notifications,
        preferences: settings.preferences,
        updatedAt: new Date()
      });

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and notification settings</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FiUser className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={settings.displayName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={settings.email}
                  disabled
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed from this panel</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={settings.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FiBell className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries({
              emailNotifications: 'Email Notifications',
              pushNotifications: 'Push Notifications',
              ticketAssignments: 'Ticket Assignment Alerts',
              escalations: 'Escalation Notifications'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <p className="text-xs text-gray-500">
                    {key === 'emailNotifications' && 'Receive notifications via email'}
                    {key === 'pushNotifications' && 'Receive browser push notifications'}
                    {key === 'ticketAssignments' && 'Get notified when tickets are assigned to you'}
                    {key === 'escalations' && 'Receive alerts for escalated issues'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications[key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FiShield className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <FiSave className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentSettings;