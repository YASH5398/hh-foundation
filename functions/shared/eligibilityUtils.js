/**
 * RECEIVE HELP ELIGIBILITY - SINGLE SOURCE OF TRUTH (Cloud Functions)
 * 
 * This is the ONLY place where receive help eligibility is determined in Cloud Functions.
 * All other functions MUST use this function.
 * 
 * DO NOT create duplicate eligibility logic elsewhere.
 */

// Import shared eligibility utilities
const { 
  checkReceiveHelpEligibility: sharedCheckReceiveHelpEligibility,
  normalizeLevel 
} = require('./sharedEligibilityUtils');

/**
 * Check if a user is eligible to receive help
 * @param {Object} userDoc - The complete user document from Firestore
 * @returns {Object} - { eligible: boolean, reason: string }
 */
const checkReceiveHelpEligibility = (userDoc) => {
  // Development logging
  console.log('🔍 CLOUD FUNCTIONS ELIGIBILITY CHECK:', {
    uid: userDoc?.uid,
    isActivated: userDoc?.isActivated,
    isBlocked: userDoc?.isBlocked,
    isOnHold: userDoc?.isOnHold,
    isReceivingHeld: userDoc?.isReceivingHeld,
    helpVisibility: userDoc?.helpVisibility,
    level: normalizeLevel(userDoc)
  });

  // Use shared eligibility logic
  const result = sharedCheckReceiveHelpEligibility(userDoc);
  
  if (result.eligible) {
    console.log('✅ RECEIVE_HELP_ELIGIBLE: All criteria met');
  } else {
    console.log('❌ RECEIVE_HELP_BLOCKED:', result.reason);
  }
  
  return result;
};

/**
 * Get a user-friendly message for eligibility status
 * @param {string} reason - The reason code from checkReceiveHelpEligibility
 * @returns {string} - User-friendly message
 */
const getEligibilityMessage = (reason) => {
  if (!reason) return 'User is eligible to receive help';

  if (reason.includes('activated')) {
    return 'User account needs to be activated to receive help';
  }
  if (reason.includes('blocked')) {
    return 'User account is currently blocked from receiving help';
  }
  if (reason.includes('on hold')) {
    return 'User account is temporarily on hold';
  }
  if (reason.includes('receiving')) {
    return 'User receiving privileges are currently held';
  }
  if (reason.includes('visibility')) {
    return 'User help visibility is disabled';
  }
  if (reason.includes('level')) {
    return 'User account level status is not properly set';
  }
  if (reason.includes('User document not found')) {
    return 'Unable to verify user account status';
  }

  return 'User is currently not eligible to receive help';
};

module.exports = {
  checkReceiveHelpEligibility,
  getEligibilityMessage
};