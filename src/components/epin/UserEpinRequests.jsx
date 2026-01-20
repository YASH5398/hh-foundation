import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { firestoreQueryService } from '../../services/firestoreQueryService';
import { authGuardService } from '../../services/authGuardService';

const UserEpinRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Check authentication before setting up listener
    if (!authGuardService.isAuthenticated()) {
      console.warn('User not authenticated, cannot fetch E-PIN requests');
      toast.error('Please log in to view your E-PIN requests.');
      setLoading(false);
      return;
    }

    console.log("Setting up E-PIN requests listener for user:", currentUser.uid);

    // Use safe query service with proper validation
    const unsubscribe = firestoreQueryService.setupSafeListener(
      'epinRequests',
      [['userId', '==', currentUser.uid]], // Use userId instead of requestedBy
      [['createdAt', 'desc']],
      (fetchedRequests, error) => {
        if (error) {
          console.error('Error fetching user E-PIN requests:', error);
          toast.error('Error fetching your requests.');
          setRequests([]);
        } else {
          console.log(`Fetched ${fetchedRequests.length} E-PIN requests`);
          setRequests(fetchedRequests);
        }
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up E-PIN requests listener');
      unsubscribe();
    };
  }, [currentUser]);

  const handleImageError = (requestId) => {
    setImageLoadErrors(prev => new Set([...prev, requestId]));
  };

  const handleImageLoad = (requestId) => {
    setImageLoadErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  };

  const renderPaymentScreenshot = (request) => {
    if (!request.paymentScreenshotUrl) {
      return (
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg border border-gray-200">
          <span className="text-xs text-gray-500">No Image</span>
        </div>
      );
    }

    const hasError = imageLoadErrors.has(request.id);

    if (hasError) {
      return (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-lg border border-red-200">
            <span className="text-xs text-red-500">Failed</span>
          </div>
          <button
            onClick={() => {
              setImageLoadErrors(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
              });
            }}
            className="text-blue-500 hover:underline text-xs"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          <img
            src={request.paymentScreenshotUrl} // Use the Firebase Storage download URL directly
            alt="Payment Screenshot"
            className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => window.open(request.paymentScreenshotUrl, '_blank')}
            onError={() => handleImageError(request.id)}
            onLoad={() => handleImageLoad(request.id)}
            loading="lazy"
          />
          {/* Loading overlay */}
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center opacity-0 transition-opacity">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <a
          href={request.paymentScreenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs"
        >
          View Full
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Your E-PIN Request Status</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading your requests...</span>
        </div>
      </div>
    );
  }

  if (!authGuardService.isAuthenticated()) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Your E-PIN Request Status</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please log in to view your E-PIN requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your E-PIN Request Status</h2>
      {requests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">You have not made any E-PIN requests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Request ID</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Bonus</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Total Epins</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Amount Paid</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">UTR Number</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Screenshot</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Status</th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-sm text-gray-900">{request.id.slice(-8)}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">{request.quantityRequested}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">{request.quantityBonus || 0}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">{request.totalEpins}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">₹{request.amountPaid}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">{request.utrNumber}</td>
                  <td className="py-3 px-4 border-b">
                    {renderPaymentScreenshot(request)}
                  </td>
                  <td className="py-3 px-4 border-b text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b text-sm text-gray-900">
                    {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserEpinRequests;