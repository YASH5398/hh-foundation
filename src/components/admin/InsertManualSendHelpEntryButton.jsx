import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';

const MANUAL_DOC_ID = 'HHF724868_HHF251839_1720242126000';
const MANUAL_DATA = {
  senderId: 'HHF251839',
  senderUid: 'SCk5GMwN3TUClEd0cNienNuJ10z2',
  senderName: 'Ravi Kumar',
  senderPhone: '9876543210',
  senderWhatsapp: '9876543210',
  senderProfileImage: '',
  receiverId: 'HHF724868',
  receiverUid: '78IdmRfawILxgEU4pMpS',
  receiverName: 'Suman Raja',
  receiverPhone: '9876543210',
  receiverWhatsapp: '9876543210',
  receiverProfileImage: '',
  amount: 300,
  status: 'Pending',
  confirmedByReceiver: false,
  paymentDetails: {
    method: 'PhonePe',
    screenshotUrl: '',
    utrNumber: '',
    bank: {
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      bankName: ''
    },
    upi: '',
    gpay: '',
    phonePe: ''
  },
  timestamp: 1720242126000,
  createdAt: serverTimestamp()
};

export default function InsertManualSendHelpEntryButton() {
  const [loading, setLoading] = useState(false);

  const handleInsert = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'sendHelp', MANUAL_DOC_ID), MANUAL_DATA);
      toast.success('Manual SendHelp entry inserted successfully!');
    } catch (e) {
      toast.error('Failed to insert manual entry: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleInsert}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
      Insert Manual SendHelp Entry
    </button>
  );
} 