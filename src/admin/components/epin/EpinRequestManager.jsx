import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiImage } from 'react-icons/fi';
<<<<<<< HEAD
import { useAuth } from '../../../context/AuthContext';
import { approveEpinRequest } from '../../../services/epinService';
import { firestoreQueryService } from '../../../services/firestoreQueryService';
import { authGuardService } from '../../../services/authGuardService';
=======
import { getDirectImageUrl } from '../../../utils/firebaseStorageUtils';
import { useAuth } from '../../../context/AuthContext';
import { approveEpinRequest } from '../../../services/epinService';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const statusColors = {
  accepted: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

function formatTimestamp(ts) {
  if (!ts) return '-';
  let date;
  if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    return '-';
  }
  return date.toLocaleDateString('en-GB') + ' | ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function generateRandomEpin() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pin = '';
  for (let i = 0; i < 12; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

const EpinRequestManager = () => {
<<<<<<< HEAD
  const { user, isAdmin, loading: authLoading } = useAuth();
=======
  const { user, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalImg, setModalImg] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
    // Wait for auth/claims to load
    if (authLoading) return;

    // Check authentication before setting up listener
    if (!authGuardService.isAuthenticated()) {
      console.warn('Admin not authenticated, cannot fetch E-PIN requests');
      toast.error('Please log in to access admin features.');
      setLoading(false);
      return;
    }

    // Use safe query service for real-time listener
    const unsubscribe = firestoreQueryService.setupSafeListener(
      'epinRequests',
      [['status', '!=', null]], // Get all requests with any status
      [['createdAt', 'desc']], // Sort by creation date, newest first
      (reqList, error) => {
        if (error) {
          console.error('Error fetching E-PIN requests:', error);
          toast.error('Failed to load E-PIN requests');
          setRequests([]);
        } else {
          console.log(`Fetched ${reqList.length} E-PIN requests`);
          setRequests(reqList);
        }
=======
    // Real-time listener for all E-PIN requests
    const q = query(collection(db, 'epinRequests'), where('status', '!=', null));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const reqList = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        // Sort by timestamp (newest first)
        reqList.sort((a, b) => {
          const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 
                       a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 
                       b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return bTime - aTime;
        });
    setRequests(reqList);
    setLoading(false);
      },
      (error) => {
        console.error('Error fetching E-PIN requests:', error);
        toast.error('Failed to load E-PIN requests');
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        setLoading(false);
      }
    );

<<<<<<< HEAD
    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up E-PIN requests listener');
      unsubscribe();
    };
=======
    return () => unsubscribe();
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  }, []);

  const handleAccept = async (req) => {
    // Validate admin permissions
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }
    // Build adminInfo
    const adminInfo = {
      uid: user?.uid || '',
      name: user?.fullName || user?.displayName || user?.name || user?.userName || '',
      email: user?.email || ''
    };
    if (!adminInfo.uid || !adminInfo.name || !adminInfo.email) {
      toast.error('Admin info incomplete. Please ensure your profile has uid, name, and email.');
      return;
    }
    if (!req.id) {
      toast.error('Invalid request data. Missing required fields.');
      return;
    }
    if (processingRequest === req.id) {
      toast.error('Request is already being processed');
      return;
    }
    setProcessingRequest(req.id);
    try {
      await approveEpinRequest(req.id, adminInfo);
      
      // Send notification to user about EPIN approval
      try {
        const { sendNotification } = await import('../../../context/NotificationContext');
        await sendNotification({
          title: 'E-PIN Request Approved',
          message: `Your request for ${req.totalEpins || req.quantityRequested} E-PINs has been approved by admin`,
          type: 'success',
          priority: 'high',
          actionLink: '/user/epin-requests',
          targetUserId: req.userId
        });
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }
    } catch (error) {
      // approveEpinRequest already handles toast and logging
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (req) => {
    // Validate admin permissions
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    // Debug: Log the entire user object to see what's available
    console.log('🔍 Full user object:', user);
    console.log('🔍 User properties:', {
      uid: user?.uid,
      fullName: user?.fullName,
      email: user?.email,
      displayName: user?.displayName,
      name: user?.name,
      userName: user?.userName
    });

    // Build and validate adminInfo - try multiple possible name fields
    const adminInfo = {
      uid: user?.uid,
      name: user?.fullName || user?.displayName || user?.name || user?.userName || "Unknown Admin",
      email: user?.email || ""
    };
    
    console.log('🔍 Built adminInfo:', { ...adminInfo });
    
    const missing = [];
    if (!adminInfo.uid) missing.push("uid");
    if (!adminInfo.name || adminInfo.name === "Unknown Admin") missing.push("name");
    if (adminInfo.email === undefined || adminInfo.email === null) missing.push("email");
    
    if (missing.length > 0) {
      console.error("❌ Admin info missing fields:", missing, adminInfo);
      console.error("❌ User object keys:", Object.keys(user || {}));
      toast.error(`Admin info missing: ${missing.join(", ")}. Please update your profile.`);
      return;
    }
    console.log('✅ Admin info validated:', { ...adminInfo });

    // Validate request data
    if (!req.id) {
      toast.error('Invalid request ID');
      return;
    }
    if (processingRequest === req.id) {
      toast.error('Request is already being processed');
      return;
    }
    setProcessingRequest(req.id);
    try {
      // Prepare serverTimestamp outside of log/object
      const rejectedAt = serverTimestamp();
      const updateData = {
        status: 'rejected',
        rejectedAt,
        rejectedBy: adminInfo,
        processedAt: serverTimestamp()
      };
      // Log updateData without serverTimestamp fields
      const logUpdateData = { ...updateData, rejectedAt: '[serverTimestamp]', processedAt: '[serverTimestamp]' };
      console.log('📝 Updating E-PIN with:', logUpdateData);
      if (!updateData.status || !updateData.rejectedBy?.uid || !updateData.rejectedBy?.name || updateData.rejectedBy?.email === undefined || updateData.rejectedBy?.email === null) {
        throw new Error('Invalid rejection data prepared');
      }
      await updateDoc(doc(db, 'epinRequests', req.id), updateData);
      
      // Send notification to user about EPIN rejection
      try {
        const { sendNotification } = await import('../../../context/NotificationContext');
        await sendNotification({
          title: 'E-PIN Request Rejected',
          message: `Your request for ${req.totalEpins || req.quantityRequested} E-PINs has been rejected by admin`,
          type: 'error',
          priority: 'high',
          actionLink: '/user/epin-requests',
          targetUserId: req.userId
        });
      } catch (notificationError) {
        console.error('Error sending rejection notification:', notificationError);
      }
      
      toast.success('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting E-PIN request:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your admin status.');
      } else if (error.code === 'invalid-argument') {
        toast.error('Invalid data provided. Please check the request details.');
      } else {
        toast.error(`Failed to reject request: ${error.message}`);
      }
    } finally {
      setProcessingRequest(null);
    }
  };

  const filtered = requests.filter(r =>
    (filter === 'all' || r.status === filter) &&
    ((r.fullName || r.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.userId || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.uid || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">E-PIN Request Manager</h1>
        <p className="text-slate-400 text-sm md:text-base">Manage and process E-PIN requests from users</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or user ID..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all" className="bg-slate-800 text-slate-100">All Statuses</option>
              <option value="pending" className="bg-slate-800 text-slate-100">Pending</option>
              <option value="accepted" className="bg-slate-800 text-slate-100">Accepted</option>
              <option value="rejected" className="bg-slate-800 text-slate-100">Rejected</option>
            </select>
          </div>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-600">
<<<<<<< HEAD
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">User</th>
=======
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">User</th>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Count</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Type</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Payment</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">UTR</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Screenshot</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Requested</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <AnimatePresence>
                {filtered.length === 0 && !loading && (
                  <tr>
<<<<<<< HEAD
                    <td colSpan={10} className="px-6 py-12 text-center">
=======
                    <td colSpan={9} className="px-6 py-12 text-center">
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FiCheckCircle className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No E-PIN requests found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((req) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="text-slate-100 font-medium">{req.fullName || req.userName}</div>
                      <div className="text-slate-400 text-sm">{req.userId}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-100 font-semibold">{req.requestedCount || req.quantityRequested}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-300">{req.requestType || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-300">{req.paymentMethod || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-300 font-mono text-sm">{req.utrNumber || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.paymentScreenshotUrl ? (
                        <button
                          className="focus:outline-none group transition-transform hover:scale-105"
                          title="View Screenshot"
<<<<<<< HEAD
                          onClick={() => setModalImg(req.paymentScreenshotUrl)}
                        >
                          <img
                            src={req.paymentScreenshotUrl}
                            alt="Payment Screenshot"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-600 group-hover:border-slate-500 transition-colors"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIyNCIgeT0iMjQiIGZvbnQtc2l6ZT0iOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM4ODgiPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                            }}
=======
                          onClick={() => setModalImg(getDirectImageUrl(req.paymentScreenshotUrl))}
                        >
                          <img
                            src={getDirectImageUrl(req.paymentScreenshotUrl)}
                            alt="Payment Screenshot"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-600 group-hover:border-slate-500 transition-colors"
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                          />
                        </button>
                      ) : (
                        <span className="text-slate-500 italic text-sm">No proof</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        req.status === 'accepted' || req.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        req.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {req.status === 'pending' && '⏳ Pending'}
                        {(req.status === 'accepted' || req.status === 'approved') && '✅ Approved'}
                        {req.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-slate-300 text-sm">{formatTimestamp(req.timestamp || req.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              processingRequest === req.id
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/25'
                            }`}
                            title={processingRequest === req.id ? 'Processing...' : 'Approve'}
                            onClick={() => handleAccept(req)}
                            disabled={processingRequest === req.id}
                          >
                            {processingRequest === req.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                            ) : (
                              <FiCheckCircle className="w-5 h-5" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              processingRequest === req.id
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-500/25'
                            }`}
                            title={processingRequest === req.id ? 'Processing...' : 'Reject'}
                            onClick={() => handleReject(req)}
                            disabled={processingRequest === req.id}
                          >
                            {processingRequest === req.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                            ) : (
                              <FiXCircle className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        <AnimatePresence>
          {filtered.length === 0 && !loading && (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-8 text-center">
              <FiCheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
              <p className="text-slate-300 text-lg font-medium">No E-PIN requests found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
          {filtered.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 shadow-xl hover:shadow-2xl transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100 text-lg">{req.fullName || req.userName}</h3>
                  <p className="text-slate-400 text-sm">{req.userId}</p>
                  <p className="text-slate-500 text-xs mt-1">{formatTimestamp(req.timestamp || req.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  req.status === 'accepted' || req.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  req.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {req.status === 'pending' && '⏳ Pending'}
                  {(req.status === 'accepted' || req.status === 'approved') && '✅ Approved'}
                  {req.status === 'rejected' && '❌ Rejected'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium mb-1">Count</p>
                  <p className="text-slate-100 font-semibold">{req.requestedCount || req.quantityRequested}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium mb-1">Type</p>
                  <p className="text-slate-300">{req.requestType || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium mb-1">Payment</p>
                  <p className="text-slate-300">{req.paymentMethod || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium mb-1">UTR</p>
                  <p className="text-slate-300 font-mono text-sm">{req.utrNumber || '-'}</p>
                </div>
              </div>

              {req.paymentScreenshotUrl && (
                <div className="mb-4">
<<<<<<< HEAD
                  <p className="text-xs text-slate-400 uppercase font-medium mb-2">Images</p>
                  <div className="flex gap-4">
                    {req.paymentScreenshotUrl && (
                      <div className="flex flex-col items-center">
                        <button
                          className="focus:outline-none group transition-transform hover:scale-105 touch-manipulation"
                          title="View Screenshot"
                          onClick={() => setModalImg(req.paymentScreenshotUrl)}
                        >
                          <img
                            src={req.paymentScreenshotUrl}
                            alt="Payment Screenshot"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-600 group-hover:border-slate-500 transition-colors"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI0MCIgeT0iNDAiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjODg4Ij5FcnJvcjwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        </button>
                        <span className="text-xs text-slate-400 mt-1">Payment</span>
                      </div>
                    )}
                  </div>
=======
                  <p className="text-xs text-slate-400 uppercase font-medium mb-2">Payment Proof</p>
                  <button
                    className="focus:outline-none group transition-transform hover:scale-105 touch-manipulation"
                    title="View Screenshot"
                    onClick={() => setModalImg(getDirectImageUrl(req.paymentScreenshotUrl))}
                  >
                    <img
                      src={getDirectImageUrl(req.paymentScreenshotUrl)}
                      alt="Payment Screenshot"
                      className="w-20 h-20 object-cover rounded-lg border border-slate-600 group-hover:border-slate-500 transition-colors"
                    />
                  </button>
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 touch-manipulation ${
                      processingRequest === req.id
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/25'
                    }`}
                    disabled={processingRequest === req.id}
                    onClick={() => handleAccept(req)}
                  >
                    <FiCheckCircle className="inline mr-2" size={16} />
                    {processingRequest === req.id ? 'Processing...' : 'Approve'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 touch-manipulation ${
                      processingRequest === req.id
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-500/25'
                    }`}
                    disabled={processingRequest === req.id}
                    onClick={() => handleReject(req)}
                  >
                    <FiXCircle className="inline mr-2" size={16} />
                    {processingRequest === req.id ? 'Processing...' : 'Reject'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Modal for image preview */}
      <AnimatePresence>
        {modalImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModalImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full bg-slate-800 rounded-xl border border-slate-600 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImg}
                alt="Payment Screenshot"
                className="max-w-full max-h-full object-contain"
              />
              <button
                className="absolute top-4 right-4 bg-slate-700/80 hover:bg-slate-600 text-slate-100 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl transition-all duration-200 touch-manipulation hover:scale-110"
                onClick={() => setModalImg(null)}
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EpinRequestManager;