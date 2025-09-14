import React, { useState } from 'react';
import { cleanSendHelpDuplicates } from '../../utils/cleanSendHelpDuplicates';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import { toast } from 'react-toastify';

export default function DeleteDuplicateSendHelpButton() {
  const { userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(null);
  const [error, setError] = useState(null);

  if (!isAdmin) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const deleted = await cleanSendHelpDuplicates();
      setDeletedCount(deleted);
      toast.success(`Deleted ${deleted} duplicate SendHelp record(s).`);
      setModalOpen(false);
    } catch (e) {
      setError(e.message || 'Error deleting duplicates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      <button
        onClick={() => setModalOpen(true)}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:opacity-50"
      >
        Delete Duplicate SendHelp Records
      </button>
      <Modal isOpen={modalOpen} onClose={() => !loading && setModalOpen(false)} title="Confirm Deletion">
        <div className="py-2 text-gray-700">
          Are you sure you want to delete all duplicate SendHelp records? <br/>
          <span className="text-sm text-gray-500">Duplicates are determined by the same senderId, receiverId, and amount. Only one of each group will be kept.</span>
        </div>
        {error && <div className="text-red-600 my-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={() => setModalOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
      {deletedCount !== null && (
        <div className="mt-2 text-green-600">Deleted {deletedCount} duplicate SendHelp record(s).</div>
      )}
    </div>
  );
}