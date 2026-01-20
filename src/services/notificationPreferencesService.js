/**
 * Notification Preferences Service
 * Manages user preferences for notification types, sounds, and delivery methods
 */

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationPreferencesService {
  constructor() {
    this.collectionName = 'notificationPreferences';
    this.preferencesRef = doc(db, this.collectionName, 'default'); // Default preferences
  }

  // Get default preferences
  getDefaultPreferences() {
    return {
      // Category preferences (true = enabled, false = disabled)
      categories: {
        payment: { enabled: true, sound: true, push: true },
        upgrade: { enabled: true, sound: true, push: true },
        referral: { enabled: true, sound: true, push: true },
        help: { enabled: true, sound: true, push: true },
        epin: { enabled: true, sound: true, push: true },
        support: { enabled: true, sound: true, push: true },
        security: { enabled: true, sound: true, push: true },
        warning: { enabled: true, sound: true, push: true },
        success: { enabled: true, sound: true, push: true },
        admin: { enabled: true, sound: true, push: true },
        general: { enabled: true, sound: true, push: true }
      },

      // Priority preferences
      priorities: {
        low: { enabled: true, sound: false, push: true },
        medium: { enabled: true, sound: true, push: true },
        high: { enabled: true, sound: true, push: true }
      },

      // Global settings
      global: {
        soundEnabled: true,
        pushEnabled: true,
        emailEnabled: false, // Future feature
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        doNotDisturb: false
      },

      // Sound preferences
      sounds: {
        volume: 0.7, // 0.0 to 1.0
        type: 'default', // default, custom, none
        customSound: null // URL to custom sound file
      },

      // Advanced settings
      advanced: {
        groupSimilar: true,
        showPreviews: true,
        autoMarkAsRead: false,
        maxNotifications: 100,
        retentionDays: 30
      }
    };
  }

  // Get user preferences
  async getUserPreferences(userId) {
    try {
      if (!userId) {
        return this.getDefaultPreferences();
      }

      const userPrefsRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(userPrefsRef);

      if (docSnap.exists()) {
        const userPrefs = docSnap.data();
        // Merge with defaults to ensure all fields exist
        return this.mergeWithDefaults(userPrefs);
      } else {
        // Create default preferences for new user
        const defaults = this.getDefaultPreferences();
        await this.saveUserPreferences(userId, defaults);
        return defaults;
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Save user preferences
  async saveUserPreferences(userId, preferences) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userPrefsRef = doc(db, this.collectionName, userId);
      await setDoc(userPrefsRef, {
        ...preferences,
        userId,
        updatedAt: new Date()
      });

      console.log('User preferences saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Update specific preference
  async updatePreference(userId, path, value) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userPrefsRef = doc(db, this.collectionName, userId);
      const updateData = {};
      updateData[path] = value;
      updateData.updatedAt = new Date();

      await updateDoc(userPrefsRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating preference:', error);
      return { success: false, error: error.message };
    }
  }

  // Merge user preferences with defaults
  mergeWithDefaults(userPrefs) {
    const defaults = this.getDefaultPreferences();
    return this.deepMerge(defaults, userPrefs);
  }

  // Deep merge utility
  deepMerge(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  // Check if notification should be sent based on preferences
  async shouldSendNotification(userId, notification) {
    try {
      const prefs = await this.getUserPreferences(userId);

      // Check if notifications are globally disabled
      if (prefs.global.doNotDisturb) {
        return false;
      }

      // Check quiet hours
      if (prefs.global.quietHours.enabled && this.isQuietHour(prefs.global.quietHours)) {
        return false;
      }

      // Check category preference
      const category = notification.category || 'general';
      const categoryPrefs = prefs.categories[category];

      if (!categoryPrefs?.enabled) {
        return false;
      }

      // Check priority preference
      const priority = notification.priority || 'medium';
      const priorityPrefs = prefs.priorities[priority];

      if (!priorityPrefs?.enabled) {
        return false;
      }

      return {
        send: true,
        sound: categoryPrefs.sound && priorityPrefs.sound && prefs.global.soundEnabled,
        push: categoryPrefs.push && priorityPrefs.push && prefs.global.pushEnabled,
        preferences: prefs
      };

    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return { send: true, sound: true, push: true }; // Default to sending
    }
  }

  // Check if current time is within quiet hours
  isQuietHour(quietHours) {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      // Same day range (e.g., 08:00 to 22:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Reset preferences to defaults
  async resetToDefaults(userId) {
    try {
      const defaults = this.getDefaultPreferences();
      return await this.saveUserPreferences(userId, defaults);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Export preferences for backup
  async exportPreferences(userId) {
    try {
      const prefs = await this.getUserPreferences(userId);
      return {
        success: true,
        data: prefs,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Import preferences from backup
  async importPreferences(userId, preferencesData) {
    try {
      // Validate the imported data structure
      if (!preferencesData || typeof preferencesData !== 'object') {
        throw new Error('Invalid preferences data');
      }

      // Merge with defaults to ensure validity
      const mergedPrefs = this.mergeWithDefaults(preferencesData);
      return await this.saveUserPreferences(userId, mergedPrefs);
    } catch (error) {
      console.error('Error importing preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Get preference statistics
  async getPreferenceStats(userId) {
    try {
      const prefs = await this.getUserPreferences(userId);

      const stats = {
        enabledCategories: Object.entries(prefs.categories)
          .filter(([_, config]) => config.enabled).length,
        totalCategories: Object.keys(prefs.categories).length,
        soundEnabled: prefs.global.soundEnabled,
        pushEnabled: prefs.global.pushEnabled,
        quietHoursEnabled: prefs.global.quietHours.enabled,
        doNotDisturbEnabled: prefs.global.doNotDisturb
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting preference stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const notificationPreferencesService = new NotificationPreferencesService();
export { notificationPreferencesService };
export default notificationPreferencesService;
