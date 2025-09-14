import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  writeBatch,
  increment,
  getDocs,
  startAfter
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const useReceiveHelp = () => {
  const { user } = useAuth();
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState({
    totalReceivers: 0,
    activeRequests: 0,
    completedToday: 0
  });

  // Fetch eligible receivers with filters
  const fetchReceivers = useCallback(async (filters = {}, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setReceivers([]);
        setLastDoc(null);
      }

      const { levelFilter = 'all', searchQuery = '', pageSize = 10 } = filters;
      
      // Build query constraints
      const constraints = [
        where('isReceivingHeld', '==', false),
        where('isOnHold', '==', false),
        orderBy('referralCount', 'desc'),
        orderBy('createdAt', 'asc')
      ];

      // Add level filter if specified
      if (levelFilter && levelFilter !== 'all') {
        constraints.splice(2, 0, where('levelStatus', '==', levelFilter));
      }

      // Add pagination
      if (loadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      constraints.push(limit(pageSize));

      const q = query(collection(db, 'users'), ...constraints);
      const snapshot = await getDocs(q);
      
      let newReceivers = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));

      // Apply search filter on client side (for name/userId)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        newReceivers = newReceivers.filter(receiver => 
          receiver.fullName?.toLowerCase().includes(searchLower) ||
          receiver.userId?.toLowerCase().includes(searchLower)
        );
      }

      // Fetch pending help requests for each receiver
      const receiversWithHelp = await Promise.all(
        newReceivers.map(async (receiver) => {
          const helpQuery = query(
            collection(db, 'receiveHelp'),
            where('receiverUid', '==', receiver.uid),
            where('status', '==', 'Pending')
          );
          const helpSnapshot = await getDocs(helpQuery);
          
          return {
            ...receiver,
            pendingHelp: helpSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          };
        })
      );

      if (loadMore) {
        setReceivers(prev => [...prev, ...receiversWithHelp]);
      } else {
        setReceivers(receiversWithHelp);
      }

      // Update pagination state
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === pageSize);

    } catch (err) {
      console.error('Error fetching receivers:', err);
      setError(err.message);
      toast.error('Failed to load receivers');
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      // Total eligible receivers
      const totalQuery = query(
        collection(db, 'users'),
        where('isReceivingHeld', '==', false),
        where('isOnHold', '==', false)
      );
      const totalSnapshot = await getDocs(totalQuery);
      
      // Active requests (pending help)
      const activeQuery = query(
        collection(db, 'receiveHelp'),
        where('status', '==', 'Pending')
      );
      const activeSnapshot = await getDocs(activeQuery);
      
      // Completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedQuery = query(
        collection(db, 'receiveHelp'),
        where('status', '==', 'confirmed'),
        where('confirmationTime', '>=', today)
      );
      const completedSnapshot = await getDocs(completedQuery);
      
      setStats({
        totalReceivers: totalSnapshot.size,
        activeRequests: activeSnapshot.size,
        completedToday: completedSnapshot.size
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Create send help request
  const createSendHelp = useCallback(async (receiverData, paymentData) => {
    if (!user) {
      toast.error('Please login to send help');
      return null;
    }

    try {
      const timestamp = Date.now();
      const docId = `${receiverData.uid}_${user.uid}_${timestamp}`;
      
      // Upload screenshot if provided
      let screenshotUrl = null;
      if (paymentData.screenshot) {
        const screenshotRef = ref(storage, `payment-screenshots/${docId}`);
        const uploadResult = await uploadBytes(screenshotRef, paymentData.screenshot);
        screenshotUrl = await getDownloadURL(uploadResult.ref);
      }

      // Get sender details
      const senderDoc = await getDoc(doc(db, 'users', user.uid));
      const senderData = senderDoc.data();

      const sendHelpData = {
        receiverId: receiverData.userId,
        receiverUid: receiverData.uid,
        receiverName: receiverData.fullName,
        receiverPhone: receiverData.phone,
        receiverWhatsapp: receiverData.whatsapp,
        receiverEmail: receiverData.email,
        senderId: senderData.userId,
        senderUid: user.uid,
        senderName: senderData.fullName,
        senderPhone: senderData.phone,
        senderWhatsapp: senderData.whatsapp,
        senderEmail: senderData.email,
        amount: 300, // Fixed amount as per requirements
        status: 'Pending',
        confirmedByReceiver: false,
        confirmationTime: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timestamp: timestamp,
        paymentDetails: {
          bank: paymentData.method === 'bank' ? {
            name: receiverData.paymentMethod?.bank?.name || '',
            accountNumber: receiverData.paymentMethod?.bank?.accountNumber || '',
            bankName: receiverData.paymentMethod?.bank?.bankName || '',
            ifscCode: receiverData.paymentMethod?.bank?.ifscCode || '',
            method: 'bank'
          } : null,
          upi: paymentData.method !== 'bank' ? {
            upi: receiverData.paymentMethod?.upi || '',
            gpay: receiverData.paymentMethod?.gpay || '',
            phonePe: receiverData.paymentMethod?.phonePe || ''
          } : null,
          screenshotUrl,
          utrNumber: paymentData.utrNumber
        }
      };

      // Create the document with custom ID
      await setDoc(doc(db, 'sendHelp', docId), sendHelpData);
      
      toast.success('Payment submitted successfully! Receiver will be notified.');
      return docId;
    } catch (err) {
      console.error('Error creating send help:', err);
      toast.error('Failed to submit payment');
      throw err;
    }
  }, [user]);

  // Confirm payment received
  const confirmReceived = useCallback(async (sendHelpId) => {
    if (!user) {
      toast.error('Please login to confirm payment');
      return false;
    }

    try {
      const batch = writeBatch(db);
      
      // Update sendHelp document
      const sendHelpRef = doc(db, 'sendHelp', sendHelpId);
      batch.update(sendHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get the sendHelp document to extract details
      const sendHelpDoc = await getDoc(sendHelpRef);
      const sendHelpData = sendHelpDoc.data();

      if (sendHelpData) {
        // Update receiver's totalReceived
        const receiverRef = doc(db, 'users', sendHelpData.receiverUid);
        batch.update(receiverRef, {
          totalReceived: increment(sendHelpData.amount),
          updatedAt: serverTimestamp()
        });

        // Update sender's totalSent
        const senderRef = doc(db, 'users', sendHelpData.senderUid);
        batch.update(senderRef, {
          totalSent: increment(sendHelpData.amount),
          updatedAt: serverTimestamp()
        });

        // Update corresponding receiveHelp document if exists
        const receiveHelpQuery = query(
          collection(db, 'receiveHelp'),
          where('receiverUid', '==', sendHelpData.receiverUid),
          where('senderUid', '==', sendHelpData.senderUid)
        );
        const receiveHelpSnapshot = await getDocs(receiveHelpQuery);
        
        receiveHelpSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'confirmed',
            confirmedByReceiver: true,
            confirmationTime: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
      }

      await batch.commit();
      toast.success('Payment confirmed successfully!');
      return true;
    } catch (err) {
      console.error('Error confirming payment:', err);
      toast.error('Failed to confirm payment');
      return false;
    }
  }, [user]);

  // Set up real-time listener for user's receive help requests
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'receiveHelp'),
      where('receiverUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userReceiveHelp = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // You can emit this data to a context or state if needed
      // For now, we'll just log it
      console.log('User receive help updated:', userReceiveHelp);
    }, (err) => {
      console.error('Error listening to receive help:', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Load more receivers
  const loadMore = useCallback((filters) => {
    if (!loading && hasMore) {
      fetchReceivers(filters, true);
    }
  }, [fetchReceivers, loading, hasMore]);

  // Refresh data
  const refresh = useCallback((filters) => {
    setLastDoc(null);
    setHasMore(true);
    fetchReceivers(filters, false);
    fetchStats();
  }, [fetchReceivers, fetchStats]);

  return {
    receivers,
    loading,
    error,
    hasMore,
    stats,
    fetchReceivers,
    loadMore,
    refresh,
    createSendHelp,
    confirmReceived
  };
};

export default useReceiveHelp;