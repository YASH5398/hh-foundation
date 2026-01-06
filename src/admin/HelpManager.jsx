import { useEffect, useState } from 'react';
import { FaCheckCircle, FaTrash, FaEye } from 'react-icons/fa';
import { getSendHelpRequests as getHelpRequests, updateSendHelpRequest as updateHelpRequest, deleteSendHelpRequest as deleteHelpRequest } from '../services/sendHelpService';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';

function HelpManager() {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10); // Number of requests per page
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getHelpRequests((data) => {
      setHelpRequests(data);
      setTotalRequests(data.length);
      setLoading(false);
      showToast('Help requests fetched successfully!', 'success');
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleMarkAsResolved = async (id) => {
    if (window.confirm('Are you sure you want to mark this request as resolved?')) {
      setLoading(true);
      try { await updateHelpRequest(id, { status: 'resolved' });
        setHelpRequests(helpRequests.map(req => req.id === id ? { ...req, status: 'resolved' } : req));
        showToast('Help request marked as resolved!', 'success');
      } catch (err) {
        setError('Failed to update help request.');
        showToast('Failed to update help request.', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Are you sure you want to delete this help request?')) {
      setLoading(true);
      try { await deleteHelpRequest(id);
        setHelpRequests(helpRequests.filter(req => req.id !== id));
        showToast('Help request deleted successfully!', 'success');
      } catch (err) {
        setError('Failed to delete help request.');
        showToast('Failed to delete help request.', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalRequests / requestsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <div className="text-center py-8">Loading help requests...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Help Request Management</h1>

      <Table
        headers={['User', 'Subject', 'Status', 'Actions']}
        data={helpRequests}
        renderRow={(request) => (
          <tr key={request.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {request.userName || request.userEmail || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {request.subject}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  request.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {request.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                onClick={() => handleViewDetails(request)}
                className="text-blue-600 hover:text-blue-900 mr-3"
              >
                <FaEye className="inline-block mr-1" />View
              </button>
              {request.status !== 'resolved' && (
                <button
                  onClick={() => handleMarkAsResolved(request.id)}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  <FaCheckCircle className="inline-block mr-1" />Resolve
                </button>
              )}
              <button
                onClick={() => handleDeleteRequest(request.id)}
                className="text-red-600 hover:text-red-900"
              >
                <FaTrash className="inline-block mr-1" />Delete
              </button>
            </td>
          </tr>
        )}
        emptyMessage="No help requests found."
      />

      <nav className="mt-4">
        <ul className="flex justify-center">
          {pageNumbers.map(number => (
            <li key={number} className="mx-1">
              <button
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                {number}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {isModalOpen && selectedRequest && (
        <Modal title="Help Request Details" onClose={closeModal}>
          <div className="p-4">
            <p><strong>User:</strong> {selectedRequest.userName || selectedRequest.userEmail || 'N/A'}</p>
            <p><strong>Subject:</strong> {selectedRequest.subject}</p>
            <p><strong>Message:</strong> {selectedRequest.message}</p>
            <p><strong>Status:</strong> {selectedRequest.status}</p>
            {selectedRequest.createdAt && (
              <p><strong>Date:</strong> {new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString()}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default HelpManager;