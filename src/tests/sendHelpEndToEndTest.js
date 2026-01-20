/**
 * SEND HELP END-TO-END TEST
 * Comprehensive test for the complete Send Help flow
 */

import { db, auth, storage } from '../config/firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { createSendHelpAssignment } from '../services/helpService';
import { HELP_STATUS } from '../config/helpStatus';

/**
 * TEST USER DATA - Update with real test user
 */
const TEST_USER = {
  uid: 'test-user-uid', // Update with real UID
  userId: 'TEST001', // Update with real userId
  fullName: 'Test User',
  email: 'test@example.com',
  levelStatus: 'Star'
};

const RECEIVER_USER = {
  uid: 'test-receiver-uid', // Update with real receiver UID
  userId: 'RECEIVER001', // Update with real receiver userId
  fullName: 'Test Receiver',
  email: 'receiver@example.com',
  levelStatus: 'Star'
};

/**
 * TEST HELP ASSIGNMENT
 */
export async function testSendHelpAssignment() {
  console.log('🧪 Testing Send Help Assignment...');

  try {
    // Create test assignment
    const result = await createSendHelpAssignment(TEST_USER, RECEIVER_USER);

    if (!result.success) {
      throw new Error('Assignment failed');
    }

    console.log('✅ Assignment successful:', result.helpId);

    // Verify documents exist
    const sendHelpDoc = await getDoc(doc(db, 'sendHelp', result.helpId));
    const receiveHelpDoc = await getDoc(doc(db, 'receiveHelp', result.helpId));

    if (!sendHelpDoc.exists() || !receiveHelpDoc.exists()) {
      throw new Error('Documents not created');
    }

    // Verify status is ASSIGNED
    const sendHelpData = sendHelpDoc.data();
    if (sendHelpData.status !== HELP_STATUS.ASSIGNED) {
      throw new Error(`Wrong status: ${sendHelpData.status}, expected: ${HELP_STATUS.ASSIGNED}`);
    }

    // Verify expiresAt is set
    if (!sendHelpData.expiresAt) {
      throw new Error('expiresAt not set');
    }

    console.log('✅ Documents created with correct status and expiresAt');
    console.log('📅 Expires at:', sendHelpData.expiresAt.toDate());

    return { success: true, helpId: result.helpId };

  } catch (error) {
    console.error('❌ Assignment test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * TEST IMAGE UPLOAD
 */
export async function testImageUpload(helpId) {
  console.log('🧪 Testing Image Upload...');

  try {
    // Create a test image (small PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);

    canvas.toBlob(async (blob) => {
      // Upload to Firebase Storage
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('No authenticated user for image upload test');
      }
      const storageRef = ref(storage, `payment-proofs/${uid}/test-${Date.now()}.png`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Image uploaded successfully:', downloadURL);

      // Update sendHelp document
      await updateDoc(doc(db, 'sendHelp', helpId), {
        'paymentDetails.screenshotUrl': downloadURL,
        status: HELP_STATUS.PAYMENT_REQUESTED
      });

      // Update receiveHelp document
      await updateDoc(doc(db, 'receiveHelp', helpId), {
        'paymentDetails.screenshotUrl': downloadURL
      });

      console.log('✅ Documents updated with screenshot URL');

      // Cleanup
      await deleteObject(storageRef);

      return { success: true, downloadURL };
    });

  } catch (error) {
    console.error('❌ Image upload test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * TEST PERMISSIONS
 */
export async function testPermissions(helpId) {
  console.log('🧪 Testing Permissions...');

  try {
    // Test reading sendHelp document
    const sendHelpDoc = await getDoc(doc(db, 'sendHelp', helpId));
    if (!sendHelpDoc.exists()) {
      throw new Error('Cannot read sendHelp document');
    }
    console.log('✅ Can read sendHelp document');

    // Test reading receiveHelp document
    const receiveHelpDoc = await getDoc(doc(db, 'receiveHelp', helpId));
    if (!receiveHelpDoc.exists()) {
      throw new Error('Cannot read receiveHelp document');
    }
    console.log('✅ Can read receiveHelp document');

    // Test updating sendHelp document (should work for sender)
    await updateDoc(doc(db, 'sendHelp', helpId), {
      testField: 'test'
    });
    console.log('✅ Can update sendHelp document');

    // Test updating receiveHelp document (should fail for sender)
    try {
      await updateDoc(doc(db, 'receiveHelp', helpId), {
        testField: 'test'
      });
      console.log('⚠️ WARNING: Sender can update receiveHelp (unexpected)');
    } catch (error) {
      console.log('✅ Correctly blocked sender from updating receiveHelp');
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Permissions test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * CLEANUP TEST DATA
 */
export async function cleanupTestData(helpId) {
  console.log('🧪 Cleaning up test data...');

  try {
    await deleteDoc(doc(db, 'sendHelp', helpId));
    await deleteDoc(doc(db, 'receiveHelp', helpId));
    console.log('✅ Test data cleaned up');
    return { success: true };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * RUN COMPLETE END-TO-END TEST
 */
export async function runSendHelpEndToEndTest() {
  console.log('🚀 STARTING SEND HELP END-TO-END TEST');
  console.log('=====================================');

  let helpId = null;

  try {
    // 1. Test Assignment
    const assignmentResult = await testSendHelpAssignment();
    if (!assignmentResult.success) {
      throw new Error(`Assignment failed: ${assignmentResult.error}`);
    }
    helpId = assignmentResult.helpId;

    // 2. Test Permissions
    const permissionsResult = await testPermissions(helpId);
    if (!permissionsResult.success) {
      throw new Error(`Permissions failed: ${permissionsResult.error}`);
    }

    // 3. Test Image Upload
    const uploadResult = await testImageUpload(helpId);
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    console.log('🎉 ALL TESTS PASSED!');
    return { success: true };

  } catch (error) {
    console.error('❌ END-TO-END TEST FAILED:', error);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (helpId) {
      await cleanupTestData(helpId);
    }
  }
}

/**
 * RUN TEST WITH LOGGING
 */
export async function runTestAndLog() {
  const result = await runSendHelpEndToEndTest();

  console.log('\n' + '='.repeat(50));
  console.log('END-TO-END TEST RESULTS');
  console.log('='.repeat(50));

  if (result.success) {
    console.log('✅ ALL TESTS PASSED');
    console.log('🎯 Send Help flow is working correctly!');
  } else {
    console.log('❌ TESTS FAILED');
    console.log(`Error: ${result.error}`);
    console.log('\n🔧 Fix the issues above and re-run the test.');
  }

  console.log('='.repeat(50));

  return result;
}

// Make globally available
window.runSendHelpEndToEndTest = runTestAndLog;
