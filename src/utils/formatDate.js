/**
 * CENTRALIZED DATE FORMATTING UTILITIES
 * Single source of truth for all date formatting operations
 */

/**
 * Format timestamp to human-readable date string
 * @param {any} timestamp - Firestore timestamp, Date object, or timestamp string
 * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
 * @param {boolean} includeTime - Whether to include time (for default format)
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, format = 'short', includeTime = false) => {
  if (!timestamp) {
    return 'N/A';
  }

  let date;

  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // Handle timestamp number or string
  else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // Invalid timestamp
  else {
    return 'Invalid Date';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });

    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

    case 'datetime':
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

    default:
      if (includeTime) {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
  }
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {any} timestamp - Firestore timestamp, Date object, or timestamp string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) {
    return 'N/A';
  }

  let date;
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(timestamp, 'short');
  }
};

/**
 * Get time remaining until a target date
 * @param {any} targetDate - Target date/timestamp
 * @returns {Object} Object with days, hours, minutes, seconds remaining
 */
export const getTimeRemaining = (targetDate) => {
  let date;

  if (targetDate && typeof targetDate.toDate === 'function') {
    date = targetDate.toDate();
  } else if (targetDate instanceof Date) {
    date = targetDate;
  } else {
    date = new Date(targetDate);
  }

  if (isNaN(date.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const now = new Date();
  const difference = date.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

/**
 * Check if a date is today
 * @param {any} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  let checkDate;

  if (date && typeof date.toDate === 'function') {
    checkDate = date.toDate();
  } else if (date instanceof Date) {
    checkDate = date;
  } else {
    checkDate = new Date(date);
  }

  if (isNaN(checkDate.getTime())) {
    return false;
  }

  const today = new Date();
  return checkDate.toDateString() === today.toDateString();
};

/**
 * Check if a date is within the last 24 hours
 * @param {any} date - Date to check
 * @returns {boolean} True if date is within 24 hours
 */
export const isWithin24Hours = (date) => {
  let checkDate;

  if (date && typeof date.toDate === 'function') {
    checkDate = date.toDate();
  } else if (date instanceof Date) {
    checkDate = date;
  } else {
    checkDate = new Date(date);
  }

  if (isNaN(checkDate.getTime())) {
    return false;
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return checkDate >= twentyFourHoursAgo && checkDate <= now;
};

/**
 * Add hours to a date
 * @param {any} date - Base date
 * @param {number} hours - Hours to add
 * @returns {Date} New date with hours added
 */
export const addHours = (date, hours) => {
  let baseDate;

  if (date && typeof date.toDate === 'function') {
    baseDate = date.toDate();
  } else if (date instanceof Date) {
    baseDate = new Date(date);
  } else {
    baseDate = new Date(date);
  }

  if (isNaN(baseDate.getTime())) {
    return new Date();
  }

  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
};