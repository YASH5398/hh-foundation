/**
 * RECEIVE HELP ELIGIBILITY - SINGLE SOURCE OF TRUTH
 * 
 * This is the ONLY place where receive help eligibility is determined.
 * All other components and services MUST use this function.
 * 
 * DO NOT create duplicate eligibility logic elsewhere.
 */

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
      paymentBlocked: userDoc?.kycDetails?.paymentBlocked,
      helpVisibility: userDoc?.helpVisibility,
      levelStatus: userDoc?.levelStatus
    });
  }

  // Check if user document exists
  if (!userDoc) {
    const reason = 'RECEIVE_HELP_BLOCKED: User document not found';
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check if user is activated
  if (userDoc.isActivated !== true) {
    const reason = `RECEIVE_HELP_BLOCKED: isActivated=${userDoc.isActivated}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check if user is blocked
  if (userDoc.isBlocked === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isBlocked=${userDoc.isBlocked}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check if user is on hold
  if (userDoc.isOnHold === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isOnHold=${userDoc.isOnHold}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check if receiving is held
  if (userDoc.isReceivingHeld === true) {
    const reason = `RECEIVE_HELP_BLOCKED: isReceivingHeld=${userDoc.isReceivingHeld}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check KYC payment blocked status
  if (userDoc.kycDetails?.paymentBlocked === true) {
    const reason = `RECEIVE_HELP_BLOCKED: kycDetails.paymentBlocked=${userDoc.kycDetails.paymentBlocked}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check help visibility (explicit false blocks, undefined/null allows)
  if (userDoc.helpVisibility === false) {
    const reason = `RECEIVE_HELP_BLOCKED: helpVisibility=${userDoc.helpVisibility}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
    }
    return { eligible: false, reason };
  }

  // Check if levelStatus exists
  if (!userDoc.levelStatus) {
    const reason = `RECEIVE_HELP_BLOCKED: levelStatus missing or empty`;
    if (process.env.NODE_ENV === 'development') {
      console.log(reason);
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
 * Get a user-friendly message for eligibility status
 * @param {string} reason - The reason code from checkReceiveHelpEligibility
 * @returns {string} - User-friendly message
 */
export const getEligibilityMessage = (reason) => {
  if (!reason) return 'You are eligible to receive help';

  if (reason.includes('isActivated')) {
    return 'Your account needs to be activated to receive help';
  }
  if (reason.includes('isBlocked')) {
    return 'Your account is currently blocked from receiving help';
  }
  if (reason.includes('isOnHold')) {
    return 'Your account is temporarily on hold';
  }
  if (reason.includes('isReceivingHeld')) {
    return 'Your receiving privileges are currently held';
  }
  if (reason.includes('paymentBlocked')) {
    return 'Your payment processing is currently blocked';
  }
  if (reason.includes('helpVisibility')) {
    return 'Your help visibility is disabled';
  }
  if (reason.includes('levelStatus')) {
    return 'Your account level status is not properly set';
  }
  if (reason.includes('User document not found')) {
    return 'Unable to verify your account status';
  }

  return 'You are currently not eligible to receive help';
};