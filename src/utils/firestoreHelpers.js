import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export async function fetchLeaderboard(limitCount = 100) {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  let usersList = userSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  usersList.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
  if (limitCount && usersList.length > limitCount) {
    usersList = usersList.slice(0, limitCount);
  }
  return usersList;
} 