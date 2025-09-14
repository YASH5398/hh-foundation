import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { FaBell, FaCheck, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '../../utils/addNotification';

const Notifications = ({ isAdmin }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', message: '', sendToAll: false, userId: '', useFirstName: false });
  const [sending, setSending] = useState(false);
  const [deliveryCount, setDeliveryCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('isRead', '==', false),
      where('type', 'in', ['userJoin', 'epinRequest']),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
      setLoading(false);
    });
    return unsub;
  }, [isAdmin]);

  const markAsRead = async (id, event) => {
    if (event) event.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleNotificationClick = (notification, event) => {
    if (event) event.stopPropagation();
    // Only navigate for valid notification types and data
    if (notification.type === 'userJoin' && notification.userId) {
      markAsRead(notification.id);
      navigate(`/admin/user/${notification.userId}`);
    } else if (notification.type === 'epinRequest') {
      markAsRead(notification.id);
      navigate('/admin/epin-requests');
    } else {
      // Just mark as read, no navigation
      markAsRead(notification.id);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSending(true);
    let count = 0;
    if (form.sendToAll) {
      // Send to all users
      const usersSnap = await getDocs(collection(db, 'users'));
      await Promise.all(usersSnap.docs.map(async userDoc => {
        const userData = userDoc.data();
        const uid = userDoc.id; // Firestore UID
        const firstName = userData.fullName ? userData.fullName.split(' ')[0] : '';
        let personalizedMessage = form.message;
        if (personalizedMessage.includes('{firstName}')) {
          personalizedMessage = personalizedMessage.replace('{firstName}', firstName);
        }
        await addNotification({
          uid: uid, // Always use Firestore UID
          userId: userData.userId,
          title: form.title,
          message: personalizedMessage,
          type: 'admin',
          isRead: false,
          sentBy: 'admin',
        });
        count++;
      }));
    } else if (form.userId) {
      // Send to one user by userId
      const userSnap = await getDocs(query(collection(db, 'users'), where('userId', '==', form.userId)));
      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();
        const uid = userDoc.id; // Firestore UID
        const firstName = userData.fullName ? userData.fullName.split(' ')[0] : '';
        let personalizedMessage = form.message;
        if (personalizedMessage.includes('{firstName}')) {
          personalizedMessage = personalizedMessage.replace('{firstName}', firstName);
        }
        await addNotification({
          uid: uid, // Always use Firestore UID
          userId: userData.userId,
          title: form.title,
          message: personalizedMessage,
          type: 'admin',
          isRead: false,
          sentBy: 'admin',
        });
        count = 1;
      }
    }
    setDeliveryCount(count);
    setSending(false);
    setForm({ title: '', message: '', sendToAll: false, userId: '', useFirstName: false });
  };

  // Notification message rendering
  const renderMessage = (n) => {
    if (n.type === 'userJoin') return `New user registered: ${n.message || ''}`;
    if (n.type === 'epinRequest') return `E-PIN requested by ${n.message || ''}`;
    return n.message;
  };

  return (
    <div className="relative">
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <FaBell className="text-2xl text-gray-700" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
            {notifications.length}
          </span>
        )}
      </button>
      {/* Dropdown/drawer */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white shadow-lg rounded-lg z-50 border border-gray-200 p-2 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-800">Notifications</span>
            <button className="text-xs text-gray-500" onClick={() => setOpen(false)}>Close</button>
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No new notifications</div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map(n => {
                // Only allow navigation for valid types
                const canNavigate = (n.type === 'userJoin' && n.userId) || n.type === 'epinRequest';
                return (
                  <div
                    key={n.id}
                    className={`flex items-center justify-between bg-gray-50 rounded p-3 shadow-sm hover:bg-gray-100 transition ${canNavigate ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={canNavigate ? (e) => handleNotificationClick(n, e) : undefined}
                  >
                    <div className="flex-1 text-sm text-gray-800 pr-2">{renderMessage(n)}</div>
                    <div className="flex gap-1">
                      {canNavigate && (
                        <button
                          className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-xs border border-blue-200 rounded"
                          onClick={e => handleNotificationClick(n, e)}
                          aria-label="View"
                        >
                          <FaEye className="inline-block" /> View
                        </button>
                      )}
                      <button
                        className="text-green-600 hover:text-green-800 p-1 flex items-center gap-1 text-xs border border-green-200 rounded"
                        onClick={e => markAsRead(n.id, e)}
                        aria-label="Mark as read"
                      >
                        <FaCheck className="inline-block" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSendNotification} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-3">
        <div className="flex gap-2">
          <input name="title" value={form.title} onChange={handleFormChange} required placeholder="Title" className="flex-1 border p-2 rounded" />
          <input name="message" value={form.message} onChange={handleFormChange} required placeholder="Message (use {firstName} for personalization)" className="flex-1 border p-2 rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1"><input type="checkbox" name="sendToAll" checked={form.sendToAll} onChange={handleFormChange} /> Send to All Users</label>
          <input name="userId" value={form.userId} onChange={handleFormChange} placeholder="User ID (optional)" className="flex-1 border p-2 rounded" disabled={form.sendToAll} />
          <label className="flex items-center gap-1"><input type="checkbox" name="useFirstName" checked={form.useFirstName} onChange={handleFormChange} /> Use First Name</label>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold" disabled={sending}>{sending ? 'Sending...' : 'Send Notification'}</button>
        {deliveryCount > 0 && <div className="text-green-600 font-semibold">Delivered to {deliveryCount} user(s)</div>}
      </form>
      {/* Below the form, list all admin notifications (type: 'admin') with delivery count if possible. */}
    </div>
  );
};

export default Notifications; 