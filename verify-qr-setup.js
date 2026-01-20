// Verification script to test E-PIN QR image setup
// This simulates what PaymentPage.jsx and EpinRequestForm.jsx do

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Replace with your actual Firebase config
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

async function verifyQRSetup() {
  try {
    console.log('🔍 Verifying E-PIN QR image setup...');
    console.log('');
    
    // Test 1: Check if document exists and has correct structure
    console.log('1. Checking systemConfig/upiSettings document...');
    const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));
    
    if (!configDoc.exists()) {
      console.log('❌ ERROR: systemConfig/upiSettings document does not exist');
      console.log('💡 Run: node create-system-config.js');
      return;
    }
    
    const configData = configDoc.data();
    console.log('✅ Document exists');
    
    // Test 2: Check required fields
    console.log('');
    console.log('2. Checking document fields...');
    
    if (!configData.upiId) {
      console.log('❌ ERROR: upiId field missing');
    } else {
      console.log('✅ upiId:', configData.upiId);
    }
    
    if (!configData.upiQrImageUrl) {
      console.log('❌ ERROR: upiQrImageUrl field missing');
    } else {
      console.log('✅ upiQrImageUrl exists');
      console.log('   URL:', configData.upiQrImageUrl.substring(0, 80) + '...');
      
      // Check if it's a Firebase Storage URL
      if (configData.upiQrImageUrl.includes('firebasestorage.googleapis.com')) {
        console.log('✅ URL is Firebase Storage URL');
      } else {
        console.log('⚠️  WARNING: URL is not a Firebase Storage URL');
      }
    }
    
    // Test 3: Test authenticated access (requires test user)
    console.log('');
    console.log('3. Testing authenticated access...');
    console.log('💡 To test authenticated access, update the script with test user credentials');
    
    // Test 4: Simulate component behavior
    console.log('');
    console.log('4. Simulating E-PIN component behavior...');
    
    // This is what PaymentPage.jsx and EpinRequestForm.jsx do:
    let upiQrImageUrl = '';
    let qrImageLoading = true;
    
    try {
      qrImageLoading = true;
      const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.upiQrImageUrl) {
          upiQrImageUrl = configData.upiQrImageUrl;
          console.log('✅ QR image URL loaded successfully');
        } else {
          console.log('❌ ERROR: upiQrImageUrl field not found');
        }
      } else {
        console.log('❌ ERROR: systemConfig document not found');
      }
    } catch (error) {
      console.log('❌ ERROR: Failed to fetch config:', error.code);
    } finally {
      qrImageLoading = false;
    }
    
    // Test 5: Final status
    console.log('');
    console.log('5. Final verification...');
    
    if (upiQrImageUrl && !qrImageLoading) {
      console.log('✅ SUCCESS: E-PIN QR image setup is complete!');
      console.log('✅ Components should display QR image correctly');
      console.log('');
      console.log('Expected behavior:');
      console.log('- PaymentPage.jsx: QR image displays in payment section');
      console.log('- EpinRequestForm.jsx: QR image displays in payment details');
      console.log('- Image source:', upiQrImageUrl.substring(0, 50) + '...');
    } else {
      console.log('❌ FAILED: Setup incomplete');
      console.log('💡 Check the errors above and fix them');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.log('');
    console.log('Common issues:');
    console.log('1. Firebase config incorrect');
    console.log('2. Firestore rules not deployed');
    console.log('3. systemConfig document missing');
  }
}

// Run verification
verifyQRSetup();