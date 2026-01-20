// Script to verify Firebase Auth custom claims
// Confirms that admin claims are properly set

const admin = require('firebase-admin');

// Load the service account key
const serviceAccount = require('./serviceAccount.json');

// Target user UID
const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

async function verifyAdminClaims() {
  try {
    console.log('🔍 Verifying Firebase Auth custom claims...');
    console.log('Target UID:', TARGET_UID);
    
    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    // Get user record with claims
    const userRecord = await admin.auth().getUser(TARGET_UID);
    
    console.log('');
    console.log('📋 User Information:');
    console.log('- UID:', userRecord.uid);
    console.log('- Email:', userRecord.email);
    console.log('- Display Name:', userRecord.displayName || 'Not set');
    console.log('- Email Verified:', userRecord.emailVerified);
    console.log('- Created:', userRecord.metadata.creationTime);
    console.log('- Last Sign In:', userRecord.metadata.lastSignInTime || 'Never');
    
    console.log('');
    console.log('🔑 Custom Claims Analysis:');
    
    if (userRecord.customClaims) {
      console.log('Raw claims:', JSON.stringify(userRecord.customClaims, null, 2));
      
      const hasAdminRole = userRecord.customClaims.role === 'admin';
      
      if (hasAdminRole) {
        console.log('✅ SUCCESS: User has admin role claim');
        console.log('✅ Admin panel access: ENABLED');
        console.log('✅ Backend functions: Will recognize as admin');
        console.log('✅ Firestore rules: Will recognize as admin (if using custom claims)');
      } else {
        console.log('❌ ERROR: User does not have admin role claim');
        console.log('Current role:', userRecord.customClaims.role || 'none');
      }
    } else {
      console.log('❌ ERROR: User has no custom claims');
      console.log('💡 Run: node set-admin.js');
    }
    
    console.log('');
    console.log('🧪 Frontend Verification Instructions:');
    console.log('1. User must log out completely');
    console.log('2. User must log back in');
    console.log('3. In browser console, run:');
    console.log('');
    console.log('   const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
    console.log('   console.log("Admin role:", idTokenResult.claims.role === "admin");');
    console.log('   console.log("All claims:", idTokenResult.claims);');
    console.log('');
    console.log('4. Expected result: idTokenResult.claims.role === "admin" should be true');
    
  } catch (error) {
    console.error('❌ Error verifying claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Check the UID is correct.');
    } else {
      console.log('💡 Error details:', {
        code: error.code,
        message: error.message
      });
    }
    
    process.exit(1);
  }
}

// Run verification
console.log('🚀 Starting Firebase Auth custom claims verification...');
console.log('');

verifyAdminClaims()
  .then(() => {
    console.log('');
    console.log('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });