import { db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { LEVEL_CONFIG, getRequiredPaymentForUnblock, isIncomeBlocked } from '../shared/mlmCore';

/**
 * Process upgrade payment for level advancement
 */
export const processUpgradePayment = async (userId, paymentAmount, paymentProof) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const requiredPayment = getRequiredPaymentForUnblock(userData);

    if (!requiredPayment || requiredPayment.type !== 'upgrade' || requiredPayment.amount !== paymentAmount) {
      throw new Error('Invalid upgrade payment amount or not required');
    }

    // Record the upgrade payment
    const paymentRecord = {
      userId,
      type: 'upgrade',
      amount: paymentAmount,
      level: userData.level,
      paymentProof,
      status: 'pending', // Will be confirmed by admin
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'levelPayments'), paymentRecord);

    return {
      success: true,
      message: 'Upgrade payment submitted for verification',
      paymentId: paymentRecord.id
    };
  } catch (error) {
    console.error('Upgrade payment processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process sponsor payment for unblocking
 */
export const processSponsorPayment = async (userId, paymentAmount, sponsorId, paymentProof) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const requiredPayment = getRequiredPaymentForUnblock(userData);

    if (!requiredPayment || requiredPayment.type !== 'sponsor' || requiredPayment.amount !== paymentAmount) {
      throw new Error('Invalid sponsor payment amount or not required');
    }

    // Verify sponsor exists and is valid
    const sponsorRef = doc(db, 'users', sponsorId);
    const sponsorDoc = await sponsorRef.get();

    if (!sponsorDoc.exists) {
      throw new Error('Invalid sponsor');
    }

    // Record the sponsor payment
    const paymentRecord = {
      userId,
      sponsorId,
      type: 'sponsor',
      amount: paymentAmount,
      level: userData.level,
      paymentProof,
      status: 'pending', // Will be confirmed by admin
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'levelPayments'), paymentRecord);

    return {
      success: true,
      message: 'Sponsor payment submitted for verification',
      paymentId: paymentRecord.id
    };
  } catch (error) {
    console.error('Sponsor payment processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user can proceed with payments (not blocked)
 */
export const canReceivePayments = (user) => {
  return !isIncomeBlocked(user);
};

/**
 * Get pending payment requirements for user
 */
export const getPendingPaymentRequirements = (user) => {
  if (!isIncomeBlocked(user)) {
    return null;
  }

  return getRequiredPaymentForUnblock(user);
};

/**
 * Admin function to confirm payment (user updates handled by Cloud Functions)
 */
export const confirmLevelPayment = async (paymentId, adminId) => {
  try {
    const paymentRef = doc(db, 'levelPayments', paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      throw new Error('Payment record not found');
    }

    const paymentData = paymentDoc.data();

    if (paymentData.status !== 'pending') {
      throw new Error('Payment already processed');
    }

    // Update payment status to confirmed - Cloud Functions will handle user updates
    await updateDoc(paymentRef, {
      status: 'confirmed',
      confirmedBy: adminId,
      confirmedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Payment confirmed - user updates will be processed automatically'
    };
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
