import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const FORCE_RECEIVER_DOC = 'globalSettings/forceReceiver';

export default function ForceReceiverAssignment() {
  const { userClaims } = useAuth();
  const [receiverUserId, setReceiverUserId] = useState('');
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = userClaims && (userClaims.admin === true || userClaims.role === 'admin');

  useEffect(() => {
    const fetchCurrent = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, FORCE_RECEIVER_DOC));
        if (docSnap.exists()) {
          setCurrent(docSnap.data());
        } else {
          setCurrent(null);
        }
      } catch (err) {
        setError('Failed to fetch current forced receiver.');
      }
      setLoading(false);
    };
    fetchCurrent();
  }, []);

  const handleSet = async () => {
    setSaving(true);
    setError('');
    try {
      if (!receiverUserId.trim()) {
        setError('Receiver User ID is required.');
        setSaving(false);
        return;
      }
      // Fetch user by userId
      const q = query(collection(db, 'users'), where('userId', '==', receiverUserId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Invalid User ID. No user found.');
        setSaving(false);
        return;
      }
      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      const receiverUid = userDoc.id;
      await setDoc(doc(db, FORCE_RECEIVER_DOC), {
        enabled: true,
        receiverUserId: receiverUserId.trim(),
        receiverUid,
        setBy: userClaims?.uid || '',
        setAt: new Date(),
      });
      toast.success('Forced receiver set!');
      setCurrent({ enabled: true, receiverUserId: receiverUserId.trim(), receiverUid });
      setError('');
    } catch (err) {
      setError('Failed to set forced receiver.');
    }
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteDoc(doc(db, FORCE_RECEIVER_DOC));
      toast.success('Force assignment cleared.');
      setCurrent(null);
      setReceiverUserId('');
    } catch (err) {
      setError('Failed to clear force assignment.');
    }
    setSaving(false);
  };

  if (!isAdmin) {
    return <div className="text-center text-red-600 font-bold py-8">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Force Receiver Assignment</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {current && current.enabled ? (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-gray-700">Current Forced Receiver:</div>
              <div className="font-bold text-blue-700">User ID: {current.receiverUserId}</div>
              <div className="font-mono text-xs text-gray-500">UID: {current.receiverUid}</div>
            </div>
          ) : (
            <div className="mb-4 text-gray-500">No forced receiver set.</div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">Receiver User ID</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              value={receiverUserId}
              onChange={e => setReceiverUserId(e.target.value)}
              placeholder="e.g. HHF139909"
              disabled={saving}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-60"
              disabled={saving || !receiverUserId.trim()}
            >
              ✅ Set as Forced Receiver
            </button>
            <button
              onClick={handleClear}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold disabled:opacity-60"
              disabled={saving || !current}
            >
              ❌ Clear Assignment
            </button>
          </div>
          {error && <div className="text-red-600 mt-4">{error}</div>}
        </>
      )}
    </div>
  );
} 