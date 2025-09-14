import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Eye, EyeOff, User, Users, RefreshCw, Edit, XCircle, List, Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LEVEL_LIMITS = {
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243,
};

function getMaxAllowed(level) {
  return LEVEL_LIMITS[level] || 3;
}

function getStatusColor(assigned, max) {
  if (assigned <= max) return 'text-green-600';
  return 'text-red-600';
}

function getStatusIcon(assigned, max) {
  if (assigned <= max) return '✅';
  return '⚠️';
}

export default function ManageHelpAssignments() {
  const [receivers, setReceivers] = useState([]);
  const [sendHelpMap, setSendHelpMap] = useState({});
  const [confirmedHelpMap, setConfirmedHelpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(null);
  const [unassignModal, setUnassignModal] = useState(null);
  const [confirmVisibility, setConfirmVisibility] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibilityAction, setVisibilityAction] = useState('hide');
  const [showHidden, setShowHidden] = useState(false);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Get all receivers (helpVisibility !== false)
      const usersSnap = await getDocs(query(collection(db, 'users'), where('isActivated', '==', true)));
      const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
      // 2. Get all sendHelp docs
      let sendHelpQ = collection(db, 'sendHelp');
      if (!showHidden) {
        sendHelpQ = query(sendHelpQ, where('isHidden', '!=', true));
      }
      const sendHelpSnap = await getDocs(sendHelpQ);
      const sendHelps = sendHelpSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // 3. Map receiverId to senders
      const map = {};
      for (const sh of sendHelps) {
        if (!map[sh.receiverId]) map[sh.receiverId] = [];
        map[sh.receiverId].push(sh);
      }
      setSendHelpMap(map);
      // 4. Get all confirmed receiveHelp docs
      const receiveHelpSnap = await getDocs(query(collection(db, 'receiveHelp'), where('confirmedByReceiver', '==', true)));
      const confirmedMap = {};
      receiveHelpSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!confirmedMap[data.receiverId]) confirmedMap[data.receiverId] = 0;
        confirmedMap[data.receiverId]++;
      });
      setConfirmedHelpMap(confirmedMap);
      setReceivers(users);
      setLoading(false);
    }
    fetchData();
  }, [refreshKey, showHidden]);

  // Toggle helpVisibility with confirmation
  const handleToggleVisibility = (receiver) => {
    setConfirmVisibility(receiver);
    setVisibilityAction(receiver.helpVisibility === false ? 'show' : 'hide');
  };

  const confirmToggleVisibility = async (receiver) => {
    if (receiver.helpVisibility === false) {
      // Show receiver
      await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: true, isReceivingHeld: false });
      toast.success(`Receiver ${receiver.userId} is now visible and eligible for assignments.`);
    } else {
      // Hide receiver
      await updateDoc(doc(db, 'users', receiver.uid), { helpVisibility: false, isReceivingHeld: true });
      toast.success(`Receiver ${receiver.userId} is now hidden and held.`);
    }
    setConfirmVisibility(null);
    setRefreshKey(k => k + 1);
  };

  // Unassign sender and trigger reassignment
  const handleUnassignSender = async (sendHelp) => {
    await deleteDoc(doc(db, 'sendHelp', sendHelp.id));
    await deleteDoc(doc(db, 'receiveHelp', sendHelp.id));
    toast.success(`Sender ${sendHelp.senderId} unassigned from ${sendHelp.receiverId}`);
    setUnassignModal(null);
    setRefreshKey(k => k + 1);
  };

  // Toggle isHidden for sendHelp doc
  const handleToggleHideSendHelp = async (sendHelp) => {
    const newHidden = !sendHelp.isHidden;
    await updateDoc(doc(db, 'sendHelp', sendHelp.id), { isHidden: newHidden });
    toast.success(`SendHelp ${newHidden ? 'hidden' : 'unhidden'}`);
    setRefreshKey(k => k + 1);
  };

  // Quick view modal for receiver
  const ReceiverProfileModal = ({ receiver, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose}><XCircle size={24} /></button>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="inline-block" /> {receiver.fullName || receiver.name || '-'} ({receiver.userId})</h3>
        <div className="mb-2"><b>Level:</b> {receiver.levelStatus}</div>
        <div className="mb-2"><b>Referral Count:</b> {receiver.referralCount}</div>
        <div className="mb-2"><b>Help Received:</b> {receiver.helpReceived}</div>
        <div className="mb-2"><b>Activation Status:</b> {receiver.isActivated ? 'Active' : 'Inactive'}</div>
        <div className="mb-2"><b>Blocked:</b> {receiver.isBlocked ? 'Yes' : 'No'}</div>
        <div className="mb-2"><b>Help Visibility:</b> {receiver.helpVisibility === false ? 'Hidden' : 'Visible'}</div>
        <div className="mb-2"><b>Last Senders:</b> {(sendHelpMap[receiver.userId] || []).map(sh => sh.senderId).join(', ')}</div>
      </div>
    </div>
  );

  // Unassign modal
  const UnassignModal = ({ receiver, onClose }) => {
    const assigned = sendHelpMap[receiver.userId] || [];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose}><XCircle size={24} /></button>
          <h3 className="text-lg font-bold mb-4">Assigned Senders for {receiver.userId}</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1">Sender ID</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map(sh => (
                  <tr key={sh.id}>
                    <td className="px-2 py-1 font-mono">{sh.senderId}</td>
                    <td className="px-2 py-1">{sh.status}</td>
                    <td className="px-2 py-1">
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleUnassignSender(sh)}>Remove & Reassign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation modal for visibility
  const ConfirmVisibilityModal = ({ receiver, onClose, onConfirm, action }) => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose}><XCircle size={24} /></button>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">{action === 'hide' ? <EyeOff className="inline-block" /> : <Eye className="inline-block" />} {action === 'hide' ? 'Hide Receiver?' : 'Show Receiver?'}</h3>
        <div className="mb-4">{action === 'hide' ? 'Are you sure you want to hide this receiver from assignment? They will not receive any new help.' : 'Show this receiver in assignment lists?'}</div>
        <div className="flex gap-4 justify-end">
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className={`px-4 py-2 rounded ${action === 'hide' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`} onClick={() => onConfirm(receiver)}>{action === 'hide' ? 'Hide' : 'Show'}</button>
        </div>
      </div>
    </div>
  );

  // Responsive: show as cards on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Manage Help Assignments <RefreshCw className="inline-block cursor-pointer" onClick={() => setRefreshKey(k => k + 1)} /></h2>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
          Show hidden
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-2">Receiver Name</th>
              <th className="px-2 py-2">Receiver ID</th>
              <th className="px-2 py-2">Level</th>
              <th className="px-2 py-2">Assigned</th>
              <th className="px-2 py-2">Limit</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Visibility</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivers.map(r => {
              const assigned = confirmedHelpMap[r.userId] || 0;
              const maxAllowed = getMaxAllowed(r.levelStatus);
              let status = '';
              if (assigned <= maxAllowed) status = 'Within Limit';
              else status = 'Exceeded';
              return (
                <tr key={r.uid} className={assigned > maxAllowed ? 'bg-red-50' : ''}>
                  <td className="px-2 py-2">{r.fullName || r.name || '-'}</td>
                  <td className="px-2 py-2 font-mono cursor-pointer text-blue-700 underline" onClick={() => setProfileModal(r)}>{r.userId}</td>
                  <td className="px-2 py-2">{r.levelStatus}</td>
                  <td className="px-2 py-2 text-center">{assigned}</td>
                  <td className="px-2 py-2 text-center">{maxAllowed}</td>
                  <td className={`px-2 py-2 font-bold ${getStatusColor(assigned, maxAllowed)}`}>{getStatusIcon(assigned, maxAllowed)} {status}</td>
                  <td className="px-2 py-2 text-center">
                    <button className="inline-block" onClick={() => handleToggleVisibility(r)}>
                      {r.helpVisibility === false ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => setUnassignModal(r)}>
                      <List size={16} className="inline-block mr-1" /> View Senders
                    </button>
                    {assigned > maxAllowed && (
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => setUnassignModal(r)}>
                        <Edit size={16} className="inline-block mr-1" /> Reassign
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Profile Modal */}
      {profileModal && <ReceiverProfileModal receiver={profileModal} onClose={() => setProfileModal(null)} />}
      {/* Unassign Modal */}
      {unassignModal && <UnassignModal receiver={unassignModal} onClose={() => setUnassignModal(null)} />}
      {/* Confirm Visibility Modal */}
      {confirmVisibility && <ConfirmVisibilityModal receiver={confirmVisibility} onClose={() => setConfirmVisibility(null)} onConfirm={confirmToggleVisibility} action={visibilityAction} />}
    </div>
  );
} 