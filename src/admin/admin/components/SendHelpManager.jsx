import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where, serverTimestamp, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { getDirectImageUrl } from '../../utils/firebaseStorageUtils';
import { motion } from 'framer-motion';
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
          const q = query(collection(db, 'sendHelp'), orderBy('createdAt', 'desc'));
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
    <div className="container mx-auto p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 px-2 sm:px-0">Send Help Manager</h1>
      
      {/* Filter & Search */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs sm:text-sm text-gray-700 font-medium">Filter by Status:</label>
          <select
            className="border border-gray-300 rounded-lg p-2 sm:p-2 text-black bg-white text-sm w-full sm:w-auto"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <input
          type="text"
          className="border border-gray-300 rounded-lg p-2 sm:p-2 text-black bg-white text-sm w-full"
          placeholder="Search by User ID or Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receiver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Proof
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No SendHelp data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((help) => (
                  <tr key={help.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-mono text-xs">{help.id}</div>
                      <div className="text-xs text-gray-500">
                        {help.createdAt?.toDate ? help.createdAt.toDate().toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {help.senderName || help.senderId || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {help.senderId}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {help.receiverName || help.receiverId || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {help.receiverId}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-green-600">₹{help.amount || 300}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[help.status] || 'bg-gray-100 text-gray-800'}`}>
                        {help.status || 'pending'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {help.paymentDetails?.screenshotUrl ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={getDirectImageUrl(help.paymentDetails.screenshotUrl)}
                            alt="Payment Proof"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjBGM0Y2Ii8+CjxwYXRoIGQ9Ik0xMCAxM0gyNlYyNkgxMFYxM1oiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEzIDhIMjNWMTNIMTNWOFoiIGZpbGw9IiM3QzNFNUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                          <button
                            onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">No proof</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {help.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(help.id, 'paid')}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(help.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {help.status === 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(help.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs"
                          >
                            Confirm
                          </button>
                        )}
                        {help.status !== 'confirmed' && (
                          <button
                            onClick={() => handleMarkConfirmed(help.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs"
                          >
                            Mark as Confirmed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 px-2">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            No SendHelp data found.
          </div>
        ) : (
          filteredData.map((help) => (
            <div key={help.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-xs text-gray-600 mb-1">{help.id}</div>
                  <div className="text-xs text-gray-500">
                    {help.createdAt?.toDate ? help.createdAt.toDate().toLocaleString() : 'N/A'}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[help.status] || 'bg-gray-100 text-gray-800'}`}>
                  {help.status || 'pending'}
                </span>
              </div>

              {/* Sender & Receiver */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {help.senderName || help.senderId || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Sender: {help.senderId}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {help.receiverName || help.receiverId || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Receiver: {help.receiverId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount & Payment Proof */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">₹{help.amount || 300}</span>
                </div>
                
                {help.paymentDetails?.screenshotUrl ? (
                  <button
                    onClick={() => window.open(getDirectImageUrl(help.paymentDetails.screenshotUrl), '_blank')}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Proof</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No proof</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {help.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(help.id, 'paid')}
                      className="flex-1 text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded text-xs font-medium"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(help.id, 'cancelled')}
                      className="flex-1 text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-2 rounded text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {help.status === 'paid' && (
                  <button
                    onClick={() => handleStatusUpdate(help.id, 'confirmed')}
                    className="flex-1 text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-2 rounded text-xs font-medium"
                  >
                    Confirm
                  </button>
                )}
                {help.status !== 'confirmed' && (
                  <button
                    onClick={() => handleMarkConfirmed(help.id)}
                    className="flex-1 text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-2 rounded text-xs font-medium"
                  >
                    Mark as Confirmed
                  </button>
                )}
                <button
                  onClick={() => setSelectedHelp(help)}
                  className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Send Help Details</h2>
                <button
                  onClick={() => setSelectedHelp(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Sender Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedHelp.senderName || 'N/A'}</p>
                      <p><span className="font-medium">ID:</span> {selectedHelp.senderId}</p>
                      <p><span className="font-medium">Phone:</span> {selectedHelp.senderPhone || 'N/A'}</p>
                      <p><span className="font-medium">WhatsApp:</span> {selectedHelp.senderWhatsApp || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Receiver Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedHelp.receiverName || 'N/A'}</p>
                      <p><span className="font-medium">ID:</span> {selectedHelp.receiverId}</p>
                      <p><span className="font-medium">Phone:</span> {selectedHelp.receiverPhone || 'N/A'}</p>
                      <p><span className="font-medium">WhatsApp:</span> {selectedHelp.receiverWhatsApp || 'N/A'}</p>
                    </div>
                    {/* Universal Chat Button Below Receiver Details */}
                    {selectedHelp?.senderUid && selectedHelp?.receiverUid && (
                      <button
                        onClick={() => {
                          // For admin view, we'll show a message that chat is available in user interface
                          alert('Chat functionality is available in the user interface. Please ask the users to use the chat button in their Send Help or Receive Help sections.');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm mt-2 w-full touch-manipulation"
                        type="button"
                      >
                        💬 Chat (User Interface)
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Amount:</span> ₹{selectedHelp.amount || 300}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[selectedHelp.status] || 'bg-gray-100 text-gray-800'}`}>
                        {selectedHelp.status || 'pending'}
                      </span>
                    </p>
                    {selectedHelp.paymentDetails?.utrNumber && (
                      <p><span className="font-medium">UTR Number:</span> {selectedHelp.paymentDetails.utrNumber}</p>
                    )}
                  </div>
                </div>
                
                {selectedHelp.paymentDetails?.screenshotUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Payment Proof</h3>
                    <div className="flex justify-center">
                      <img
                        src={getDirectImageUrl(selectedHelp.paymentDetails.screenshotUrl)}
                        alt="Payment Proof"
                        className="max-w-full h-48 sm:h-64 object-contain rounded-lg border border-gray-200 cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SendHelpManager;