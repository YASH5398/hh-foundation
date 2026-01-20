// Setup script to create system configuration in Firestore
// Run this once to set up the admin UPI QR image URL
// Replace the Firebase config with your actual config

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// You need to replace this with your actual Firebase config
const firebaseConfig = {
  // Your Firebase config here - get this from Firebase Console
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupSystemConfig() {
  try {
    console.log('Setting up system configuration...');
    
    // Create system configuration document
    await setDoc(doc(db, 'systemConfig', 'upiSettings'), {
      upiId: 'helpingpin@axl',
      // Firebase Storage URL for UPI QR code image
      upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
      description: 'System UPI configuration for E-PIN payments',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ System configuration created successfully!');
    console.log('');
    console.log('✅ QR Image URL has been set to the Firebase Storage URL');
    console.log('✅ E-PIN forms should now display the QR code correctly');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Test E-PIN forms to verify QR image displays correctly');
    
  } catch (error) {
    console.error('❌ Error creating system configuration:', error);
    console.log('');
    console.log('Make sure:');
    console.log('1. Firebase config is correct');
    console.log('2. You have admin permissions');
    console.log('3. Firestore is enabled in your project');
  }
}

// Run the setup
setupSystemConfig();