// Script to set Firebase Auth custom claims for admin access
// This uses Firebase Admin SDK to set { role: "admin" } claim

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Using service account key file from backend functions
const serviceAccount = require('./backend/functions/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

async function setAdminClaims() {
  try {
    console.log('🔧 Setting admin claims for user...');
    console.log('Target UID:', TARGET_UID);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });
    
    console.log('✅ Admin claims set successfully!');
    console.log('');
    console.log('Custom claims set:');
    console.log('{ role: "admin" }');
    console.log('');
    
    // Verify the claims were set
    const userRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ Verification - User custom claims:');
    console.log(JSON.stringify(userRecord.customClaims, null, 2));
    
    console.log('');
    console.log('🚨 IMPORTANT NEXT STEPS:');
    console.log('1. The user MUST log out and log in again for claims to take effect');
    console.log('2. Claims are included in the ID token after re-authentication');
    console.log('3. Firestore rules will now recognize this user as admin');
    console.log('');
    console.log('🧪 To verify on frontend:');
    console.log('const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
    console.log('console.log("Admin role:", idTokenResult.claims.role === "admin");');
    
  } catch (error) {
    console.error('❌ Error setting admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Check the UID is correct.');
    } else if (error.code === 'auth/insufficient-permission') {
      console.log('💡 Insufficient permissions. Ensure Admin SDK is properly initialized.');
    } else {
      console.log('💡 Check Firebase Admin SDK setup and credentials.');
    }
  }
}

// Run the script
setAdminClaims();