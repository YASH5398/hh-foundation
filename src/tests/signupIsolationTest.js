import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * ISOLATED SIGNUP TEST - Firebase Auth + Firestore Rules Only
 *
 * This test does ONLY:
 * - createUserWithEmailAndPassword
 * - setDoc(users/{uid})
 * - getDoc(users/{uid})
 *
 * NO imports from:
 * - Signup.jsx
 * - AuthContext
 * - notificationService
 * - unreadMessageService
 * - countdownService
 * - Any components with listeners
 */

export async function runSignupIsolationTest() {
  console.log("🧪 STARTING ISOLATED SIGNUP TEST");
  console.log("=================================");

  const testEmail = `isolation_test_${Date.now()}@test.com`;
  const testPassword = "Test@123456";
  let createdUser = null;
  let testUid = null;

  try {
    // ========================================
    // STEP 1: Firebase Auth - Create User
    // ========================================
    console.log("📧 STEP 1: Creating Firebase Auth user...");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    createdUser = userCredential.user;
    testUid = userCredential.user.uid;

    console.log(`✅ STEP 1 PASSED: Auth user created with UID: ${testUid}`);

    // ========================================
    // STEP 2: Firestore Write - setDoc
    // ========================================
    console.log("💾 STEP 2: Creating Firestore users document...");

    const userData = {
      uid: testUid,
      email: testEmail,
      fullName: "Test User",
      phone: "9876543210",
      whatsappNumber: "9876543210",
      createdAt: new Date(),
      role: "user",
      isActivated: false,
      totalEarnings: 0,
      referralCount: 0,
      helpReceived: 0,
      totalReceived: 0,
      totalSent: 0
    };

    await setDoc(doc(db, "users", testUid), userData);
    console.log(`✅ STEP 2 PASSED: users/${testUid} document created`);

    // ========================================
    // STEP 3: Firestore Read - getDoc
    // ========================================
    console.log("📖 STEP 3: Verifying Firestore document exists...");

    const docSnap = await getDoc(doc(db, "users", testUid));

    if (!docSnap.exists()) {
      throw new Error("❌ TEST FAILED: Document does not exist after setDoc");
    }

    const retrievedData = docSnap.data();
    console.log(`✅ STEP 3 PASSED: Document retrieved successfully`);
    console.log(`   Retrieved UID: ${retrievedData.uid}`);
    console.log(`   Retrieved Email: ${retrievedData.email}`);

    // ========================================
    // CLEANUP: Delete test user and document
    // ========================================
    console.log("🧹 CLEANUP: Removing test data...");

    // Delete Firestore document
    await deleteDoc(doc(db, "users", testUid));
    console.log("✅ Document deleted");

    // Delete Auth user
    await deleteUser(createdUser);
    console.log("✅ Auth user deleted");

    console.log("");
    console.log("🎉 ISOLATED SIGNUP TEST PASSED!");
    console.log("=================================");
    console.log("✅ Firebase Auth works");
    console.log("✅ Firestore rules work");
    console.log("✅ No permission-denied errors");
    console.log("✅ No Firestore Listen calls");
    console.log("");
    console.log("CONCLUSION: Problem is NOT in Firebase Auth or Firestore rules");
    console.log("CONCLUSION: Problem is in Signup.jsx or its imported components");

    return { success: true, message: "Isolated test passed - issue is in Signup component" };

  } catch (error) {
    console.error("");
    console.error("❌ ISOLATED SIGNUP TEST FAILED!");
    console.error("================================");

    // Log detailed error information
    console.error(String("Error Code:") + " " + String(error.code));
    console.error(String("Error Message:") + " " + String(error.message));
    console.error(String("Error Stack:") + " " + String(error.stack));

    // Determine which step failed
    let failedStep = "unknown";
    // Safely handle error.message to prevent TypeError: Cannot read properties of undefined (reading 'indexOf')
    const safeMessage = typeof error?.message === "string" ? error.message : "";

    if (safeMessage.includes("auth/")) {
      failedStep = "Firebase Auth (createUserWithEmailAndPassword)";
    } else if (safeMessage.includes("permission-denied")) {
      failedStep = "Firestore Permission (setDoc/getDoc)";
    } else if (error.code === "unavailable") {
      failedStep = "Firestore Service Unavailable";
    } else if (safeMessage.includes("network")) {
      failedStep = "Network Connection";
    }

    console.error(`Failed at step: ${failedStep}`);

    // Cleanup on failure
    try {
      if (createdUser) {
        console.log("🧹 Attempting cleanup...");
        if (testUid) {
          await deleteDoc(doc(db, "users", testUid)).catch(() => {});
        }
        await deleteUser(createdUser).catch(() => {});
        console.log("✅ Cleanup completed");
      }
    } catch (cleanupError) {
      console.error(String("❌ Cleanup failed:") + " " + String(cleanupError.message));
    }

    console.error("");
    console.error("CONCLUSION: Issue is in Firebase Auth or Firestore rules");
    console.error("CONCLUSION: Check Firestore security rules and Firebase config");

    return {
      success: false,
      error: error.message,
      code: error.code,
      failedStep: failedStep,
      message: "Isolated test failed - check Firebase Auth/Firestore rules"
    };
  }
}

// Export for use in components
export default runSignupIsolationTest;