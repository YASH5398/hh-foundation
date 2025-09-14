import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';

const issueCategories = [
  'Login Issues', 'E-PIN Problems', 'Payment Issues', 'Referral Issues', 'Blocked or Frozen Status',
  'Level Upgrade Issues', 'Profile Errors', 'Notification Delivery', 'Data Inconsistencies', 'Miscellaneous Flags'
];
const statusOptions = ['All', 'Resolved', 'Unresolved'];

function UserFullDataViewer({ userData, epins, notifications, supportMessages }) {
  if (!userData) return null;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-8 w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-center">User Full Data</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><b>UID:</b> {userData.uid}</div>
        <div><b>User ID:</b> {userData.userId}</div>
        <div><b>Full Name:</b> {userData.fullName}</div>
        <div><b>Email:</b> {userData.email}</div>
        <div><b>Phone:</b> {userData.phone}</div>
        <div><b>WhatsApp:</b> {userData.whatsapp}</div>
        <div><b>Sponsor ID:</b> {userData.sponsorId}</div>
        <div><b>Upline ID:</b> {userData.uplineId}</div>
        <div><b>Is Activated:</b> {userData.isActivated ? 'Yes' : 'No'}</div>
        <div><b>Is Blocked:</b> {userData.isBlocked ? 'Yes' : 'No'}</div>
        <div><b>Level:</b> {userData.level}</div>
        <div><b>Level Status:</b> {userData.levelStatus}</div>
        <div><b>Registration Time:</b> {userData.registrationDate ? new Date(userData.registrationDate.seconds * 1000).toLocaleString() : '-'}</div>
        <div><b>Device Info:</b> {userData.deviceInfo || '-'}</div>
        <div><b>Total Referrals:</b> {userData.totalReferrals || '-'}</div>
        <div><b>Total Team:</b> {userData.totalTeam || '-'}</div>
        <div><b>Total Earnings:</b> {userData.totalEarnings || '-'}</div>
        <div><b>Payment Method:</b> {userData.paymentMethod ? JSON.stringify(userData.paymentMethod) : '-'}</div>
        <div><b>Bank Details:</b> {userData.bank ? JSON.stringify(userData.bank) : '-'}</div>
        <div><b>Help Received:</b> {userData.helpReceived || '-'}</div>
        <div><b>Help Sent:</b> {userData.helpSent || '-'}</div>
      </div>
      <div className="mt-4 flex flex-col items-center">
        {userData.profileImage && <img src={userData.profileImage} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200 shadow mb-2" />}
      </div>
      <div className="mt-4">
        <b>E-PINs:</b>
        <ul className="list-disc ml-6">
          {epins && epins.length > 0 ? epins.map(e => <li key={e.id}>{e.code} - {e.status}</li>) : <li>No E-PINs</li>}
        </ul>
      </div>
      <div className="mt-4">
        <b>Notifications:</b>
        <ul className="list-disc ml-6">
          {notifications && notifications.length > 0 ? notifications.slice(0, 5).map(n => <li key={n.id}>{n.message} ({n.createdAt && n.createdAt.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : '-'})</li>) : <li>No notifications</li>}
        </ul>
      </div>
      <div className="mt-4">
        <b>Support Messages:</b>
        <ul className="list-disc ml-6">
          {supportMessages && supportMessages.length > 0 ? supportMessages.slice(0, 5).map(s => <li key={s.id}>{s.message} ({s.createdAt && s.createdAt.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleString() : '-'})</li>) : <li>No support messages</li>}
        </ul>
      </div>
    </div>
  );
}

function UserIssueScanner() {
  const [userId, setUserId] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', date: '' });
  const [note, setNote] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userData, setUserData] = useState(null);
  const [epins, setEpins] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);

  // Dummy smart issue detection (replace with real logic as needed)
  const scanUser = async () => {
    setLoading(true);
    setIssues([]);
    // Simulate analysis delay
    setTimeout(() => {
      setIssues([
        {
          id: '1',
          type: 'Login Issues',
          title: 'Account Blocked',
          details: 'User account is currently blocked by admin.',
          status: 'Unresolved',
          timestamp: new Date().toISOString(),
          suggestion: 'Unblock user if issue is resolved.'
        },
        {
          id: '2',
          type: 'Payment Issues',
          title: 'Help Assigned but Not Confirmed',
          details: 'User has a pending help assignment that is not confirmed by receiver.',
          status: 'Unresolved',
          timestamp: new Date().toISOString(),
          suggestion: 'Contact receiver to confirm payment.'
        },
        {
          id: '3',
          type: 'Profile Errors',
          title: 'Missing Payment Method',
          details: 'User profile is missing payment method information.',
          status: 'Resolved',
          timestamp: new Date().toISOString(),
          suggestion: 'Ask user to update payment method.'
        }
      ]);
      setLoading(false);
    }, 1200);
  };

  const viewUserData = async () => {
    setLoading(true);
    setUserData(null);
    setEpins([]);
    setNotifications([]);
    setSupportMessages([]);
    // Fetch user doc
    const userQ = query(collection(db, 'users'), where('userId', '==', userId));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      setUserData({ ...userDoc.data(), uid: userDoc.id });
      // Fetch E-PINs
      const epinQ = query(collection(db, 'epins'), where('userId', '==', userId));
      const epinSnap = await getDocs(epinQ);
      setEpins(epinSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Fetch notifications
      const notifQ = query(collection(db, 'notifications'), where('receiverUid', '==', userDoc.id), orderBy('createdAt', 'desc'));
      const notifSnap = await getDocs(notifQ);
      setNotifications(notifSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Fetch support messages
      const supportQ = query(collection(db, 'supportMessages'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const supportSnap = await getDocs(supportQ);
      setSupportMessages(supportSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    setLoading(false);
  };

  const filteredIssues = issues.filter(issue =>
    (filters.type === 'All' || issue.type === filters.type) &&
    (filters.status === 'All' || issue.status === filters.status) &&
    (!filters.date || issue.timestamp.startsWith(filters.date))
  );

  const markResolved = (id) => {
    setIssues(issues.map(issue => issue.id === id ? { ...issue, status: 'Resolved' } : issue));
  };

  const handleAddNote = (id) => {
    setIssues(issues.map(issue => issue.id === id ? { ...issue, adminNote: note } : issue));
    setNote('');
    setSelectedIssue(null);
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-8 flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">User Issue Scanner</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg mb-4">
          <input
            type="text"
            className="border rounded px-3 py-2 flex-1"
            placeholder="Enter User ID (e.g. HHF123456)"
            value={userId}
            onChange={e => setUserId(e.target.value)}
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded w-full sm:w-auto"
              onClick={scanUser}
              disabled={loading || !userId}
            >
              {loading ? 'Scanning...' : 'Scan Issues'}
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded w-full sm:w-auto"
              onClick={viewUserData}
              disabled={loading || !userId}
            >
              View Data
            </button>
          </div>
        </div>
        {userData && <UserFullDataViewer userData={userData} epins={epins} notifications={notifications} supportMessages={supportMessages} />}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full max-w-2xl">
          <select
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          >
            <option value="All">All Types</option>
            {issueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {filteredIssues.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">No issues found.</div>
          ) : filteredIssues.map(issue => (
            <div key={issue.id} className="bg-white rounded-xl shadow border border-gray-200 p-4 sm:p-5 flex flex-col gap-2 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="font-bold text-lg text-indigo-700">{issue.title}</span>
                <span className={`sm:ml-auto px-2 py-1 rounded text-xs font-semibold ${issue.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status}</span>
              </div>
              <div className="text-gray-700 text-sm">{issue.details}</div>
              <div className="text-xs text-gray-500">⏰ {new Date(issue.timestamp).toLocaleString()}</div>
              <div className="text-xs text-gray-600">Type: {issue.type}</div>
              <div className="text-xs text-gray-600">Suggestion: {issue.suggestion}</div>
              {issue.adminNote && <div className="text-xs text-blue-700 bg-blue-50 rounded p-2">Admin Note: {issue.adminNote}</div>}
              <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
                {issue.status !== 'Resolved' && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded w-full sm:w-auto"
                    onClick={() => markResolved(issue.id)}
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1 rounded w-full sm:w-auto"
                  onClick={() => setSelectedIssue(issue.id)}
                >
                  Add Admin Note
                </button>
              </div>
              {selectedIssue === issue.id && (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    className="border rounded px-2 py-1"
                    placeholder="Enter admin note..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                  />
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded w-full sm:w-auto"
                    onClick={() => handleAddNote(issue.id)}
                  >
                    Save Note
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserIssueScanner; 