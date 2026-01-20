import React, { useEffect, useState, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, limit } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { bulkMarkNotificationsRead, setNotificationRead } from '../../services/notificationActions';
=======
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDoc, limit } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Firestore Security Rule:
// match /notifications/{notifId} {
//   allow read, update: if request.auth != null
//     && get(/databases/$(default)/documents/users/$(request.auth.uid)).data.userId == resource.data.userId;
// }

const typeIcon = (type) => {
  if (type === 'receiveHelp') return <CheckCircle className="text-green-500 w-5 h-5" />;
  return <Bell className="text-blue-400 w-5 h-5" />;
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const bellRef = useRef();

  // Fetch userId from Firestore profile
  useEffect(() => {
    if (!auth.currentUser) return;
    if (!user?.uid) return;
    const fetchUserId = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setUserId(userDoc.data().userId);
    };
    fetchUserId();
  }, [user?.uid]);

  // Real-time notifications by userId (latest 10)
  useEffect(() => {
    let unsub = () => {};

    const setupListener = async () => {
      if (!auth.currentUser) return;
      if (!userId) return;
      setLoading(true);

      try {
        // Force token refresh before creating listener
        await auth.currentUser.getIdToken(true);

        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        unsub = onSnapshot(q, (snap) => {
          setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to setup notifications listener:', error);
        setLoading(false);
      }
    };

    setupListener();

    return () => unsub();
  }, [userId]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (open && notifications.some(n => !n.isRead)) {
<<<<<<< HEAD
      const ids = notifications.filter(n => !n.isRead).map(n => n.id);
      bulkMarkNotificationsRead(ids).catch(() => {});
=======
      notifications.filter(n => !n.isRead).forEach(n => {
        updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      });
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
    }
  }, [open, notifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-w-xs bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b font-semibold text-gray-700 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" /> Notifications
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 flex justify-center"><LoadingSpinner /></div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No notifications</div>
              ) : notifications.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 ${!n.isRead ? 'font-bold' : ''}`}
                  onClick={async () => {
<<<<<<< HEAD
                    if (!n.isRead) await setNotificationRead(n.id, true);
=======
                    if (!n.isRead) await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                  }}
                >
                  <div className="pt-1">
                    {!n.isRead ? <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" /> : null}
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{n.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      {n.timestamp?.toDate ? dayjs(n.timestamp.toDate()).fromNow() : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications; 