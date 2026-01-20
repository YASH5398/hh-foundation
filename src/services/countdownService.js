import { HELP_STATUS } from '../config/helpStatus';

/**
 * CountdownService - Centralized countdown and auto-block logic
 * Handles 24-hour countdowns for all help assignments
 */

/**
 * Check if countdown has expired for a given assignedAt timestamp
 * @param {Date|Timestamp} assignedAt - Assignment timestamp
 * @returns {boolean} - True if expired, false otherwise
 */
export const isCountdownExpired = (assignedAt) => {
  if (!assignedAt) return false;

  // Convert Firestore timestamp to Date if needed
  const assignedDate = assignedAt.toDate ? assignedAt.toDate() : new Date(assignedAt);

  // Calculate end time (assignedAt + 24 hours)
  const endTime = new Date(assignedDate.getTime() + (24 * 60 * 60 * 1000));

  // Check if current time is past end time
  const now = new Date();
  return now.getTime() > endTime.getTime();
};

/**
 * Get remaining time in milliseconds for a countdown
 * @param {Date|Timestamp} assignedAt - Assignment timestamp
 * @returns {number} - Remaining time in milliseconds
 */
export const getRemainingTime = (assignedAt) => {
  if (!assignedAt) return 0;

  // Convert Firestore timestamp to Date if needed
  const assignedDate = assignedAt.toDate ? assignedAt.toDate() : new Date(assignedAt);

  // Calculate end time (assignedAt + 24 hours)
  const endTime = new Date(assignedDate.getTime() + (24 * 60 * 60 * 1000));

  // Calculate remaining time
  const now = new Date();
  return Math.max(0, endTime.getTime() - now.getTime());
};

/**
 * Format time into readable string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export const formatTimeLeft = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Auto-block user when countdown expires
 * @param {string} helpId - Help assignment ID
 * @returns {Promise<Object>} - Result of blocking operation
 */
export const autoBlockUser = async (helpId) => {
  if (!helpId) {
    throw new Error('Help ID is required for auto-blocking');
  }

  // Server-authoritative: deadline handling is performed only by Cloud Functions.
  // Client must never mutate sendHelp/receiveHelp/users for countdown logic.
  return { blocked: false, reason: 'server_only' };
};

/**
 * Check and auto-block expired assignments on app load
 * @param {string} userUid - User ID to check
 * @returns {Promise<Object>} - Blocking result
 */
export const checkAndBlockExpiredAssignments = async (userUid) => {
  if (!userUid) return { blocked: false, reason: 'no_user' };

  try {
    // Get all active receiveHelp assignments for the user
    const { query, where, collection, getDocs, doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
    const activeStatuses = ['pending', 'payment_requested'];

    const receiveHelpQuery = query(
      collection(db, 'receiveHelp'),
      where('receiverUid', '==', userUid),
      where('status', 'in', activeStatuses)
    );

    const receiveHelpSnap = await getDocs(receiveHelpQuery);

    if (receiveHelpSnap.empty) {
      return { blocked: false, reason: 'no_active_assignments' };
    }

    // Find assignments that have expired
    const expiredAssignments = [];
    for (const docSnap of receiveHelpSnap.docs) {
      const assignment = { id: docSnap.id, ...docSnap.data() };
      if (assignment.assignedAt && isCountdownExpired(assignment.assignedAt)) {
        expiredAssignments.push(assignment);
      }
    }

    if (expiredAssignments.length === 0) {
      return { blocked: false, reason: 'no_expired_assignments' };
    }

    // Block user and mark assignments as expired
    await runTransaction(db, async (transaction) => {
      // Update each expired receiveHelp assignment
      for (const assignment of expiredAssignments) {
        transaction.update(doc(db, 'receiveHelp', assignment.id), {
          status: 'expired',
          expiredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Block the user
      transaction.update(doc(db, 'users', userUid), {
        isBlocked: true,
        blockReason: 'Payment not completed within 24 hours - automatic block',
        blockedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    return {
      blocked: true,
      expiredAssignments: expiredAssignments.length,
      reason: 'assignments_expired'
    };
  } catch (error) {
    console.error('Error checking/blocking expired assignments:', error);
    return { blocked: false, reason: 'error', error: error.message };
  }
};

/**
 * Get countdown status for a help assignment
 * @param {string} helpId - Help assignment ID
 * @returns {Promise<Object>} - Countdown status
 */
export const getCountdownStatus = async (helpId) => {
  if (!helpId) return { isExpired: false, timeLeft: 0 };

  try {
    const helpRef = doc(db, 'sendHelp', helpId);
    const helpSnap = await getDoc(helpRef);

    if (!helpSnap.exists) {
      return { isExpired: false, timeLeft: 0, error: 'Help not found' };
    }

    const helpData = helpSnap.data();
    const timeLeft = getRemainingTime(helpData.assignedAt);
    const isExpired = timeLeft <= 0;

    return {
      isExpired,
      timeLeft,
      assignedAt: helpData.assignedAt,
      formattedTime: formatTimeLeft(timeLeft),
      status: helpData.status
    };
  } catch (error) {
    console.error('Error getting countdown status:', error);
    return { isExpired: false, timeLeft: 0, error: error.message };
  }
};

/**
 * Hook for managing countdown with auto-block functionality
 * @param {Date|Timestamp} assignedAt - Assignment timestamp
 * @param {string} helpId - Help assignment ID
 * @returns {Object} - Countdown state and controls
 */
export const useCountdownWithAutoBlock = (assignedAt, helpId) => {
  const countdown = useCountdown(assignedAt, async () => {
    // Auto-block when countdown expires
    if (helpId) {
      try {
        await autoBlockUser(helpId);
      } catch (error) {
        console.error('Auto-block failed:', error);
      }
    }
  });

  return {
    ...countdown,
    helpId
  };
};

export default {
  isCountdownExpired,
  getRemainingTime,
  formatTimeLeft,
  autoBlockUser,
  checkAndBlockExpiredAssignments,
  getCountdownStatus,
  useCountdownWithAutoBlock
};
