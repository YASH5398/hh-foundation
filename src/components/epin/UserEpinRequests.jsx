import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { getDirectImageUrl } from '../../utils/firebaseStorageUtils';

const UserEpinRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    console.log("currentUser:", currentUser);
    console.log("Firestore data:", {
      requestedBy: currentUser?.uid,
      quantity: selectedQty,
      paymentMethod: selectedMethod,
      utrNumber: utr,
      proofURL: proofUrl,
      status: "Pending",
      timestamp: "serverTimestamp()"
    });

    const q = query(
      collection(db, 'epinRequests'),
      where('requestedBy', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(fetchedRequests);
    }, (error) => {
      console.error('Error fetching user E-PIN requests:', error);
      toast.error('Error fetching your requests.');
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your E-PIN Request Status</h2>
      {requests.length === 0 ? (
        <p>You have not made any E-PIN requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Request ID</th>
                <th className="py-2 px-4 border-b">Quantity</th>
                <th className="py-2 px-4 border-b">Bonus</th>
                <th className="py-2 px-4 border-b">Total Epins</th>
                <th className="py-2 px-4 border-b">Amount Paid</th>
                <th className="py-2 px-4 border-b">UTR Number</th>
                <th className="py-2 px-4 border-b">Screenshot</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-sm">{request.id}</td>
                  <td className="py-2 px-4 border-b text-sm">{request.quantityRequested}</td>
                  <td className="py-2 px-4 border-b text-sm">{request.quantityBonus}</td>
                  <td className="py-2 px-4 border-b text-sm">{request.totalEpins}</td>
                  <td className="py-2 px-4 border-b text-sm">₹{request.amountPaid}</td>
                  <td className="py-2 px-4 border-b text-sm">{request.utrNumber}</td>
                  <td className="py-2 px-4 border-b">
                    {request.paymentScreenshotUrl ? (
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src={getDirectImageUrl(request.paymentScreenshotUrl)}
                          alt="Payment Screenshot"
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(getDirectImageUrl(request.paymentScreenshotUrl), '_blank')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIzMiIgeT0iMzIiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjODg4Ij5JbWFnZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        <a
                          href={getDirectImageUrl(request.paymentScreenshotUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          View Full
                        </a>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-2 px-4 border-b text-sm capitalize">{request.status}</td>
                  <td className="py-2 px-4 border-b text-sm">
                    {request.createdAt?.toDate().toLocaleDateString() || 'N/A'}
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