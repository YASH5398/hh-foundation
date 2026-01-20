import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import UserStatusBox from './UserStatusBox';
import DashboardProfileCard, { DashboardProfileCardSkeleton } from './DashboardProfileCard';
import TopReferrers from './TopReferrers';
import NewsTicker from '../common/NewsTicker';
import PersonalizedTicker from '../common/PersonalizedTicker';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import SkeletonBox from '../common/SkeletonBox';
import { Send, Twitter, Facebook, Instagram } from 'lucide-react';
import CountUp from 'react-countup';
import { HELP_STATUS } from '../../config/helpStatus';
import { authGuardService } from '../../services/authGuardService';
import { firestoreQueryService } from '../../services/firestoreQueryService';

// Icons
import { FiSend, FiDownload, FiUsers, FiCreditCard, FiArrowUpCircle, FiDollarSign, FiCopy, FiCheck, FiShare2, FiCalendar, FiClock } from 'react-icons/fi';

const SOCIALS = [
  {
    name: 'Telegram',
    icon: Send, // Use Send as a Telegram-like icon
    color: '#0088cc',
    url: 'https://t.me/yourchannel',
    tooltip: 'Follow us on Telegram',
  },
  {
    name: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    url: 'https://twitter.com/yourhandle',
    tooltip: 'Follow us on Twitter',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F3',
    url: 'https://facebook.com/yourpage',
    tooltip: 'Follow us on Facebook',
  },
  {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    url: 'https://instagram.com/yourprofile',
    tooltip: 'Follow us on Instagram',
  },
];

const SocialMediaBar = () => (
  <footer className="w-full mt-8 sm:mt-12">
    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 py-4 sm:py-6 bg-white/80 border-t border-gray-200">
      {SOCIALS.map(({ name, icon: Icon, color, url, tooltip }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center"
          aria-label={tooltip}
        >
          <Icon
            className="transition-transform duration-200 group-hover:scale-125"
            size={24}
            style={{ color }}
          />
          <span className="absolute bottom-[-2rem] sm:bottom-[-2.2rem] left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg transition-transform duration-200 z-50 pointer-events-none">
            {tooltip}
          </span>
        </a>
      ))}
    </div>
  </footer>
);

const ReferralLink = ({ userProfile }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const referralLink = userProfile?.referralLink || `${window.location.origin}/register?ref=${userProfile?.userId || ''}`;

  useEffect(() => {
    if (userProfile) {
      setIsLoading(false);
    }
  }, [userProfile]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy!');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-6 w-full mb-4">
        <div className="flex items-center justify-start mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
            <FiShare2 className="text-blue-500 mr-2 text-base sm:text-lg" />
            Your Referral Link
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-grow h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-24 h-12 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-6 w-full mb-4">
      <div className="flex items-center justify-start mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
          <FiShare2 className="text-blue-500 mr-2 text-base sm:text-lg" />
          Your Referral Link
        </h2>
      </div>
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-grow px-4 py-3 border border-blue-200 rounded-lg bg-white text-gray-700 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
        <button
          onClick={copyToClipboard}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-base"
        >
          {copySuccess ? (
            <>
              <FiCheck className="text-base" />
              <span className="text-sm font-medium">Copied</span>
            </>
          ) : (
            <>
              <FiCopy className="text-base" />
              <span className="text-sm font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

function TickerSection() {
  const [enabled, setEnabled] = React.useState(true);
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    let unsubscribers = [];

    const setupListeners = async () => {
      // Check authentication before setting up listeners
      if (!authGuardService.isAuthenticated()) {
        console.warn('User not authenticated, disabling ticker');
        setLoading(false);
        setEnabled(false);
        return;
      }

      if (!user?.uid) {
        setLoading(false);
        setEnabled(false);
        return;
      }

      try {
        console.log('Setting up ticker listeners');

        // Safe listener for app settings
        const settingsUnsubscribe = firestoreQueryService.setupSafeListener(
          'appSettings',
          [['__name__', '==', 'tickerStatus']],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching ticker settings:', error);
              setEnabled(true); // Default to enabled on error
              return;
            }
            
            if (documents.length > 0) {
              setEnabled(documents[0].enabled !== false);
            } else {
              setEnabled(true); // Default to enabled if document doesn't exist
            }
          }
        );
        unsubscribers.push(settingsUnsubscribe);

        // Safe listener for user data
        const userUnsubscribe = firestoreQueryService.setupSafeListener(
          'users',
          [['__name__', '==', user.uid]],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching user data for ticker:', error);
              setFullName('');
            } else if (documents.length > 0) {
              setFullName(documents[0].fullName || '');
            } else {
              setFullName('');
            }
            setLoading(false);
          }
        );
        unsubscribers.push(userUnsubscribe);

      } catch (error) {
        console.error('Failed to setup ticker listeners:', error);
        setEnabled(true);
        setFullName('');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      console.log('Cleaning up ticker listeners');
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error cleaning up ticker listener:', error);
        }
      });
    };
  }, [user]);

  if (!enabled || loading || !fullName) return null;

  const tickerText = `🎉 Welcome ${fullName}! 🚀 Welcome to the Most Trusted 5-Level Helping Plan! 🌟 Start your journey with just ₹300 and unlock unlimited earning opportunities! 💰 Receive help from real people, upgrade levels, and become financially free! 💎 Together, we grow, together, we rise. Jai Shri Krishna 🙏`;

  return (
    <div className="w-full mt-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#e0f7fa] via-[#fce4ec] to-[#f3e5f5] h-10 px-4 rounded-md shadow-sm flex items-center leading-none">
        <div className="w-full h-full">
          <div className="animate-marquee text-[#222] font-medium text-sm md:text-base whitespace-nowrap overflow-hidden leading-none">
            {tickerText}
            <span className="mx-8 opacity-40">•</span>
            {tickerText}
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardHome = () => {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [localUserProfile, setLocalUserProfile] = useState(null);
  const [stats, setStats] = useState({
    totalSentAmount: 0,
    totalReceivedAutopool: 0,
    totalReceivedSponsor: 0,
    totalEarnings: 0,
    directReferrals: 0,
    totalTeam: 0,
    pendingHelps: 0,
    availableEpins: 0,
    upcomingPayment: 0
  });
  const [error, setError] = useState(null);
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

  // CRITICAL: Check authentication before any Firebase operations
  useEffect(() => {
    if (!authGuardService.isAuthenticated()) {
      console.warn('DashboardHome: User not authenticated');
      setError('Please log in to access your dashboard.');
      return;
    }
  }, []);

  // Debug logging for component lifecycle
  console.log('🚀 DashboardHome component rendered');
  console.log('🔐 Auth state:', { user, loading, authenticated: authGuardService.isAuthenticated() });
  console.log('📊 Component state:', { userProfile, error });

  // Test mode - set to true to use fixed UID for testing
  const TEST_MODE = false;
  const TEST_UID = '78IdmRfawILxgEU4pMpS';

  // Utility function to test Firestore connection
  const testFirestoreConnection = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.log('❌ No user ID available for testing');
        return;
      }

      console.log('🧪 Testing Firestore connection for UID:', userId);
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log('✅ Firestore test successful:', userData);
        return userData;
      } else {
        console.log('❌ User document not found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Firestore test failed:', error);
      return null;
    }
  };

  // Get the UID to use (either from auth, test mode, or fallback)
  const getUserId = () => {
    if (TEST_MODE) return TEST_UID;
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    if (user?.uid) return user.uid;
    return null;
  };

  // Fetch user profile from Firestore
  useEffect(() => {
    let unsubscribe = () => {};

    const setupListener = async () => {
      // Check authentication before setting up listener
      if (!authGuardService.isAuthenticated()) {
        console.warn('User not authenticated, cannot fetch user profile');
        setError('Please log in to access your dashboard.');
        return;
      }

      const userId = getUserId();
      if (!userId) {
        console.warn('No user ID available');
        setError('User ID not available. Please try logging in again.');
        return;
      }

      try {
        console.log('Setting up user profile listener for:', userId);
        
        // Use safe listener from firestoreQueryService
        unsubscribe = firestoreQueryService.setupSafeListener(
          'users',
          [['__name__', '==', userId]], // Query by document ID
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching user profile:', error);
              setError('Failed to load user profile. Please try refreshing the page.');
              return;
            }

            if (documents.length > 0) {
              const userProfile = documents[0];
              console.log('User profile loaded:', userProfile);
              setUserProfile({ ...userProfile, uid: userId });
              setLocalUserProfile({ ...userProfile, uid: userId });
              setStats(prev => ({
                ...prev,
                totalTeam: userProfile.totalTeam || 0
              }));
              setError(null);
            } else {
              console.warn('User profile document not found');
              setUserProfile(null);
              setLocalUserProfile(null);
              setError('User profile not found. Please contact support.');
            }
          }
        );

      } catch (error) {
        console.error('Failed to setup user profile listener:', error);
        setError('Failed to setup user profile listener. Please try refreshing the page.');
      }
    };

    setupListener();

    return () => {
      console.log('Cleaning up user profile listener');
      unsubscribe();
    };
  }, [user?.uid]);

  // Real-time Firestore listeners for dashboard stats (only for user-owned data)
  useEffect(() => {
    let unsubscribers = [];

    const setupListeners = async () => {
      // Check authentication before setting up listeners
      if (!authGuardService.isAuthenticated()) {
        console.warn('User not authenticated, cannot setup stats listeners');
        return;
      }

      if (!userProfile || !userProfile.uid) {
        console.log('User profile not available, skipping stats listeners setup');
        return;
      }

      try {
        console.log('Setting up stats listeners for user:', userProfile.uid);

        // 1. Total Sent Help
        const sentHelpUnsubscribe = firestoreQueryService.setupSafeListener(
          'sendHelp',
          [['senderUid', '==', userProfile.uid]],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching sent help:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              total += Number(doc.amount) || 0;
            });
            setStats(prev => ({ ...prev, totalSentAmount: total }));
          }
        );
        unsubscribers.push(sentHelpUnsubscribe);

        // 2. Received (AutoPool)
        const receivedAutoPoolUnsubscribe = firestoreQueryService.setupSafeListener(
          'receiveHelp',
          [['receiverUid', '==', userProfile.uid], ['source', '==', 'autopool']],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching received autopool:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              total += Number(doc.amount) || 0;
            });
            setStats(prev => ({ ...prev, totalReceivedAutopool: total }));
          }
        );
        unsubscribers.push(receivedAutoPoolUnsubscribe);

        // 3. Received (Sponsor)
        const receivedSponsorUnsubscribe = firestoreQueryService.setupSafeListener(
          'receiveHelp',
          [['receiverUid', '==', userProfile.uid], ['source', '==', 'sponsor']],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching received sponsor:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              total += Number(doc.amount) || 0;
            });
            setStats(prev => ({ ...prev, totalReceivedSponsor: total }));
          }
        );
        unsubscribers.push(receivedSponsorUnsubscribe);

        // 4. Total Earnings
        const earningsUnsubscribe = firestoreQueryService.setupSafeListener(
          'receiveHelp',
          [['receiverUid', '==', userProfile.uid]],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching earnings:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              if ([HELP_STATUS.CONFIRMED, HELP_STATUS.FORCE_CONFIRMED].includes(doc.status)) {
                total += Number(doc.amount) || 0;
              }
            });
            setStats(prev => ({ ...prev, totalEarnings: total }));
          }
        );
        unsubscribers.push(earningsUnsubscribe);

        // 5. Pending Helps
        const pendingHelpsUnsubscribe = firestoreQueryService.setupSafeListener(
          'receiveHelp',
          [['receiverUid', '==', userProfile.uid]],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching pending helps:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              if (['ASSIGNED', 'PAYMENT_REQUESTED', 'PAYMENT_DONE'].includes(doc.status)) {
                total += Number(doc.amount) || 0;
              }
            });
            setStats(prev => ({ ...prev, pendingHelps: total }));
          }
        );
        unsubscribers.push(pendingHelpsUnsubscribe);

        // 6. Upcoming Payments
        const upcomingUnsubscribe = firestoreQueryService.setupSafeListener(
          'sendHelp',
          [['senderUid', '==', userProfile.uid]],
          [],
          (documents, error) => {
            if (error) {
              console.error('Error fetching upcoming payments:', error);
              return;
            }
            let total = 0;
            documents.forEach(doc => {
              if ([HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE].includes(doc.status)) {
                total += Number(doc.amount) || 0;
              }
            });
            setStats(prev => ({ ...prev, upcomingPayment: total }));
          }
        );
        unsubscribers.push(upcomingUnsubscribe);

      } catch (error) {
        console.error('Failed to setup stats listeners:', error);
        setError('Failed to load dashboard statistics. Please try refreshing the page.');
      }
    };

    setupListeners();

    return () => {
      console.log('Cleaning up stats listeners');
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error cleaning up listener:', error);
        }
      });
    };
  }, [userProfile?.uid]);

  // One-time fetch for Direct Members and Available E-PINs (prevents permission-denied errors)
  useEffect(() => {
    if (!authGuardService.isAuthenticated()) {
      console.warn('User not authenticated, cannot fetch direct members and E-PINs');
      return;
    }

    if (!userProfile || !userProfile.uid) {
      console.log('User profile not available, skipping direct members and E-PINs fetch');
      return;
    }

    const fetchDirectMembers = async () => {
      try {
        console.log('Fetching direct members for user:', userProfile.uid);
        
        const documents = await firestoreQueryService.safeQuery(
          'users',
          [['sponsorId', '==', userProfile.uid]],
          [],
          null
        );
        
        console.log('Direct members fetched:', documents.length);
        setStats(prev => ({ ...prev, directReferrals: documents.length }));
      } catch (error) {
        console.error('Failed to fetch direct members:', error);
        // Don't set error state for this non-critical data
      }
    };

    const fetchAvailableEpins = async () => {
      try {
        console.log('Fetching available E-PINs for user:', userProfile.uid);
        
        const documents = await firestoreQueryService.safeQuery(
          'epins',
          [['usedBy', '==', null], ['assignedTo', '==', userProfile.uid]],
          [],
          null
        );
        
        console.log('Available E-PINs fetched:', documents.length);
        setStats(prev => ({ ...prev, availableEpins: documents.length }));
      } catch (error) {
        console.error('Failed to fetch available E-PINs:', error);
        // Don't set error state for this non-critical data
      }
    };

    fetchDirectMembers();
    fetchAvailableEpins();
  }, [userProfile?.uid]);

  const navigate = useNavigate();

  // CRITICAL: Prevent rendering if user is null (logout state)
  // This guard must come AFTER all hooks are declared but BEFORE any rendering
  if (!user) {
    console.log("🔍 DASHBOARD HOME: No user, preventing render");
    return null;
  }

  const handleNavigateToUpgrade = () => {
    navigate('/dashboard/upgrade-flow');
  };

  // Remove all section-level loading spinners or skeletons
  // Do not show any loading UI for profile, stats, or cards
  // Only render the content directly, or fallback to a minimal placeholder if needed
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ErrorMessage message={error} />
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Render fallback if user is null
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <div className="text-center">
          <p className="text-lg font-semibold">You are not logged in.</p>
          <p className="text-sm text-gray-500">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Use localUserProfile if available, otherwise fall back to userProfile from context
  const displayProfile = localUserProfile || userProfile;

  // Add fallback for userProfile loading
  if (!userProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-gray-800">Profile not found. Please contact support.</div>;
  }

  // Debug logging for userProfile data
  console.log('Dashboard userProfile:', userProfile);
  console.log('Dashboard displayProfile:', displayProfile);
  console.log('Profile fields for card:', {
    userId: userProfile?.userId,
    name: userProfile?.fullName,
    levelStatus: userProfile?.levelStatus,
    rankDate: userProfile?.rankDate,
    joiningDate: userProfile?.joiningDate
  });

  // 🔥 Debug line for Firestore data
  console.log("🔥 userProfile from Firestore:", userProfile);

  // ✅ Debug line to verify userProfile loaded
  console.log("✅ userProfile loaded:", userProfile);

  // Add conditional check wherever userProfile is used
  if (!userProfile) {
    console.warn('User profile is null, show fallback or redirect.');
    return <div>Please contact support or try logging in again.</div>;
  }

  return (
    <div className="w-full p-0 m-0 bg-white">
      <div className="w-full">
        <div className="w-full flex flex-col p-0 m-0 min-w-0">
          {/* Referral Link Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-none sm:rounded-xl p-3 sm:p-4 min-w-0 hover:bg-[#eff6ff] hover:shadow-md transition-all duration-300"
          >
                        <ReferralLink userProfile={userProfile} />

            {/* Ticker Below */}
            <div className="mt-4 w-full overflow-hidden rounded-xl px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 border border-blue-800 shadow-2xl">
              <div className="animate-marquee whitespace-nowrap text-white font-bold drop-shadow-lg text-base sm:text-lg">
                Welcome, {userProfile?.fullName?.split(' ')[0] || 'User'}! 🚀 | Your referral link is active. Share with your friends & grow your team. 💼 | Helping others is the fastest way to rise! 🙌
              </div>
            </div>
          </motion.div>

          {/* User Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-none sm:rounded-xl p-0 m-0 mb-2 sm:mb-4 relative min-w-0 hover:bg-[#eff6ff] hover:shadow-md transition-all duration-300"
          >
            {loading ? (
              <DashboardProfileCardSkeleton />
            ) : (
              <DashboardProfileCard
                userId={userProfile?.userId || 'N/A'}
                name={userProfile?.fullName || userProfile?.name || 'N/A'}
                joiningDate={userProfile?.registrationTime || userProfile?.createdAt || 'N/A'}
                levelStatus={userProfile?.levelStatus || 'N/A'}
                level={userProfile?.level || 'N/A'}
                isActivated={userProfile?.isActivated || false}
                referralCount={userProfile?.referralCount || 0}
              />
            )}
          </motion.div>

          {/* Dashboard Statistics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="px-4 sm:px-6 lg:px-8 mb-8"
          >
            {/* Primary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-blue-500/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiSend className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Total Sent Help
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.totalSentAmount || 0} duration={2.5} separator="," prefix="₹" />
                  </p>
                  <p className="text-xs text-white/70">Amount sent to help others</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-emerald-500/90 via-teal-600/90 to-cyan-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-teal-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiDownload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Received AutoPool
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.totalReceivedAutopool || 0} duration={2.5} separator="," prefix="₹" />
                  </p>
                  <p className="text-xs text-white/70">AutoPool earnings received</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-orange-500/90 via-red-600/90 to-pink-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiDownload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Received Sponsor
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.totalReceivedSponsor || 0} duration={2.5} separator="," prefix="₹" />
                  </p>
                  <p className="text-xs text-white/70">Sponsor bonus received</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-violet-500/90 via-purple-600/90 to-indigo-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiDollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Total Earnings
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.totalEarnings || 0} duration={2.5} separator="," prefix="₹" />
                  </p>
                  <p className="text-xs text-white/70">Total income generated</p>
                </div>
              </motion.div>
            </div>

            {/* Secondary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-green-500/90 via-emerald-600/90 to-teal-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiUsers className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Direct Members
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.directReferrals || 0} duration={2.5} separator="," />
                  </p>
                  <p className="text-xs text-white/70">People you referred</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-amber-500/90 via-yellow-600/90 to-orange-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiClock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Pending Helps
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.pendingHelps || 0} duration={2.5} separator="," />
                  </p>
                  <p className="text-xs text-white/70">Awaiting confirmation</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-rose-500/90 via-pink-600/90 to-red-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 via-pink-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiCreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Available E-PINs
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.availableEpins || 0} duration={2.5} separator="," />
                  </p>
                  <p className="text-xs text-white/70">Ready to use E-PINs</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-slate-500/90 via-gray-600/90 to-zinc-700/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-gray-500/20 to-zinc-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiCalendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Upcoming Payment
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <CountUp end={stats.upcomingPayment || 0} duration={2.5} separator="," prefix="₹" />
                  </p>
                  <p className="text-xs text-white/70">Next scheduled payment</p>
                </div>
              </motion.div>
            </div>
          </motion.div>



          {/* Social Media Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-none sm:rounded-xl p-3 sm:p-4 min-w-0 hover:bg-[#eff6ff] hover:shadow-md transition-all duration-300"
          >
            <SocialMediaBar />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;