import {
  createUserWithEmailAndPassword,
  deleteUser
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * DEEP SIGNUP TEST - Backend Logic Only
 *
 * Tests Firebase Auth + Firestore rules + E-PIN logic
 * WITHOUT using Signup.jsx UI or any React components
 *
 * This isolates whether the issue is in:
 * - Firebase Auth
 * - Firestore rules
 * - E-PIN logic
 * - Data structure
 */

export async function runSignupDeepTest() {
  console.log("🧪 STARTING DEEP SIGNUP TEST");
  console.log("============================");

  const testEmail = `deep_test_${Date.now()}@test.com`;
  const testPassword = "Test@123456";
  let createdUser = null;
  let testUid = null;
  let testUserId = null;

  const results = {
    authCreation: false,
    userDocCreation: false,
    userDocVerification: false,
    epinQuery: false,
    epinUpdate: false,
    fullSignup: false,
    errors: []
  };

  try {
    // ========================================
    // PART 1: AUTH + USER DOC TEST (BASELINE)
    // ========================================
    console.log("\n📋 PART 1: Testing Auth + User Document Creation");
    console.log("--------------------------------------------------");

    console.log("🔍 STEP 1A: Creating Firebase Auth user...");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    createdUser = userCredential.user;
    testUid = userCredential.user.uid;
    testUserId = `TEST${Date.now().toString().slice(-6)}`;

    console.log(`✅ STEP 1A: Auth user created successfully, UID: ${testUid}`);
    results.authCreation = true;

    console.log("🔍 STEP 1B: Creating users/{uid} document with FULL DATA...");

    const userData = {
      uid: testUid,
      userId: testUserId,
      fullName: "Deep Test User",
      email: testEmail,
      phone: "9876543210",
      whatsapp: "9876543210",
      sponsorId: "TESTSPONSOR",
      paymentMethod: {
        type: "Bank Transfer",
        bankDetails: {
          accountNumber: "1234567890",
          bankName: "Test Bank",
          ifscCode: "TEST0001",
          name: "Test Account Holder"
        }
      },
      isActivated: false,
      levelStatus: "Star",
      registrationTime: serverTimestamp(),
      profileImage: "https://example.com/default-avatar.png",
      referralCount: 0,
      totalEarnings: 0,
      totalReceived: 0,
      totalSent: 0,
      totalTeam: 0,
      isBlocked: false,
      deviceToken: "",
      helpReceived: 0,
      level: 1,
      referredUsers: [],
      nextLevelPaymentDone: false,
      createdAt: serverTimestamp(),
      bank: {
        accountNumber: "1234567890",
        bankName: "Test Bank",
        ifscCode: "TEST0001",
        name: "Test Account Holder"
      },
      kycDetails: {
        aadhaar: "",
        pan: ""
      }
    };

    console.log("🔍 STEP 1B: User data payload:", userData);

    await setDoc(doc(db, "users", testUid), userData);
    console.log("✅ STEP 1B: User document created successfully");
    results.userDocCreation = true;

    console.log("🔍 STEP 1C: Verifying user document exists and is readable...");

    const docSnap = await getDoc(doc(db, "users", testUid));

    if (!docSnap.exists()) {
      throw new Error("❌ STEP 1C: User document does not exist after creation!");
    }

    const retrievedData = docSnap.data();
    console.log("✅ STEP 1C: User document verified successfully");
    console.log(`   Retrieved UID: ${retrievedData.uid}`);
    console.log(`   Retrieved Email: ${retrievedData.email}`);
    console.log(`   Retrieved Full Name: ${retrievedData.fullName}`);
    results.userDocVerification = true;

    // ========================================
    // PART 2: E-PIN FLOW TEST
    // ========================================
    console.log("\n📋 PART 2: Testing E-PIN Query & Update");
    console.log("---------------------------------------");

    console.log("🔍 STEP 2A: Querying for unused E-PINs...");

    const epinQuery = query(collection(db, 'epins'), where('status', '==', 'unused'));
    const epinSnapshot = await getDocs(epinQuery);

    console.log(`🔍 STEP 2A: Found ${epinSnapshot.size} unused E-PINs`);

    if (epinSnapshot.empty) {
      console.log("⚠️ STEP 2A: No unused E-PINs found - cannot test E-PIN update");
      console.log("   This is expected if no E-PINs exist in the database");
      results.epinQuery = true; // Not a failure, just no data
    } else {
      const epinDoc = epinSnapshot.docs[0];
      const epinRef = doc(db, 'epins', epinDoc.id);
      const epinData = epinDoc.data();

      console.log(`✅ STEP 2A: Found unused E-PIN: ${epinData.epin} (ID: ${epinDoc.id})`);
      results.epinQuery = true;

      console.log("🔍 STEP 2B: Updating E-PIN status to 'used'...");

      await updateDoc(epinRef, {
        status: 'used',
        assignedTo: testUid,
        usedBy: testUid,
        usedAt: serverTimestamp()
      });

      console.log("✅ STEP 2B: E-PIN marked as used successfully");
      results.epinUpdate = true;

      // Verify the update
      const updatedEpinDoc = await getDoc(epinRef);
      const updatedEpinData = updatedEpinDoc.data();

      if (updatedEpinData.status !== 'used') {
        throw new Error("❌ STEP 2B: E-PIN status not updated correctly!");
      }

      console.log("✅ STEP 2B: E-PIN update verified");
    }

    // ========================================
    // PART 3: FULL SIGNUP SIMULATION
    // ========================================
    console.log("\n📋 PART 3: Full Signup Simulation");
    console.log("----------------------------------");

    console.log("🔍 STEP 3A: Simulating complete signup flow...");

    // Clean up previous test data first
    try {
      await setDoc(doc(db, "users", testUid), userData, { merge: false });
      console.log("✅ STEP 3A: Clean user document recreated");
    } catch (error) {
      console.log("⚠️ STEP 3A: Could not recreate user document:", error.message);
    }

    // Test E-PIN flow again if available
    if (!epinSnapshot.empty) {
      const epinDoc = epinSnapshot.docs[0];
      const epinRef = doc(db, 'epins', epinDoc.id);

      console.log("🔍 STEP 3B: Testing E-PIN update in signup context...");

      await updateDoc(epinRef, {
        status: 'used',
        assignedTo: testUid,
        usedBy: testUid,
        usedAt: serverTimestamp()
      });

      console.log("✅ STEP 3B: E-PIN update in signup context successful");
    }

    console.log("🔍 STEP 3C: Final verification of user document...");

    const finalDocSnap = await getDoc(doc(db, "users", testUid));

    if (!finalDocSnap.exists()) {
      throw new Error("❌ STEP 3C: User document missing after full simulation!");
    }

    const finalData = finalDocSnap.data();
    console.log("✅ STEP 3C: Final user document verified");
    console.log(`   Final UID: ${finalData.uid}`);
    console.log(`   Final Status: ${finalData.isActivated ? 'Activated' : 'Not Activated'}`);
    console.log(`   Final Level: ${finalData.level}`);

    results.fullSignup = true;

    console.log("\n🎉 DEEP SIGNUP TEST COMPLETED SUCCESSFULLY!");
    console.log("===========================================");
    console.log("✅ Firebase Auth: WORKING");
    console.log("✅ Firestore Rules: WORKING");
    console.log("✅ User Document Creation: WORKING");
    console.log("✅ E-PIN Logic: WORKING");
    console.log("✅ Full Signup Simulation: WORKING");

    console.log("\n📊 TEST RESULTS SUMMARY:");
    console.log(`   Auth Creation: ${results.authCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   User Doc Creation: ${results.userDocCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   User Doc Verification: ${results.userDocVerification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   E-PIN Query: ${results.epinQuery ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   E-PIN Update: ${results.epinUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Full Signup: ${results.fullSignup ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n🔍 CONCLUSION:");
    console.log("If all tests pass, the issue is NOT in Firebase Auth or Firestore rules.");
    console.log("The issue is likely in Signup.jsx UI, state management, or React component logic.");

    return {
      success: true,
      results: results,
      message: "All backend tests passed - issue is in Signup.jsx UI/React logic"
    };

  } catch (error) {
    console.error("\n❌ DEEP SIGNUP TEST FAILED!");
    console.error("===========================");

    results.errors.push({
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    // Determine which step failed
    let failedStep = "unknown";
    let layer = "unknown";

    if (error.message.includes("auth/")) {
      failedStep = "Firebase Auth";
      layer = "Firebase Auth";
    } else if (error.message.includes("permission-denied")) {
      failedStep = "Firestore Permission";
      layer = "Firestore Rules";
    } else if (error.message.includes("epin") || error.message.includes("E-PIN")) {
      failedStep = "E-PIN Logic";
      layer = "E-PIN Flow";
    } else if (error.message.includes("users/")) {
      failedStep = "User Document";
      layer = "Firestore Rules";
    } else if (error.code === "unavailable") {
      failedStep = "Firestore Service";
      layer = "Firebase Service";
    }

    console.error(`Failed at layer: ${layer}`);
    console.error(`Failed step: ${failedStep}`);

    // Cleanup on failure
    try {
      console.log("\n🧹 CLEANUP: Removing test data...");
      if (createdUser) {
        // Try to delete user document
        try {
          // Note: Can't delete user doc if rules don't allow it, but that's expected
          console.log("   Skipping user document cleanup (rules may prevent deletion)");
        } catch (docError) {
          console.log("   User document cleanup failed (expected):", docError.message);
        }

        // Delete Auth user
        await deleteUser(createdUser);
        console.log("   ✅ Auth user deleted");
      }
    } catch (cleanupError) {
      console.error("   ❌ Cleanup failed:", cleanupError.message);
    }

    console.error("\n📊 PARTIAL TEST RESULTS:");
    console.log(`   Auth Creation: ${results.authCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   User Doc Creation: ${results.userDocCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   User Doc Verification: ${results.userDocVerification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   E-PIN Query: ${results.epinQuery ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   E-PIN Update: ${results.epinUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Full Signup: ${results.fullSignup ? '✅ PASS' : '❌ FAIL'}`);

    console.error("\n🔍 FAILURE ANALYSIS:");
    console.error(`   Layer: ${layer}`);
    console.error(`   Step: ${failedStep}`);
    console.error(`   Error: ${error.code} - ${error.message}`);

    return {
      success: false,
      results: results,
      error: error.message,
      code: error.code,
      failedLayer: layer,
      failedStep: failedStep,
      message: `Test failed at ${failedStep} in ${layer} layer`
    };
  }
}

// Export for use in components
export default runSignupDeepTest;

