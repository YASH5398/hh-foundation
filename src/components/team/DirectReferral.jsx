import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function DashboardCards() {
  const { user: currentUser } = useAuth();

  // State for each metric
  const [totalSentHelp, setTotalSentHelp] = useState(0);
  const [receivedAutoPool, setReceivedAutoPool] = useState(0);
  const [receivedSponsor, setReceivedSponsor] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [directMembers, setDirectMembers] = useState(0);
  const [totalTeam, setTotalTeam] = useState(0);
  const [pendingHelps, setPendingHelps] = useState(0);
  const [availableEpins, setAvailableEpins] = useState(0);
  const [upcomingPayment, setUpcomingPayment] = useState(0);

  useEffect(() => {
    if (!currentUser?.userId) return;

    // Total Sent Help
    const sentHelpQ = query(collection(db, "sendHelp"), where("senderId", "==", currentUser.userId));
    const unsubSentHelp = onSnapshot(sentHelpQ, snap => setTotalSentHelp(snap.size));

    // Received (AutoPool)
    const autoPoolQ = query(
      collection(db, "receiveHelp"),
      where("receiverId", "==", currentUser.userId),
      where("isSponsorHelp", "==", false)
    );
    const unsubAutoPool = onSnapshot(autoPoolQ, snap => setReceivedAutoPool(snap.size));

    // Received (Sponsor)
    const sponsorQ = query(
      collection(db, "receiveHelp"),
      where("receiverId", "==", currentUser.userId),
      where("isSponsorHelp", "==", true)
    );
    const unsubSponsor = onSnapshot(sponsorQ, snap => setReceivedSponsor(snap.size));

    // Total Earnings (sum of confirmed received helps)
    const earningsQ = query(
      collection(db, "receiveHelp"),
      where("receiverId", "==", currentUser.userId),
      where("status", "==", "confirmed")
    );
    const unsubEarnings = onSnapshot(earningsQ, snap => {
      let sum = 0;
      snap.forEach(doc => {
        const data = doc.data();
        sum += Number(data.amount) || 0;
      });
      setTotalEarnings(sum);
    });

    // Pending Helps
    const pendingQ = query(
      collection(db, "receiveHelp"),
      where("receiverId", "==", currentUser.userId),
      where("status", "==", "pending")
    );
    const unsubPending = onSnapshot(pendingQ, snap => setPendingHelps(snap.size));

    // Direct Members
    const directQ = query(collection(db, "users"), where("sponsorId", "==", currentUser.userId));
    const unsubDirect = onSnapshot(directQ, snap => setDirectMembers(snap.size));

    // Available E-PINs
    setAvailableEpins(Array.isArray(currentUser?.epins) ? currentUser.epins.filter(e => e.isUsed === false).length : 0);

    // Total Team
    setTotalTeam(Array.isArray(currentUser?.referredUsers) ? currentUser.referredUsers.length : 0);

    // Upcoming Payment (count of users at your level with higher referral count)
    async function fetchUpcomingPayment() {
      if (!currentUser?.level || typeof currentUser.referralCount !== "number") {
        setUpcomingPayment(0);
        return;
      }
      const q = query(
        collection(db, "users"),
        where("level", "==", currentUser.level),
        where("isActivated", "==", true)
      );
      const snap = await getDocs(q);
      const higher = snap.docs.filter(doc => (doc.data().referralCount || 0) > currentUser.referralCount);
      setUpcomingPayment(higher.length);
    }
    fetchUpcomingPayment();

    // Cleanup
    return () => {
      unsubSentHelp();
      unsubAutoPool();
      unsubSponsor();
      unsubEarnings();
      unsubPending();
      unsubDirect();
    };
  }, [currentUser]);

  // Render your cards here using the state variables above
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <DashboardCard title="Total Sent Help" value={totalSentHelp} color="red" />
      <DashboardCard title="Received (AutoPool)" value={receivedAutoPool} color="purple" />
      <DashboardCard title="Received (Sponsor)" value={receivedSponsor} color="indigo" />
      <DashboardCard title="Total Earnings" value={`₹${totalEarnings}`} color="green" />
      <DashboardCard title="Direct Members" value={directMembers} color="blue" />
      <DashboardCard title="Total Team" value={totalTeam} color="teal" />
      <DashboardCard title="Pending Helps" value={pendingHelps} color="orange" />
      <DashboardCard title="Available E-PINs" value={availableEpins} color="yellow" />
      <DashboardCard title="Upcoming Payment" value={upcomingPayment} color="blue" />
      </div>
    );
  }

// Example DashboardCard component
function DashboardCard({ title, value, color }) {
  const colorMap = {
    red: "from-red-500 via-red-400 to-pink-600",
    purple: "from-purple-500 via-pink-500 to-purple-700",
    indigo: "from-purple-700 via-purple-500 to-pink-500",
    green: "from-green-500 via-green-400 to-green-700",
    blue: "from-blue-500 via-blue-400 to-indigo-600",
    teal: "from-green-500 via-green-400 to-green-700",
    orange: "from-orange-500 via-yellow-400 to-yellow-600",
    yellow: "from-yellow-600 via-yellow-400 to-orange-500"
  };
  return (
    <div className={`rounded-xl shadow-lg px-6 py-6 text-center font-bold text-lg bg-gradient-to-br ${colorMap[color]} text-white border-2 border-white`}>
      <div className="text-2xl mb-2">{title}</div>
      <div className="text-4xl font-extrabold">{value}</div>
    </div>
  );
}