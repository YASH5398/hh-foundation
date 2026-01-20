// Script to verify Firebase Auth custom claims
// Run this to check if admin claims are properly set

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

async function verifyAdminClaims() {
  try {
    console.log('🔍 Verifying admin claims...');
    console.log('Target UID:', TARGET_UID);
    console.log('');
    
    // Get user record
    const userRecord = await admin.auth().getUser(TARGET_UID);
    
    console.log('📋 User Information:');
    console.log('- UID:', userRecord.uid);
    console.log('- Email:', userRecord.email);
    console.log('- Display Name:', userRecord.displayName);
    console.log('- Email Verified:', userRecord.emailVerified);
    console.log('');
    
    // Check custom claims
    console.log('🔑 Custom Claims:');
    if (userRecord.customClaims) {
      console.log(JSON.stringify(userRecord.customClaims, null, 2));
      
      if (userRecord.customClaims.role === 'admin') {
        console.log('✅ SUCCESS: User has admin role claim');
        console.log('');
        console.log('🎯 Expected Firestore Rule Behavior:');
        console.log('- isAdmin() function will return true');
        console.log('- User can access admin-only documents');
        console.log('- User can perform admin-only operations');
      } else {
        console.log('❌ ERROR: User does not have admin role claim');
        console.log('💡 Run set-admin-claims.js to fix this');
      }
    } else {
      console.log('❌ ERROR: User has no custom claims');
      console.log('💡 Run set-admin-claims.js to set admin claims');
    }
    
    console.log('');
    console.log('🧪 Frontend Verification Code:');
    console.log('// Add this to your frontend to test:');
    console.log('const user = auth.currentUser;');
    console.log('if (user) {');
    console.log('  const idTokenResult = await user.getIdTokenResult(true);');
    console.log('  console.log("All claims:", idTokenResult.claims);');
    console.log('  console.log("Is admin:", idTokenResult.claims.role === "admin");');
    console.log('}');
    
  } catch (error) {
    console.error('❌ Error verifying claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Check the UID is correct.');
    } else {
      console.log('💡 Check Firebase Admin SDK setup and credentials.');
    }
  }
}

// Run verification
verifyAdminClaims();