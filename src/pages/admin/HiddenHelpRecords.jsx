import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HiddenHelpRecords() {
  const [sendHelp, setSendHelp] = useState([]);
  const [receiveHelp, setReceiveHelp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHidden() {
      setLoading(true);
      const sendHelpSnap = await getDocs(query(collection(db, 'sendHelp'), where('isHidden', '==', true)));
      const receiveHelpSnap = await getDocs(query(collection(db, 'receiveHelp'), where('isHidden', '==', true)));
      setSendHelp(sendHelpSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setReceiveHelp(receiveHelpSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }
    fetchHidden();
  }, []);

  const handleUnhide = async (type, id) => {
    await updateDoc(doc(db, type, id), { isHidden: false });
    toast.success('Record unhidden');
    if (type === 'sendHelp') setSendHelp(list => list.filter(d => d.id !== id));
    if (type === 'receiveHelp') setReceiveHelp(list => list.filter(d => d.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Hidden Help Records</h2>
      {loading ? <div>Loading...</div> : (
        <>
          <h3 className="text-lg font-semibold mb-2">Hidden SendHelp</h3>
          <table className="min-w-full border mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Sender</th>
                <th className="px-4 py-2">Receiver</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sendHelp.length === 0 ? <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hidden sendHelp records.</td></tr> : sendHelp.map(sh => (
                <tr key={sh.id}>
                  <td className="px-4 py-2 font-mono">{sh.id}</td>
                  <td className="px-4 py-2">{sh.senderId}</td>
                  <td className="px-4 py-2">{sh.receiverId}</td>
                  <td className="px-4 py-2">{sh.status}</td>
                  <td className="px-4 py-2">
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-900" onClick={() => handleUnhide('sendHelp', sh.id)}>
                      <Eye size={14} /> Unhide
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="text-lg font-semibold mb-2">Hidden ReceiveHelp</h3>
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Sender</th>
                <th className="px-4 py-2">Receiver</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {receiveHelp.length === 0 ? <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hidden receiveHelp records.</td></tr> : receiveHelp.map(rh => (
                <tr key={rh.id}>
                  <td className="px-4 py-2 font-mono">{rh.id}</td>
                  <td className="px-4 py-2">{rh.senderId}</td>
                  <td className="px-4 py-2">{rh.receiverId}</td>
                  <td className="px-4 py-2">{rh.status}</td>
                  <td className="px-4 py-2">
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-900" onClick={() => handleUnhide('receiveHelp', rh.id)}>
                      <Eye size={14} /> Unhide
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
} 