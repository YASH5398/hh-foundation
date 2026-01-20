// Script to set Firebase Auth custom claims ONLY
// This focuses specifically on custom claims, not Firestore documents

const admin = require('firebase-admin');

// Target user UID
const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

// Initialize Firebase Admin SDK using environment variables
// This approach uses the Firebase CLI authentication
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'hh-foundation'
});

async function setCustomClaims() {
  try {
    console.log('🔧 Setting Firebase Auth custom claims...');
    console.log('Target UID:', TARGET_UID);
    console.log('Project ID: hh-foundation');
    
    // Initialize with project ID only - let Firebase handle auth
    admin.initializeApp({
      projectId: 'hh-foundation'
    });
    
    console.log('✅ Firebase Admin SDK initialized');
    
    // Verify user exists first
    const userRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ User found:', {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      currentClaims: userRecord.customClaims || {}
    });
    
    // Set the custom claims
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });
    
    console.log('✅ Custom claims set successfully!');
    
    // Verify the claims were set
    const updatedUserRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ Verification - Custom claims:', updatedUserRecord.customClaims);
    
    if (updatedUserRecord.customClaims?.role === 'admin') {
      console.log('');
      console.log('🎉 SUCCESS! Custom claims set correctly.');
      console.log('');
      console.log('🚨 CRITICAL NEXT STEPS:');
      console.log('1. User MUST log out completely');
      console.log('2. User MUST log back in');
      console.log('3. Claims only take effect after re-authentication');
      console.log('');
      console.log('🧪 Frontend Verification Code:');
      console.log('const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
      console.log('console.log("Admin role:", idTokenResult.claims.role === "admin");');
      console.log('console.log("All claims:", idTokenResult.claims);');
    } else {
      console.log('❌ Verification failed - claims not set correctly');
    }
    
  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Verify the UID is correct.');
    } else if (error.code === 'app/invalid-credential') {
      console.log('💡 Credential error. Try one of these solutions:');
      console.log('   1. Run: firebase login');
      console.log('   2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.log('   3. Use a valid service account key');
    } else {
      console.log('💡 Error details:', {
        code: error.code,
        message: error.message
      });
    }
    
    process.exit(1);
  }
}

// Run the script
setCustomClaims()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });