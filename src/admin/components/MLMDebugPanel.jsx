import React, { useState } from 'react';
import { useMLMActivation } from '../../hooks/useMLMActivation';
import { debugAllPendingAssignments } from '../../services/sendHelpService';

export default function MLMDebugPanel() {
  const { debugCurrentUser, debugAllAssignments, loading, error } = useMLMActivation();
  const [userId, setUserId] = useState('');
  const [debugResults, setDebugResults] = useState('');

  const handleDebugUser = async () => {
    if (!userId.trim()) {
      setDebugResults('Please enter a user ID');
      return;
    }
    
    try {
      setDebugResults('Debugging user...');
      // Note: debugMLMState function was removed - implement custom debug logic if needed
      console.log('Debug function removed - implement custom logic if needed');
      setDebugResults('Debug function removed - implement custom logic if needed');
    } catch (err) {
      setDebugResults(`Error: ${err.message}`);
    }
  };

  const handleDebugCurrentUser = async () => {
    try {
      setDebugResults('Debugging current user...');
      await debugCurrentUser();
      setDebugResults('Check browser console for detailed results');
    } catch (err) {
      setDebugResults(`Error: ${err.message}`);
    }
  };

  const handleDebugAllAssignments = async () => {
    try {
      setDebugResults('Debugging all assignments...');
      await debugAllAssignments();
      setDebugResults('Check browser console for detailed results');
    } catch (err) {
      setDebugResults(`Error: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">MLM Debug Panel</h2>
      
      <div className="space-y-6">
        {/* Debug Specific User */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug Specific User</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleDebugUser}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Debugging...' : 'Debug User'}
            </button>
          </div>
        </div>

        {/* Debug Current User */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug Current User</h3>
          <button
            onClick={handleDebugCurrentUser}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Debugging...' : 'Debug Current User'}
          </button>
        </div>

        {/* Debug All Assignments */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug All Pending Assignments</h3>
          <button
            onClick={handleDebugAllAssignments}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Debugging...' : 'Debug All Assignments'}
          </button>
        </div>

        {/* Results */}
        {debugResults && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Debug Results</h3>
            <p className="text-gray-700">{debugResults}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Debug results will be logged to the browser console</li>
            <li>• Check the Network tab for Firestore queries</li>
            <li>• Use this panel to troubleshoot MLM assignment issues</li>
            <li>• Verify user activation status and help document creation</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 