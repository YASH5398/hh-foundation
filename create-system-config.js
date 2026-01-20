// Script to create systemConfig/upiSettings document with the correct QR image URL
// This sets up the document that PaymentPage.jsx and EpinRequestForm.jsx read from

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function createSystemConfig() {
  try {
    console.log('🔧 Creating systemConfig/upiSettings document...');
    
    // Create the document with the correct Firebase Storage URL
    await setDoc(doc(db, 'systemConfig', 'upiSettings'), {
      upiId: 'helpingpin@axl',
      upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
      description: 'System UPI configuration for E-PIN payments',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ systemConfig/upiSettings document created successfully!');
    console.log('✅ QR image URL set to Firebase Storage URL');
    console.log('');
    console.log('Document structure:');
    console.log('- Collection: systemConfig');
    console.log('- Document: upiSettings');
    console.log('- Field: upiQrImageUrl (Firebase Storage URL)');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure Firestore rules allow authenticated users to read systemConfig');
    console.log('2. Test E-PIN forms to verify QR image displays correctly');
    
  } catch (error) {
    console.error('❌ Error creating system configuration:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check Firebase config is correct');
    console.log('2. Ensure you have admin permissions');
    console.log('3. Verify Firestore is enabled in your project');
  }
}

// Run the setup
createSystemConfig();