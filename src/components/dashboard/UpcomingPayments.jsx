import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';

const AMOUNTS = {
  Star: 300,
  Silver: 600,
  Gold: 2000,
  Platinum: 20000,
  Diamond: 200000,
};
const fallbackColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-red-500',
];
function getInitial(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}
function getColorForIndex(idx) {
  return fallbackColors[idx % fallbackColors.length];
}

const UpcomingPayments = () => {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [eligibleDownlines, setEligibleDownlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Log currentUser
  useEffect(() => {
    console.log("👤 currentUser:", user);
  }, [user]);

  // Fetch userProfile from Firestore
  useEffect(() => {
    if (!user || !user.uid) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setError('');
    async function fetchProfile() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ ...userDoc.data(), uid: user.uid });
          // 2. Log userProfile from Firestore
          console.log("📄 userProfile from Firestore:", { ...userDoc.data(), uid: user.uid });
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Fetch eligible downlines
  useEffect(() => {
    if (!userProfile || !userProfile.userId) return;
    setLoading(true);
    setError('');
    async function fetchEligibleDownlines() {
      try {
        const q = query(
          collection(db, 'users'),
          where('sponsorId', '==', userProfile.userId),
          where('isActivated', '==', true)
        );
        const snap = await getDocs(q);
        let referrals = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        // 3. Log active referrals
        console.log("👥 Active referrals (downline):", referrals);
        // Sort by referralCount descending
        referrals.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
        // Filter out users who have already sent help
        const filtered = [];
        for (let i = 0; i < referrals.length; i++) {
          const d = referrals[i];
          // Compose sendHelp docId: {receiverId}_{senderId}_{registrationTime}
          const regTime = d.registrationTime && d.registrationTime.seconds ? d.registrationTime.seconds : null;
          if (!d.uid || !regTime) continue; // skip if missing
          const docId = `${userProfile.uid}_${d.uid}_${regTime}`;
          // 4. Log sendHelp docId
          console.log("🔎 Checking sendHelp docId:", docId);
          const sendHelpDoc = await getDoc(doc(db, 'sendHelp', docId));
          // 4. Log if sendHelp exists
          console.log("📄 Does sendHelp exist?", sendHelpDoc.exists());
          if (!sendHelpDoc.exists()) {
            filtered.push(d);
          }
        }
        // 5. Log final eligible users
        console.log("✅ Final eligibleUsers:", filtered);
        setEligibleDownlines(filtered);
      } catch (e) {
        setError('❌ Failed to load referrals.');
      } finally {
        setLoading(false);
      }
    }
    fetchEligibleDownlines();
  }, [userProfile]);

  // UI/UX
  if (authLoading || profileLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <LoadingSpinner size="h-10 w-10" color="border-purple-400" />
        <div className="text-gray-600 mt-2">Loading upcoming payments...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <ErrorMessage message="Unable to load profile. Contact support." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // 6. Log JSX rendering condition
  if (eligibleDownlines.length === 3) {
    console.log("🎉 Showing upcoming payment cards");
  } else {
    console.log("⚠️ Not enough referrals to show upcoming payments");
  }

  // If less than 3 eligible downlines
  if (eligibleDownlines.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 mb-2">You need 3 active referrals to unlock upcoming payments.</div>
      </div>
    );
  }

  // Amount for current user's level
  const amount = userProfile.level && AMOUNTS[userProfile.level] ? AMOUNTS[userProfile.level] : 300;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-10 p-0 m-0 flex flex-col items-center">
      <div className="w-full mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 sm:mb-6 tracking-tight text-center">Upcoming Payments</h2>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="mb-4 text-green-700 font-semibold flex items-center gap-2 text-sm sm:text-base">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>3 users have been assigned to send you <span className="font-bold text-green-800">₹{amount}</span> each</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {eligibleDownlines.slice(0, 3).map((d, idx) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 flex flex-col items-center bg-gradient-to-br from-white via-blue-50 to-purple-50 hover:scale-105 transition-transform duration-200"
                >
                  {d.profileImage ? (
                    <img src={d.profileImage} alt={d.fullName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mb-3 border-2 border-blue-400" />
                  ) : (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold text-white mb-3 ${getColorForIndex(idx)}`}>
                      {getInitial(d.fullName)}
                    </div>
                  )}
                  <div className="text-base sm:text-lg font-bold text-gray-800 mb-1 text-center">{d.fullName}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1 text-center">User ID: <span className="font-mono text-blue-700">{d.userId}</span></div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1 text-center">Phone: <span className="font-semibold text-blue-600">{d.phone}</span></div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1 text-center">WhatsApp: <span className="font-semibold text-green-600">{d.whatsapp}</span></div>
                  <div className="mt-2 mb-1">
                    <span className="inline-block px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold text-center">Assigned to send payment</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingPayments; 