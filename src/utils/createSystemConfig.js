// Browser-based script to create systemConfig/upiSettings document
// Run this in the browser console or import it in your app before authentication

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.firebasestorage.app",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddbdb0beb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createSystemConfig() {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.error('❌ Error: Not authenticated. Please login first.');
      return;
    }

    // Check if user is admin
    const userToken = await auth.currentUser.getIdTokenResult();
    if (userToken.claims.role !== 'admin') {
      console.error('❌ Error: Only admins can create system configuration.');
      return;
    }

    console.log('🔧 Creating systemConfig/upiSettings document...\n');
    
    // Create the document with all required fields
    await setDoc(doc(db, 'systemConfig', 'upiSettings'), {
      upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
      phonePe: '6299261088',
      gpay: '6299261088',
      paytm: '6299261088',
      upiId: 'helpingpin@axl',
      description: 'System UPI configuration for E-PIN payments',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ systemConfig/upiSettings document created successfully!\n');
    console.log('📋 Document Details:');
    console.log('   Collection: systemConfig');
    console.log('   Document: upiSettings');
    console.log('   Fields:');
    console.log('   ✓ upiQrImageUrl (Firebase Storage URL)');
    console.log('   ✓ phonePe');
    console.log('   ✓ gpay');
    console.log('   ✓ paytm');
    console.log('   ✓ upiId');
    console.log('\n✅ E-PIN QR image should now display correctly!');
    console.log('✅ Refresh /dashboard/epins/payment page to see QR code\n');

  } catch (error) {
    console.error('❌ Error creating system configuration:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify you are logged in as an admin');
    console.log('2. Check browser console for detailed error messages');
    console.log('3. Verify Firestore rules allow admin write access to systemConfig\n');
  }
}

// Export for use
export { createSystemConfig };

// If script is run directly in browser console, execute
if (typeof window !== 'undefined') {
  console.log('🚀 To create systemConfig/upiSettings, run:');
  console.log('   createSystemConfig()');
}
