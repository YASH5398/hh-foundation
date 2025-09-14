import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';

const statusColors = {
  unused: 'bg-gray-100 text-gray-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  used: 'bg-green-100 text-green-800',
};

const AllEpins = () => {
  const [epins, setEpins] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEpin, setSelectedEpin] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');

  useEffect(() => {
    const fetchEpins = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'epins'));
      const epinList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEpins(epinList);
      setLoading(false);
    };
    fetchEpins();
  }, []);

  const filteredEpins = epins.filter(epin => {
    const matchesSearch =
      epin.code?.toLowerCase().includes(search.toLowerCase()) ||
      epin.ownerId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || epin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssign = async (epin) => {
    if (!assignEmail) return toast.error('Enter user UID');
    try {
      await updateDoc(doc(db, 'epins', epin.id), {
        ownerId: assignEmail,
        status: 'assigned',
      });
      toast.success('E-PIN assigned!');
      setEpins(epins.map(e => e.id === epin.id ? { ...e, ownerId: assignEmail, status: 'assigned' } : e));
      setShowModal(false);
      setAssignEmail('');
    } catch (err) {
      toast.error('Failed to assign E-PIN');
    }
  };

  const handleDelete = async (epin) => {
    if (epin.status !== 'unused') return toast.error('Can only delete unused E-PINs');
    if (!window.confirm('Delete this E-PIN?')) return;
    try {
      await deleteDoc(doc(db, 'epins', epin.id));
      toast.success('E-PIN deleted');
      setEpins(epins.filter(e => e.id !== epin.id));
    } catch (err) {
      toast.error('Failed to delete E-PIN');
    }
  };

  const handleMarkUsed = async (epin) => {
    try {
      await updateDoc(doc(db, 'epins', epin.id), {
        status: 'used',
        usedAt: new Date(),
      });
      toast.success('E-PIN marked as used');
      setEpins(epins.map(e => e.id === epin.id ? { ...e, status: 'used', usedAt: new Date() } : e));
    } catch (err) {
      toast.error('Failed to mark as used');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Code', 'Plan', 'Price', 'Status', 'OwnerId', 'UsedBy', 'CreatedAt', 'UsedAt'],
      ...filteredEpins.map(e => [e.code, e.plan, e.price, e.status, e.ownerId, e.usedBy, e.createdAt, e.usedAt]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-2 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by code or UID..."
          className="border rounded px-3 py-2 w-full md:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="unused">Unused</option>
          <option value="assigned">Assigned</option>
          <option value="used">Used</option>
        </select>
        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded">Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Owner ID</th>
              <th className="px-4 py-2">Used By</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Used</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8">Loading E-PINs...</td></tr>
            ) : filteredEpins.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8">No E-PINs found.</td></tr>
            ) : (
              filteredEpins.map(epin => (
                <tr key={epin.id} className="border-t">
                  <td className="px-4 py-2">{epin.code}</td>
                  <td className="px-4 py-2">{epin.plan}</td>
                  <td className="px-4 py-2">{epin.price}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[epin.status] || 'bg-gray-100 text-gray-800'}`}>{epin.status}</span>
                  </td>
                  <td className="px-4 py-2">{epin.ownerId || '-'}</td>
                  <td className="px-4 py-2">{epin.usedBy || '-'}</td>
                  <td className="px-4 py-2">{epin.createdAt ? new Date(epin.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{epin.usedAt ? new Date(epin.usedAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setSelectedEpin(epin); setShowModal(true); }}>Assign</button>
                    <button className="text-green-600 hover:underline" onClick={() => handleMarkUsed(epin)}>Mark Used</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(epin)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for assign */}
      {showModal && selectedEpin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowModal(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-2">Assign E-PIN</h2>
            <input
              type="email"
              className="border p-2 w-full mb-2"
              value={assignEmail}
              onChange={e => setAssignEmail(e.target.value)}
              placeholder="User UID"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={() => handleAssign(selectedEpin)}>Assign</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEpins; 