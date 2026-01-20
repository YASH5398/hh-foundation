/**
 * STANDARDIZED HELP STATUS CONSTANTS
 * These are the ONLY valid statuses for sendHelp and receiveHelp documents
 * Use these constants everywhere - NO hardcoded strings
 */

export const HELP_STATUS = {
  ASSIGNED: 'assigned',
  PAYMENT_REQUESTED: 'payment_requested',
  PAYMENT_DONE: 'payment_done',
  CONFIRMED: 'confirmed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  FORCE_CONFIRMED: 'force_confirmed'
};

export const HELP_STATUS_LABELS = {
  [HELP_STATUS.ASSIGNED]: 'Assigned',
  [HELP_STATUS.PAYMENT_REQUESTED]: 'Payment Requested',
  [HELP_STATUS.PAYMENT_DONE]: 'Payment Done',
  [HELP_STATUS.CONFIRMED]: 'Confirmed',
  [HELP_STATUS.TIMEOUT]: 'Timeout',
  [HELP_STATUS.CANCELLED]: 'Cancelled',
  [HELP_STATUS.DISPUTED]: 'Disputed',
  [HELP_STATUS.FORCE_CONFIRMED]: 'Force Confirmed'
};

/**
 * Check if a status is active (can be worked on)
 */
export const isActiveStatus = (status) => {
  return [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE].includes(status);
};

/**
 * Check if a status is completed
 */
export const isCompletedStatus = (status) => {
  return [HELP_STATUS.CONFIRMED, HELP_STATUS.FORCE_CONFIRMED, HELP_STATUS.CANCELLED, HELP_STATUS.TIMEOUT].includes(status);
};

/**
 * Check if a status allows payment submission
 */
export const canSubmitPayment = (status) => {
  return status === HELP_STATUS.PAYMENT_REQUESTED;
};

/**
 * Check if a status allows payment request
 */
export const canRequestPayment = (status) => {
  return status === HELP_STATUS.ASSIGNED;
};

/**
 * Check if a status allows confirmation
 */
export const canConfirmPayment = (status) => {
  return status === HELP_STATUS.PAYMENT_DONE;
};

/**
 * Check if a status is confirmed
 */
export const isConfirmedStatus = (status) => {
  return status === HELP_STATUS.CONFIRMED;
};

/**
 * Check if a status is pending
 */
export const isPendingStatus = (status) => {
  return status === HELP_STATUS.ASSIGNED || status === HELP_STATUS.PAYMENT_REQUESTED || status === HELP_STATUS.PAYMENT_DONE;
};

/**
 * Normalize status string (handle legacy variations)
 */
export const normalizeStatus = (status) => {
  if (!status) return HELP_STATUS.ASSIGNED;

  // Handle common variations
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '');
  switch (normalized) {
    case 'assigned': return HELP_STATUS.ASSIGNED;
    case 'paymentrequested':
    case 'payment_requested': return HELP_STATUS.PAYMENT_REQUESTED;
    case 'paymentdone':
    case 'payment_done': return HELP_STATUS.PAYMENT_DONE;
    case 'confirmed': return HELP_STATUS.CONFIRMED;
    case 'timeout': return HELP_STATUS.TIMEOUT;
    case 'cancelled':
    case 'canceled': return HELP_STATUS.CANCELLED;
    case 'disputed': return HELP_STATUS.DISPUTED;
    case 'forceconfirmed':
    case 'force_confirmed': return HELP_STATUS.FORCE_CONFIRMED;
    default: return HELP_STATUS.ASSIGNED;
  }
};

/**
 * Validate that a status string is one of the allowed values
 */
export const isValidStatus = (status) => {
  return Object.values(HELP_STATUS).includes(status);
};
