/**
 * SHARED ELIGIBILITY UTILITIES - SINGLE SOURCE OF TRUTH
 * 
 * This file contains eligibility logic used by BOTH frontend and backend.
 * All eligibility checks MUST use these functions to ensure consistency.
 * 
 * STANDARDIZED ON: level field (NOT levelStatus)
 * UNIFIED FLAGS: isOnHold, isReceivingHeld (removed paymentBlocked, upgradeRequired, sponsorPaymentPending)
 */

const { isIncomeBlocked } = require('./mlmCore');

/**
 * Normalize level value - handle old numeric levels and new string levels
 * STANDARDIZED ON: level field
 */
const normalizeLevel = (userData) => {
  // Priority: level field first, then levelStatus for backward compatibility
  const levelValue = userData.level || userData.levelStatus;
  
  if (!levelValue) return 'Star';

  // If already a string, return as-is
  if (typeof levelValue === 'string') {
    return levelValue;
  }

  // Handle old numeric levels (backward compatibility)
  if (typeof levelValue === 'number') {
    const levelMap = {
      1: 'Star',
      2: 'Silver', 
      3: 'Gold',
      4: 'Platinum',
      5: 'Diamond'
    };
    return levelMap[levelValue] || 'Star';
  }

  return 'Star'; // Fallback
};

/**
 * Check if a user is eligible to SEND help
 * @param {Object} userData - The complete user document from Firestore
 * @returns {Object} - { eligible: boolean, reason: string }
 */
const checkSendHelpEligibility = (userData) => {
  if (!userData) {
    return { eligible: false, reason: 'User document not found' };
  }

  // Basic checks - inactive users CAN send help to become activated
  // if (!userData.isActivated) {
  //   return { eligible: false, reason: 'User not activated' };
  // }

  // UNIFIED BLOCKING FLAGS - only check isOnHold and isBlocked
  if (userData.isBlocked === true) {
    return { eligible: false, reason: 'Account is blocked' };
  }

  if (userData.isOnHold === true) {
    return { eligible: false, reason: 'Account is on hold' };
  }

  // Income blocking check using MLM core logic
  if (isIncomeBlocked({ ...userData, level: normalizeLevel(userData) })) {
    return { eligible: false, reason: 'Income is blocked - complete required payments' };
  }

  return { eligible: true, reason: null };
};

/**
 * Check if a user is eligible to RECEIVE help
 * @param {Object} userData - The complete user document from Firestore  
 * @returns {Object} - { eligible: boolean, reason: string }
 */
const checkReceiveHelpEligibility = (userData) => {
  if (!userData) {
    return { eligible: false, reason: 'User document not found' };
  }

  // Check if user is activated
  if (userData.isActivated !== true) {
    return { eligible: false, reason: 'User account needs to be activated to receive help' };
  }

  // UNIFIED BLOCKING FLAGS - only check these two
  if (userData.isBlocked === true) {
    return { eligible: false, reason: 'User account is currently blocked from receiving help' };
  }

  if (userData.isOnHold === true) {
    return { eligible: false, reason: 'User account is temporarily on hold' };
  }

  if (userData.isReceivingHeld === true) {
    return { eligible: false, reason: 'User receiving privileges are currently held' };
  }

  // Check help visibility (explicit false blocks, undefined/null allows)
  if (userData.helpVisibility === false) {
    return { eligible: false, reason: 'User help visibility is disabled' };
  }

  // Check if level exists (use normalized level)
  const userLevel = normalizeLevel(userData);
  if (!userLevel) {
    return { eligible: false, reason: 'User account level is not properly set' };
  }

  // All checks passed - user is eligible
  return { eligible: true, reason: null };
};

/**
 * Check receiver eligibility with additional business logic
 * Used by server-side receiver selection
 */
const isReceiverEligibleStrict = (userData) => {
  // Use the basic eligibility function first
  const { eligible } = checkReceiveHelpEligibility(userData);
  
  if (!eligible) return false;

  // Additional business logic checks - REMOVED conflicting flags
  // No longer checking upgradeRequired, sponsorPaymentPending, paymentBlocked
  
  // Check receive limit based on level
  const userLevel = normalizeLevel(userData);
  const LEVEL_RECEIVE_LIMITS = {
    Star: 3,
    Silver: 9,
    Gold: 27,
    Platinum: 81,
    Diamond: 243
  };
  
  const limit = LEVEL_RECEIVE_LIMITS[userLevel] || LEVEL_RECEIVE_LIMITS.Star;
  if ((userData.activeReceiveCount || 0) >= limit) return false;
  
  return true;
};

/**
 * Get ineligibility reason for receiver
 */
const getReceiverIneligibilityReason = (userData) => {
  // First check basic eligibility
  const { eligible, reason } = checkReceiveHelpEligibility(userData);
  if (!eligible) {
    // Map detailed reasons to existing reason codes
    if (reason.includes('activated')) return 'not_activated';
    if (reason.includes('blocked')) return 'blocked';
    if (reason.includes('on hold')) return 'on_hold';
    if (reason.includes('receiving')) return 'receiving_held';
    if (reason.includes('visibility')) return 'help_visibility_disabled';
    if (reason.includes('level')) return 'level_status_missing';
    return 'not_eligible';
  }
  
  // Check additional business logic
  const userLevel = normalizeLevel(userData);
  const LEVEL_RECEIVE_LIMITS = {
    Star: 3,
    Silver: 9,
    Gold: 27,
    Platinum: 81,
    Diamond: 243
  };
  
  const limit = LEVEL_RECEIVE_LIMITS[userLevel] || LEVEL_RECEIVE_LIMITS.Star;
  if ((userData.activeReceiveCount || 0) >= limit) return 'receive_limit_reached';
  
  return 'not_eligible';
};

// CommonJS exports for backend
module.exports = {
  normalizeLevel,
  checkSendHelpEligibility,
  checkReceiveHelpEligibility,
  isReceiverEligibleStrict,
  getReceiverIneligibilityReason
};