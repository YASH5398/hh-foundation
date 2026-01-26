import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, orderBy, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { HELP_STATUS, HELP_STATUS_LABELS, normalizeStatus } from '../../config/helpStatus';
import { getUserById } from '../../services/userService';
import Card from '../ui/Card';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { getCurrentUserUid } from '../../utils/registrationUtils';
import UpcomingPayments from './UpcomingPayments';
import { useNavigate } from 'react-router-dom';
import ChatModal from '../ui/ChatModal';
import { useSocialTasks } from '../../hooks/useProfile';
import { Link } from 'react-router-dom';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';
import { createNotification } from '../../services/notificationService';

const LEVELS = [
  'Star',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
];

const getInitial = (name) => (name && name.length > 0 ? name[0].toUpperCase() : '?');

const LevelBadge = ({ level }) => (
  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium ml-2">{level || 'N/A'}</span>
);

const PodiumProfile = ({ user, rank }) => {
  const size = rank === 1 ? 'w-20 h-20 sm:w-28 sm:h-28 text-2xl sm:text-5xl' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl';
  const glow = rank === 1 ? 'animate-pulse shadow-[0_0_32px_4px_rgba(251,191,36,0.3)]' : '';
  const crown = rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: rank * 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="mb-1 text-2xl sm:text-3xl">{crown}</div>
      <img
        src={getProfileImageUrl(user)}
        alt={user.fullName}
        className={`${PROFILE_IMAGE_CLASSES.base} border-4 border-white ${size} ${glow} bg-[#232345]`}
        onError={e => { e.target.onerror = null; e.target.src = getProfileImageUrl(null); }}
      />
      <div className="flex flex-col items-center mt-2">
        <span className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight text-center">{user.fullName}</span>
        <span className="text-xs sm:text-sm text-gray-500 font-mono text-center">{user.userId}</span>
        <LevelBadge level={user.level} />
        <span className="text-xs text-gray-600 mt-1">{user.referralCount} refs</span>
      </div>
    </motion.div>
  );
};

const ActivationBanner = ({ onSendHelp, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="mb-6 sm:mb-8 w-full max-w-2xl mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-green-400 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 border border-blue-100/40 relative overflow-hidden"
    style={{
      boxShadow: '0 8px 32px 0 rgba(60,60,180,0.18)',
    }}
  >
    {/* Dismiss Icon */}
    <button
      onClick={onDismiss}
      className="absolute top-2 sm:top-3 right-2 sm:right-3 text-white/80 hover:text-white text-lg sm:text-xl font-bold focus:outline-none z-10"
      aria-label="Dismiss activation banner"
      tabIndex={0}
    >
      &times;
    </button>
    <div className="flex-shrink-0 flex items-center justify-center bg-white/20 rounded-full p-2 sm:p-3 shadow-lg">
      <span className="text-xl sm:text-2xl">🔒</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-lg sm:text-xl font-bold text-white drop-shadow mb-1">Activate Your ID</div>
      <div className="text-white/90 text-xs sm:text-sm font-medium mb-2">To unlock your account and start receiving help, please send ₹300 to your assigned user.</div>
      <button
        onClick={onSendHelp}
        className="mt-2 px-4 sm:px-6 py-2 bg-white/90 hover:bg-white text-blue-700 font-semibold rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-sm sm:text-base"
      >
        Send Help Now &rarr;
      </button>
    </div>
    <div className="absolute right-0 top-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-white/10 to-green-300/10 rounded-full blur-2xl opacity-60 pointer-events-none" />
  </motion.div>
);

const Dashboard = () => {
  const { currentUser, user, isAdmin } = useAuth();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("Star");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [directMembers, setDirectMembers] = useState(0);
  const [totalTeam, setTotalTeam] = useState(0);
  const [totalSentHelp, setTotalSentHelp] = useState(0);
  const [receivedAutoPool, setReceivedAutoPool] = useState(0);
  const [receivedSponsor, setReceivedSponsor] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingHelps, setPendingHelps] = useState(0);
  const [availableEpins, setAvailableEpins] = useState(0);
  const [upcomingPayment, setUpcomingPayment] = useState(0);
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(() => {
    return !localStorage.getItem('sendHelpDismissed');
  });
  const [showSendHelpCard, setShowSendHelpCard] = useState(true);
  const [sendHelpReminder, setSendHelpReminder] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const { tasks } = useSocialTasks(user?.uid);

  const openChatDrawer = ({ senderUid, receiverUid, chatId, name }) => {
    setChatInfo({ chatId, otherUser: { uid: receiverUid, name } });
    setChatOpen(true);
  };

  useEffect(() => {
    if (user && user.isActivated === false) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [user]);
  // Reset dismissal on next login
  useEffect(() => {
    if (user && user.isActivated === false) {
      localStorage.removeItem('sendHelpDismissed');
    }
  }, [user && user.uid]);
  const handleDismiss = () => {
    localStorage.setItem('sendHelpDismissed', 'true');
    setShowBanner(false);
  };

  // Use isAdmin from context (single source of truth)
  const isAdminUser = isAdmin;

  // Fetch dashboard metrics
  useEffect(() => {
    let unsubSentHelp = () => {};
    let unsubAutoPool = () => {};
    let unsubSponsor = () => {};
    let unsubEarnings = () => {};
    let unsubPending = () => {};
    let unsubDirect = () => {};

    const setupListeners = async () => {
      if (!auth.currentUser) return;
      if (!user?.uid) return;

      try {
        // Force token refresh before creating listeners
        await auth.currentUser.getIdToken(true);

        console.log('currentUser.uid:', user.uid);
        console.log('currentUser.userId:', user.userId);
        // Total Sent Help
        const sentHelpQ = query(collection(db, 'sendHelp'), where('senderUid', '==', user.uid));
        unsubSentHelp = onSnapshot(sentHelpQ, snap => {
          setTotalSentHelp(snap.size);
          console.log('sendHelp docs:', snap.docs.slice(0,3).map(d=>d.data()));
        }, (error) => {
          // Immediately unsubscribe on permission-denied
          if (error.code === 'permission-denied') {
            unsubSentHelp();
          }
        });
        // Received (AutoPool)
        const autoPoolQ = query(collection(db, 'receiveHelp'), where('receiverUid', '==', user.uid), where('isSponsorHelp', '==', false));
        unsubAutoPool = onSnapshot(autoPoolQ, snap => {
          setReceivedAutoPool(snap.size);
          console.log('receiveHelp (AutoPool) docs:', snap.docs.slice(0,3).map(d=>d.data()));
        }, (error) => {
          // Immediately unsubscribe on permission-denied
          if (error.code === 'permission-denied') {
            unsubAutoPool();
          }
        });
        // Received (Sponsor)
        const sponsorQ = query(collection(db, 'receiveHelp'), where('receiverUid', '==', user.uid), where('isSponsorHelp', '==', true));
        unsubSponsor = onSnapshot(sponsorQ, snap => {
          setReceivedSponsor(snap.size);
          console.log('receiveHelp (Sponsor) docs:', snap.docs.slice(0,3).map(d=>d.data()));
        }, (error) => {
          // Immediately unsubscribe on permission-denied
          if (error.code === 'permission-denied') {
            unsubSponsor();
          }
        });
        // Total Earnings (sum of confirmed received helps)
        const earningsQ = query(
          collection(db, 'receiveHelp'),
          where('receiverUid', '==', user.uid),
          where('status', 'in', [HELP_STATUS.CONFIRMED, HELP_STATUS.FORCE_CONFIRMED])
        );
        unsubEarnings = onSnapshot(earningsQ, snap => {
          let sum = 0;
          snap.forEach(doc => {
            const data = doc.data();
            sum += Number(data.amount) || 0;
          });
          setTotalEarnings(sum);
        }, (error) => {
          // Immediately unsubscribe on permission-denied
          if (error.code === 'permission-denied') {
            unsubEarnings();
          }
        });
        // Pending Helps
        const pendingQ = query(
          collection(db, 'receiveHelp'),
          where('receiverUid', '==', user.uid),
          where('status', 'in', [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE])
        );
        unsubPending = onSnapshot(pendingQ, snap => {
          setPendingHelps(snap.size);
        }, (error) => {
          // Immediately unsubscribe on permission-denied
          if (error.code === 'permission-denied') {
            unsubPending();
          }
        });
        // Direct Members
        const directQ = query(collection(db, 'users'), where('sponsorId', '==', user.uid));
        unsubDirect = onSnapshot(directQ, snap => {
          setDirectMembers(snap.size);
          console.log('users (Direct Members) docs:', snap.docs.slice(0,3).map(d=>d.data()));
        });
        // Available E-PINs
        setAvailableEpins(Array.isArray(currentUser?.epins) ? currentUser.epins.filter(e => e.isUsed === false).length : 0);
        // Total Team
        setTotalTeam(Array.isArray(currentUser?.referredUsers) ? currentUser.referredUsers.length : 0);
        // Upcoming Payment (count of users at your level with higher referral count)
        async function fetchUpcomingPayment() {
          if (!user?.level || typeof user.referralCount !== 'number') {
            setUpcomingPayment(0);
            return;
          }
          const q = query(
            collection(db, 'users'),
            where('level', '==', user.level),
            where('isActivated', '==', true)
          );
          const snap = await getDocs(q);
          const higher = snap.docs.filter(doc => (doc.data().referralCount || 0) > user.referralCount);
          setUpcomingPayment(higher.length);
        }
        fetchUpcomingPayment();
      } catch (error) {
        console.error('Failed to setup dashboard listeners:', error);
      }
    };

    setupListeners();

    return () => {
      unsubSentHelp();
      unsubAutoPool();
      unsubSponsor();
      unsubEarnings();
      unsubPending();
      unsubDirect();
    };
  }, [user?.uid]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          console.log("UID:", user.uid);
          console.log('📁 Firestore path:', `users/${user.uid}`);
          console.log('🔒 Security rule check: request.auth.uid == userId (should be true)');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load dashboard data');
      } finally {
        // setLoading(false); // Removed loading state
      }
    };
    fetchUserData();
  }, [user?.uid]);

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    if (!user?.uid) return;
    
    setActivityLoading(true);
    try {
      // Fetch recent send help transactions
      const sendHelpQuery = query(
        collection(db, 'sendHelp'),
        where('senderId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      // Fetch recent receive help transactions
      const receiveHelpQuery = query(
        collection(db, 'receiveHelp'),
        where('receiverUid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const [sendHelpSnap, receiveHelpSnap] = await Promise.all([
        getDocs(sendHelpQuery),
        getDocs(receiveHelpQuery)
      ]);
      
      const activities = [];
      
      // Process send help activities
      sendHelpSnap.docs.forEach(doc => {
        const data = doc.data();
        const statusKey = normalizeStatus(data.status);
        const statusLabel = HELP_STATUS_LABELS[statusKey] || statusKey;
        activities.push({
          id: doc.id,
          type: 'send',
          amount: data.amount || 0,
          status: statusLabel,
          createdAt: data.createdAt,
          receiverName: data.receiverName || 'Unknown',
          receiverUserId: data.receiverUserId || 'N/A'
        });
      });
      
      // Process receive help activities
      receiveHelpSnap.docs.forEach(doc => {
        const data = doc.data();
        const statusKey = normalizeStatus(data.status);
        const statusLabel = HELP_STATUS_LABELS[statusKey] || statusKey;
        activities.push({
          id: doc.id,
          type: 'receive',
          amount: data.amount || 0,
          status: statusLabel,
          createdAt: data.createdAt,
          senderName: data.senderName || 'AutoPool',
          senderUserId: data.senderUserId || 'N/A'
        });
      });
      
      // Sort by creation date and take top 5
      activities.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    let unsub = () => {};

    const setupListener = async () => {
      if (!auth.currentUser) return;
      if (!user?.uid) return;
      setUpcomingLoading(true);
      setUpcomingError("");

      try {
        // Force token refresh before creating listener
        await auth.currentUser.getIdToken(true);

        const q = query(
          collection(db, 'sendHelp'),
          where('senderId', '==', user.uid),
          where('status', 'in', [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE]),
          orderBy('createdAt', 'asc')
        );
        unsub = onSnapshot(q, async (snap) => {
          try {
            let docs = snap.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .slice(0, 3);
            // Fetch receiver info for each
            const receivers = await Promise.all(
              docs.map(async (doc) => {
                let receiver = { userId: doc.receiverUserId || doc.receiverId, name: '', profileImage: '', paymentMethod: '' };
                try {
                  const userResult = await getUserById(doc.receiverUid || doc.receiverId);
                  if (userResult.success && userResult.data) {
                    const user = userResult.data;
                    receiver = {
                      userId: user.userId || doc.receiverUserId || doc.receiverId,
                      name: user.fullName || user.name || '',
                      profileImage: user.profileImage || '',
                      paymentMethod: user.paymentMethod?.upiId || user.paymentMethod?.phonePeNumber || user.paymentMethod?.googlePayNumber || user.paymentMethod?.method || '',
                    };
                  }
                } catch (error) {
                  console.error('Error fetching receiver info:', error);
                }
                return { ...receiver, status: doc.status };
              })
            );
            setUpcomingPayments(receivers);
            setUpcomingLoading(false);
          } catch (err) {
            setUpcomingError('Failed to load upcoming payments.');
            setUpcomingLoading(false);
          }
        }, (err) => {
          setUpcomingError('Failed to load upcoming payments.');
          setUpcomingLoading(false);
        });
      } catch (error) {
        console.error('Failed to setup upcoming payments listener:', error);
        setUpcomingLoading(false);
      }
    };

    setupListener();

    return () => unsub();
  }, [user?.uid]);

  // Fetch recent activity when user changes
  useEffect(() => {
    fetchRecentActivity();
  }, [user?.uid]);

  // Fetch Send Help Reminder
  useEffect(() => {
    let unsubscribe = () => {};

    const setupListener = async () => {
      if (!auth.currentUser) return;
      if (!user?.uid) return;

      setReminderLoading(true);

      try {
        // Force token refresh before creating listener
        await auth.currentUser.getIdToken(true);

        // First, check if user has any existing sendHelp documents
        const sendHelpQuery = query(
          collection(db, 'sendHelp'),
          where('senderId', '==', user.uid),
          where('status', 'in', [HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE]),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        unsubscribe = onSnapshot(sendHelpQuery, async (snapshot) => {
          try {
            if (!snapshot.empty) {
              // User has existing sendHelp - show the latest one
              const latestSendHelp = snapshot.docs[0].data();
              setSendHelpReminder(latestSendHelp);

              // Fetch receiver details
              if (latestSendHelp.receiverUid) {
                try {
                  const receiverResult = await getUserById(latestSendHelp.receiverUid);
                  if (receiverResult.success && receiverResult.data) {
                    setReceiver(receiverResult.data);
                  }
                } catch (error) {
                  console.error('Error fetching receiver details:', error);
                }
              }
            } else {
              // No existing sendHelp - find eligible receiver for initial ₹300
              const eligibleReceiversQuery = query(
                collection(db, 'users'),
                where('isActivated', '==', true),
                where('hasReceivedHelp', '==', false),
                limit(1)
              );

              const eligibleSnapshot = await getDocs(eligibleReceiversQuery);
              if (!eligibleSnapshot.empty) {
                const eligibleReceiver = eligibleSnapshot.docs[0].data();
                setReceiver(eligibleReceiver);
                setSendHelpReminder({ type: 'initial', amount: 300 });
              }
            }
          } catch (error) {
            console.error('Error fetching send help reminder:', error);
          } finally {
            setReminderLoading(false);
          }
        });
      } catch (error) {
        console.error('Failed to setup sendHelp reminder listener:', error);
        setReminderLoading(false);
      }
    };

    setupListener();

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    async function sendWelcomeNotificationIfNeeded() {
      if (!user?.uid || !user?.fullName) return;
      // Check if welcome notification already exists
      const notifQ = query(
        collection(db, 'notifications'),
        where('uid', '==', user.uid),
        where('type', '==', 'welcome')
      );
      const notifSnap = await getDocs(notifQ);
      if (notifSnap.empty) {
        // Not found, create welcome notification
        const firstName = user.fullName.split(' ')[0];
        await createNotification({
          uid: user.uid,
          userId: user.uid,
          title: `Hi ${firstName}, welcome to Helping Hands Foundation!`,
          message: "Let’s grow together by helping each other. 💖",
          type: 'welcome',
          preventDuplicates: true
        });
      }
    }
    sendWelcomeNotificationIfNeeded();
  }, [user?.uid, user?.fullName]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const dashboardCards = [
    {
      title: 'Send Help',
      value: formatCurrency(userData?.sendHelpAmount || 0),
      bgColor: 'bg-[#9B1C1C]',
      delay: 0.1
    },
    {
      title: 'Receive Help (AutoPool)',
      value: formatCurrency(userData?.receiveHelpAutoPool || 0),
      bgColor: 'bg-[#D946EF]',
      delay: 0.2
    },
    {
      title: 'Receive Help (Sponsor)',
      value: formatCurrency(userData?.receiveHelpSponsor || 0),
      bgColor: 'bg-[#3B82F6]',
      delay: 0.3
    },
    {
      title: 'Direct Member',
      value: userData?.directMemberCount?.toString() || '0',
      bgColor: 'bg-[#7B341E]',
      delay: 0.4
    }
  ];

  const fetchLeaderboard = async (selectedLevel) => {
    setLeaderboardLoading(true);
    setLeaderboardError(false);
    const q = query(
      collection(db, "leaderboard"),
      where("level", "==", selectedLevel),
      orderBy("referralCount", "desc"),
      limit(100)
    );
    try {
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => doc.data());
      setLeaderboard(users);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboardError(true);
    }
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(selectedLevel);
    // eslint-disable-next-line
  }, [selectedLevel]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[380px] mx-auto px-3">
      {/* Activation Banner: Only show if user.isActivated === false and not dismissed */}
      {user && user.isActivated === false && showBanner && (
        <ActivationBanner onSendHelp={() => navigate('/dashboard/send-help')} onDismiss={handleDismiss} />
      )}
      
      {/* Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-4 sm:mb-6"
      >
        <div className="text-white min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold truncate">Dashboard</h1>
          <p className="text-xs sm:text-sm opacity-80">Welcome back!</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <span className="text-white text-xs sm:text-sm font-medium hidden sm:block">
            ID: {userData?.userId || 'Loading...'}
          </span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-900 font-bold text-xs sm:text-sm">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-4 sm:mb-6"
      >
        <img
          src="https://iili.io/FzSnRZF.th.png"
          alt="Company Logo"
          className="rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 shadow-lg"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = 'https://placehold.co/64x64/cccccc/000000?text=Logo'; 
          }}
        />
      </motion.div>

      {/* Dashboard Statistics Section */}
      <div className="mt-14 mb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">💰</span>
            <div className="text-2xl font-bold mb-2">Total Sent Help</div>
            <div className="text-4xl font-extrabold">{totalSentHelp}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">👥</span>
            <div className="text-2xl font-bold mb-2">Received (AutoPool)</div>
            <div className="text-4xl font-extrabold">{receivedAutoPool}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">👥</span>
            <div className="text-2xl font-bold mb-2">Received (Sponsor)</div>
            <div className="text-4xl font-extrabold">{receivedSponsor}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">👥</span>
            <div className="text-2xl font-bold mb-2">Direct Member</div>
            <div className="text-4xl font-extrabold">{directMembers}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">👥</span>
            <div className="text-2xl font-bold mb-2">Total Team</div>
            <div className="text-4xl font-extrabold">{totalTeam}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">⚠️</span>
            <div className="text-2xl font-bold mb-2">Pending Helps</div>
            <div className="text-4xl font-extrabold">{pendingHelps}</div>
          </div>
          <div className="w-full min-w-0 mx-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 hover:scale-[1.05] transition-transform duration-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-5">🔑</span>
            <div className="text-2xl font-bold mb-2">Available E-PINs</div>
            <div className="text-4xl font-extrabold">{availableEpins}</div>
          </div>
        </div>
      </div>

      {user && user.referralCount === 0 && (
        <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col items-center mb-6">
          <div className="text-blue-700 font-semibold text-lg mb-1">🚀 Boost Your Priority!</div>
          <div className="text-gray-700 text-sm mb-2">Complete social tasks to increase your chance of receiving help. <Link to="/dashboard/tasks" className="text-blue-600 underline font-medium">Go to Tasks</Link></div>
          <div className="text-blue-600 font-bold">Task Score: {tasks?.taskScore || 0} / 3</div>
        </div>
      )}

      {/* Upcoming Payment Section */}
      <div className="w-full mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-white mb-4 sm:mb-6">Upcoming Payments</h2>
        {upcomingLoading ? (
          <div className="text-center text-white py-6 sm:py-8 text-sm sm:text-base">Loading payments...</div>
        ) : (
          <UpcomingPayments upcomingList={upcomingPayments} />
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="w-full mt-8 sm:mt-12">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-white mb-4 sm:mb-6">Leaderboard</h2>
        {leaderboardLoading ? (
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-blue-200 animate-pulse mb-4" />
            <div className="w-full h-6 sm:h-8 bg-blue-100 rounded mb-2 animate-pulse" />
            <div className="w-full h-6 sm:h-8 bg-blue-100 rounded mb-2 animate-pulse" />
            <div className="w-full h-6 sm:h-8 bg-blue-100 rounded mb-2 animate-pulse" />
          </div>
        ) : leaderboardError ? (
          <div className="flex justify-center items-center min-h-[30vh]">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-2 text-sm sm:text-base">
              <XCircle className="w-5 h-5" />
              Failed to load leaderboard
            </div>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="flex flex-row items-end justify-center gap-1 sm:gap-2 lg:gap-3 xl:gap-8 w-full max-w-2xl mx-auto mt-[-10px] sm:mt-[-20px] lg:mt-0 mb-6 sm:mb-8">
              {/* 2nd Place (left) */}
              <div className="flex-1 flex flex-col items-center">
                {leaderboard[1] && <PodiumProfile user={leaderboard[1]} rank={2} />}
              </div>
              {/* 1st Place (center, larger, slightly higher) */}
              <div className="flex-1 flex flex-col items-center mb-2 sm:mb-4 lg:mb-8">
                {leaderboard[0] && <PodiumProfile user={leaderboard[0]} rank={1} />}
              </div>
              {/* 3rd Place (right) */}
              <div className="flex-1 flex flex-col items-center">
                {leaderboard[2] && <PodiumProfile user={leaderboard[2]} rank={3} />}
              </div>
            </div>
            {/* Remaining users (4-100) */}
            <div className="w-full max-w-2xl mx-auto">
              <AnimatePresence>
                {leaderboard.slice(3, 100).map((user, idx) => (
                  <motion.div
                    key={user.userId + idx}
                    className="shadow-md hover:shadow-lg border-l-4 border-blue-400 rounded-xl p-3 sm:p-4 mb-3 flex items-center justify-between hover:bg-[#eff6ff] transition-all duration-300"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.4, delay: idx * 0.03 }}
                  >
                    <span className="text-blue-500 font-bold text-sm sm:text-base lg:text-lg w-6 sm:w-8 lg:w-10 text-center mr-2 flex-shrink-0">{idx + 4}</span>
                    <img
              src={getProfileImageUrl(user)}
              alt={user.fullName}
              className={`${PROFILE_IMAGE_CLASSES.small} border-2 border-white/40 shadow mr-2 sm:mr-3 lg:mr-4 flex-shrink-0`}
              onError={e => { e.target.onerror = null; e.target.src = getProfileImageUrl(null); }}
            />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-800 font-semibold text-sm sm:text-base lg:text-lg truncate">{user.fullName || 'N/A'}</div>
                      <div className="text-xs sm:text-sm text-gray-500 font-mono truncate">{user.userId}</div>
                      <LevelBadge level={user.level} />
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-700 ml-2 sm:ml-4 flex-shrink-0">{user.referralCount} refs</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-md mx-auto mt-6 sm:mt-8 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => {
              e.preventDefault();
              navigate('/dashboard/send-help');
            }}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
          >
            Send Help
          </motion.button>
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => {
              e.preventDefault();
              navigate('/dashboard/receive-help');
            }}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
          >
            Request Help
          </motion.button>
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard/direct-referral');
            }}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
          >
            My Team
          </motion.button>
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard/profile-settings');
            }}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
          >
            Profile
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full max-w-2xl mx-auto mt-6 sm:mt-8"
      >
        <h2 className="text-white text-base sm:text-lg font-semibold text-center mb-3 sm:mb-4">
          Recent Activity
        </h2>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 space-y-3">
          {activityLoading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-sm sm:text-base">Loading recent activity...</p>
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex justify-between items-center text-white">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">
                    {activity.type === 'send' ? 'Help Sent' : 'Help Received'}
                  </p>
                  <p className="text-xs sm:text-sm opacity-80 truncate">
                    ₹{activity.amount.toLocaleString()} {activity.type === 'send' ? 'to' : 'from'} {activity.type === 'send' ? activity.receiverName : activity.senderName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs sm:text-sm opacity-60">
                    {activity.createdAt?.toDate ? 
                      activity.createdAt.toDate().toLocaleDateString() : 
                      new Date().toLocaleDateString()
                    }
                  </span>
                  <div className="text-xs opacity-50">
                    {activity.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white opacity-60">
              <p className="text-sm sm:text-base">No recent activity</p>
              <p className="text-xs sm:text-sm">Your help transactions will appear here</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Send Help Reminder Card */}
      {showSendHelpCard && !reminderLoading && (
        <>
          {sendHelpReminder && receiver ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mt-6 px-2"
        >
          <div className="relative bg-white border border-gray-100 shadow-lg rounded-2xl w-full max-w-md p-6 transition-all duration-300">
            {/* Notification Badge */}
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              New
            </div>
            <button
              type="button"
              onClick={() => setShowSendHelpCard(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl transition-colors duration-200"
              aria-label="Close"
            >
              ✖️
            </button>
            
            {sendHelpReminder.type === 'initial' ? (
              // Initial ₹300 help reminder
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Send Help ₹300 and Activate Your ID
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={getProfileImageUrl(receiver)}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                    onError={e => { e.target.onerror = null; e.target.src = getProfileImageUrl(null); }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{receiver.fullName || 'Unknown User'}</div>
                    <div className="text-sm text-gray-600 font-mono">ID: {receiver.userId || 'N/A'}</div>
                    <div className="text-sm text-gray-600">📞 {receiver.phone || 'N/A'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    console.log('Navigating to /dashboard/send-help');
                    navigate('/dashboard/send-help');
                  }}
                  className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Send Help
                </button>
              </>
            ) : (
              // Existing sendHelp reminder
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Your Send Help Status
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={getProfileImageUrl(receiver)}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                    onError={e => { e.target.onerror = null; e.target.src = getProfileImageUrl(null); }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{receiver.fullName || 'Unknown User'}</div>
                    <div className="text-sm text-gray-600 font-mono">ID: {receiver.userId || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Amount: ₹{sendHelpReminder.amount || 0}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <StatusBadge status={sendHelpReminder.status} />
                  {[HELP_STATUS.ASSIGNED, HELP_STATUS.PAYMENT_REQUESTED, HELP_STATUS.PAYMENT_DONE].includes(sendHelpReminder.status) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/send-help');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Complete Payment
                    </button>
                  )}
                </div>
                {/* Universal Chat Button Below Action Buttons */}
                {sendHelpReminder?.senderUid && sendHelpReminder?.receiverUid && (
                  <button
                    onClick={() => openChatDrawer({
                      senderUid: sendHelpReminder.senderUid,
                      receiverUid: sendHelpReminder.receiverUid,
                      chatId: `${sendHelpReminder.senderId}_${sendHelpReminder.receiverId}`,
                      name: sendHelpReminder.receiverName
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm mt-2 w-full"
                    type="button"
                  >
                    💬 Chat with {sendHelpReminder.receiverName || 'Receiver'}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
          ) : (
            // Minimal placeholder for loading state
            <div className="flex justify-center mt-6 px-2">
              <div className="relative bg-white border border-gray-100 shadow-lg rounded-2xl w-full max-w-md p-6 text-center text-gray-400">
                No send help reminder available.
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State for Send Help Reminder */}
      {showSendHelpCard && reminderLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mt-6 px-2"
        >
          <div className="relative bg-white border border-gray-100 shadow-lg rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 font-medium">Loading send help reminder...</span>
            </div>
          </div>
        </motion.div>
      )}

        {/* Render ChatModal at the bottom */}
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          chatId={chatInfo?.chatId}
          currentUser={user}
          otherUser={chatInfo?.otherUser}
        />
      </div>
    </div>
  );
};

function StatusBadge({ status }) {
  let color = 'bg-gray-200 text-gray-600';
  let label = status;

  switch (status) {
    case HELP_STATUS.ASSIGNED:
      color = 'bg-yellow-100 text-yellow-800';
      label = '🕒 Assigned';
      break;
    case HELP_STATUS.PAYMENT_REQUESTED:
      color = 'bg-blue-100 text-blue-800';
      label = '💳 Payment Requested';
      break;
    case HELP_STATUS.PAYMENT_DONE:
      color = 'bg-indigo-100 text-indigo-800';
      label = '✅ Payment Done';
      break;
    case HELP_STATUS.CONFIRMED:
    case HELP_STATUS.FORCE_CONFIRMED:
      color = 'bg-green-100 text-green-800';
      label = '✅ Confirmed';
      break;
    case HELP_STATUS.CANCELLED:
      color = 'bg-red-100 text-red-800';
      label = '❌ Cancelled';
      break;
    case HELP_STATUS.TIMEOUT:
      color = 'bg-red-100 text-red-800';
      label = '⏰ Timeout';
      break;
    case HELP_STATUS.DISPUTED:
      color = 'bg-orange-100 text-orange-800';
      label = '⚠️ Disputed';
      break;
    default:
      color = 'bg-gray-200 text-gray-600';
      label = status || 'Unknown';
  }
  
  return (
    <span className={`${color} px-2 py-1 rounded-full text-xs font-semibold`}>
      {label}
    </span>
  );
}