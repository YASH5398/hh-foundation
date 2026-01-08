import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where, serverTimestamp, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { getDirectImageUrl } from '../../utils/firebaseStorageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, CheckCircle, XCircle, Clock, User, CreditCard, Phone, MessageCircle } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const SendHelpManager = () => {
  const { user } = useAuth();
  const [sendHelpData, setSendHelpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedHelp, setSelectedHelp] = useState(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let unsub = null;
    const verifyAdmin = async () => {
      setCheckingAdmin(true);
      setIsAdmin(false);
      setAccessDenied(false);
      setSendHelpData([]);
      setLoading(true);
      
      try {
        const currentUser = auth.currentUser;
        if (!user || !currentUser) {
          setCheckingAdmin(false);
          setIsAdmin(false);
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        
        const tokenResult = await getIdTokenResult(currentUser, true);
        console.log('Admin token claims:', tokenResult.claims);
        
        if (tokenResult.claims && tokenResult.claims.admin === true) {
          setIsAdmin(true);
          setAccessDenied(false);
          
          // Fetch SendHelp data
          const q = query(collection(db, 'sendHelp'), where('status', '!=', null), orderBy('createdAt', 'desc'));
          unsub = onSnapshot(
            q,
            (snap) => {
              try {
                const list = snap.docs.map(doc => {
                  const data = doc.data();
                  return { id: doc.id, ...data };
                });
                setSendHelpData(list);
                setLoading(false);
              } catch (err) {
                setLoading(false);
                toast.error('Error loading SendHelp data.');
                console.error(err);
              }
            },
            (error) => {
              setLoading(false);
              toast.error('Permission denied: Unable to fetch SendHelp data.');
              console.error('Firestore onSnapshot permission error:', error);
            }
          );
        } else {
          setIsAdmin(false);
          setAccessDenied(true);
          setLoading(false);
        }
        setCheckingAdmin(false);
      } catch (err) {
        setCheckingAdmin(false);
        setIsAdmin(false);
        setAccessDenied(true);
        setLoading(false);
        toast.error(err.message || 'Failed to verify admin status.');
        console.error('Admin claim check error:', err);
      }
    };
    verifyAdmin();
    return () => { if (unsub) unsub(); };
  }, [user]);

  // Filtered and searched data
  const filteredData = sendHelpData.filter(help => {
    const matchesStatus = statusFilter === 'all' ? true : help.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      help.senderId?.toLowerCase().includes(search.toLowerCase()) ||
      help.receiverId?.toLowerCase().includes(search.toLowerCase()) ||
      help.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      help.receiverName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle status update
  const handleStatusUpdate = async (helpId, newStatus) => {
    try {
      await updateDoc(doc(db, 'sendHelp', helpId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const handleMarkConfirmed = async (helpId) => {
    try {
      // Get the sendHelp doc to find receiverUid
      const sendHelpRef = doc(db, 'sendHelp', helpId);
      const sendHelpSnap = await getDoc(sendHelpRef);
      if (!sendHelpSnap.exists()) {
        toast.error('SendHelp document not found');
        return;
      }
      const sendHelpData = sendHelpSnap.data();
      const receiverUid = sendHelpData.receiverUid;
      if (!receiverUid) {
        toast.error('Receiver UID not found');
        return;
      }
      // Get the user doc to get current helpReceived
      const userRef = doc(db, 'users', receiverUid);
      const userSnap = await getDoc(userRef);
      const helpReceived = userSnap.exists() ? (userSnap.data().helpReceived || 0) : 0;
      // Prepare batch
      const batch = writeBatch(db);
      // Update sendHelp
      batch.update(sendHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Update receiveHelp
      const receiveHelpRef = doc(db, 'receiveHelp', helpId);
      batch.update(receiveHelpRef, {
        status: 'confirmed',
        confirmedByReceiver: true,
        confirmationTime: Timestamp.now(),
      });
      // Increment helpReceived and set hold flags if reaching 3
      const newHelpReceived = helpReceived + 1;
      const userUpdate = { helpReceived: newHelpReceived };
      if (newHelpReceived === 3) {
        userUpdate.isReceivingHeld = true;
        userUpdate.isOnHold = true;
      }
      batch.update(userRef, userUpdate);
      await batch.commit();
      toast.success('Marked as Confirmed');
    } catch (error) {
      toast.error('Failed to mark as confirmed');
      console.error('Error marking as confirmed:', error);
    }
  };

  // Access control and loading
  if (checkingAdmin || loading) {
    return (
      <div className="text-center py-8 text-gray-600 font-bold flex flex-col items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        Checking admin access...
      </div>
    );
  }

  if (accessDenied || !isAdmin) {
    return (
      <div className="text-center py-8 text-red-600 font-bold">
        Access Denied. Admins only.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">Send Help Manager</h1>
        <p className="text-slate-400 text-sm md:text-base">Monitor and manage send help transactions between users</p>
      </div>

      {/* Filter & Search Controls */}
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm text-slate-300 font-medium">Filter by Status:</label>
            <select
              className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-slate-800 text-slate-100">All Statuses</option>
              <option value="pending" className="bg-slate-800 text-slate-100">Pending</option>
              <option value="paid" className="bg-slate-800 text-slate-100">Paid</option>
              <option value="confirmed" className="bg-slate-800 text-slate-100">Confirmed</option>
              <option value="cancelled" className="bg-slate-800 text-slate-100">Cancelled</option>
            </select>
          </div>

          <div className="flex-1">
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Search by User ID or Name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Transaction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Sender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Receiver
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Payment Proof
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No SendHelp transactions found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((help) => (
                  <motion.tr
                    key={help.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-400 mb-1">{help.id.slice(-12)}</div>
                      <div className="text-sm text-slate-300">
                        {help.createdAt?.toDate ? help.createdAt.toDate().toLocaleString() : 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-100">
                            {help.senderName || help.senderId || 'N/A'}
                          </div>
                          <div className="text-sm text-slate-400">
                            ID: {help.senderId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                          <User className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-100">
                            {help.receiverName || help.receiverId || 'N/A'}
                          </div>
                          <div className="text-sm text-slate-400">
                            ID: {help.receiverId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-400 text-lg">₹{help.amount || 300}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[help.status]?.includes('yellow') ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        STATUS_COLORS[help.status]?.includes('blue') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        STATUS_COLORS[help.status]?.includes('green') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        STATUS_COLORS[help.status]?.includes('red') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {help.status || 'pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {help.paymentDetails?.screenshotUrl ? (
                        <div className="flex items-center space-x-2">
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            src={getDirectImageUrl(help.paymentDetails.screenshotUrl)}
                            alt="Payment Proof"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-600 cursor-pointer transition-all duration-200"
                            onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjBGM0Y2Ii8+CjxwYXRoIGQ9Ik0xMCAxM0gyNlYyNkgxMFYxM1oiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEzIDhIMjNWMTNIMTNWOFoiIGZpbGw9IiM3QzNFNUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-500/10 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </motion.button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No proof</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {help.status === 'pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(help.id, 'paid')}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                            >
                              Mark Paid
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(help.id, 'cancelled')}
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:shadow-red-500/25 transition-all duration-200"
                            >
                              Cancel
                            </motion.button>
                          </>
                        )}
                        {help.status === 'paid' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(help.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                          >
                            Confirm
                          </motion.button>
                        )}
                        {help.status !== 'confirmed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleMarkConfirmed(help.id)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                          >
                            Mark Confirmed
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        <AnimatePresence>
          {filteredData.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
              <p className="text-slate-300 text-lg font-medium">No SendHelp transactions found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredData.map((help) => (
              <motion.div
                key={help.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 shadow-xl hover:shadow-2xl transition-all duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="font-mono text-xs text-slate-400 mb-1">{help.id.slice(-12)}</div>
                    <div className="text-sm text-slate-300">
                      {help.createdAt?.toDate ? help.createdAt.toDate().toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                    STATUS_COLORS[help.status]?.includes('yellow') ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    STATUS_COLORS[help.status]?.includes('blue') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    STATUS_COLORS[help.status]?.includes('green') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    STATUS_COLORS[help.status]?.includes('red') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {help.status || 'pending'}
                  </span>
                </div>

                {/* Sender & Receiver */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">
                        {help.senderName || help.senderId || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        Sender ID: {help.senderId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                      <User className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">
                        {help.receiverName || help.receiverId || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        Receiver ID: {help.receiverId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount & Payment Proof */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-green-400 text-lg">₹{help.amount || 300}</span>
                  </div>

                  {help.paymentDetails?.screenshotUrl ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Proof</span>
                    </motion.button>
                  ) : (
                    <span className="text-slate-500 italic text-sm">No proof</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700/50">
                  {help.status === 'pending' && (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(help.id, 'paid')}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200 touch-manipulation"
                      >
                        Mark Paid
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(help.id, 'cancelled')}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-red-500/25 transition-all duration-200 touch-manipulation"
                      >
                        Cancel
                      </motion.button>
                    </>
                  )}
                  {help.status === 'paid' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusUpdate(help.id, 'confirmed')}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-green-500/25 transition-all duration-200 touch-manipulation"
                    >
                      Confirm
                    </motion.button>
                  )}
                  {help.status !== 'confirmed' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMarkConfirmed(help.id)}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-green-500/25 transition-all duration-200 touch-manipulation"
                    >
                      Mark Confirmed
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedHelp(help)}
                    className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation"
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedHelp(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Send Help Details</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedHelp(null)}
                    className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h3 className="font-semibold text-slate-200 mb-3 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-400" />
                        Sender Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Name:</span> <span className="text-slate-100">{selectedHelp.senderName || 'N/A'}</span></p>
                        <p><span className="text-slate-400">ID:</span> <span className="text-slate-100 font-mono">{selectedHelp.senderId}</span></p>
                        <p><span className="text-slate-400">Phone:</span> <span className="text-slate-100">{selectedHelp.senderPhone || 'N/A'}</span></p>
                        <p><span className="text-slate-400">WhatsApp:</span> <span className="text-slate-100">{selectedHelp.senderWhatsApp || 'N/A'}</span></p>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h3 className="font-semibold text-slate-200 mb-3 flex items-center">
                        <User className="w-5 h-5 mr-2 text-green-400" />
                        Receiver Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Name:</span> <span className="text-slate-100">{selectedHelp.receiverName || 'N/A'}</span></p>
                        <p><span className="text-slate-400">ID:</span> <span className="text-slate-100 font-mono">{selectedHelp.receiverId}</span></p>
                        <p><span className="text-slate-400">Phone:</span> <span className="text-slate-100">{selectedHelp.receiverPhone || 'N/A'}</span></p>
                        <p><span className="text-slate-400">WhatsApp:</span> <span className="text-slate-100">{selectedHelp.receiverWhatsApp || 'N/A'}</span></p>
                      </div>
                      {/* Universal Chat Button Below Receiver Details */}
                      {selectedHelp?.senderUid && selectedHelp?.receiverUid && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // For admin view, we'll show a message that chat is available in user interface
                            alert('Chat functionality is available in the user interface. Please ask the users to use the chat button in their Send Help or Receive Help sections.');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 w-full shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 touch-manipulation"
                          type="button"
                        >
                          <MessageCircle className="inline mr-2 w-4 h-4" />
                          Chat (User Interface)
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <h3 className="font-semibold text-slate-200 mb-3 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                      Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Amount:</span> <span className="text-green-400 font-semibold text-lg">₹{selectedHelp.amount || 300}</span></p>
                        <p><span className="text-slate-400">Status:</span>
                          <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                            STATUS_COLORS[selectedHelp.status]?.includes('yellow') ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            STATUS_COLORS[selectedHelp.status]?.includes('blue') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            STATUS_COLORS[selectedHelp.status]?.includes('green') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            STATUS_COLORS[selectedHelp.status]?.includes('red') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {selectedHelp.status || 'pending'}
                          </span>
                        </p>
                      </div>
                      {selectedHelp.paymentDetails?.utrNumber && (
                        <div className="space-y-2 text-sm">
                          <p><span className="text-slate-400">UTR Number:</span> <span className="text-slate-100 font-mono">{selectedHelp.paymentDetails.utrNumber}</span></p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedHelp.paymentDetails?.screenshotUrl && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <h3 className="font-semibold text-slate-200 mb-3 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-blue-400" />
                        Payment Proof
                      </h3>
                      <div className="flex justify-center">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={getDirectImageUrl(selectedHelp.paymentDetails.screenshotUrl)}
                          alt="Payment Proof"
                          className="max-w-full h-64 object-contain rounded-lg border border-slate-600 cursor-pointer transition-all duration-200"
                          onClick={() => window.open(getDirectImageUrl(selectedHelp.paymentDetails.screenshotUrl), '_blank')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGM0Y2Ii8+CjxwYXRoIGQ9Ik03NSAxMDBIMjI1VjE1MEg3NVYxMDBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMDAgNjVIMjAwVjEwMEgxMDBWNjVaIiBmaWxsPSIjN0MzRTVGIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendHelpManager;