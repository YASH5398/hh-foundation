import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "react-hot-toast";

export const approveEpinRequest = async (requestId, adminInfo) => {
  try {
    // Validate admin info
    if (!adminInfo?.uid || !adminInfo?.name || !adminInfo?.email) {
      toast.error("❌ Invalid admin info. Please re-login or contact dev.");
      return;
    }

    // Prepare payload
    const payload = {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: {
        uid: adminInfo.uid,
        name: adminInfo.name,
        email: adminInfo.email,
      },
    };

    // Update Firestore
    const ref = doc(db, "epinRequests", requestId);
    await updateDoc(ref, payload);

    toast.success("✅ E-PIN request approved successfully!");
  } catch (err) {
    console.error("🔥 Firestore update failed", err);
    toast.error("❌ Failed to approve E-PIN request. Check console.");
  }
}; 