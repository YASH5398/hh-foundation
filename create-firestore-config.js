// Script to create systemConfig/upiSettings document in Firestore
// This must be run with Admin SDK credentials

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(process.cwd(), 'functions', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found at:', serviceAccountPath);
  console.error('Make sure you have placed the service account key file in the functions/ directory');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function createSystemConfig() {
  try {
    console.log('🔧 Creating systemConfig/upiSettings document...\n');
    
    // Create the document with all required fields
    await db.collection('systemConfig').doc('upiSettings').set({
      upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
      phonePe: '6299261088',
      gpay: '6299261088',
      paytm: '6299261088',
      upiId: 'helpingpin@axl',
      description: 'System UPI configuration for E-PIN payments',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
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
    console.log('✅ Next: Refresh /dashboard/epins/payment page\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating system configuration:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify serviceAccountKey.json exists in functions/ directory');
    console.log('2. Check that the key has admin permissions');
    console.log('3. Verify Firebase project is correctly configured\n');
    process.exit(1);
  }
}

createSystemConfig();
