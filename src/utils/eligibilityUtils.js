/**
 * RECEIVE HELP ELIGIBILITY - SINGLE SOURCE OF TRUTH
 * 
 * This is the ONLY place where receive help eligibility is determined.
 * All other components and services MUST use this function.
 * 
 * DO NOT create duplicate eligibility logic elsewhere.
 */

/**
 * Normalize level value - handle old numeric levels and new string levels
 * STANDARDIZED ON: level field
 */
const normalizeLevel = (userData) => {
  // Priority: level field first, then levelStatus for backward compatibility
  const levelValue = userData?.level || userData?.levelStatus;
  
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
 * Check if a user is eligible to receive help
 * @param {Object} userDoc - The complete user document from Firestore
 * @returns {Object} - { eligible: boolean, reason: string }
 */
export const checkReceiveHelpEligibility = (userDoc) => {
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ELIGIBILITY CHECK:', {
      uid: userDoc?.uid,
      isActivated: userDoc?.isActivated,
      isBlocked: userDoc?.isBlocked,
      isOnHold: userDoc?.isOnHold,
      isReceivingHeld: userDoc?.isReceivingHeld,
      helpVisibility: userDoc?.helpVisibility,
      level: normalizeLevel(userDoc)
    });
  }

  // Check if user document exists
  if (!userDoc) {
    const reason = 'User document not found';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  // Check if user is activated
  if (userDoc.isActivated !== true) {
    const reason = 'User account needs to be activated to receive help';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  // UNIFIED BLOCKING FLAGS - only check these two
  if (userDoc.isBlocked === true) {
    const reason = 'User account is currently blocked from receiving help';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  if (userDoc.isOnHold === true) {
    const reason = 'User account is temporarily on hold';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  if (userDoc.isReceivingHeld === true) {
    const reason = 'User receiving privileges are currently held';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  // Check help visibility (explicit false blocks, undefined/null allows)
  if (userDoc.helpVisibility === false) {
    const reason = 'User help visibility is disabled';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  // Check if level exists (use normalized level)
  const userLevel = normalizeLevel(userDoc);
  if (!userLevel) {
    const reason = 'User account level is not properly set';
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RECEIVE_HELP_BLOCKED:', reason);
    }
    return { eligible: false, reason };
  }

  // All checks passed - user is eligible
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ RECEIVE_HELP_ELIGIBLE: All criteria met');
  }

  return { eligible: true, reason: null };
};

/**
 * Check if a user is eligible to send help
 * @param {Object} userData - The complete user document from Firestore
 * @returns {Object} - { eligible: boolean, reason: string }
 */
export const checkSendHelpEligibility = (userData) => {
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

  return { eligible: true, reason: null };
};

/**
 * Get a user-friendly message for eligibility status
 * @param {string} reason - The reason code from checkReceiveHelpEligibility
 * @returns {string} - User-friendly message
 */
export const getEligibilityMessage = (reason) => {
  if (!reason) return 'You are eligible to receive help';

  if (reason.includes('activated')) {
    return 'Your account needs to be activated to receive help';
  }
  if (reason.includes('blocked')) {
    return 'Your account is currently blocked from receiving help';
  }
  if (reason.includes('on hold')) {
    return 'Your account is temporarily on hold';
  }
  if (reason.includes('receiving')) {
    return 'Your receiving privileges are currently held';
  }
  if (reason.includes('visibility')) {
    return 'Your help visibility is disabled';
  }
  if (reason.includes('level')) {
    return 'Your account level status is not properly set';
  }
  if (reason.includes('User document not found')) {
    return 'Unable to verify your account status';
  }

  return 'You are currently not eligible to receive help';
};

/**
 * Export normalize level for use in other components
 */
export { normalizeLevel };