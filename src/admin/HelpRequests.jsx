import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const statusOptions = ['all', 'pending', 'approved', 'rejected'];

const HelpRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'helpRequests'), where('status', '!=', null));
    const unsub = onSnapshot(q, async (snap) => {
      let reqs = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        let userName = '';
        if (data.requestBy) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.requestBy));
            if (userDoc.exists()) userName = userDoc.data().fullName || '';
          } catch {}
        }
        return { ...data, id: d.id, userName };
      }));
      setRequests(reqs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (id, action, adminEmail) => {
    setMsg('');
    setLoading(true);
    try {
      const update = { status: action };
      if (action === 'approved') {
        update.approvedBy = adminEmail;
        update.approvedAt = new Date();
      }
      await updateDoc(doc(db, 'helpRequests', id), update);
      setMsg('Request updated!');
    } catch {
      setMsg('Error updating request.');
    }
    setLoading(false);
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Help Requests</h2>
      <div className="flex gap-2 mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2 border rounded">
          {statusOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
        </select>
      </div>
      {msg && <div className={msg.includes('Error') ? 'text-red-500' : 'text-green-600'}>{msg}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Request By</th>
              <th className="p-2">User Name</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => (
              <tr key={req.id} className="border-b">
                <td className="p-2">{req.requestBy}</td>
                <td className="p-2">{req.userName}</td>
                <td className="p-2">₹{req.amount}</td>
                <td className="p-2">{req.status}</td>
                <td className="p-2">{req.createdAt && req.createdAt.toDate ? req.createdAt.toDate().toLocaleString() : ''}</td>
                <td className="p-2 flex gap-2">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(req.id, 'approved', 'admin@hhf.com')} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                      <button onClick={() => handleAction(req.id, 'rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="text-center py-4">Loading...</div>}
      {!loading && filtered.length === 0 && <div className="text-center py-4">No requests found.</div>}
    </div>
  );
};

export default HelpRequests; 