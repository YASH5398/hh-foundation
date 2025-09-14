import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const levelOptions = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const ManageLevel = () => {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSearch = async () => {
    setMsg('');
    setUser(null);
    setEdit({});
    setLoading(true);
    let q;
    if (search.includes('@')) {
      q = query(collection(db, 'users'), where('email', '==', search));
    } else {
      q = query(collection(db, 'users'), where('userId', '==', search));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      const u = { ...snap.docs[0].data(), id: snap.docs[0].id };
      setUser(u);
      setEdit({
        level: u.level,
        levelStatus: u.levelStatus,
        referralCount: u.referralCount,
        totalTeam: u.totalTeam,
      });
    } else {
      setMsg('User not found');
    }
    setLoading(false);
  };

  const handleChange = e => {
    setEdit({ ...edit, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        level: Number(edit.level),
        levelStatus: edit.levelStatus,
        referralCount: Number(edit.referralCount),
        totalTeam: Number(edit.totalTeam),
      });
      setMsg('User updated successfully!');
    } catch (err) {
      setMsg('Error updating user.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage User Level</h2>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email or User ID" className="flex-1 p-2 border rounded" />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>Search</button>
      </div>
      {msg && <div className={msg.includes('success') ? 'text-green-600' : 'text-red-500'}>{msg}</div>}
      {user && (
        <div className="space-y-4 mt-4">
          <div><b>Name:</b> {user.fullName}</div>
          <div><b>Email:</b> {user.email}</div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm">Level</label>
              <input name="level" type="number" min={1} value={edit.level} onChange={handleChange} className="p-2 border rounded w-24" />
            </div>
            <div>
              <label className="block text-sm">Level Status</label>
              <select name="levelStatus" value={edit.levelStatus} onChange={handleChange} className="p-2 border rounded">
                {levelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm">Referral Count</label>
              <input name="referralCount" type="number" min={0} value={edit.referralCount} onChange={handleChange} className="p-2 border rounded w-24" />
            </div>
            <div>
              <label className="block text-sm">Total Team</label>
              <input name="totalTeam" type="number" min={0} value={edit.totalTeam} onChange={handleChange} className="p-2 border rounded w-24" />
            </div>
          </div>
          <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      )}
    </div>
  );
};

export default ManageLevel; 