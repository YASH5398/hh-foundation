/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Handle Firebase Auth errors and return user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error) => {
  if (!error || !error.code) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to perform this action.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

/**
 * Handle Firestore errors and return user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const handleFirestoreError = (error) => {
  if (!error || !error.code) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case 'permission-denied':
      return 'Access denied. Please check your permissions.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    case 'not-found':
      return 'The requested data was not found.';
    case 'already-exists':
      return 'This data already exists.';
    case 'resource-exhausted':
      return 'Service limit exceeded. Please try again later.';
    case 'failed-precondition':
      return 'Operation failed due to invalid state. Please try again.';
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    case 'out-of-range':
      return 'Operation is out of valid range.';
    case 'unimplemented':
      return 'This operation is not implemented.';
    case 'internal':
      return 'Internal server error. Please try again later.';
    case 'data-loss':
      return 'Data loss occurred. Please try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

/**
 * Handle general application errors
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {string} User-friendly error message
 */
export const handleGeneralError = (error, context = 'operation') => {
  if (!error) {
    return `An unexpected error occurred during ${context}.`;
  }

  // Check if it's a Firebase Auth error
  if (error.code && error.code.startsWith('auth/')) {
    return handleAuthError(error);
  }

  // Check if it's a Firestore error
  if (error.code && (error.code === 'permission-denied' || error.code === 'unavailable')) {
    return handleFirestoreError(error);
  }

  // Handle network errors
  if (error.message && error.message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Handle timeout errors
  if (error.message && error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Return the error message or a generic one
  return error.message || `An error occurred during ${context}. Please try again.`;
};

/**
 * Log error for debugging purposes
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = 'Unknown', additionalData = {}) => {
  console.error(`❌ Error in ${context}:`, {
    error: error.message,
    code: error.code,
    stack: error.stack,
    ...additionalData
  });
};

/**
 * Create a standardized error response object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Error message
 * @param {any} data - Additional data
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (success = false, message = 'An error occurred', data = null) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create a standardized success response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (data = null, message = 'Operation completed successfully') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}; 