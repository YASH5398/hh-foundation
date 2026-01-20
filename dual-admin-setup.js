// Dual admin setup: Sets both custom claims AND user document role
// This ensures compatibility with both authentication systems

const admin = require('firebase-admin');

// Target user UID
const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';

// Initialize Firebase Admin SDK with project ID
try {
  admin.initializeApp({
    projectId: 'hh-foundation'
  });
  console.log('✅ Firebase Admin SDK initialized with project ID');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function setupDualAdmin() {
  try {
    console.log('🔧 Setting up dual admin authentication...');
    console.log('Target UID:', TARGET_UID);
    
    // Step 1: Verify the user exists
    const userRecord = await admin.auth().getUser(TARGET_UID);
    console.log('✅ User found:', {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified
    });
    
    // Step 2: Set custom claims (for backend functions)
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });
    console.log('✅ Custom claims set: { role: "admin" }');
    
    // Step 3: Update user document (for Firestore rules)
    const userDocRef = db.collection('users').doc(TARGET_UID);
    await userDocRef.update({
      role: 'admin',
      isAdmin: true,
      adminGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ User document updated with admin role');
    
    // Step 4: Verify both systems
    const updatedUserRecord = await admin.auth().getUser(TARGET_UID);
    const userDoc = await userDocRef.get();
    
    console.log('');
    console.log('🔍 VERIFICATION:');
    console.log('Custom Claims:', updatedUserRecord.customClaims);
    console.log('User Document Role:', userDoc.data()?.role);
    
    const claimsValid = updatedUserRecord.customClaims?.role === 'admin';
    const docValid = userDoc.data()?.role === 'admin';
    
    if (claimsValid && docValid) {
      console.log('🎉 SUCCESS! Dual admin setup complete.');
      console.log('');
      console.log('✅ Custom Claims: VALID (for backend functions)');
      console.log('✅ User Document: VALID (for Firestore rules)');
      console.log('');
      console.log('🚨 IMPORTANT NEXT STEPS:');
      console.log('1. User must log out and log in again');
      console.log('2. Both authentication systems will now work');
      console.log('3. User can access admin panel and admin-only Firestore data');
    } else {
      console.log('❌ Verification failed:');
      console.log('- Custom Claims Valid:', claimsValid);
      console.log('- User Document Valid:', docValid);
    }
    
  } catch (error) {
    console.error('❌ Error setting up dual admin:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Check the UID is correct.');
    } else if (error.code === 'permission-denied') {
      console.log('💡 Permission denied. Check Firebase project permissions.');
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
setupDualAdmin()
  .then(() => {
    console.log('✅ Dual admin setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Dual admin setup failed:', error);
    process.exit(1);
  });