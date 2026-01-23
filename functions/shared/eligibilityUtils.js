/**
 * RECEIVE HELP ELIGIBILITY - SINGLE SOURCE OF TRUTH (Cloud Functions)
 * 
 * This is the ONLY place where receive help eligibility is determined in Cloud Functions.
 * All other functions MUST use this function.
 * 
 * DO NOT create duplicate eligibility logic elsewhere.
 */

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
    paymentBlocked: userDoc?.kycDetails?.paymentBlocked,
    helpVisibility: userDoc?.helpVisibility,
    levelStatus: userDoc?.levelStatus
  });

  // Check if user document exists
  if (!userDoc) {
    const reason = 'RECEIVE_HELP_BLOCKED: User document not found';
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check if user is activated
  if (userDoc.isActivated !== true) {
    const reason = `RECEIVE_HELP_BLOCKED: isActivated=${userDoc.isActivated}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check if user is blocked
  if (userDoc.isBlocked === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isBlocked=${userDoc.isBlocked}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check if user is on hold
  if (userDoc.isOnHold === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isOnHold=${userDoc.isOnHold}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check if receiving is held
  if (userDoc.isReceivingHeld === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isReceivingHeld=${userDoc.isReceivingHeld}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check KYC payment blocked status
  if (userDoc.kycDetails?.paymentBlocked === true) {
    const reason = `RECEIVE_HELP_BLOCKED: kycDetails.paymentBlocked=${userDoc.kycDetails.paymentBlocked}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check help visibility (explicit false blocks, undefined/null allows)
  if (userDoc.helpVisibility === false) {
    const reason = `RECEIVE_HELP_BLOCKED: helpVisibility=${userDoc.helpVisibility}`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // Check if levelStatus exists
  if (!userDoc.levelStatus) {
    const reason = `RECEIVE_HELP_BLOCKED: levelStatus missing or empty`;
    console.log(reason);
    return { eligible: false, reason };
  }

  // All checks passed - user is eligible
  console.log('✅ RECEIVE_HELP_ELIGIBLE: All criteria met');
  return { eligible: true, reason: null };
};

/**
 * Get a user-friendly message for eligibility status
 * @param {string} reason - The reason code from checkReceiveHelpEligibility
 * @returns {string} - User-friendly message
 */
const getEligibilityMessage = (reason) => {
  if (!reason) return 'User is eligible to receive help';

  if (reason.includes('isActivated')) {
    return 'User account needs to be activated to receive help';
  }
  if (reason.includes('isBlocked')) {
    return 'User account is currently blocked from receiving help';
  }
  if (reason.includes('isOnHold')) {
    return 'User account is temporarily on hold';
  }
  if (reason.includes('isReceivingHeld')) {
    return 'User receiving privileges are currently held';
  }
  if (reason.includes('paymentBlocked')) {
    return 'User payment processing is currently blocked';
  }
  if (reason.includes('helpVisibility')) {
    return 'User help visibility is disabled';
  }
  if (reason.includes('levelStatus')) {
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