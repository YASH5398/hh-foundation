// Script to set Firebase Auth custom claims for admin access
// Uses the provided service account JSON to authenticate

const admin = require('firebase-admin');

// Load the service account key
const serviceAccount = require('./serviceAccount.json');

// Target user UID
const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

async function setAdminClaims() {
  try {
    console.log('🔧 Setting Firebase Auth custom claims...');
    console.log('Target UID:', TARGET_UID);
    console.log('Project ID:', serviceAccount.project_id);
    
    // Initialize Firebase Admin SDK with service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Verify user exists first
    const userRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ User found:', {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      currentClaims: userRecord.customClaims || {}
    });
    
    // Set the custom claims - ADMIN ROLE ONLY
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });
    
    console.log('✅ Custom claims set successfully!');
    console.log('Claims set: { role: "admin" }');
    
    // Verify the claims were set
    const updatedUserRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ Verification - Custom claims:', updatedUserRecord.customClaims);
    
    if (updatedUserRecord.customClaims?.role === 'admin') {
      console.log('');
      console.log('🎉 SUCCESS! Admin custom claims set correctly.');
      console.log('');
      console.log('🚨 CRITICAL NEXT STEPS:');
      console.log('1. User MUST log out completely from the application');
      console.log('2. User MUST log back in to refresh the ID token');
      console.log('3. Custom claims only take effect after re-authentication');
      console.log('4. Admin panel access will work via Auth token claims ONLY');
      console.log('');
      console.log('🧪 Frontend Verification Code:');
      console.log('// Add this to browser console after login:');
      console.log('const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
      console.log('console.log("Admin role:", idTokenResult.claims.role === "admin");');
      console.log('console.log("All claims:", idTokenResult.claims);');
      console.log('');
      console.log('✅ Expected result: idTokenResult.claims.role === "admin" should be true');
    } else {
      console.log('❌ Verification failed - claims not set correctly');
      console.log('Actual claims:', updatedUserRecord.customClaims);
    }
    
  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Verify the UID is correct:');
      console.log('   UID:', TARGET_UID);
    } else if (error.code === 'app/invalid-credential') {
      console.log('💡 Invalid service account credentials.');
      console.log('   Check that serviceAccount.json is valid and has proper permissions.');
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
console.log('🚀 Starting Firebase Auth custom claims setup...');
console.log('');

setAdminClaims()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully');
    console.log('🔐 Admin access is now based on Firebase Auth custom claims');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });