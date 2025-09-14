import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { getDirectImageUrl } from '../../../utils/firebaseStorageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

const statusColors = {
  accepted: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

const generateRandomEpin = () => {
  // Generates a random 12-digit E-PIN (alphanumeric)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pin = '';
  for (let i = 0; i < 12; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
};

const EpinRequests = () => {
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

    // Validate admin user information
    if (!user?.uid || !user?.fullName || !user?.email) {
      toast.error('Admin profile incomplete. Please update your profile.');
      return;
    }

    // Validate request data
    if (!req.id || !req.uid || !req.requestedCount || req.requestedCount <= 0) {
      toast.error('Invalid request data. Missing required fields.');
      return;
    }

    // Prevent duplicate processing
    if (processingRequest === req.id) {
      toast.error('Request is already being processed');
      return;
    }

    setProcessingRequest(req.id);

    try {
      const batch = writeBatch(db);
      
      // Generate E-PINs
      const newEpins = Array.from({ length: req.requestedCount }, () => ({
        epin: generateRandomEpin(),
        createdAt: serverTimestamp(),
        usedBy: null,
        isUsed: false,
        ownerUid: req.uid,
        requestId: req.id,
        requestType: req.requestType || 'Buy',
        status: 'unused'
      }));

      // Add E-PINs to 'epins' collection
      newEpins.forEach(pin => {
        const epinDoc = doc(collection(db, 'epins'));
        batch.set(epinDoc, pin);
      });

      // Prepare update data for the request with proper admin metadata
      const updateData = {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: {
          uid: user.uid,
          name: user.fullName,
          email: user.email
        },
        totalEpinsGenerated: req.requestedCount,
        epinRequestId: req.id,
        processedAt: serverTimestamp()
      };

      // Validate update data before submitting
      if (!updateData.status || !updateData.approvedAt || !updateData.approvedBy?.uid) {
        throw new Error('Invalid update data prepared');
      }

      // Update request status
      batch.update(doc(db, 'epinRequests', req.id), updateData);

      // Commit the batch
      await batch.commit();
      
      toast.success(`Approved and added ${req.requestedCount} E-PIN(s) to user.`);
      
    } catch (error) {
      console.error('Error approving E-PIN request:', error);
      
      // Provide specific error messages based on error type
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your admin status.');
      } else if (error.code === 'invalid-argument') {
        toast.error('Invalid data provided. Please check the request details.');
      } else if (error.message.includes('Invalid update data')) {
        toast.error('Failed to prepare update data. Please try again.');
      } else {
        toast.error(`Failed to approve request: ${error.message}`);
      }
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

    // Validate admin user information
    if (!user?.uid || !user?.fullName || !user?.email) {
      toast.error('Admin profile incomplete. Please update your profile.');
      return;
    }

    // Validate request data
    if (!req.id) {
      toast.error('Invalid request ID');
      return;
    }

    // Prevent duplicate processing
    if (processingRequest === req.id) {
      toast.error('Request is already being processed');
      return;
    }

    setProcessingRequest(req.id);

    try {
      // Prepare update data for rejection with proper admin metadata
      const updateData = {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: {
          uid: user.uid,
          name: user.fullName,
          email: user.email
        },
        processedAt: serverTimestamp()
      };

      // Validate update data before submitting
      if (!updateData.status || !updateData.rejectedAt || !updateData.rejectedBy?.uid) {
        throw new Error('Invalid rejection data prepared');
      }

      await updateDoc(doc(db, 'epinRequests', req.id), updateData);
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
    (r.fullName?.toLowerCase().includes(search.toLowerCase()) || 
     r.userId?.toLowerCase().includes(search.toLowerCase()) ||
     r.uid?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or user ID..."
          className="w-full md:w-72 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="w-full md:w-48 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No E-PIN requests found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filtered.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 border border-blue-50 relative"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-blue-700">{req.fullName}</span>
                  <span className="text-xs text-gray-400">({req.userId})</span>
                  <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[req.status] || 'bg-gray-100 text-gray-500'}`}>{req.status}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="font-semibold text-gray-700">Count:</span> {req.requestedCount}</div>
                  <div><span className="font-semibold text-gray-700">Type:</span> {req.requestType}</div>
                  <div><span className="font-semibold text-gray-700">Payment:</span> {req.paymentMethod}</div>
                  <div><span className="font-semibold text-gray-700">UTR:</span> {req.utrNumber || 'N/A'}</div>
                  <div><span className="font-semibold text-gray-700">Requested:</span> {req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleString() : '-'}</div>
                </div>
                {req.paymentScreenshotUrl && (
                  <div className="mt-2">
                    <img
                      src={getDirectImageUrl(req.paymentScreenshotUrl)}
                      alt="Payment Screenshot"
                      className="w-24 h-24 object-cover rounded border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setModalImg(getDirectImageUrl(req.paymentScreenshotUrl))}
                    />
                  </div>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      className={`flex-1 py-2 rounded-lg font-semibold shadow transition ${
                        processingRequest === req.id 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                      onClick={() => handleAccept(req)}
                      disabled={processingRequest === req.id}
                    >
                      {processingRequest === req.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        '✅ Approve'
                      )}
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-lg font-semibold shadow transition ${
                        processingRequest === req.id 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      onClick={() => handleReject(req)}
                      disabled={processingRequest === req.id}
                    >
                      {processingRequest === req.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        '❌ Reject'
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Modal for image preview */}
      {modalImg && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setModalImg(null)}>
          <div className="bg-white rounded-2xl p-4 shadow-xl max-w-lg w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img src={modalImg} alt="Payment Proof" className="w-full h-auto max-h-[60vh] rounded mb-4" />
            <button className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700" onClick={() => setModalImg(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpinRequests;