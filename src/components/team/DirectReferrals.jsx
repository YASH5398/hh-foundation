import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../config/firebase";

const gradientCard = "rounded-xl shadow-lg px-6 py-6 text-center text-white font-bold text-lg bg-gradient-to-br border-2 border-white hover:scale-105 transition-transform duration-200";
const gradients = [
  "from-blue-600 via-blue-400 to-indigo-600",
  "from-green-500 via-green-400 to-green-700",
  "from-yellow-400 via-yellow-500 to-yellow-600",
  "from-red-500 via-pink-500 to-pink-600"
];

export default function DirectReferrals() {
  const { user, loading: authLoading } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setReferrals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    async function fetchReferrals() {
      try {
        // Force token refresh before query
        await auth.currentUser.getIdToken(true);

        const q = query(
          collection(db, "users"),
          where("sponsorId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setReferrals(items);
      } catch (e) {
        setError("❌ Failed to load direct referrals.");
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [user?.uid]);

  // Stats
  const total = referrals.length;
  const active = referrals.filter(r => r.isActivated).length;
  const blocked = referrals.filter(r => r.isBlocked).length;
  const pending = referrals.filter(r => !r.isActivated && !r.isBlocked).length;

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-10 h-10 border-4 border-purple-300 border-t-transparent rounded-full animate-spin mb-2"></div>
        <div className="text-gray-600 mt-2">Loading...</div>
      </div>
    );
  }

  if (!user?.uid) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10 px-2 flex flex-col items-center">
      <div className="max-w-5xl w-full mx-auto mb-8">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Direct Referrals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className={`${gradientCard} ${gradients[0]}`}>Total Referrals<br /><span className="text-3xl font-extrabold text-white">{total}</span></div>
          <div className={`${gradientCard} ${gradients[1]}`}>Active Referrals<br /><span className="text-3xl font-extrabold text-white">{active}</span></div>
          <div className={`${gradientCard} ${gradients[2]}`}>Pending Referrals<br /><span className="text-3xl font-extrabold text-white">{pending}</span></div>
          <div className={`${gradientCard} ${gradients[3]}`}>User Blocked<br /><span className="text-3xl font-extrabold text-white">{blocked}</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">My Direct Referrals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">SR. NO</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">NAME</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">USER ID</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">PHONE NO</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase">ACTIVE</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase">INACTIVE</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-800 font-bold">No direct referrals found.</td>
                  </tr>
                ) : (
                  referrals.map((r, idx) => (
                    <tr key={r.id} className="border-b last:border-0 text-gray-800">
                      <td className="px-4 py-2">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded font-semibold tracking-wide inline-block">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.fullName}</td>
                      <td className="px-4 py-2 font-mono text-blue-700">{r.userId}</td>
                      <td className="px-4 py-2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded font-semibold tracking-wide inline-block">
                          {r.phone}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {r.isActivated ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full" aria-label="Active">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {!r.isActivated ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full" aria-label="Inactive">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" /></svg>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}