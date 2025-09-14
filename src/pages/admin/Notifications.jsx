import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, getDoc, setDoc, doc, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const LEVELS = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [manualUserIds, setManualUserIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const { user, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;

  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, 'users')).then(snap => {
      setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [isAdmin]);

  // Fetch latest broadcast for close button
  useEffect(() => {
    if (!isAdmin) return;
    getDoc(doc(db, 'broadcast', 'latest')).then(snap => {
      if (snap.exists()) setActiveBroadcast({ id: 'latest', ...snap.data() });
      else setActiveBroadcast(null);
    });
  }, [broadcastLoading, isAdmin]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !broadcastTitle.trim()) return;
    setBroadcastLoading(true);
    try {
      await setDoc(doc(db, 'broadcast', 'latest'), {
        message: broadcastMsg.trim(),
        title: broadcastTitle.trim(),
        timestamp: serverTimestamp(),
        targetLevels: levelFilter,
        statusFilter,
        manualUserIds,
      });
      setBroadcastMsg('');
      setBroadcastTitle('');
      setLevelFilter([]);
      setStatusFilter([]);
      setManualUserIds([]);
      alert('Broadcast message created!');
    } catch (err) {
      alert('Failed to create broadcast: ' + (err.message || 'Unknown error'));
    }
    setBroadcastLoading(false);
  };

  // Close broadcast: delete broadcast doc and clean up popupDismissed for all users
  const handleCloseBroadcast = async () => {
    if (!activeBroadcast) return;
    if (!window.confirm('Are you sure you want to close this broadcast? This will remove the popup for all users.')) return;
    setBroadcastLoading(true);
    try {
      // Delete broadcast doc
      await deleteDoc(doc(db, 'broadcast', 'latest'));
      // Clean up popupDismissed for all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      usersSnap.forEach(userDoc => {
        const uid = userDoc.id;
        batch.set(doc(db, 'popupDismissed', uid), { latest: true }, { merge: true });
      });
      await batch.commit();
      setActiveBroadcast(null);
      alert('Broadcast closed and popups removed for all users.');
    } catch (err) {
      alert('Failed to close broadcast: ' + (err.message || 'Unknown error'));
    }
    setBroadcastLoading(false);
  };

  return (
    <>
      {/* BroadcastNotificationPopup removed from admin panel */}
      {isAdmin && (
        <form onSubmit={handleBroadcastSubmit} className="max-w-xl mx-auto mt-6 mb-8 p-4 bg-blue-50 rounded-xl flex flex-col gap-2 border border-blue-200">
          <div className="font-bold text-blue-900 mb-1">Create Broadcast Notification</div>
          <input
            type="text"
            className="border rounded px-3 py-2 mb-2"
            placeholder="Personalized Title (e.g. Hi {firstName} 👋)"
            value={broadcastTitle}
            onChange={e => setBroadcastTitle(e.target.value)}
            required
          />
          <textarea
            className="border rounded px-3 py-2 mb-2"
            placeholder="Notification message..."
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
            required
          />
          <div className="flex flex-col gap-2 mb-2">
            <label className="font-semibold">Target Levels:</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(lvl => (
                <label key={lvl} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={levelFilter.includes(lvl)}
                    onChange={e => setLevelFilter(l => e.target.checked ? [...l, lvl] : l.filter(x => x !== lvl))}
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <label className="font-semibold">Status Filter:</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(opt.value)}
                    onChange={e => setStatusFilter(s => e.target.checked ? [...s, opt.value] : s.filter(x => x !== opt.value))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <label className="font-semibold">Manual User Selection (optional):</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mb-2"
              placeholder="Search users by name, email, or userId..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
            />
            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
              {allUsers.filter(u => {
                const s = searchUser.toLowerCase();
                return (
                  (u.fullName || u.name || '').toLowerCase().includes(s) ||
                  (u.email || '').toLowerCase().includes(s) ||
                  (u.userId || '').toLowerCase().includes(s)
                );
              }).map(u => (
                <label key={u.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={manualUserIds.includes(u.id)}
                    onChange={e => setManualUserIds(ids => e.target.checked ? [...ids, u.id] : ids.filter(x => x !== u.id))}
                  />
                  <span>{u.fullName || u.name || u.email || u.userId}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-60" disabled={broadcastLoading}>
            {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      )}
      {isAdmin && activeBroadcast && (
        <div className="max-w-xl mx-auto mb-8 flex justify-end">
          <button onClick={handleCloseBroadcast} className="bg-red-600 text-white rounded px-4 py-2 font-semibold hover:bg-red-700 disabled:opacity-60" disabled={broadcastLoading}>
            Close Broadcast
          </button>
        </div>
      )}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6">All Notifications</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications found.</div>
        ) : (
          <table className="min-w-full bg-white border rounded-xl">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Message</th>
                <th className="px-4 py-2 border-b">Date</th>
                <th className="px-4 py-2 border-b">Receiver</th>
                <th className="px-4 py-2 border-b">Read</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} className="border-b">
                  <td className="px-4 py-2">{n.message}</td>
                  <td className="px-4 py-2">{n.createdAt && n.createdAt.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2">{n.receiverUid || '-'}</td>
                  <td className="px-4 py-2">{n.read ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}



export default Notifications; 