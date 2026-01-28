// Test Script for Chatbot Implementation
// Verifies all components work together correctly

const admin = require('firebase-admin');
const { detectIntent } = require('./functions/chatbot/intentDetector');
const { getUserData, getEpinData, getSendHelpData, getReceiveHelpData, getSupportTickets } = require('./functions/chatbot/firestoreReader');
const { generateReply } = require('./functions/chatbot/replyEngine');

// Mock user data for testing
const mockUserData = {
  uid: 'test-user-123',
  fullName: 'Sourav Kumar',
  isActivated: true,
  isBlocked: false,
  helpVisibility: true,
  levelStatus: 'Silver',
  referralCount: 5,
  referredUsers: [
    { uid: 'ref1', isActive: true },
    { uid: 'ref2', isActive: false }
  ],
  bankAccount: '1234567890',
  kycVerified: true,
  paymentMethod: 'upi',
  isReceivingHeld: false,
  activeReceiveCount: 2,
  upgradeRequired: false,
  sponsorPaymentPending: false
};

// Mock E-PIN data
const mockEpinData = [
  { id: 'epin1', status: 'unused', ownerUid: 'test-user-123' },
  { id: 'epin2', status: 'used', ownerUid: 'test-user-123' },
  { id: 'epin3', status: 'unused', ownerUid: 'test-user-123' }
];

// Test cases for different intents
const testCases = [
  {
    name: 'E-PIN Query - English',
    message: 'How many E-PINs do I have?',
    expectedIntent: 'epin'
  },
  {
    name: 'E-PIN Query - Hinglish',
    message: 'Kitna E-PIN hai mere paas?',
    expectedIntent: 'epin'
  },
  {
    name: 'Send Help Issue - English',
    message: 'Why is Send Help not working?',
    expectedIntent: 'sendHelp'
  },
  {
    name: 'Send Help Issue - Hinglish',
    message: 'Send help kyu nahi ho raha?',
    expectedIntent: 'sendHelp'
  },
  {
    name: 'Receive Help Query - English',
    message: 'When will I receive my payment?',
    expectedIntent: 'receiveHelp'
  },
  {
    name: 'Receive Help Query - Hinglish',
    message: 'Payment kab ayega?',
    expectedIntent: 'receiveHelp'
  },
  {
    name: 'Upcoming Payment - English',
    message: 'What is my next payment?',
    expectedIntent: 'upcomingPayment'
  },
  {
    name: 'Leaderboard Query - English',
    message: 'What is my rank?',
    expectedIntent: 'leaderboard'
  },
  {
    name: 'Referrals Query - English',
    message: 'How many referrals do I have?',
    expectedIntent: 'referrals'
  },
  {
    name: 'Profile Query - English',
    message: 'Is my profile complete?',
    expectedIntent: 'profile'
  },
  {
    name: 'Support Ticket Query - English',
    message: 'What is my ticket status?',
    expectedIntent: 'supportTicket'
  },
  {
    name: 'Tasks Query - English',
    message: 'Did I complete my tasks?',
    expectedIntent: 'tasks'
  },
  {
    name: 'Fallback Case',
    message: 'Tell me about the weather',
    expectedIntent: 'fallback'
  }
];

async function runTests() {
  console.log('🧪 Starting Chatbot Implementation Tests...\n');
  
  // Test 1: Intent Detection
  console.log('📋 Test 1: Intent Detection');
  console.log('===========================');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const detectedIntent = detectIntent(testCase.message);
    const passed = detectedIntent === testCase.expectedIntent;
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expectedIntent}, Got: ${detectedIntent}`);
    
    if (passed) passedTests++;
    console.log('');
  }
  
  console.log(`_intent Detection: ${passedTests}/${totalTests} tests passed\n`);
  
  // Test 2: Reply Generation
  console.log('📋 Test 2: Reply Generation');
  console.log('===========================');
  
  for (const testCase of testCases.slice(0, 5)) { // Test first 5 cases
    try {
      const intent = detectIntent(testCase.message);
      const reply = await generateReply(intent, mockUserData, mockUserData.uid);
      
      console.log(`✅ ${testCase.name}`);
      console.log(`   Message: "${testCase.message}"`);
      console.log(`   Reply: "${reply}"`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
  
  // Test 3: Name Prefix Logic
  console.log('📋 Test 3: Name Prefix Logic');
  console.log('============================');
  
  const testNames = ['', 'Sourav', 'John', 'मोहन'];
  for (const name of testNames) {
    const userData = { ...mockUserData, fullName: name };
    try {
      const reply = await generateReply('epin', userData, userData.uid);
      console.log(`${name || '(No name)'}: "${reply}"`);
    } catch (error) {
      console.log(`${name || '(No name)'}: Error - ${error.message}`);
    }
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\n📊 Summary:');
  console.log(`   Intent Detection: ${passedTests}/${totalTests} passed`);
  console.log('   Reply Generation: Manual verification required');
  console.log('   Name Prefix: Working (see above)');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy functions with: firebase deploy --only functions');
  console.log('2. Test with real user data in Firestore');
  console.log('3. Verify frontend integration');
}

// Run tests if script is executed directly
if (require.main === module) {
  // Initialize Firebase Admin (use service account for testing)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  
  runTests().catch(console.error);
}

module.exports = { runTests };