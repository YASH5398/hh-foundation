// Test script to verify Firestore permissions for systemConfig access
// Run this to test if authenticated users can read systemConfig/upiSettings

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Replace with your Firebase config
const firebaseConfig = {
  // Your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testSystemConfigAccess() {
  try {
    console.log('🔍 Testing Firestore permissions for systemConfig...');
    
    // Test 1: Try to read without authentication (should fail)
    console.log('\n1. Testing unauthenticated access (should fail):');
    try {
      const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));
      console.log('❌ ERROR: Unauthenticated access succeeded (security issue!)');
    } catch (error) {
      console.log('✅ GOOD: Unauthenticated access blocked:', error.code);
    }
    
    // Test 2: Sign in as a regular user and try to read (should succeed)
    console.log('\n2. Testing authenticated user access (should succeed):');
    
    // Replace with a test user email/password
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword';
    
    try {
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ User authenticated successfully');
      
      const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        console.log('✅ SUCCESS: systemConfig document read successfully');
        console.log('📄 Document data:', {
          upiId: data.upiId,
          hasQrImageUrl: !!data.upiQrImageUrl,
          qrImageUrlPreview: data.upiQrImageUrl ? data.upiQrImageUrl.substring(0, 50) + '...' : 'Not found'
        });
        
        if (data.upiQrImageUrl) {
          console.log('✅ upiQrImageUrl field exists and has value');
        } else {
          console.log('⚠️  WARNING: upiQrImageUrl field is missing or empty');
        }
      } else {
        console.log('❌ ERROR: systemConfig/upiSettings document does not exist');
        console.log('💡 Run setup-system-config.js to create it');
      }
      
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.code);
      console.log('💡 Make sure you have a test user account or update the credentials');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSystemConfigAccess();