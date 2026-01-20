/**
 * CENTRALIZED DATE FORMATTING UTILITIES
 * Single source of truth for all date formatting operations
 */

/**
 * Format a timestamp to a readable date string
 * @param {Date|Timestamp|string|number} timestamp - The timestamp to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
  const {
    includeTime = false,
    relative = false,
    format = 'default'
  } = options;

  if (!timestamp) return 'N/A';

  let date;

  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // Handle string or number
  else {
    date = new Date(timestamp);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Return relative time if requested
  if (relative) {
    return getRelativeTime(date);
  }

  // Format based on type
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
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    case 'datetime':
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    default:
      if (includeTime) {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Future dates
  if (diffInSeconds < 0) {
    const absDiffInSeconds = Math.abs(diffInSeconds);
    const absDiffInMinutes = Math.abs(diffInMinutes);
    const absDiffInHours = Math.abs(diffInHours);
    const absDiffInDays = Math.abs(diffInDays);

    if (absDiffInSeconds < 60) return 'in a few seconds';
    if (absDiffInMinutes < 60) return `in ${absDiffInMinutes} minute${absDiffInMinutes !== 1 ? 's' : ''}`;
    if (absDiffInHours < 24) return `in ${absDiffInHours} hour${absDiffInHours !== 1 ? 's' : ''}`;
    if (absDiffInDays < 7) return `in ${absDiffInDays} day${absDiffInDays !== 1 ? 's' : ''}`;
    return formatDate(date, { format: 'short' });
  }

  // Past dates
  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

/**
 * Get time remaining until a future date
 * @param {Date|Timestamp} targetDate - The target date
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

  const now = new Date();
  const diffInMs = date - now;

  if (diffInMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

/**
 * Format time remaining as a string
 * @param {Date|Timestamp} targetDate - The target date
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time remaining string
 */
export const formatTimeRemaining = (targetDate, options = {}) => {
  const { showSeconds = false, compact = false } = options;
  const timeRemaining = getTimeRemaining(targetDate);

  if (timeRemaining.expired) {
    return 'Expired';
  }

  const { days, hours, minutes, seconds } = timeRemaining;
  const parts = [];

  if (days > 0) {
    parts.push(compact ? `${days}d` : `${days} day${days !== 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(compact ? `${hours}h` : `${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(compact ? `${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  if (showSeconds && seconds > 0) {
    parts.push(compact ? `${seconds}s` : `${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return showSeconds ? (compact ? '<1s' : 'Less than a second') : (compact ? '<1m' : 'Less than a minute');
  }

  return parts.slice(0, 2).join(compact ? ' ' : ', ');
};

/**
 * Check if a date is today
 * @param {Date|Timestamp} date - The date to check
 * @returns {boolean} True if the date is today
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

  const today = new Date();
  return checkDate.toDateString() === today.toDateString();
};

/**
 * Check if a date is within the last 24 hours
 * @param {Date|Timestamp} date - The date to check
 * @returns {boolean} True if the date is within 24 hours
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

  const now = new Date();
  const diffInHours = (now - checkDate) / (1000 * 60 * 60);
  return diffInHours <= 24 && diffInHours >= 0;
};

/**
 * Add hours to a date
 * @param {Date|Timestamp} date - The base date
 * @param {number} hours - Hours to add
 * @returns {Date} New date with added hours
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

  return new Date(baseDate.getTime() + (hours * 60 * 60 * 1000));
};

export default {
  formatDate,
  getRelativeTime,
  getTimeRemaining,
  formatTimeRemaining,
  isToday,
  isWithin24Hours,
  addHours
};


