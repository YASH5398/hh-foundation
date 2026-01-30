import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { FiSave, FiUser, FiBell, FiShield, FiMail, FiPhone, FiGlobe, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
              <FiUser className="w-5 h-5 text-indigo-400" />
            </span>
            Account Settings
          </h1>
          <p className="text-slate-400 mt-1 ml-1 text-sm font-medium">Manage preferences and configurations</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <FiSave className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column */}
        <div className="space-y-8">

          {/* Profile Section */}
          <Section title="Personal Information" icon={FiUser}>
            <div className="space-y-4">
              <InputGroup label="Display Name">
                <input
                  type="text"
                  name="displayName"
                  value={settings.displayName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="Agent Name"
                />
              </InputGroup>

              <InputGroup label="Email Address">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-400 font-mono text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Contact admin to change email</p>
              </InputGroup>

              <InputGroup label="Phone Number">
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={settings.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </InputGroup>
            </div>
          </Section>

          {/* Preferences Section */}
          <Section title="System Preferences" icon={FiGlobe}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Language">
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </InputGroup>

                <InputGroup label="Theme">
                  <div className="relative">
                    <FiMoon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </InputGroup>
              </div>

              <InputGroup label="Timezone">
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                </select>
              </InputGroup>
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">

          {/* Notifications Section */}
          <Section title="Notification Center" icon={FiBell}>
            <div className="space-y-1">
              <ToggleItem
                label="Email Alerts"
                desc="Receive critical updates via email"
                active={settings.notifications.emailNotifications}
                onClick={() => handleNotificationChange('emailNotifications')}
              />
              <ToggleItem
                label="Push Notifications"
                desc="Browser alerts for real-time events"
                active={settings.notifications.pushNotifications}
                onClick={() => handleNotificationChange('pushNotifications')}
              />
              <ToggleItem
                label="Assignment Alerts"
                desc="Notify when tickets are assigned to me"
                active={settings.notifications.ticketAssignments}
                onClick={() => handleNotificationChange('ticketAssignments')}
              />
              <ToggleItem
                label="Escalation Protocols"
                desc="High priority alerts for escalated issues"
                active={settings.notifications.escalations}
                onClick={() => handleNotificationChange('escalations')}
              />
            </div>
          </Section>

          {/* Security (Read-Only) */}
          <Section title="Security Status" icon={FiShield}>
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-300">Account Security</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] uppercase font-bold tracking-wider">Active</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Your account is protected with standard encryption. 2FA is currently managed by the administrator.</p>
              <button disabled className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                Manage Security Keys (Disabled)
              </button>
            </div>
          </Section>
        </div>
      </form>
    </div>
  );
};

/* --- Styled Components --- */

const Section = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-8"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
    </div>
    {children}
  </motion.div>
);

const InputGroup = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
      {label}
    </label>
    {children}
  </div>
);

const ToggleItem = ({ label, desc, active, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors cursor-pointer group"
  >
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{label}</p>
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${active ? 'bg-blue-600' : 'bg-slate-700'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${active ? 'left-7' : 'left-1'}`} />
    </div>
  </div>
);

export default AgentSettings;