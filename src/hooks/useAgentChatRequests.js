import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export const useAgentChatRequests = (isAgent = false) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAgent) {
      setLoading(false);
      return;
    }

    // Listen for pending chat requests
    const chatRequestsRef = collection(db, 'agentChatRequests');
    const q = query(
      chatRequestsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setPendingRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to chat requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAgent]);

  return {
    pendingRequests,
    loading
  };
};
