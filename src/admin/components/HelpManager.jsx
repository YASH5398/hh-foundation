import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

/*
// Utility: Set admin claim using Firebase Admin SDK (run in Node.js, not in client)
// Replace USER_UID_HERE with the actual UID
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims('USER_UID_HERE', { admin: true }).then(() => {
  console.log('Admin claim set successfully');
});
*/

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const HelpManager = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    let unsub = null;

    // Wait for auth and claims to load before deciding
    if (authLoading) return;

    const setup = async () => {
      setFetchError(false);
      setPermissionError(false);
      setTickets([]);

      if (!user || !isAdmin) {
        setLoading(false);
        return;
      }

      // Admin confirmed via claims - listen for tickets
      setLoading(true);

      const q = query(collection(db, 'supportTickets'));
      unsub = onSnapshot(
        q,
        (snap) => {
          try {
            const list = snap.docs.map(doc => {
              const data = doc.data();
              if (!data.timestamp) throw new Error('Missing timestamp in support ticket: ' + doc.id);
              return { id: doc.id, ...data };
            });
            setTickets(list);
            setLoading(false);
          } catch (err) {
            setFetchError(true);
            setLoading(false);
            toast.error('One or more support tickets are missing a timestamp.');
            console.error(err);
          }
        },
        (error) => {
          setFetchError(true);
          setLoading(false);
          setPermissionError(true);
          toast.error('Permission denied: Unable to fetch support requests.');
          console.error('Firestore onSnapshot permission error:', error);
        }
      );
    };

    setup();
    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line
  }, [user, isAdmin, authLoading]);

  // Fetch user details for modal
  useEffect(() => {
    if (selectedTicket) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', selectedTicket.userId));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            setUserDetails(null);
          }
        } catch {
          setUserDetails(null);
        }
      };
      fetchUser();
      setAdminReply(selectedTicket.adminReply || '');
    } else {
      setUserDetails(null);
      setAdminReply('');
    }
  }, [selectedTicket]);

  // Access control and loading
  if (authLoading || loading) {
    return <div className="text-center py-8 text-gray-600 font-bold flex flex-col items-center gap-4">
      <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
      Checking admin access...
    </div>;
  }
  if (permissionError) {
    return <div className="text-center py-8 text-red-600 font-bold">Permission denied: Unable to fetch support requests. Check Firestore rules and admin claim.</div>;
  }
  if (!user || !isAdmin) {
    return <div className="text-center py-8 text-red-600 font-bold">Access Denied. Admins only.</div>;
  }

  // Filtered and searched tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' ? true : ticket.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      ticket.userId?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle reply submit
  const handleReply = async () => {
    if (!adminReply.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    setReplyLoading(true);
    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        adminReply: adminReply,
        status: 'resolved',
      });
      toast.success('Reply sent successfully');
      setSelectedTicket(null);
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setReplyLoading(false);
    }
  };

  // Responsive: show table on md+, cards/accordion on mobile
  return (
    <div className="container mx-auto p-2 sm:p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Help/Support Manager</h1>
      {/* Filter & Search */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <label className="text-sm text-gray-700">Filter by Status:</label>
        <select
          className="border border-gray-300 rounded p-2 text-black bg-white w-full sm:w-48"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          className="border border-gray-300 rounded p-2 text-black bg-white w-full sm:w-64"
          placeholder="Search by User ID or Subject"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Table/List for md+ screens */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-black">User ID</th>
              <th className="py-2 px-4 text-left text-black">Subject</th>
              <th className="py-2 px-4 text-left text-black">Message</th>
              <th className="py-2 px-4 text-left text-black">Status</th>
              <th className="py-2 px-4 text-left text-black">Date</th>
              <th className="py-2 px-4 text-left text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-600">Loading support requests...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={6} className="text-center py-8 text-red-600">Failed to fetch support requests.</td></tr>
            ) : filteredTickets.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-600">No support requests found.</td></tr>
            ) : (
              filteredTickets.map(ticket => (
                <tr key={ticket.id} className="border-b last:border-b-0">
                  <td className="py-2 px-4 font-mono text-black break-all">{ticket.userId}</td>
                  <td className="py-2 px-4 text-black break-all">{ticket.subject}</td>
                  <td className="py-2 px-4 text-black break-all">
                    {ticket.message.length > 100 ? ticket.message.slice(0, 100) + '…' : ticket.message}
                    {(!ticket.adminReply || ticket.adminReply.trim() === '') && (
                      <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">Unread</span>
                    )}
                  </td>
                  <td className="py-2 px-4 font-semibold capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'}`}>{ticket.status}</span>
                  </td>
                  <td className="py-2 px-4 text-black">{ticket.timestamp?.toDate ? ticket.timestamp.toDate().toLocaleString() : '-'}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Cards/Accordion for mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading support requests...</div>
        ) : fetchError ? (
          <div className="text-center py-8 text-red-600">Failed to fetch support requests.</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No support requests found.</div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-lg shadow p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-black text-xs">{ticket.userId}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'}`}>{ticket.status}</span>
              </div>
              <div className="font-semibold text-black">{ticket.subject}</div>
              <div className="text-gray-700 text-xs">
                {ticket.message.length > 100 ? ticket.message.slice(0, 100) + '…' : ticket.message}
                {(!ticket.adminReply || ticket.adminReply.trim() === '') && (
                  <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">Unread</span>
                )}
              </div>
              <div className="text-gray-500 text-xs">{ticket.timestamp?.toDate ? ticket.timestamp.toDate().toLocaleString() : '-'}</div>
              <button
                onClick={() => setSelectedTicket(ticket)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm w-fit self-end"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>
      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2 sm:px-0">
          <div className="bg-white rounded shadow p-4 sm:p-6 w-full max-w-md relative overflow-y-auto max-h-[95vh] flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 text-2xl" onClick={() => setSelectedTicket(null)}>&times;</button>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Support Request</h2>
            <div className="mb-2">
              <div className="text-xs text-gray-600 mb-1">User ID: <span className="font-mono text-black">{selectedTicket.userId}</span></div>
              {userDetails && (
                <div className="text-xs text-gray-700 mb-1">
                  <div><span className="font-semibold">Name:</span> {userDetails.fullName || userDetails.username || '-'}</div>
                  <div><span className="font-semibold">Phone:</span> {userDetails.phone || '-'}</div>
                  <div><span className="font-semibold">Email:</span> {userDetails.email || '-'}</div>
                  <div><span className="font-semibold">WhatsApp:</span> {userDetails.whatsapp || '-'}</div>
                </div>
              )}
            </div>
            <div className="mb-2">
              <div className="font-semibold text-gray-800">Subject:</div>
              <div className="text-black mb-2 break-all">{selectedTicket.subject}</div>
              <div className="font-semibold text-gray-800">Message:</div>
              <div className="text-black whitespace-pre-line mb-2 break-all">{selectedTicket.message}</div>
              <div className="font-semibold text-gray-800">Status:</div>
              <div className={`mb-2 font-semibold capitalize`}>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selectedTicket.status] || 'bg-gray-100 text-gray-800'}`}>{selectedTicket.status}</span>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Admin Reply</label>
              {selectedTicket.status === 'resolved' || selectedTicket.adminReply ? (
                <textarea
                  className="border border-gray-300 rounded p-2 w-full text-black bg-gray-100 placeholder:text-gray-500"
                  rows={3}
                  value={selectedTicket.adminReply || adminReply}
                  readOnly
                />
              ) : (
                <textarea
                  className="border border-gray-300 rounded p-2 w-full text-black bg-white placeholder:text-gray-500"
                  rows={3}
                  value={adminReply}
                  onChange={e => setAdminReply(e.target.value)}
                  placeholder="Type your reply here..."
                  disabled={replyLoading}
                />
              )}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 flex flex-col sm:flex-row gap-2 z-10 border-t border-gray-100">
              {(!selectedTicket.adminReply && selectedTicket.status !== 'resolved') && (
                <button
                  onClick={handleReply}
                  className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-60"
                  disabled={replyLoading}
                >
                  {replyLoading ? 'Sending...' : 'Send Reply & Resolve'}
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded w-full"
                disabled={replyLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpManager; 