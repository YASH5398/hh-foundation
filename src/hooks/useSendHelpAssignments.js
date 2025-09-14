import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const fetchSendHelpAssignments = async (userId) => {
  const q = query(
    collection(db, 'sendHelp'),
    where('senderId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export function useSendHelpAssignments(userId) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchSendHelpAssignments(userId)
      .then(setAssignments)
      .catch(() => setError('Failed to fetch assignments'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { assignments, loading, error };
} 