import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function fetchLatestSendHelp(userId) {
  const q = query(
    collection(db, 'sendHelp'),
    where('senderId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function fetchLatestReceiveHelp(userId) {
  const q = query(
    collection(db, 'receiveHelp'),
    where('receiverId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export function useLatestSendHelp(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchLatestSendHelp(userId)
      .then(doc => setData(doc))
      .catch(() => setError('Failed to fetch send help'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error };
}

export function useLatestReceiveHelp(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchLatestReceiveHelp(userId)
      .then(doc => setData(doc))
      .catch(() => setError('Failed to fetch receive help'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error };
} 