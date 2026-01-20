import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export async function testSignupFlow() {
  const email = `test_${Date.now()}@test.com`;
  const password = "Test@123456";

  console.log("TEST: Creating auth user");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  console.log("TEST: Creating users document");
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    createdAt: new Date()
  });

  console.log("TEST: Verifying document");
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("TEST FAILED: users document not created");
  }

  console.log("✅ TEST PASSED: Signup flow works correctly");
}
