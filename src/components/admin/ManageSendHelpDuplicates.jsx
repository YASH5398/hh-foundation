import React, { useEffect, useState } from 'react';
import { getDocs, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

export default function ManageSendHelpDuplicates() {
  const { userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    getDocs(collection(db, 'sendHelp'))
      .then(snapshot => {
        const allDocs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          created: d.createTime ? d.createTime.toDate() : null
        }));
        setDocs(allDocs);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Error fetching documents');
        setLoading(false);
      });
  }, [isAdmin]);

  if (!isAdmin) return null;

  // Group duplicates
  const groups = {};
  docs.forEach(doc => {
    const key = `${String(doc.senderId).trim().toLowerCase()}_${String(doc.receiverId).trim().toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  });
  // Only show groups with more than 1 doc
  const duplicateGroups = Object.values(groups).filter(g => g.length > 1);

  const handleSelect = (docId, checked) => {
    setSelected(prev => ({ ...prev, [docId]: checked }));
  };

  const handleDelete = async () => {
    setDeleting(true);
    setResult(null);
    let deleted = 0;
    try {
      for (const docId of Object.keys(selected)) {
        if (selected[docId]) {
          await deleteDoc(doc(db, 'sendHelp', docId));
          deleted++;
        }
      }
      setResult(`✅ Deleted ${deleted} document(s).`);
      // Refresh list
      setDocs(docs => docs.filter(d => !selected[d.id]));
      setSelected({});
    } catch (e) {
      setResult('Error deleting documents: ' + (e.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Manage sendHelp Duplicates</h2>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : duplicateGroups.length === 0 ? <div className="text-gray-500">No duplicates found.</div> : (
        <form onSubmit={e => { e.preventDefault(); handleDelete(); }}>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Select</th>
                <th className="p-2 border">Document ID</th>
                <th className="p-2 border">Sender ID</th>
                <th className="p-2 border">Receiver ID</th>
                <th className="p-2 border">Created</th>
              </tr>
            </thead>
            <tbody>
              {duplicateGroups.map(group => group.map((doc, idx) => (
                <tr key={doc.id} className={idx === 0 ? 'bg-green-50' : ''}>
                  <td className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={!!selected[doc.id]}
                      onChange={e => handleSelect(doc.id, e.target.checked)}
                      disabled={deleting}
                    />
                  </td>
                  <td className="p-2 border font-mono">{doc.id}</td>
                  <td className="p-2 border">{doc.senderId}</td>
                  <td className="p-2 border">{doc.receiverId}</td>
                  <td className="p-2 border">{doc.created ? doc.created.toLocaleString() : '-'}</td>
                </tr>
              )))}
            </tbody>
          </table>
          <button
            type="submit"
            disabled={deleting || Object.values(selected).every(v => !v)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          {result && <div className="mt-2 text-green-600">{result}</div>}
        </form>
      )}
    </div>
  );
}