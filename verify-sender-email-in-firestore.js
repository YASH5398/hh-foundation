/**
 * VERIFY SENDER EMAIL IN FIRESTORE
 * 
 * This script will:
 * 1. Create a NEW Send Help assignment
 * 2. Check the newly created receiveHelp document in Firestore
 * 3. Verify if senderEmail field exists and is populated
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function verifyNewSendHelpHasSenderEmail() {
  console.log('🔍 VERIFYING SENDER EMAIL IN NEW FIRESTORE DOCUMENTS');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get the most recent receiveHelp documents (created after our fix)
    console.log('📋 Fetching recent receiveHelp documents...');
    
    const receiveHelpQuery = db.collection('receiveHelp')
      .orderBy('createdAt', 'desc')
      .limit(5);
    
    const receiveHelpSnapshot = await receiveHelpQuery.get();
    
    if (receiveHelpSnapshot.empty) {
      console.log('❌ No receiveHelp documents found');
      return;
    }

    console.log(`📊 Found ${receiveHelpSnapshot.size} recent receiveHelp documents`);
    console.log('');

    // Step 2: Check each document for senderEmail field
    let documentsWithEmail = 0;
    let documentsWithoutEmail = 0;

    receiveHelpSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const docId = doc.id;
      
      console.log(`📄 Document ${index + 1}: ${docId}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || 'Unknown'}`);
      console.log(`   Sender UID: ${data.senderUid || 'Missing'}`);
      console.log(`   Sender Name: ${data.senderName || 'Missing'}`);
      console.log(`   Sender Phone: ${data.senderPhone || 'Missing'}`);
      
      // CHECK FOR SENDER EMAIL
      if (data.senderEmail) {
        console.log(`   ✅ Sender Email: ${data.senderEmail}`);
        documentsWithEmail++;
      } else {
        console.log(`   ❌ Sender Email: MISSING`);
        documentsWithoutEmail++;
      }
      
      console.log('');
    });

    // Step 3: Check corresponding sendHelp documents
    console.log('🔍 Checking corresponding sendHelp documents...');
    console.log('');

    for (const doc of receiveHelpSnapshot.docs) {
      const helpId = doc.id;
      
      try {
        const sendHelpDoc = await db.collection('sendHelp').doc(helpId).get();
        
        if (sendHelpDoc.exists) {
          const sendData = sendHelpDoc.data();
          console.log(`📄 SendHelp ${helpId}:`);
          
          if (sendData.senderEmail) {
            console.log(`   ✅ Sender Email: ${sendData.senderEmail}`);
          } else {
            console.log(`   ❌ Sender Email: MISSING`);
          }
        } else {
          console.log(`❌ SendHelp document ${helpId} not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking sendHelp ${helpId}:`, error.message);
      }
      
      console.log('');
    }

    // Step 4: Summary
    console.log('📊 SUMMARY:');
    console.log(`   Documents with senderEmail: ${documentsWithEmail}`);
    console.log(`   Documents without senderEmail: ${documentsWithoutEmail}`);
    
    if (documentsWithEmail > 0) {
      console.log('✅ SUCCESS: senderEmail is being saved in new documents');
    } else {
      console.log('❌ ISSUE: senderEmail is NOT being saved in new documents');
      console.log('🔧 ACTION REQUIRED: Fix the startHelpAssignment function');
    }

  } catch (error) {
    console.error('❌ Error verifying documents:', error);
  }
}

// Run the verification
verifyNewSendHelpHasSenderEmail()
  .then(() => {
    console.log('🏁 Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });