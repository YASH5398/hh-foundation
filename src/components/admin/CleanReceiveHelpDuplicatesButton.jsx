import React, { useState } from 'react';
import { cleanReceiveHelpDuplicates } from '../../utils/cleanReceiveHelpDuplicates';
import { useAuth } from '../../context/AuthContext';

export default function CleanReceiveHelpDuplicatesButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!user?.isAdmin) return null;

  const handleClick = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const deleted = await cleanReceiveHelpDuplicates();
      setResult(`Deleted ${deleted} duplicate(s).`);
    } catch (e) {
      setError(e.message || 'Error cleaning duplicates');
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
        {loading ? 'Cleaning...' : 'Clean Duplicate ReceiveHelp Docs'}
      </button>
      {result && <div className="mt-2 text-green-600">{result}</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
} 