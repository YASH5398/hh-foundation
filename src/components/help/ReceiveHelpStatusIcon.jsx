import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function ReceiveHelpStatusIcon({ user }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "receiveHelp"),
      where("receiverUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="flex items-center">
      {pendingCount < 3 ? (
        <span
          className="text-yellow-500 text-2xl"
          title="Waiting for helpers"
        >
          🔁
        </span>
      ) : (
        <span
          className="text-green-600 text-2xl"
          title="Helpers Assigned"
        >
          ✅
        </span>
      )}
    </div>
  );
} 