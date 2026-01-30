/**
 * DEBUG SCRIPT - Payment Request Feature
 * This script helps identify why the Payment Request feature is not visible
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc, onSnapshot } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function debugPaymentRequestFeature() {
  console.log('🔍 Starting Payment Request Feature Debug...\n');

  try {
    // 1. Check if there are any sendHelp documents with paymentRequested field
    console.log('1. Checking sendHelp collection for paymentRequested field...');
    const sendHelpQuery = query(collection(db, 'sendHelp'));
    const sendHelpSnapshot = await getDocs(sendHelpQuery);
    
    let foundPaymentRequested = false;
    sendHelpSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.paymentRequested !== undefined) {
        foundPaymentRequested = true;
        console.log(`   ✅ Found paymentRequested in sendHelp doc ${doc.id}:`, data.paymentRequested);
      }
    });
    
    if (!foundPaymentRequested) {
      console.log('   ❌ No paymentRequested field found in any sendHelp documents');
    }

    // 2. Check receiveHelp collection
    console.log('\n2. Checking receiveHelp collection for paymentRequested field...');
    const receiveHelpQuery = query(collection(db, 'receiveHelp'));
    const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
    
    foundPaymentRequested = false;
    receiveHelpSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.paymentRequested !== undefined) {
        foundPaymentRequested = true;
        console.log(`   ✅ Found paymentRequested in receiveHelp doc ${doc.id}:`, data.paymentRequested);
      }
    });
    
    if (!foundPaymentRequested) {
      console.log('   ❌ No paymentRequested field found in any receiveHelp documents');
    }

    // 3. Check for pending helps
    console.log('\n3. Checking for pending helps...');
    const pendingQuery = query(
      collection(db, 'sendHelp'),
      where('status', '==', 'assigned')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    console.log(`   Found ${pendingSnapshot.size} pending sendHelp documents`);
    pendingSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - Help ID: ${doc.id}, Status: ${data.status}, PaymentRequested: ${data.paymentRequested}`);
    });

    // 4. Check for payment_requested status
    console.log('\n4. Checking for payment_requested status...');
    const paymentRequestedQuery = query(
      collection(db, 'sendHelp'),
      where('status', '==', 'payment_requested')
    );
    const paymentRequestedSnapshot = await getDocs(paymentRequestedQuery);
    
    console.log(`   Found ${paymentRequestedSnapshot.size} payment_requested sendHelp documents`);
    paymentRequestedSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - Help ID: ${doc.id}, Status: ${data.status}, PaymentRequested: ${data.paymentRequested}`);
    });

    console.log('\n✅ Debug completed. Check the output above for issues.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPaymentRequestFeature();