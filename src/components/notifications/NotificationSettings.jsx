import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import NotificationPreferences from './NotificationPreferences';
import {
  FiSettings, FiVolume2, FiVolumeX, FiPlay, FiX,
  FiBell, FiDollarSign, FiCheck, FiAlertTriangle, FiUser, FiTool,
  FiSliders
} from 'react-icons/fi';

const NotificationSettings = ({ isOpen, onClose, userId }) => {
  const { user } = useAuth();
  const {
    soundEnabled,
    toggleSound,
    testSound,
    availableSoundTypes
  } = useNotifications();

  const [testingSound, setTestingSound] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [settings, setSettings] = useState({
    playSound: true,
    sounds: {
      default: 'default',
      payment: 'payment',
      success: 'success',
      warning: 'warning',
      admin: 'admin'
    },
    browserNotifications: false,
    pushNotifications: false
  });
  const [loading, setLoading] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadSettings();
    }
  }, [isOpen, user?.uid]);

  const loadSettings = async () => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, 'notificationSettings', user.uid);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          playSound: data.playSound ?? true,
          sounds: {
            default: data.sounds?.default ?? 'default',
            payment: data.sounds?.payment ?? 'payment',
            success: data.sounds?.success ?? 'success',
            warning: data.sounds?.warning ?? 'warning',
            admin: data.sounds?.admin ?? 'admin'
          },
          browserNotifications: data.browserNotifications ?? false,
          pushNotifications: data.pushNotifications ?? false
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const settingsRef = doc(db, 'notificationSettings', user.uid);
      await setDoc(settingsRef, {
        ...newSettings,
        updatedAt: new Date()
      }, { merge: true });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const updateSoundType = async (notificationType, soundType) => {
    const newSettings = {
      ...settings,
      sounds: {
        ...settings.sounds,
        [notificationType]: soundType
      }
    };
    await saveSettings(newSettings);
  };

  const handleTestSound = async (soundType) => {
    setTestingSound(soundType);
    await testSound(soundType.key, 'medium');
    setTimeout(() => setTestingSound(null), 1000);
  };

  const getSoundIcon = (type) => {
    switch (type) {
      case 'payment': return <FiDollarSign className="w-4 h-4" />;
      case 'success': return <FiCheck className="w-4 h-4" />;
      case 'warning': return <FiAlertTriangle className="w-4 h-4" />;
      case 'admin': return <FiUser className="w-4 h-4" />;
      case 'system': return <FiTool className="w-4 h-4" />;
      default: return <FiBell className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[999]"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiSettings className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-bold text-gray-800">Notification Settings</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {settings.playSound ? (
                      <FiVolume2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <FiVolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">Notification Sounds</h4>
                      <p className="text-sm text-gray-500">Play sounds for new notifications</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateSetting('playSound', !settings.playSound)}
                    disabled={loading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.playSound ? 'bg-green-500' : 'bg-gray-300'
                    } ${loading ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.playSound ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Sound Selection Section */}
                {settings.playSound && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Notification Sound Types</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Choose sounds for different types of notifications
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {availableSoundTypes.map((soundType) => (
                        <motion.button
                          key={soundType.key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTestSound(soundType)}
                          disabled={testingSound === soundType.key}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                              {getSoundIcon(soundType.key)}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900">{soundType.label}</div>
                              <div className="text-sm text-gray-500">
                                Currently: {settings.sounds[soundType.key] === soundType.key ? 'Selected' : 'Other sound'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={settings.sounds[soundType.key]}
                              onChange={(e) => updateSoundType(soundType.key, e.target.value)}
                              disabled={loading}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              {availableSoundTypes.map(st => (
                                <option key={st.key} value={st.key}>{st.label}</option>
                              ))}
                            </select>
                            {testingSound === soundType.key ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                              />
                            ) : (
                              <FiPlay className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestSound(soundType);
                                }}
                              />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Additional Settings */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Additional Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FiBell className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Browser Notifications</div>
                          <div className="text-xs text-gray-500">Show notifications in browser</div>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSetting('browserNotifications', !settings.browserNotifications)}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.browserNotifications ? 'bg-blue-500' : 'bg-gray-300'
                        } ${loading ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.browserNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FiSettings className="w-5 h-5 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                          <div className="text-xs text-gray-500">Receive push notifications</div>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.pushNotifications ? 'bg-purple-500' : 'bg-gray-300'
                        } ${loading ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPreferences(true)}
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <FiSliders className="w-4 h-4" />
                    <span>Advanced Preferences</span>
                  </motion.button>

                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Preferences Modal */}
              <NotificationPreferences
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
                userId={userId}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettings;
