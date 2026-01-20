<<<<<<< HEAD
import React from 'react';
import { motion } from 'framer-motion';
import PaymentJourneyMotion from '../common/PaymentJourneyMotion';
import { useAuth } from '../../context/AuthContext';

const UpcomingPayments = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-4">
            Your Upcoming Payments
          </h1>
          <p className="text-lg text-gray-600">
            Here's what you can earn at each level
          </p>
        </motion.div>

        {/* Star Level - ALWAYS VISIBLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">⭐</div>
            <h2 className="text-2xl font-bold text-yellow-600">Star Level</h2>
            <span className="ml-auto text-lg font-semibold text-green-600">₹900</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
                className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-4 text-center border-2 border-yellow-200"
              >
                <div className="text-2xl font-bold text-yellow-800">₹300</div>
                <div className="text-sm text-yellow-600">User {i + 1}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center text-gray-600">
            <div className="font-semibold">3 users × ₹300 = ₹900</div>
            <div className="text-sm mt-1">This is your starting point</div>
          </div>
        </motion.div>

        {/* Higher Levels Preview */}
        <div className="space-y-4">
          {[
            { level: 'Silver', icon: '🥈', amount: 5400, users: 9, perUser: 600, color: 'from-gray-100 to-gray-200', border: 'border-gray-300' },
            { level: 'Gold', icon: '🥇', amount: 54000, users: 27, perUser: 2000, color: 'from-yellow-100 to-yellow-200', border: 'border-yellow-300' },
            { level: 'Platinum', icon: '💎', amount: 1620000, users: 81, perUser: 20000, color: 'from-slate-100 to-slate-200', border: 'border-slate-300' },
            { level: 'Diamond', icon: '👑', amount: 486000000, users: 243, perUser: 200000, color: 'from-blue-100 to-purple-200', border: 'border-blue-300' }
          ].map((levelData, index) => (
            <motion.div
              key={levelData.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.3 }}
              className={`rounded-xl shadow-md border-2 ${levelData.border} p-6 bg-gradient-to-r ${levelData.color} opacity-75`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{levelData.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{levelData.level} Level</h3>
                    <div className="text-sm text-gray-600">
                      {levelData.users} users × ₹{levelData.perUser.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ₹{levelData.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Journey Video Icon */}
        <div className="mt-8 text-center">
          <PaymentJourneyMotion mode="icon" user={user} />
=======
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
          if (!d.uid) continue; // skip if missing

          // Query for sendHelp documents where current user is receiver and downline is sender
          // Use query instead of direct doc lookup since timestamp is unpredictable
          const sendHelpQuery = query(
            collection(db, 'sendHelp'),
            where('receiverId', '==', userProfile.uid),
            where('senderId', '==', d.uid)
          );

          console.log("🔎 Checking for sendHelp from", d.uid, "to", userProfile.uid);
          const sendHelpSnapshot = await getDocs(sendHelpQuery);

          // Include downline if no sendHelp documents exist (they haven't sent help yet)
          if (sendHelpSnapshot.empty) {
            console.log("📄 No sendHelp found for", d.uid, "- including in upcoming payments");
            filtered.push(d);
          } else {
            console.log("📄 Found existing sendHelp for", d.uid, "- excluding from upcoming payments");
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        </div>
      </div>
    </div>
  );
};

export default UpcomingPayments; 