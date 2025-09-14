import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, writeBatch, Timestamp, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

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

function formatDate(ts) {
  if (!ts) return '-';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return '-';
  }
}

export default function DocumentManager() {
  const [receivers, setReceivers] = useState([]);
  const [sendHelpMap, setSendHelpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [autoAssignLog, setAutoAssignLog] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [batchFixing, setBatchFixing] = useState(false);
  const [expandedReceiver, setExpandedReceiver] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [confirmedHelpCounts, setConfirmedHelpCounts] = useState({}); // userId -> confirmed count
  // Add state to store receiveHelp docs for expanded user
  const [expandedReceiveHelps, setExpandedReceiveHelps] = useState([]);
  const [forceConfirmingId, setForceConfirmingId] = useState(null);

  // Fetch all active receivers and their sendHelp assignments
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Get all active receivers
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
      setReceivers(users);
      // 4. Fetch confirmed receiveHelp counts for each user
      const confirmedCounts = {};
      for (const user of users) {
        const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', user.userId), where('status', '==', 'confirmed'));
        const snap = await getDocs(q);
        confirmedCounts[user.userId] = snap.size;
      }
      setConfirmedHelpCounts(confirmedCounts);
      // 5. Pending confirmations
      const pending = sendHelps.filter(sh => sh.status === 'Pending' && sh.paymentDetails && sh.paymentDetails.screenshotUrl);
      setPendingConfirmations(pending);
      setLoading(false);
    }
    fetchData();
  }, [showHidden]);

  // Fetch receiveHelp docs when expandedReceiver changes
  useEffect(() => {
    async function fetchReceiveHelpsForUser() {
      if (!expandedReceiver) {
        setExpandedReceiveHelps([]);
        return;
      }
      const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver));
      const snap = await getDocs(q);
      setExpandedReceiveHelps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchReceiveHelpsForUser();
  }, [expandedReceiver]);

  // Handler for Force Confirm
  async function handleForceConfirm(receiveHelpDoc, receiverUid) {
    setForceConfirmingId(receiveHelpDoc.id);
    try {
      // Get user doc to check helpReceived
      const userRef = doc(db, 'users', receiverUid);
      const userSnap = await getDoc(userRef);
      const helpReceived = userSnap.exists() ? (userSnap.data().helpReceived || 0) : 0;
      if (helpReceived >= 3) {
        toast.error('User already has 3 confirmed helps.');
        setForceConfirmingId(null);
        return;
      }
      const batch = writeBatch(db);
      // Update receiveHelp doc
      const receiveHelpRef = doc(db, 'receiveHelp', receiveHelpDoc.id);
      batch.update(receiveHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Update sendHelp doc (same ID)
      const sendHelpRef = doc(db, 'sendHelp', receiveHelpDoc.id);
      batch.update(sendHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Increment helpReceived for user
      batch.update(userRef, { helpReceived: helpReceived + 1 });
      await batch.commit();
      toast.success('Force Confirmed!');
      // Refresh receiveHelp docs and confirmed counts
      const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver));
      const snap = await getDocs(q);
      setExpandedReceiveHelps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Also refresh confirmedHelpCounts
      const confirmedQ = query(collection(db, 'receiveHelp'), where('receiverId', '==', expandedReceiver), where('status', '==', 'confirmed'));
      const confirmedSnap = await getDocs(confirmedQ);
      setConfirmedHelpCounts(prev => ({ ...prev, [expandedReceiver]: confirmedSnap.size }));
      await checkAndAutoHoldUser(receivers.find(u => u.userId === expandedReceiver)?.uid, expandedReceiver);
    } catch (err) {
      toast.error('Force Confirm failed.');
      console.error(err);
    } finally {
      setForceConfirmingId(null);
    }
  }

  // Add after handleForceConfirm and any other confirmation logic
  async function checkAndAutoHoldUser(receiverUid, receiverUserId) {
    // 1. Query all receiveHelp docs for this user with status == 'confirmed' and confirmedByReceiver == true
    const q = query(collection(db, 'receiveHelp'), where('receiverId', '==', receiverUserId), where('status', '==', 'confirmed'), where('confirmedByReceiver', '==', true));
    const snap = await getDocs(q);
    if (snap.size === 3) {
      // 2. Get user doc
      const userRef = doc(db, 'users', receiverUid);
      // 3. Get all 3 doc IDs
      const docIds = snap.docs.map(d => d.id);
      // 4. Prepare batch
      const batch = writeBatch(db);
      // 5. Update user
      batch.update(userRef, {
        helpReceived: 3,
        isReceivingHeld: true,
        isOnHold: true,
      });
      // 6. For each doc, update receiveHelp and sendHelp if not already confirmed
      for (const docId of docIds) {
        const receiveHelpRef = doc(db, 'receiveHelp', docId);
        const receiveHelpSnap = await getDoc(receiveHelpRef);
        const rh = receiveHelpSnap.data();
        if (rh.status !== 'confirmed' || !rh.confirmedByReceiver) {
          batch.update(receiveHelpRef, {
            status: 'confirmed',
            confirmedByReceiver: true,
            confirmationTime: Timestamp.now(),
          });
        }
        const sendHelpRef = doc(db, 'sendHelp', docId);
        const sendHelpSnap = await getDoc(sendHelpRef);
        const sh = sendHelpSnap.exists() ? sendHelpSnap.data() : null;
        if (sh && (sh.status !== 'confirmed' || !sh.confirmedByReceiver)) {
          batch.update(sendHelpRef, {
            status: 'confirmed',
            confirmedByReceiver: true,
            confirmationTime: Timestamp.now(),
          });
        }
      }
      await batch.commit();
      toast.success('User auto-held and all helps confirmed!');
    }
  }

  // Filtered receivers
  const filteredReceivers = receivers.filter(r => {
    if (levelFilter && r.levelStatus !== levelFilter) return false;
    if (searchUserId && !r.userId.toLowerCase().includes(searchUserId.toLowerCase())) return false;
    const assigned = sendHelpMap[r.userId]?.length || 0;
    const maxAllowed = getMaxAllowed(r.levelStatus);
    if (statusFilter === 'OK' && assigned > maxAllowed) return false;
    if (statusFilter === 'EXCEEDED' && assigned <= maxAllowed) return false;
    return true;
  });

  // Remove excess senders for a receiver
  const handleRemoveExcess = async (receiver) => {
    const assigned = sendHelpMap[receiver.userId] || [];
    const maxAllowed = getMaxAllowed(receiver.levelStatus);
    const excess = assigned.slice(maxAllowed);
    for (const sh of excess) {
      await deleteDoc(doc(db, 'sendHelp', sh.id));
      await deleteDoc(doc(db, 'receiveHelp', sh.id));
      toast.success(`Removed sender ${sh.senderId} from receiver ${receiver.userId}`);
      // Optionally: reassign sender
      // await assignReceiverOnActivation(sh.senderUid); // If callable from frontend
    }
  };

  // Manual reassign sender
  const handleManualReassign = async (sendHelpId, senderUid) => {
    await deleteDoc(doc(db, 'sendHelp', sendHelpId));
    await deleteDoc(doc(db, 'receiveHelp', sendHelpId));
    toast.success(`Sender reassigned. Please run assignment for sender.`);
    // Optionally: reassign sender
    // await assignReceiverOnActivation(senderUid); // If callable from frontend
  };

  // Batch fix all over-assigned receivers
  const handleBatchFix = async () => {
    setBatchFixing(true);
    for (const r of receivers) {
      const assigned = sendHelpMap[r.userId]?.length || 0;
      const maxAllowed = getMaxAllowed(r.levelStatus);
      if (assigned > maxAllowed) {
        await handleRemoveExcess(r);
      }
    }
    setBatchFixing(false);
    toast.success('Batch fix complete!');
  };

  // Cleanup invalid receivers
  const handleCleanupInvalid = async () => {
    for (const r of receivers) {
      if (r.isBlocked || r.isReceivingHeld || r.paymentBlocked) {
        const assigned = sendHelpMap[r.userId] || [];
        for (const sh of assigned) {
          await deleteDoc(doc(db, 'sendHelp', sh.id));
          await deleteDoc(doc(db, 'receiveHelp', sh.id));
        }
      }
    }
    toast.success('Invalid receiver cleanup complete!');
  };

  // Toggle isHidden for sendHelp doc
  const handleToggleHideSendHelp = async (sendHelp) => {
    const newHidden = !sendHelp.isHidden;
    await updateDoc(doc(db, 'sendHelp', sendHelp.id), { isHidden: newHidden });
    toast.success(`SendHelp ${newHidden ? 'hidden' : 'unhidden'}`);
    // Refresh data
    setTimeout(() => window.location.reload(), 500);
  };

  // Responsive: show as cards on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Document Manager – Receiver Assignment Overview</h2>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
          Show hidden
        </label>
      </div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <input type="text" placeholder="Search User ID" className="border rounded px-3 py-2" value={searchUserId} onChange={e => setSearchUserId(e.target.value)} />
        <select className="border rounded px-3 py-2" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option value="">All Levels</option>
          {Object.keys(LEVEL_LIMITS).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="OK">OK</option>
          <option value="EXCEEDED">EXCEEDED</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleBatchFix} disabled={batchFixing}>{batchFixing ? 'Fixing...' : 'Batch Fix Over-Assigned'}</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleCleanupInvalid}>Cleanup Invalid Receivers</button>
      </div>
      {/* Desktop Table */}
      {!isMobile && (
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Assigned</th>
              <th className="px-4 py-2">Max Allowed</th>
              <th className="px-4 py-2">Confirmed</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceivers.map(r => {
              const assigned = sendHelpMap[r.userId]?.length || 0;
              const maxAllowed = getMaxAllowed(r.levelStatus);
              const confirmed = confirmedHelpCounts[r.userId] || 0;
              const status = assigned > maxAllowed ? 'EXCEEDED' : 'OK';
              return (
                <tr key={r.uid} className={status === 'EXCEEDED' ? 'bg-red-50' : ''}>
                  <td className="px-4 py-2 font-mono">{r.userId}</td>
                  <td className="px-4 py-2">{r.fullName || r.name || '-'}</td>
                  <td className="px-4 py-2">{r.levelStatus}</td>
                  <td className="px-4 py-2 text-center">{assigned}</td>
                  <td className="px-4 py-2 text-center">{maxAllowed}</td>
                  <td className="px-4 py-2 text-center">
                    {confirmed === 3 && (
                      <span className="inline-block bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">3 Confirmed</span>
                    )}
                  </td>
                  <td className={`px-4 py-2 font-bold ${status === 'EXCEEDED' ? 'text-red-600' : 'text-green-600'}`}>{status === 'OK' ? '✅ OK' : '❗ EXCEEDED'}</td>
                  <td className="px-4 py-2">
                    {status === 'EXCEEDED' && (
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onClick={() => handleRemoveExcess(r)}>Fix Over-Assignment</button>
                    )}
                    {assigned > 0 && (
                      <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={() => setExpandedReceiver(expandedReceiver === r.userId ? null : r.userId)}>
                        {expandedReceiver === r.userId ? 'Hide Sender Details' : 'Show Sender IDs'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {/* Sender Details Modal/Accordion */}
      {expandedReceiver && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setExpandedReceiver(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Sender Details for {expandedReceiver}</h3>
            <div className="overflow-x-auto max-h-96 mb-4">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1">Doc ID</th>
                    <th className="px-2 py-1">Amount</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Confirmed</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expandedReceiveHelps.map(rh => (
                    <tr key={rh.id}>
                      <td className="px-2 py-1 font-mono">{rh.id}</td>
                      <td className="px-2 py-1">{rh.amount}</td>
                      <td className="px-2 py-1">{rh.status}</td>
                      <td className="px-2 py-1">{rh.confirmedByReceiver ? 'Yes' : 'No'}</td>
                      <td className="px-2 py-1">
                        {(!rh.confirmedByReceiver && receivers.find(u => u.userId === expandedReceiver)?.helpReceived < 3) && (
                          <button className="bg-red-600 text-white px-3 py-1 rounded" disabled={forceConfirmingId === rh.id} onClick={() => handleForceConfirm(rh, receivers.find(u => u.userId === expandedReceiver)?.uid)}>
                            {forceConfirmingId === rh.id ? 'Confirming...' : 'Force Confirm'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1">Sender ID</th>
                    <th className="px-2 py-1">Name</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Assigned At</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(sendHelpMap[expandedReceiver] || []).map(sh => (
                    <tr key={sh.id}>
                      <td className="px-2 py-1 font-mono">{sh.senderId}</td>
                      <td className="px-2 py-1">{sh.senderName || '-'}</td>
                      <td className="px-2 py-1">{sh.status}</td>
                      <td className="px-2 py-1">{formatDate(sh.createdAt || sh.timestamp)}</td>
                      <td className="px-2 py-1">
                        <button className={`inline-flex items-center gap-1 px-2 py-1 rounded ${sh.isHidden ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-900'}`} onClick={() => handleToggleHideSendHelp(sh)}>
                          {sh.isHidden ? <EyeOff size={14} /> : <Eye size={14} />} {sh.isHidden ? 'Unhide' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Cards */}
      {isMobile && (
        <div className="flex flex-col gap-4">
          {filteredReceivers.map(r => {
            const assigned = sendHelpMap[r.userId]?.length || 0;
            const maxAllowed = getMaxAllowed(r.levelStatus);
            const confirmed = confirmedHelpCounts[r.userId] || 0;
            const status = assigned > maxAllowed ? 'EXCEEDED' : 'OK';
            return (
              <div key={r.uid} className={`rounded-lg shadow border p-4 ${status === 'EXCEEDED' ? 'bg-red-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-blue-700">{r.userId}</span>
                  <span className={`font-bold ${status === 'EXCEEDED' ? 'text-red-600' : 'text-green-600'}`}>{status === 'OK' ? '✅ OK' : '❗ EXCEEDED'}</span>
                </div>
                <div className="mb-1"><span className="font-semibold">Name:</span> {r.fullName || r.name || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Level:</span> {r.levelStatus}</div>
                <div className="mb-1"><span className="font-semibold">Assigned:</span> {assigned}</div>
                <div className="mb-1"><span className="font-semibold">Max Allowed:</span> {maxAllowed}</div>
                <div className="mb-1"><span className="font-semibold">Confirmed:</span> {confirmed === 3 && (
                  <span className="inline-block bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">3 Confirmed</span>
                )}
                </div>
                <div className="flex gap-2 mt-2">
                  {status === 'EXCEEDED' && (
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => handleRemoveExcess(r)}>Fix</button>
                  )}
                  {assigned > 0 && (
                    <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={() => setExpandedReceiver(expandedReceiver === r.userId ? null : r.userId)}>
                      {expandedReceiver === r.userId ? 'Hide Senders' : 'Show Senders'}
                    </button>
                  )}
                </div>
                {/* Collapsible sender details */}
                {expandedReceiver === r.userId && (
                  <div className="mt-3 border-t pt-2">
                    <div className="font-bold mb-1">Sender Details</div>
                    {(sendHelpMap[r.userId] || []).map(sh => (
                      <div key={sh.id} className="mb-2 p-2 rounded bg-gray-50 border">
                        <div><span className="font-semibold">Sender ID:</span> {sh.senderId}</div>
                        <div><span className="font-semibold">Name:</span> {sh.senderName || '-'}</div>
                        <div><span className="font-semibold">Status:</span> {sh.status}</div>
                        <div><span className="font-semibold">Assigned At:</span> {formatDate(sh.createdAt || sh.timestamp)}</div>
                        <div><span className="font-semibold">Hidden:</span> {sh.isHidden ? 'Yes' : 'No'}</div>
                        <button className={`inline-flex items-center gap-1 px-2 py-1 rounded ${sh.isHidden ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-900'}`} onClick={() => handleToggleHideSendHelp(sh)}>
                          {sh.isHidden ? <EyeOff size={14} /> : <Eye size={14} />} {sh.isHidden ? 'Unhide' : 'Hide'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Pending Confirmations Tracker</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Receiver ID</th>
                <th className="px-4 py-2">Sender ID</th>
                <th className="px-4 py-2">Proof Submitted</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingConfirmations.map(pc => (
                <tr key={pc.id}>
                  <td className="px-4 py-2 font-mono">{pc.receiverId}</td>
                  <td className="px-4 py-2 font-mono">{pc.senderId}</td>
                  <td className="px-4 py-2">{pc.paymentDetails?.screenshotUrl ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">{pc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Auto-Assignment Log (placeholder) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Auto-Assignment Log</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-500">(Log feature coming soon...)</div>
      </div>
      {/* Manual Reassign Sender (placeholder) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Manual Reassign Sender</h3>
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="Sender ID" className="border rounded px-3 py-2" id="manualSenderId" />
          <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => {
            const senderId = document.getElementById('manualSenderId').value;
            const sendHelp = Object.values(sendHelpMap).flat().find(sh => sh.senderId === senderId);
            if (sendHelp) {
              handleManualReassign(sendHelp.id, sendHelp.senderUid);
            } else {
              toast.error('Sender not found or not assigned.');
            }
          }}>Reassign</button>
        </div>
      </div>
    </div>
  );
} 