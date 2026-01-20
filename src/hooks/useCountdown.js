import { useState, useEffect, useRef } from 'react';

/**
 * useCountdown Hook - Manages 24-hour countdown from expiresAt timestamp
 * @param {Date|Timestamp} expiresAt - The timestamp when the help expires
 * @param {Function} onExpired - Callback function called when countdown expires
 * @returns {Object} - { timeLeft, isExpired, hours, minutes, seconds }
 */
export const useCountdown = (expiresAt, onExpired) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const onExpiredRef = useRef(onExpired);

  // Update callback ref when onExpired changes
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // Calculate time left until expiresAt timestamp
  const calculateTimeLeft = (expiresTimestamp) => {
    if (!expiresTimestamp) return 0;

    // Convert Firestore timestamp to Date if needed
    const expiresDate = expiresTimestamp.toDate ? expiresTimestamp.toDate() : new Date(expiresTimestamp);

    // Calculate remaining time until expiration
    const now = new Date();
    const remaining = Math.max(0, expiresDate.getTime() - now.getTime());

    return remaining;
  };

  // Format time into hours, minutes, seconds
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  // Start countdown when expiresAt changes
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      setIsExpired(false);
      return;
    }

    const updateCountdown = () => {
      const remaining = calculateTimeLeft(expiresAt);
      setTimeLeft(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        if (onExpiredRef.current) {
          onExpiredRef.current();
        }
      }
    };

    // Update immediately
    updateCountdown();

    // Set up interval to update every second
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAt, isExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const { hours, minutes, seconds } = formatTime(timeLeft);

  return {
    timeLeft,
    isExpired,
    hours,
    minutes,
    seconds,
    // Formatted string for display
    formattedTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  };
};

export default useCountdown;
