// Status constants for Send Help and Receive Help workflow
export const HELP_STATUS = {
  PENDING: 'pending',
  PAYMENT_DONE: 'Payment Done',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected'
};

// Legacy status constants for backward compatibility
export const LEGACY_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PAYMENT_DONE: 'Payment Done'
};

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// User status constants
export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  PENDING_ACTIVATION: 'pending_activation'
};

// Upline payment status
export const UPLINE_PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export default {
  HELP_STATUS,
  PAYMENT_STATUS,
  USER_STATUS,
  UPLINE_PAYMENT_STATUS
};