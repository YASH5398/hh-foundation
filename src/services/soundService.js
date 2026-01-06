/**
 * Sound Service for Notification Audio Feedback
 * Provides different notification sounds based on type and priority
 */

class SoundService {
  constructor() {
    this.audioContext = null;
    this.isEnabled = this.getStoredPreference();
    this.isSupported = this.checkAudioSupport();
    this.sounds = {};
    this.initAudioContext();
  }

  // Check if Web Audio API is supported
  checkAudioSupport() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  // Initialize Audio Context
  async initAudioContext() {
    if (!this.isSupported) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🎵 Sound service initialized');
    } catch (error) {
      console.warn('⚠️ Audio context initialization failed:', error);
      this.isSupported = false;
    }
  }

  // Get stored user preference
  getStoredPreference() {
    try {
      const stored = localStorage.getItem('notificationSoundsEnabled');
      return stored !== null ? JSON.parse(stored) : true; // Default to enabled
    } catch {
      return true;
    }
  }

  // Set user preference
  setEnabled(enabled) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('notificationSoundsEnabled', JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save sound preference:', error);
    }
  }

  // Generate different notification sounds using Web Audio API
  generateSound(type = 'default', priority = 'medium') {
    if (!this.audioContext || !this.isSupported) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Sound configurations based on type and priority
    const soundConfigs = {
      // Payment related notifications
      payment: {
        frequency: priority === 'high' ? 800 : 600,
        duration: 0.3,
        waveType: 'sine',
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 }
      },

      // System notifications
      system: {
        frequency: priority === 'high' ? 1000 : 700,
        duration: 0.2,
        waveType: 'triangle',
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.05 }
      },

      // Admin notifications
      admin: {
        frequency: priority === 'high' ? 1200 : 900,
        duration: 0.25,
        waveType: 'square',
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.25, release: 0.08 }
      },

      // Success/achievement notifications
      success: {
        frequency: priority === 'high' ? 600 : 500,
        duration: 0.4,
        waveType: 'sine',
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 }
      },

      // Warning/error notifications
      warning: {
        frequency: priority === 'high' ? 400 : 300,
        duration: 0.5,
        waveType: 'sawtooth',
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.3 }
      },

      // Default notification
      default: {
        frequency: 550,
        duration: 0.2,
        waveType: 'sine',
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.05 }
      }
    };

    const config = soundConfigs[type] || soundConfigs.default;

    // Configure oscillator
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
    oscillator.type = config.waveType;

    // Configure envelope
    const now = this.audioContext.currentTime;
    const { attack, decay, sustain, release } = config.envelope;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);

    return { oscillator, gainNode, duration: config.duration };
  }

  // Play notification sound
  async playNotificationSound(type = 'default', priority = 'medium') {
    if (!this.isEnabled || !this.isSupported || !this.audioContext) {
      return false;
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const sound = this.generateSound(type, priority);
      if (!sound) return false;

      const { oscillator, duration } = sound;

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);

      console.log(`🔊 Played ${type} notification sound (${priority} priority)`);
      return true;

    } catch (error) {
      console.warn('⚠️ Failed to play notification sound:', error);
      return false;
    }
  }

  // Play sound based on notification data
  async playSoundForNotification(notification) {
    if (!notification) return false;

    // Determine sound type based on notification content
    let soundType = 'default';
    const title = notification.title || '';
    const message = notification.message || '';
    const category = notification.category || notification.type;

    if (title.includes('Payment') || title.includes('₹') || category === 'payment') {
      soundType = 'payment';
    } else if (title.includes('Success') || title.includes('Completed') || title.includes('✅') || category === 'success') {
      soundType = 'success';
    } else if (title.includes('Alert') || title.includes('Error') || title.includes('Failed') || category === 'warning') {
      soundType = 'warning';
    } else if (category === 'admin' || notification.type === 'admin') {
      soundType = 'admin';
    } else if (category === 'system' || notification.type === 'system') {
      soundType = 'system';
    }

    const priority = notification.priority || 'medium';

    return await this.playNotificationSound(soundType, priority);
  }

  // Test sound (for settings/preferences)
  async testSound(type = 'default', priority = 'medium') {
    return await this.playNotificationSound(type, priority);
  }

  // Get available sound types for UI
  getAvailableSoundTypes() {
    return [
      { key: 'default', label: 'Default', description: 'Standard notification sound' },
      { key: 'payment', label: '💰 Payment', description: 'For payment-related notifications' },
      { key: 'success', label: '✅ Success', description: 'For achievements and completions' },
      { key: 'warning', label: '⚠️ Warning', description: 'For alerts and errors' },
      { key: 'admin', label: '👤 Admin', description: 'For administrative messages' },
      { key: 'system', label: '🔧 System', description: 'For system updates' }
    ];
  }

  // Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds = {};
  }
}

// Create and export singleton instance
const soundService = new SoundService();
export { soundService };
export default soundService;
