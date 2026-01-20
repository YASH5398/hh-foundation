import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SendHelp from '../help/SendHelp';

const UplinePayment = () => {
  const { currentUser } = useAuth();
  const [pendingUplinePayments, setPendingUplinePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'uplinePayments'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payments = [];
      snapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() });
      });
      setPendingUplinePayments(payments);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching upline payments:', err);
      setError('Failed to load pending upline payments.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleConfirmUplinePayment = async (paymentId, senderId, level, amount) => {
    setLoading(true);
    setError('');
    try {
      // Update uplinePayment status to Completed
      const paymentRef = doc(db, 'uplinePayments', paymentId);
      await updateDoc(paymentRef, { status: 'Completed' });

      // Unblock sender's paymentBlocked status
      const senderRef = doc(db, 'users', senderId);
      await updateDoc(senderRef, { paymentBlocked: false, uplinePaymentDue: false });

      // Log in helpHistory
      await addDoc(collection(db, 'helpHistory'), {
        action: 'upline_payment_completed',
        receiverId: currentUser.uid,
        senderId: senderId,
        level: level,
        amount: amount,
        status: 'Completed',
        timestamp: serverTimestamp(),
        uplinePaymentDocId: paymentId,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error confirming upline payment:', err);
      setError('Failed to confirm upline payment. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <ErrorMessage message="Please log in to view your upline payment requests." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Upline Payments</h2>

        {error && <ErrorMessage message={error} />}

        {pendingUplinePayments.length === 0 ? (
          <p className="text-center text-gray-600">No pending upline payments at the moment.</p>
        ) : (
          <div className="space-y-4">
            {pendingUplinePayments.map((payment) => (
              <div key={payment.id} className="border p-4 rounded-md shadow-sm">
                <p><strong>Sender ID:</strong> {payment.senderId}</p>
                <p><strong>Level:</strong> {payment.level}</p>
                <p><strong>Amount:</strong> ₹{payment.amount}</p>
                <p><strong>Status:</strong> {payment.status}</p>
                {/* Display sender info: name, WhatsApp, UPI, userId, payment proof (requires fetching sender's user data) */}
                <button
                  onClick={() => handleConfirmUplinePayment(payment.id, payment.senderId, payment.level, payment.amount)}
                  className="mt-2 bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition"
                >
                  Confirm Upline Payment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UplinePayment;