import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const SendHelpContext = createContext();

export const useSendHelp = () => {
  return useContext(SendHelpContext);
};

export const SendHelpProvider = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceiver = useCallback(async (user) => {
    if (!user || !user.uid || !user.level) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);

    try {
      // 1. Check for existing Send Help doc (pending or confirmed)
      const q = query(
        collection(db, 'sendHelp'),
        where('senderUid', '==', user.uid),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        const receiverRef = doc(db, 'users', docData.receiverUid);
        const receiverSnap = await getDoc(receiverRef);
        if (receiverSnap.exists()) {
          const receiver = { uid: receiverSnap.id, ...receiverSnap.data() };
          setSelectedReceiver(receiver);
          localStorage.setItem('selectedReceiver', JSON.stringify(receiver));
          return;
        }
      }

      // 2. If no existing, assign a new eligible receiver
      const eligibleReceiversQuery = query(
        collection(db, 'users'),
        where('isActivated', '==', true),
        where('isBlocked', '==', false),
        where('isReceivingHeld', '==', false),
        where('level', '==', user.level)
      );
      const allReceivers = await getDocs(eligibleReceiversQuery);
      const LEVEL_HELP_LIMIT = { Star: 3, Silver: 9, Gold: 27, Platinum: 81, Diamond: 243 };
      let eligibleReceivers = [];
      for (const doc of allReceivers.docs) {
        const receiver = { uid: doc.id, ...doc.data() };
        if (!receiver.userId || receiver.userId === user.userId) continue;
        
        const helpsSnapshot = await getDocs(query(
          collection(db, 'receiveHelp'),
          where('receiverId', '==', receiver.userId),
          where('confirmedByReceiver', '==', true),
          where('level', '==', receiver.level)
        ));
        const confirmedCount = helpsSnapshot.size;
        const requiredHelps = LEVEL_HELP_LIMIT[receiver.level] || 3;
        if (confirmedCount >= requiredHelps) continue;
        
        eligibleReceivers.push(receiver);
      }

      eligibleReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

      if (eligibleReceivers.length > 0) {
        setSelectedReceiver(eligibleReceivers[0]);
        localStorage.setItem('selectedReceiver', JSON.stringify(eligibleReceivers[0]));
      } else {
        setSelectedReceiver(null);
        throw new Error('No eligible receiver found. All receivers have reached their help limit.');
      }
    } catch (err) {
      console.error('Receiver fetch failed:', err);
      throw new Error('Failed to fetch eligible receiver.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prefetch data when user is available
    if (currentUser) {
      fetchReceiver(currentUser);
    }
  }, [currentUser, fetchReceiver]);

  const value = {
    selectedReceiver,
    isLoading,
    fetchReceiver,
  };

  return (
    <SendHelpContext.Provider value={value}>
      {children}
    </SendHelpContext.Provider>
  );
};