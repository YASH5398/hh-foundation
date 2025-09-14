import React, { useState } from 'react';
import { cleanReceiveHelpDuplicates } from '../../utils/cleanReceiveHelpDuplicates';
import { useAuth } from '../../context/AuthContext';

export default function DeleteDuplicateReceiveHelpButton() {
  const { userClaims } = useAuth();
  const isAdmin = userClaims && userClaims.admin === true;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isAdmin) return null;

  const handleClick = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const deleted = await cleanReceiveHelpDuplicates();
      setResult(`✅ ${deleted} duplicates deleted.`);
    } catch (e) {
      setError(e.message || 'Error deleting duplicates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete Duplicate receiveHelp Docs'}
      </button>
      {result && <div className="mt-2 text-green-600">{result}</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
}