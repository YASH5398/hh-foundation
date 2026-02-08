const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function runTest() {
  const timestamp = Date.now();
  const email = `test_verification_${timestamp}@example.com`;
  const fullName = "Verification Test User";
  const sponsorId = "HHF943461";
  const userId = `HHF${Math.floor(100000 + Math.random() * 900000)}`;

  console.log(`Creating user with email: ${email}`);

  try {
    // 1. Create Auth User
    const userRecord = await auth.createUser({
      email: email,
      password: 'Password123!',
      displayName: fullName
    });

    const uid = userRecord.uid;
    console.log(`Auth user created with UID: ${uid}`);

    // 2. Create Firestore Document (exactly as Signup.jsx does)
    const userData = {
      uid: uid,
      userId: userId,
      fullName,
      email,
      phone: "9000000001",
      whatsapp: "9000000001",
      sponsorId,
      role: "user",
      level: "Star",
      levelStatus: "ACTIVE",
      isActivated: false,
      isBlocked: false,
      isOnHold: false,
      isReceivingHeld: false,
      helpVisibility: true,
      nextLevelPaymentDone: false, // This is level-related!
      referralCount: 0,
      helpReceived: 0,
      totalEarnings: 0,
      totalReceived: 0,
      totalSent: 0,
      totalTeam: 0,
      profileImage: "https://i.ibb.co/vz6V0vD/default-profile.png",
      deviceToken: "",
      paymentMethod: { type: "UPI", upiId: "test@upi" },
      bank: {},
      registrationTime: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(userData);
    console.log(`Firestore document created for UID: ${uid}`);

    // 3. Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Fetch the document and verify
    const docSnap = await db.collection('users').doc(uid).get();
    const data = docSnap.data();

    let results = [];
    results.push('--- VERIFICATION RESULTS ---');
    
    // Check level fields
    const hasLevel = data.level === "Star";
    const hasLevelStatus = data.levelStatus === "ACTIVE";
    results.push(`Requirement 1: Top-level level/levelStatus`);
    results.push(`  - level: "Star" -> ${hasLevel ? "PASS" : "FAIL"} (actual: "${data.level}")`);
    results.push(`  - levelStatus: "ACTIVE" -> ${hasLevelStatus ? "PASS" : "FAIL"} (actual: "${data.levelStatus}")`);

    // Check kycDetails
    const hasKycDetails = 'kycDetails' in data;
    results.push(`Requirement 2: kycDetails field is NOT created`);
    results.push(`  - kycDetails absent -> ${!hasKycDetails ? "PASS" : "FAIL"}`);

    // Check any other level-related fields
    const keys = Object.keys(data);
    const otherLevelFields = keys.filter(key => 
      (key.toLowerCase().includes('level')) && key !== 'level' && key !== 'levelStatus'
    );
    
    results.push(`Requirement 3: No other level-related fields`);
    if (otherLevelFields.length === 0) {
      results.push(`  - Result: PASS`);
    } else {
      results.push(`  - Result: FAIL`);
      results.push(`  - Found: ${JSON.stringify(otherLevelFields)}`);
    }

    const overallPass = hasLevel && hasLevelStatus && !hasKycDetails && otherLevelFields.length === 0;
    results.push(`\nOVERALL STATUS: ${overallPass ? "PASS" : "FAIL"}`);

    console.log(results.join('\n'));

    // Cleanup
    await db.collection('users').doc(uid).delete();
    await auth.deleteUser(uid);
    console.log('Cleanup: Test user deleted.');

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    process.exit();
  }
}

runTest();
