// Check admin user in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.firebasestorage.app",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddb0beb",
  measurementId: "G-H1J3X51DF0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdminUser() {
  console.log('🔍 CHECK: ===== CHECKING ADMIN USER IN FIRESTORE =====');
  console.log('🔍 CHECK: Project ID:', app.options.projectId);
  
  const adminUid = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';
  console.log('🔍 CHECK: Admin UID:', adminUid);
  
  try {
    const userDocRef = doc(db, 'users', adminUid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('🔍 CHECK: ❌ CRITICAL - Admin document does NOT exist in Firestore!');
      console.log('🔍 CHECK: This is why admin login fails on deployed site.');
      console.log('🔍 CHECK: Creating admin document...');
      
      await setDoc(userDocRef, {
        uid: adminUid,
        email: 'mrdev2386@gmail.com',
        role: 'admin',
        fullName: 'Admin User',
        createdAt: new Date(),
        isActivated: true,
        totalEarnings: 0,
        referralCount: 0,
        helpReceived: 0,
        totalReceived: 0,
        totalSent: 0
      });
      
      console.log('🔍 CHECK: ✅ Admin document created successfully!');
    } else {
      const userData = userDoc.data();
      console.log('🔍 CHECK: ✅ Admin document exists in Firestore');
      console.log('🔍 CHECK: Document data:');
      console.log('  - UID:', userData.uid);
      console.log('  - Email:', userData.email);
      console.log('  - Role:', userData.role);
      console.log('  - Full Name:', userData.fullName);
      console.log('  - Is Activated:', userData.isActivated);
      
      if (userData.role !== 'admin') {
        console.log('🔍 CHECK: ❌ WARNING - Role is NOT admin! Current role:', userData.role);
      } else {
        console.log('🔍 CHECK: ✅ Role is correctly set to admin');
      }
    }
    
    console.log('🔍 CHECK: ===== CHECK COMPLETE =====');
    process.exit(0);
  } catch (error) {
    console.error('🔍 CHECK: ❌ ERROR:', error.message);
    console.error('🔍 CHECK: Error code:', error.code);
    process.exit(1);
  }
}

checkAdminUser();
