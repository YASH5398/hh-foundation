import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const getRank = (level) => {
  switch (level) {
    case 1:
      return "Star";
    case 2:
      return "Silver";
    case 3:
      return "Gold";
    case 4:
      return "Platinum";
    case 5:
      return "Diamond";
    default:
      return "Unknown";
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return {
        uid: user.uid,
        userId: userData.userId,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        level: userData.level,
        rank: getRank(userData.level),
        role: userData.role || 'user', // Include role field
        epins: userData.epins,
        paymentMethod: userData.paymentMethod,
        JoinedDate: userData.JoinedDate, // Retrieve JoinedDate
      };
    } else {
      throw new Error("User data not found in Firestore.");
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};