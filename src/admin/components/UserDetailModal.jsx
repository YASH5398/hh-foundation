import React, { useEffect, useState } from 'react';
import { getAllEpinsForUser } from '../../services/epin/epinService';
import { getUserByUserId } from '../../services/userService';
import { listenToSendHelps, listenToReceiveHelps } from '../../services/helpService';
import defaultAvatar from '../../assets/default-avatar.png';

const UserDetailModal = ({ user, onClose }) => {
  const [epins, setEpins] = useState([]);
  const [sponsorName, setSponsorName] = useState('');
  const [sendHelps, setSendHelps] = useState([]);
  const [receiveHelps, setReceiveHelps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch E-PINs
    getAllEpinsForUser(user.userId).then(res => {
      if (res.success) setEpins(res.epins);
    });
    // Fetch sponsor name
    if (user.sponsorId) {
      getUserByUserId(user.sponsorId).then(res => {
        if (res.success && res.data) setSponsorName(res.data.fullName || '');
      });
    }
    // Listen to sendHelp/receiveHelp
    const unsubSend = listenToSendHelps(user.uid, setSendHelps);
    const unsubRecv = listenToReceiveHelps(user.uid, setReceiveHelps);
    setLoading(false);
    return () => {
      if (unsubSend) unsubSend();
      if (unsubRecv) unsubRecv();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl" onClick={onClose}>&times;</button>
        <div className="flex flex-col items-center mb-4">
          <img
            src={user.profileImage || defaultAvatar}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow mb-2"
          />
          <h2 className="text-xl font-bold mb-1">{user.fullName}</h2>
          <div className="text-gray-500 text-sm">{user.email}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><b>Phone:</b> {user.phone}</div>
          <div><b>WhatsApp:</b> {user.whatsapp}</div>
          <div><b>User ID:</b> {user.userId}</div>
          <div><b>UID (Firebase):</b> {user.uid}</div>
          <div><b>Sponsor ID:</b> {user.sponsorId}</div>
          <div><b>Sponsor Name:</b> {sponsorName}</div>
          <div><b>Upline ID:</b> {user.uplineId}</div>
          <div><b>Registration Date:</b> {user.registrationTime && user.registrationTime.toDate ? user.registrationTime.toDate().toLocaleDateString() : '-'}</div>
          <div><b>Status:</b> {user.status || (user.isBlocked ? 'Blocked' : user.isActivated ? 'Active' : 'Inactive')}</div>
          <div><b>Is Activated:</b> {user.isActivated ? '✅' : '❌'}</div>
          <div><b>Is Blocked:</b> {user.isBlocked ? '✅' : '❌'}</div>
          <div><b>Current Level:</b> {user.level}</div>
          <div><b>Level Status:</b> {user.levelStatus}</div>
          <div><b>Referral Count:</b> {user.referralCount}</div>
          <div><b>Team Count:</b> {user.totalTeam}</div>
          <div><b>Help Received:</b> {user.helpReceived}</div>
          <div><b>Total Earnings:</b> ₹{user.totalEarnings}</div>
          <div><b>Total Sent:</b> ₹{user.totalSent}</div>
          <div><b>Total Received:</b> ₹{user.totalReceived}</div>
          <div><b>Next Level Payment Done:</b> {user.nextLevelPaymentDone ? '✅' : '❌'}</div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><b>Payment Method:</b> {user.paymentMethod?.type || user.paymentMethod?.method || '-'}</div>
            <div><b>UPI ID:</b> {user.paymentMethod?.upiId || user.upiId || '-'}</div>
            <div><b>Bank Account No:</b> {user.paymentMethod?.bank?.accountNumber || user.bankDetails?.accountNumber || '-'}</div>
            <div><b>Bank Name:</b> {user.paymentMethod?.bank?.bankName || user.bankDetails?.bankName || '-'}</div>
            <div><b>IFSC:</b> {user.paymentMethod?.bank?.ifscCode || user.bankDetails?.ifscCode || '-'}</div>
            <div><b>Holder Name:</b> {user.paymentMethod?.bank?.accountHolder || user.bankDetails?.accountHolder || '-'}</div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">E-PINs</h3>
          <ul className="list-disc ml-6">
            {epins.length > 0 ? epins.map(e => (
              <li key={e.id} className="mb-1">
                <span className="font-mono">{e.epin || e.code}</span> - <span className={e.status === 'used' ? 'text-red-600' : 'text-green-700'}>{e.status}</span>
              </li>
            )) : <li>No E-PINs</li>}
          </ul>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Send Help Records</h3>
          <ul className="list-disc ml-6 max-h-32 overflow-y-auto">
            {sendHelps.length > 0 ? sendHelps.map(h => (
              <li key={h.id}>
                To: {h.receiverId} | Amount: ₹{h.amount} | Status: {h.status}
              </li>
            )) : <li>No send help records</li>}
          </ul>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Receive Help Records</h3>
          <ul className="list-disc ml-6 max-h-32 overflow-y-auto">
            {receiveHelps.length > 0 ? receiveHelps.map(h => (
              <li key={h.id}>
                From: {h.senderId} | Amount: ₹{h.amount} | Status: {h.status}
              </li>
            )) : <li>No receive help records</li>}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded">Delete User</button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded">{user.isBlocked ? 'Unblock' : 'Block'} User</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Change Level/Status</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded">View Referred Users</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal; 