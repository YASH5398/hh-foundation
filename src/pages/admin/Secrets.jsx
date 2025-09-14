import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LEVELS = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const ADMIN_EMAILS = ['hellosuman765@gmail.com'];

function Secrets() {
  const { user } = useAuth();
  const [tab, setTab] = useState('assignment');

  // Manual Receiver Assignment State
  const [receiverId, setReceiverId] = useState('');
  const [count, setCount] = useState(1);
  const [status, setStatus] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [level, setLevel] = useState('Star');

  // User Management State
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [levelEdit, setLevelEdit] = useState({});

  // Fetch assignments
  const fetchAssignments = async () => {
    const q = query(collection(db, 'manualReceiverQueue'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setAssignments(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
  };
  useEffect(() => { fetchAssignments(); }, []);

  // Fetch users
  useEffect(() => {
    if (tab !== 'users') return;
    const fetchUsers = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, [tab]);

  // Assignment handlers
  const handleCreate = async () => {
    setStatus('');
    if (!receiverId || !count || count < 1 || !level) {
      setStatus('Please enter valid receiver ID, level, and count.');
      return;
    }
    const userQ = query(collection(db, 'users'), where('userId', '==', receiverId), where('isActivated', '==', true), where('isHiddenFromSite', '!=', true));
    const userSnap = await getDocs(userQ);
    if (userSnap.empty) {
      setStatus('Receiver not found or not eligible.');
      return;
    }
    try {
      await addDoc(collection(db, 'manualReceiverQueue'), {
        receiverId,
        count: Number(count),
        assignedCount: 0,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
        active: true,
        level,
      });
      setStatus('Assignment created.');
      setReceiverId('');
      setCount(1);
      setLevel('Star');
      fetchAssignments();
    } catch (err) {
      setStatus('Error: ' + (err.message || 'Could not create assignment.'));
    }
  };
  const handleCancel = async (id) => {
    try {
      await updateDoc(doc(db, 'manualReceiverQueue', id), { active: false });
      fetchAssignments();
    } catch {}
  };

  // User management handlers
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.userId || '').toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  });
  const handleActivate = async (u) => {
    await updateDoc(doc(db, 'users', u.id), { isActivated: true, adminActivated: true });
    setUsers(users.map(x => x.id === u.id ? { ...x, isActivated: true, adminActivated: true } : x));
    toast.success('User activated!');
  };
  const handleLevelChange = (u, level) => {
    setLevelEdit({ ...levelEdit, [u.id]: level });
  };
  const handleSetLevel = async (u) => {
    const level = levelEdit[u.id] || u.level || 'Star';
    await updateDoc(doc(db, 'users', u.id), { level, levelStatus: level });
    setUsers(users.map(x => x.id === u.id ? { ...x, level, levelStatus: level } : x));
    toast.success('Level updated!');
  };

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4 bg-white rounded-xl shadow">
      <div className="flex gap-4 mb-6">
        <button className={`px-4 py-2 rounded font-semibold ${tab==='assignment'?'bg-indigo-600 text-white':'bg-gray-200 text-gray-700'}`} onClick={()=>setTab('assignment')}>🔐 Manual Receiver Assignment</button>
        <button className={`px-4 py-2 rounded font-semibold ${tab==='users'?'bg-indigo-600 text-white':'bg-gray-200 text-gray-700'}`} onClick={()=>setTab('users')}>👤 User Management</button>
      </div>
      {tab === 'assignment' && (
        <>
          <h2 className="text-2xl font-bold mb-4">Manual Receiver Assignment</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="border rounded px-3 py-2 flex-1"
              placeholder="Receiver User ID (e.g. HHF987654)"
              value={receiverId}
              onChange={e => setReceiverId(e.target.value)}
            />
            <select
              className="border rounded px-3 py-2 w-36"
              value={level}
              onChange={e => setLevel(e.target.value)}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input
              type="number"
              className="border rounded px-3 py-2 w-32"
              min={1}
              value={count}
              onChange={e => setCount(e.target.value)}
            />
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded"
              onClick={handleCreate}
            >
              Create Assignment
            </button>
          </div>
          {status && <div className="text-sm mb-4 text-center text-gray-700">{status}</div>}
          <h3 className="text-lg font-semibold mb-2">Current Active Assignments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-xl">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Receiver ID</th>
                  <th className="px-4 py-2 border-b">Level</th>
                  <th className="px-4 py-2 border-b">Count</th>
                  <th className="px-4 py-2 border-b">Assigned</th>
                  <th className="px-4 py-2 border-b">Status</th>
                  <th className="px-4 py-2 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">No active assignments.</td></tr>
                ) : (
                  assignments.map(a => (
                    <tr key={a.id} className="border-b">
                      <td className="px-4 py-2">{a.receiverId}</td>
                      <td className="px-4 py-2">{a.level || '-'}</td>
                      <td className="px-4 py-2">{a.count}</td>
                      <td className="px-4 py-2">{a.assignedCount}</td>
                      <td className="px-4 py-2">{a.assignedCount} / {a.count} assigned</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                          onClick={() => handleCancel(a.id)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'users' && (
        <>
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <input
            className="border px-3 py-2 rounded mb-4 w-full max-w-md"
            placeholder="Search by userId, name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2">User ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Activated</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Referrals</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8">No users found.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{u.userId}</td>
                    <td className="px-3 py-2">{u.fullName}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.phone}</td>
                    <td className="px-3 py-2">{u.isActivated ? '✅' : '❌'}</td>
                    <td className="px-3 py-2">
                      <select
                        className="border rounded px-2 py-1"
                        value={levelEdit[u.id] || u.level || 'Star'}
                        onChange={e => handleLevelChange(u, e.target.value)}
                      >
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">{u.referralCount || 0}</td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                        disabled={u.isActivated}
                        onClick={() => handleActivate(u)}
                      >Activate ID</button>
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleSetLevel(u)}
                      >Set Level</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Secrets; 