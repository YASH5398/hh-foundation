const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

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
            nextLevelPaymentDone: false,
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

        // 3. Wait for triggers to potentially run (though we didn't find any that add kycDetails)
        console.log('Waiting 5 seconds for triggers...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Fetch the document and verify
        const docSnap = await db.collection('users').doc(uid).get();
        const data = docSnap.data();

        console.log('\n--- VERIFICATION RESULTS ---');

        // Check level fields
        const hasLevel = data.level === "Star";
        const hasLevelStatus = data.levelStatus === "ACTIVE";
        console.log(`1) level: "Star" -> ${hasLevel ? "PASS" : "FAIL"} (${data.level})`);
        console.log(`1) levelStatus: "ACTIVE" -> ${hasLevelStatus ? "PASS" : "FAIL"} (${data.levelStatus})`);

        // Check kycDetails
        const hasKycDetails = 'kycDetails' in data;
        console.log(`2) kycDetails NOT created -> ${!hasKycDetails ? "PASS" : "FAIL"}`);
        if (hasKycDetails) {
            console.log('   kycDetails content:', data.kycDetails);
        }

        // Check any other level-related fields
        const levelRelatedFields = Object.keys(data).filter(key =>
            key.toLowerCase().includes('level') && key !== 'level' && key !== 'levelStatus'
        );
        console.log(`3) No other level-related fields -> ${levelRelatedFields.length === 0 ? "PASS" : "FAIL"}`);
        if (levelRelatedFields.length > 0) {
            console.log('   Other level-related fields found:', levelRelatedFields);
        }

        const overallPass = hasLevel && hasLevelStatus && !hasKycDetails && levelRelatedFields.length === 0;
        console.log(`\nOVERALL RESULT: ${overallPass ? "PASS" : "FAIL"}`);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

runTest();
