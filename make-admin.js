// Simple script to make a user admin using Firebase Admin SDK
// This bypasses the need for existing admin authentication

const admin = require('firebase-admin');

// Target user UID
const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./backend/functions/serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'hh-foundation'
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

async function makeUserAdmin() {
  try {
    console.log('🔧 Making user admin...');
    console.log('Target UID:', TARGET_UID);
    console.log('Project ID:', 'hh-foundation');
    
    // First, verify the user exists
    const userRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ User found:', {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified
    });
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });
    
    console.log('✅ Admin claims set successfully!');
    
    // Verify the claims were set
    const updatedUserRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ Verification - Custom claims:', updatedUserRecord.customClaims);
    
    if (updatedUserRecord.customClaims?.role === 'admin') {
      console.log('🎉 SUCCESS! User is now an admin.');
      console.log('');
      console.log('🚨 IMPORTANT NEXT STEPS:');
      console.log('1. The user MUST log out and log in again');
      console.log('2. Claims take effect after re-authentication');
      console.log('3. User can now access admin panel');
      console.log('');
      console.log('🧪 Frontend verification:');
      console.log('const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
      console.log('console.log("Is admin:", idTokenResult.claims.role === "admin");');
    } else {
      console.log('❌ Claims verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Check the UID is correct.');
    } else if (error.code === 'auth/insufficient-permission') {
      console.log('💡 Insufficient permissions. Check service account permissions.');
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
makeUserAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });