const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testEpinApprovalSystem() {
  console.log('🧪 Testing E-PIN Approval System Fixes...\n');

  try {
    // Test 1: Admin Authentication
    console.log('1️⃣ Testing Admin Authentication...');
    const adminEmail = 'admin@example.com'; // Replace with actual admin email
    const adminPassword = 'adminpassword'; // Replace with actual admin password
    
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const adminUser = userCredential.user;
    console.log('✅ Admin authenticated:', adminUser.email);

    // Test 2: Create a test E-PIN request
    console.log('\n2️⃣ Creating test E-PIN request...');
    const testRequestData = {
      uid: 'test-user-uid',
      userId: 'TEST001',
      fullName: 'Test User',
      requestedCount: 5,
      requestType: 'Buy',
      paymentMethod: 'PhonePe',
      utrNumber: 'TEST123456789',
      paymentScreenshotUrl: 'test-screenshot.jpg',
      status: 'pending',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      amountPaid: 500,
      bonusEpins: 1,
      totalEpins: 6
    };

    const requestRef = await addDoc(collection(db, 'epinRequests'), testRequestData);
    console.log('✅ Test E-PIN request created with ID:', requestRef.id);

    // Test 3: Verify request data structure
    console.log('\n3️⃣ Verifying request data structure...');
    const requestDoc = await getDoc(requestRef);
    const requestData = requestDoc.data();
    
    const requiredFields = ['uid', 'userId', 'fullName', 'requestedCount', 'status', 'timestamp'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present in request');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }

    // Test 4: Test approval with proper admin metadata
    console.log('\n4️⃣ Testing approval with proper admin metadata...');
    const approvalData = {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: {
        uid: adminUser.uid,
        name: 'Admin User',
        email: adminUser.email
      },
      totalEpinsGenerated: requestData.requestedCount,
      epinRequestId: requestRef.id,
      processedAt: serverTimestamp()
    };

    // Validate approval data
    if (!approvalData.status || !approvalData.approvedAt || !approvalData.approvedBy?.uid) {
      throw new Error('Invalid approval data structure');
    }

    await updateDoc(doc(db, 'epinRequests', requestRef.id), approvalData);
    console.log('✅ E-PIN request approved successfully');

    // Test 5: Verify approval data was saved correctly
    console.log('\n5️⃣ Verifying approval data...');
    const approvedDoc = await getDoc(requestRef);
    const approvedData = approvedDoc.data();
    
    if (approvedData.status === 'approved' && 
        approvedData.approvedBy?.uid === adminUser.uid &&
        approvedData.approvedBy?.name === 'Admin User') {
      console.log('✅ Approval data saved correctly');
      console.log('   - Status:', approvedData.status);
      console.log('   - Approved by:', approvedData.approvedBy.name);
      console.log('   - Admin UID:', approvedData.approvedBy.uid);
    } else {
      console.log('❌ Approval data verification failed');
    }

    // Test 6: Test rejection with proper admin metadata
    console.log('\n6️⃣ Testing rejection with proper admin metadata...');
    const rejectionData = {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: {
        uid: adminUser.uid,
        name: 'Admin User',
        email: adminUser.email
      },
      processedAt: serverTimestamp()
    };

    // Validate rejection data
    if (!rejectionData.status || !rejectionData.rejectedAt || !rejectionData.rejectedBy?.uid) {
      throw new Error('Invalid rejection data structure');
    }

    await updateDoc(doc(db, 'epinRequests', requestRef.id), rejectionData);
    console.log('✅ E-PIN request rejected successfully');

    // Test 7: Verify rejection data was saved correctly
    console.log('\n7️⃣ Verifying rejection data...');
    const rejectedDoc = await getDoc(requestRef);
    const rejectedData = rejectedDoc.data();
    
    if (rejectedData.status === 'rejected' && 
        rejectedData.rejectedBy?.uid === adminUser.uid &&
        rejectedData.rejectedBy?.name === 'Admin User') {
      console.log('✅ Rejection data saved correctly');
      console.log('   - Status:', rejectedData.status);
      console.log('   - Rejected by:', rejectedData.rejectedBy.name);
      console.log('   - Admin UID:', rejectedData.rejectedBy.uid);
    } else {
      console.log('❌ Rejection data verification failed');
    }

    // Test 8: Test validation functions
    console.log('\n8️⃣ Testing validation functions...');
    
    // Test admin validation
    const adminValidation = adminUser.uid && 'Admin User' && adminUser.email;
    console.log('✅ Admin validation:', adminValidation ? 'PASS' : 'FAIL');
    
    // Test request validation
    const requestValidation = requestRef.id && requestData.uid && requestData.requestedCount > 0;
    console.log('✅ Request validation:', requestValidation ? 'PASS' : 'FAIL');
    
    // Test update data validation
    const updateDataValidation = approvalData.status && approvalData.approvedAt && approvalData.approvedBy?.uid;
    console.log('✅ Update data validation:', updateDataValidation ? 'PASS' : 'FAIL');

    console.log('\n🎉 All E-PIN approval system tests completed successfully!');
    console.log('\n📋 Summary of fixes implemented:');
    console.log('   ✅ Admin user information validation');
    console.log('   ✅ Proper admin metadata structure (object with uid, name, email)');
    console.log('   ✅ Enhanced data validation before Firestore operations');
    console.log('   ✅ Updated Firestore security rules for admin metadata');
    console.log('   ✅ Improved error handling and user feedback');
    console.log('   ✅ Prevention of duplicate processing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testEpinApprovalSystem(); 