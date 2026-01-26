// Verification script to check admin user in Firestore
// Run this with: node verify-admin-deployed.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function verifyAdminUser() {
  console.log('🔍 VERIFICATION: ===== ADMIN USER VERIFICATION =====');
  console.log('🔍 VERIFICATION: Project ID:', admin.app().options.projectId);
  
  try {
    // Check for admin user by email
    const adminEmail = 'mrdev2386@gmail.com';
    console.log('🔍 VERIFICATION: Looking for admin user:', adminEmail);
    
    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    console.log('🔍 VERIFICATION: Firebase Auth user found:');
    console.log('  - UID:', userRecord.uid);
    console.log('  - Email:', userRecord.email);
    console.log('  - Email verified:', userRecord.emailVerified);
    console.log('  - Disabled:', userRecord.disabled);
    console.log('  - Custom claims:', JSON.stringify(userRecord.customClaims || {}, null, 2));
    
    // Check Firestore document
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.log('🔍 VERIFICATION: ❌ CRITICAL - Firestore document does NOT exist for this user!');
      console.log('🔍 VERIFICATION: Creating admin document...');
      
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: adminEmail,
        role: 'admin',
        fullName: 'Admin User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActivated: true
      });
      
      console.log('🔍 VERIFICATION: ✅ Admin document created successfully');
    } else {
      const userData = userDoc.data();
      console.log('🔍 VERIFICATION: Firestore document found:');
      console.log('  - UID:', userData.uid);
      console.log('  - Email:', userData.email);
      console.log('  - Role:', userData.role);
      console.log('  - Full Name:', userData.fullName);
      console.log('  - Is Activated:', userData.isActivated);
      
      if (userData.role !== 'admin') {
        console.log('🔍 VERIFICATION: ❌ CRITICAL - Role is NOT admin! Updating...');
        await db.collection('users').doc(userRecord.uid).update({
          role: 'admin'
        });
        console.log('🔍 VERIFICATION: ✅ Role updated to admin');
      } else {
        console.log('🔍 VERIFICATION: ✅ Role is correctly set to admin');
      }
    }
    
    console.log('🔍 VERIFICATION: ===== VERIFICATION COMPLETE =====');
    process.exit(0);
  } catch (error) {
    console.error('🔍 VERIFICATION: ❌ ERROR:', error);
    process.exit(1);
  }
}

verifyAdminUser();
