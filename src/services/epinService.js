import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "react-hot-toast";

export const approveEpinRequest = async (requestId, adminInfo) => {
  try {
    // Validate admin info (uid, fullName, email)
    if (!adminInfo?.uid || !adminInfo?.fullName || !adminInfo?.email) {
      toast.error("❌ Invalid admin info. Please re-login or contact dev.");
      return;
    }

    // Prepare payload
    const payload = {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: {
        uid: adminInfo.uid,
        fullName: adminInfo.fullName,
        email: adminInfo.email
      }
    };

    // Update Firestore
    const ref = doc(db, "epinRequests", requestId);
    await updateDoc(ref, payload);

    toast.success("✅ E-PIN request approved successfully!");
  } catch (err) {
    console.error(String("🔥 Firestore update failed") + " " + String(err));
    toast.error("❌ Failed to approve E-PIN request. Check console.");
  }
};