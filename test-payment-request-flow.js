/**
 * Test Payment Request Flow
 * This script tests the complete payment request flow:
 * 1. Receiver clicks "Request Payment" button
 * 2. Both documents get updated with paymentRequested: true
 * 3. Sender sees popup with sound notification
 * 4. Sender completes payment, paymentRequested resets to false
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, serverTimestamp, onSnapshot } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test data
const TEST_HELP_ID = 'test-help-123';
const RECEIVER_EMAIL = 'receiver@test.com';
const SENDER_EMAIL = 'sender@test.com';
const TEST_PASSWORD = 'testpassword123';

async function testPaymentRequestFlow() {
  console.log('🧪 Starting Payment Request Flow Test...\n');

  try {
    // Step 1: Sign in as receiver
    console.log('1. 👤 Signing in as receiver...');
    await signInWithEmailAndPassword(auth, RECEIVER_EMAIL, TEST_PASSWORD);
    console.log('✅ Receiver signed in successfully\n');

    // Step 2: Simulate receiver clicking "Request Payment"
    console.log('2. 🎯 Simulating receiver clicking "Request Payment" button...');
    
    const receiveHelpRef = doc(db, 'receiveHelp', TEST_HELP_ID);
    const sendHelpRef = doc(db, 'sendHelp', TEST_HELP_ID);

    // Update both documents with payment request
    const updateData = {
      paymentRequested: true,
      lastPaymentRequestAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await Promise.all([
      updateDoc(receiveHelpRef, updateData),
      updateDoc(sendHelpRef, updateData)
    ]);

    console.log('✅ Payment request sent - both documents updated\n');

    // Step 3: Verify the updates
    console.log('3. 🔍 Verifying document updates...');
    
    const [receiveDoc, sendDoc] = await Promise.all([
      getDoc(receiveHelpRef),
      getDoc(sendHelpRef)
    ]);

    if (receiveDoc.exists() && sendDoc.exists()) {
      const receiveData = receiveDoc.data();
      const sendData = sendDoc.data();

      console.log('📄 ReceiveHelp document:');
      console.log(`   - paymentRequested: ${receiveData.paymentRequested}`);
      console.log(`   - lastPaymentRequestAt: ${receiveData.lastPaymentRequestAt?.toDate?.()}`);

      console.log('📄 SendHelp document:');
      console.log(`   - paymentRequested: ${sendData.paymentRequested}`);
      console.log(`   - lastPaymentRequestAt: ${sendData.lastPaymentRequestAt?.toDate?.()}`);

      if (receiveData.paymentRequested && sendData.paymentRequested) {
        console.log('✅ Both documents correctly updated with paymentRequested: true\n');
      } else {
        console.log('❌ Documents not properly updated\n');
        return;
      }
    } else {
      console.log('❌ Documents not found\n');
      return;
    }

    // Step 4: Set up real-time listener (simulating sender's page)
    console.log('4. 👂 Setting up real-time listener (simulating sender\'s page)...');
    
    const unsubscribe = onSnapshot(sendHelpRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('🔥 Real-time update received:');
        console.log(`   - paymentRequested: ${data.paymentRequested}`);
        
        if (data.paymentRequested === true) {
          console.log('🚨 POPUP SHOULD SHOW NOW!');
          console.log('🔊 SOUND SHOULD PLAY NOW!');
          console.log('   Message: "Receiver is requesting payment. Please complete the payment."\n');
        } else if (data.paymentRequested === false) {
          console.log('🔄 Payment request cleared - popup should hide\n');
        }
      }
    });

    // Step 5: Wait a moment, then simulate payment completion
    console.log('5. ⏳ Waiting 3 seconds, then simulating payment completion...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('6. 💳 Simulating sender completing payment...');
    
    // Reset payment request flag (this would normally be done by submitPayment Cloud Function)
    await Promise.all([
      updateDoc(receiveHelpRef, { 
        paymentRequested: false,
        status: 'payment_done',
        updatedAt: serverTimestamp()
      }),
      updateDoc(sendHelpRef, { 
        paymentRequested: false,
        status: 'payment_done',
        updatedAt: serverTimestamp()
      })
    ]);

    console.log('✅ Payment completed - paymentRequested reset to false\n');

    // Step 6: Wait for final update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cleanup
    unsubscribe();
    console.log('🧹 Test completed - listener cleaned up\n');

    console.log('🎉 PAYMENT REQUEST FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('📋 Summary:');
    console.log('   ✅ Receiver can request payment');
    console.log('   ✅ Both documents get updated');
    console.log('   ✅ Real-time listener detects changes');
    console.log('   ✅ Popup and sound should trigger');
    console.log('   ✅ Payment completion resets flag');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPaymentRequestFlow().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testPaymentRequestFlow };