import { useState, useEffect, useCallback } from 'react';
import { doc, collection, query, where, getDocs, runTransaction, getDoc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getActiveSendHelp, listenToSendHelpByUserId } from '../services/helpService';
import { toast } from 'react-hot-toast';

export function useSendHelpLogic(user) {
  const [sendHelp, setSendHelp] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noEligibleReceiver, setNoEligibleReceiver] = useState(false);

  // Helper to validate user document fields
  const validateUserDoc = async (uid) => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      throw new Error('Your user profile does not exist. Please contact support.');
    }
    const data = userDocSnap.data();
    if (
      typeof data.isActivated !== 'boolean' ||
      typeof data.levelStatus === 'undefined' ||
      typeof data.referralCount === 'undefined' ||
      typeof data.userId === 'undefined' ||
      typeof data.fullName === 'undefined'
    ) {
      throw new Error('Your user profile is missing required fields. Please contact support.');
    }
    return data;
  };

  const assignReceiver = useCallback(async () => {
    setIsLoading(true);
    setNoEligibleReceiver(false);
    setError('');
    
    try {
      // Step 1: Validate user authentication
      if (!user || !user.uid) {
        throw new Error('You must be logged in to send help.');
      }

      // Step 2: Validate sender's user document
      const userData = await validateUserDoc(user.uid);
      const senderId = userData.userId; // HHF code
      const senderName = userData.fullName || userData.name || '';
      const senderLevelStatus = userData.levelStatus;
      const senderUid = user.uid; // Firebase UID

      console.log('SendHelp: Sender data:', {
        senderId,
        senderName,
        senderLevelStatus,
        senderUid
      });

      // Step 3: Fetch all users from the users collection
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const allUsers = usersSnap.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      }));

      console.log('SendHelp: All users fetched from Firestore:', allUsers.length);

      // Step 4: Filter users according to criteria
      let eligibleReceivers = [];
      console.log('SendHelp: Starting to filter users with conditions:', {
        totalUsers: allUsers.length,
        requiredConditions: ['isActivated == true', 'helpVisibility == true', 'isOnHold == false', 'isReceivingHeld == false', 'isBlocked == false']
      });
      
      for (const userDoc of allUsers) {
        // Check if user is activated
        if (!userDoc.isActivated) {
          console.log('SendHelp: Filtered out user (not activated):', userDoc.userId);
          continue;
        }

        // Check helpVisibility
        if (!userDoc.helpVisibility) {
          console.log('SendHelp: Filtered out user (helpVisibility false):', userDoc.userId);
          continue;
        }

        // Check if user is on hold
        if (userDoc.isOnHold) {
          console.log('SendHelp: Filtered out user (isOnHold true):', userDoc.userId);
          continue;
        }

        // Check if user is receiving held
        if (userDoc.isReceivingHeld) {
          console.log('SendHelp: Filtered out user (isReceivingHeld true):', userDoc.userId);
          continue;
        }

        // Check if user is blocked
        if (userDoc.isBlocked) {
          console.log('SendHelp: Filtered out user (isBlocked true):', userDoc.userId);
          continue;
        }

        // Check if userId is defined and not empty
        if (!userDoc.userId || userDoc.userId.trim() === '') {
          console.log('SendHelp: Filtered out user (missing or empty userId):', userDoc);
          continue;
        }

        // Avoid assigning help to self
        if (userDoc.userId === senderId) {
          console.log('SendHelp: Filtered out user (same userId as sender):', userDoc.userId);
          continue;
        }

        // User passed all filters, add to eligible list
        console.log('SendHelp: User passed all filters:', {
          userId: userDoc.userId,
          isActivated: userDoc.isActivated,
          helpVisibility: userDoc.helpVisibility,
          isOnHold: userDoc.isOnHold,
          isReceivingHeld: userDoc.isReceivingHeld,
          isBlocked: userDoc.isBlocked
        });
        
        eligibleReceivers.push({
          uid: userDoc.uid,
          userId: userDoc.userId,
          fullName: userDoc.fullName || userDoc.name || '',
          referralCount: userDoc.referralCount || 0,
          paymentMethod: userDoc.paymentMethod || {}
        });
      }

      console.log('SendHelp: Eligible receivers after filtering:', eligibleReceivers);
      console.log('SendHelp: Query snapshot docs count:', allUsers.length);
      console.log('SendHelp: All fetched users data:', allUsers.map(user => ({
        userId: user.userId,
        isActivated: user.isActivated,
        helpVisibility: user.helpVisibility,
        isOnHold: user.isOnHold,
        isReceivingHeld: user.isReceivingHeld,
        isBlocked: user.isBlocked
      })));

      // Step 5: Check if any eligible receivers found
      if (eligibleReceivers.length === 0) {
        console.log('SendHelp: No eligible receivers found, trying fallback to first active user');
        
        // Fallback: Pick the first active user from users collection
        const fallbackUser = allUsers.find(user => 
          user.isActivated && 
          user.userId && 
          user.userId.trim() !== '' && 
          user.userId !== senderId
        );
        
        if (fallbackUser) {
          console.log('SendHelp: Found fallback user:', fallbackUser.userId);
          eligibleReceivers.push({
            uid: fallbackUser.uid,
            userId: fallbackUser.userId,
            fullName: fallbackUser.fullName || fallbackUser.name || '',
            referralCount: fallbackUser.referralCount || 0,
            paymentMethod: fallbackUser.paymentMethod || {}
          });
        } else {
          console.log('SendHelp: No fallback user found either');
          const errorMessage = 'No eligible receiver';
          toast.error(errorMessage);
          setNoEligibleReceiver(true);
          setError(errorMessage);
          setIsLoading(false);
          return false;
        }
      }

      // Step 6: Sort by referralCount descending and pick the first user
      eligibleReceivers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
      const receiver = eligibleReceivers[0];

      console.log('SendHelp: Selected receiver:', receiver);

      // Step 7: Validate receiver data
      if (!receiver.userId) {
        console.error('SendHelp error: Receiver userId is missing', receiver);
        throw new Error('Receiver userId is missing');
      }

      if (!receiver.fullName) {
        console.error('SendHelp error: Receiver fullName is missing', receiver);
        throw new Error('Receiver fullName is missing');
      }

      const receiverId = receiver.userId; // HHF code
      const receiverName = receiver.fullName;
      const receiverUid = receiver.uid; // Firebase UID

      // Validate receiver Firebase UID
      if (!receiverUid) {
        console.error('SendHelp error: Receiver Firebase UID is missing', receiver);
        throw new Error('Receiver Firebase UID is required for security');
      }

      // Step 8: Generate custom document ID
      const docId = `${receiverId}_${senderId}`;
      // Step 9: Prepare payment details with exact structure as specified
      const paymentDetails = {
        paymentMethod: "PhonePe",
        gpay: "9876543210",
        phonePe: "9876543210",
        upi: "sourav@upi",
        utrNumber: "UTR12345678",
        screenshotUrl: "https://example.com/pay.jpg",
        bank: {
          accountHolder: "Sourav Kumar",
          accountNumber: "1234567890",
          bankName: "State Bank of India",
          ifsc: "SBIN0001234"
        }
      };
      // Step 10: Create the document data structure with exact field order
      const helpDocData = {
          amount: 300,
        confirmedByReceiver: false,
        paymentDetails,
        receiverId,
        receiverName,
        receiverUid,
        senderId,
        senderName,
        senderUid,
        status: "pending",
        timestamp: serverTimestamp()
      };
      // Debug: Log the critical fields for Firestore rules
      console.log('sendHelpDocData:', helpDocData);
      console.log('user.uid:', user.uid, 'receiverUid:', receiverUid);
      // Step 11: Existence check and create sendHelp document
      const sendHelpDocRef = doc(db, 'sendHelp', docId);
      const sendHelpDocSnap = await getDoc(sendHelpDocRef);
      if (!sendHelpDocSnap.exists()) {
      await setDoc(sendHelpDocRef, helpDocData);
        console.log('SendHelp: Created sendHelp document with ID:', docId);
      } else {
        console.log('SendHelp: sendHelp document already exists. Skipping creation.');
      }
      // Step 12: Existence check and create receiveHelp document
      const receiveHelpDocRef = doc(db, 'receiveHelp', docId);
      const receiveHelpDocSnap = await getDoc(receiveHelpDocRef);
      if (!receiveHelpDocSnap.exists()) {
      await setDoc(receiveHelpDocRef, helpDocData);
        console.log('SendHelp: Created receiveHelp document with ID:', docId);
      } else {
        console.log('SendHelp: receiveHelp document already exists. Skipping creation.');
      }
      // Step 13: Set local state
      const sendHelpWithId = { ...helpDocData, id: docId };
      setSendHelp(sendHelpWithId);
      setStatus('pending');
      toast.success('Help request created successfully!');
      setIsLoading(false);
      return true;

    } catch (err) {
      console.error('SendHelp error:', err);
      const message = err.message || 'Failed to assign receiver.';
      toast.error(message);
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    setNoEligibleReceiver(false);
    const setup = async () => {
      try {
          await assignReceiver();
      } catch (err) {
        setIsLoading(false);
      }
    };
    setup();
  }, [user, assignReceiver]);

  const markAsPaid = async () => {
    if (!sendHelp || sendHelp.status !== 'pending') return;

    setIsLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const sendHelpDocRef = doc(db, 'sendHelp', sendHelp.id);
        const receiveHelpDocRef = doc(db, 'receiveHelp', sendHelp.id);

        transaction.update(sendHelpDocRef, { status: 'paid' });
        transaction.update(receiveHelpDocRef, { status: 'paid' });
      });
      setStatus('paid');
      setIsLoading(false);
    } catch (err) {
      let message = err.message || 'Failed to update payment status.';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    }
  };

  return {
    sendHelp,
    status,
    error,
    loading: isLoading,
    isLoading,
    markAsPaid,
    assignReceiver,
    noEligibleReceiver,
    // Additional properties for SendHelp component
    hasActiveHelp: sendHelp && sendHelp.status !== 'completed',
    selectedReceiver: sendHelp?.receiver || null,
    currentStep: sendHelp ? 'receiver' : 'status',
    paymentMethod: null,
    utr: '',
    screenshot: null,
    submitting: isLoading,
    activeSendHelp: sendHelp,
    handleActivate: assignReceiver,
    handleProceedToPayment: () => {},
    handlePaymentMethodSelect: () => {},
    handleScreenshotChange: () => {},
    handleSubmitProof: () => {},
    handleReturnToDashboard: () => {},
    setUtr: () => {}
  };
}