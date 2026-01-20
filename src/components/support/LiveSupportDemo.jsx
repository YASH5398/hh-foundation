import React, { useState } from 'react';
import LiveSupportChat from './LiveSupportChat';
import { FiMessageCircle } from 'react-icons/fi';

const LiveSupportDemo = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Live Support Demo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Click "Request Support" to create a new chat room</li>
            <li>• Initially, only you are in the participants list</li>
            <li>• Agents can join from the agent dashboard</li>
            <li>• You'll get a notification when an agent joins</li>
            <li>• Messages sync in real-time using Firestore</li>
            <li>• Mobile-friendly interface with message bubbles</li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowChat(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiMessageCircle className="mr-2" size={20} />
            Request Support
          </button>
        </div>

        {/* Live Support Chat */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <LiveSupportChat onClose={() => setShowChat(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSupportDemo;