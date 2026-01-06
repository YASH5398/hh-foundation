import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import notificationPreferencesService from '../../services/notificationPreferencesService';
import {
  FiSettings, FiX, FiSave, FiRotateCcw, FiDownload, FiUpload,
  FiBell, FiVolume2, FiVolumeX, FiClock, FiMoon, FiSun,
  FiToggleLeft, FiToggleRight, FiCheck, FiAlertTriangle
} from 'react-icons/fi';

const NotificationPreferences = ({ isOpen, onClose, userId }) => {
  const { availableSoundTypes, testSound } = useNotifications();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');

  useEffect(() => {
    if (isOpen && userId) {
      loadPreferences();
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationPreferencesService.getUserPreferences(userId);
      setPreferences(prefs);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await notificationPreferencesService.saveUserPreferences(userId, preferences);
      setHasChanges(false);
      // Show success message
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      const defaults = notificationPreferencesService.getDefaultPreferences();
      setPreferences(defaults);
      setHasChanges(true);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };

  const updatePreference = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current = newPrefs;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
    setHasChanges(true);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      payment: '💰',
      upgrade: '🎯',
      referral: '👥',
      help: '🤝',
      epin: '⭐',
      support: '🎫',
      security: '🛡️',
      warning: '⚠️',
      success: '✅',
      admin: '👨‍💼',
      general: '📢'
    };
    return icons[category] || '🔔';
  };

  if (!preferences) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 shadow-2xl"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading preferences...</p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] z-[70]"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FiSettings className="w-6 h-6 text-gray-700" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
                      <p className="text-gray-600">Customize how and when you receive notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-8 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-1">
                  {[
                    { key: 'categories', label: 'Categories', icon: FiBell },
                    { key: 'global', label: 'Global', icon: FiSettings },
                    { key: 'sounds', label: 'Sounds', icon: FiVolume2 },
                    { key: 'schedule', label: 'Schedule', icon: FiClock }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        activeTab === key
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 max-h-96 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Categories Tab */}
                  {activeTab === 'categories' && (
                    <motion.div
                      key="categories"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Categories</h3>
                        <p className="text-gray-600 mb-6">Choose which types of notifications you want to receive</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(preferences.categories).map(([category, config]) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getCategoryIcon(category)}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
                                  <p className="text-sm text-gray-500">Payment confirmations</p>
                                </div>
                              </div>
                              <button
                                onClick={() => updatePreference(`categories.${category}.enabled`, !config.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  config.enabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {config.enabled && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Push notifications</span>
                                  <button
                                    onClick={() => updatePreference(`categories.${category}.push`, !config.push)}
                                    className={`text-xs px-2 py-1 rounded ${
                                      config.push ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {config.push ? 'On' : 'Off'}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Sound alerts</span>
                                  <button
                                    onClick={() => updatePreference(`categories.${category}.sound`, !config.sound)}
                                    className={`text-xs px-2 py-1 rounded ${
                                      config.sound ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {config.sound ? 'On' : 'Off'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Global Tab */}
                  {activeTab === 'global' && (
                    <motion.div
                      key="global"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Global Settings</h3>
                        <p className="text-gray-600 mb-6">Control overall notification behavior</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <FiBell className="w-5 h-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">Push Notifications</h4>
                              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                            </div>
                          </div>
                          <button
                            onClick={() => updatePreference('global.pushEnabled', !preferences.global.pushEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.global.pushEnabled ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.global.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <FiVolume2 className="w-5 h-5 text-green-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                              <p className="text-sm text-gray-500">Play sounds for notifications</p>
                            </div>
                          </div>
                          <button
                            onClick={() => updatePreference('global.soundEnabled', !preferences.global.soundEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.global.soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.global.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <FiMoon className="w-5 h-5 text-purple-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">Do Not Disturb</h4>
                              <p className="text-sm text-gray-500">Pause all notifications</p>
                            </div>
                          </div>
                          <button
                            onClick={() => updatePreference('global.doNotDisturb', !preferences.global.doNotDisturb)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.global.doNotDisturb ? 'bg-purple-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.global.doNotDisturb ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Sounds Tab */}
                  {activeTab === 'sounds' && (
                    <motion.div
                      key="sounds"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sound Settings</h3>
                        <p className="text-gray-600 mb-6">Customize notification sounds</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Volume Level
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={preferences.sounds.volume}
                            onChange={(e) => updatePreference('sounds.volume', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Mute</span>
                            <span>{Math.round(preferences.sounds.volume * 100)}%</span>
                            <span>Max</span>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-medium text-gray-900 mb-3">Test Sounds</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableSoundTypes.slice(0, 6).map((soundType) => (
                              <button
                                key={soundType.key}
                                onClick={() => testSound(soundType.key, 'medium')}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                              >
                                <span className="text-sm font-medium">{soundType.label}</span>
                                <FiVolume2 className="w-4 h-4 text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Schedule Tab */}
                  {activeTab === 'schedule' && (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiet Hours</h3>
                        <p className="text-gray-600 mb-6">Set times when you don't want to receive notifications</p>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <FiClock className="w-5 h-5 text-indigo-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">Enable Quiet Hours</h4>
                              <p className="text-sm text-gray-500">Pause notifications during specified hours</p>
                            </div>
                          </div>
                          <button
                            onClick={() => updatePreference('global.quietHours.enabled', !preferences.global.quietHours.enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.global.quietHours.enabled ? 'bg-indigo-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.global.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {preferences.global.quietHours.enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time
                              </label>
                              <input
                                type="time"
                                value={preferences.global.quietHours.start}
                                onChange={(e) => updatePreference('global.quietHours.start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time
                              </label>
                              <input
                                type="time"
                                value={preferences.global.quietHours.end}
                                onChange={(e) => updatePreference('global.quietHours.end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <button
                      onClick={resetToDefaults}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <FiRotateCcw className="w-4 h-4" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={savePreferences}
                      disabled={!hasChanges || saving}
                      className={`px-6 py-2 bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                        hasChanges && !saving ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPreferences;
