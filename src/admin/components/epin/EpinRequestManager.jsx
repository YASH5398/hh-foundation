import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiImage } from 'react-icons/fi';
import { getDirectImageUrl } from '../../../utils/firebaseStorageUtils';
import { useAuth } from '../../../context/AuthContext';
import { approveEpinRequest } from '../../../services/epinService';

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
  const { user, userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalImg, setModalImg] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    // Real-time listener for all E-PIN requests
    const unsubscribe = onSnapshot(
      collection(db, 'epinRequests'),
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
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or user ID..."
          className="w-full md:w-72 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="w-full md:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-4 text-left font-bold uppercase text-gray-900">User</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Count</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Type</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Payment</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">UTR</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Screenshot</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Status</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Requested</th>
              <th className="px-4 py-4 text-center font-bold uppercase text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No E-PIN requests found.</td>
                </tr>
              )}
              {filtered.map((req) => (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-4 align-top text-gray-900">{req.fullName || req.userName}</td>
                  <td className="px-4 py-4 text-center align-top text-gray-900">{req.requestedCount || req.quantityRequested}</td>
                  <td className="px-4 py-4 text-center align-top text-gray-900">{req.requestType || '-'}</td>
                  <td className="px-4 py-4 text-center align-top text-gray-900">{req.paymentMethod || '-'}</td>
                  <td className="px-4 py-4 text-center align-top text-gray-900">{req.utrNumber || '-'}</td>
                  <td className="px-4 py-4 text-center align-top">
                    {req.paymentScreenshotUrl ? (
                      <button
                        className="focus:outline-none group"
                        title="View Screenshot"
                        onClick={() => setModalImg(getDirectImageUrl(req.paymentScreenshotUrl))}
                      >
                        <img
                          src={getDirectImageUrl(req.paymentScreenshotUrl)}
                          alt="Payment Screenshot"
                          className="w-12 h-12 object-cover rounded border border-gray-200 group-hover:scale-105 transition-transform inline-block"
                        />
                      </button>
                    ) : (
                      <span className="italic text-gray-700">No proof</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      req.status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                      req.status === 'accepted' ? 'bg-green-500 text-white' :
                      req.status === 'approved' ? 'bg-green-500 text-white' :
                      req.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-gray-200 text-gray-900'
                    }`}>
                      {req.status === 'pending' && '🟡 Pending'}
                      {req.status === 'accepted' && '🟢 Accepted'}
                      {req.status === 'approved' && '🟢 Approved'}
                      {req.status === 'rejected' && '🔴 Rejected'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center align-top text-gray-900">{formatTimestamp(req.timestamp || req.createdAt)}</td>
                  <td className="px-4 py-4 text-center align-top">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className={`p-2 rounded-full shadow transition ${
                            processingRequest === req.id 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                          title={processingRequest === req.id ? 'Processing...' : 'Approve'}
                          onClick={() => handleAccept(req)}
                          disabled={processingRequest === req.id}
                        >
                          {processingRequest === req.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
                          ) : (
                          <FiCheckCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          className={`p-2 rounded-full shadow transition touch-manipulation ${
                            processingRequest === req.id 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                          title={processingRequest === req.id ? 'Processing...' : 'Reject'}
                          onClick={() => handleReject(req)}
                          disabled={processingRequest === req.id}
                        >
                          {processingRequest === req.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700"></div>
                          ) : (
                          <FiXCircle className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        <AnimatePresence>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl shadow-lg">
              No E-PIN requests found.
            </div>
          )}
          {filtered.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{req.fullName || req.userName}</h3>
                  <p className="text-sm text-gray-500">{formatTimestamp(req.timestamp || req.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  req.status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                  req.status === 'accepted' ? 'bg-green-500 text-white' :
                  req.status === 'approved' ? 'bg-green-500 text-white' :
                  req.status === 'rejected' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-900'
                }`}>
                  {req.status === 'pending' && '🟡 Pending'}
                  {req.status === 'accepted' && '🟢 Accepted'}
                  {req.status === 'approved' && '🟢 Approved'}
                  {req.status === 'rejected' && '🔴 Rejected'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Count</p>
                  <p className="text-sm font-medium text-gray-900">{req.requestedCount || req.quantityRequested}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Type</p>
                  <p className="text-sm font-medium text-gray-900">{req.requestType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Payment</p>
                  <p className="text-sm font-medium text-gray-900">{req.paymentMethod || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">UTR</p>
                  <p className="text-sm font-medium text-gray-900">{req.utrNumber || '-'}</p>
                </div>
              </div>
              
              {req.paymentScreenshotUrl && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Screenshot</p>
                  <button
                    className="focus:outline-none group touch-manipulation"
                    title="View Screenshot"
                    onClick={() => setModalImg(getDirectImageUrl(req.paymentScreenshotUrl))}
                  >
                    <img
                      src={getDirectImageUrl(req.paymentScreenshotUrl)}
                      alt="Payment Screenshot"
                      className="w-16 h-16 object-cover rounded border border-gray-200 group-hover:scale-105 transition-transform"
                    />
                  </button>
                </div>
              )}
              
              {req.status === 'pending' && (
                <div className="flex gap-3 pt-3 border-t border-gray-200">
                  <button
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition touch-manipulation ${
                      processingRequest === req.id 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                    disabled={processingRequest === req.id}
                    onClick={() => handleAccept(req)}
                  >
                    <FiCheckCircle className="inline mr-2" size={16} />
                    {processingRequest === req.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition touch-manipulation ${
                      processingRequest === req.id 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                    disabled={processingRequest === req.id}
                    onClick={() => handleReject(req)}
                  >
                    <FiXCircle className="inline mr-2" size={16} />
                    {processingRequest === req.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Modal for image preview */}
      {modalImg && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setModalImg(null)}>
          <div className="relative max-w-4xl max-h-full">
            <img src={modalImg} alt="Payment Screenshot" className="max-w-full max-h-full object-contain rounded-lg" />
            <button
              className="absolute top-2 right-2 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl touch-manipulation"
              onClick={() => setModalImg(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpinRequestManager;