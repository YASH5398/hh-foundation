// Cloud Function to set Firebase Auth custom claims for admin access
// Deploy this as a callable function and invoke from admin panel

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');

// Cloud Function to set admin claims
exports.setAdminClaims = onCall(async (request) => {
  // Verify the caller is already an admin (security check)
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can set admin claims');
  }

  const { targetUid } = request.data;

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'targetUid is required');
  }

  try {
    // Set custom claims
    await getAuth().setCustomUserClaims(targetUid, {
      role: 'admin'
    });

    // Verify the claims were set
    const userRecord = await getAuth().getUser(targetUid);

    return {
      success: true,
      message: 'Admin claims set successfully',
      customClaims: userRecord.customClaims,
      targetUid: targetUid
    };

  } catch (error) {
    console.error('Error setting admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'User not found');
    }
    
    throw new HttpsError('internal', 'Failed to set admin claims');
  }
});

// Cloud Function to remove admin claims
exports.removeAdminClaims = onCall(async (request) => {
  // Verify the caller is already an admin (security check)
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can remove admin claims');
  }

  const { targetUid } = request.data;

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'targetUid is required');
  }

  try {
    // Remove admin role (set to null or different role)
    await getAuth().setCustomUserClaims(targetUid, {
      role: null
    });

    return {
      success: true,
      message: 'Admin claims removed successfully',
      targetUid: targetUid
    };

  } catch (error) {
    console.error('Error removing admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'User not found');
    }
    
    throw new HttpsError('internal', 'Failed to remove admin claims');
  }
});

// Cloud Function to verify admin claims
exports.verifyAdminClaims = onCall(async (request) => {
  const { targetUid } = request.data;

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'targetUid is required');
  }

  try {
    const userRecord = await getAuth().getUser(targetUid);

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: userRecord.customClaims,
      isAdmin: userRecord.customClaims?.role === 'admin'
    };

  } catch (error) {
    console.error('Error verifying admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'User not found');
    }
    
    throw new HttpsError('internal', 'Failed to verify admin claims');
  }
});