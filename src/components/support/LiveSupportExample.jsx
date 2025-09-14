import React, { useState } from 'react';
import LiveSupportChat from './LiveSupportChat';
import { FiMessageCircle } from 'react-icons/fi';

const LiveSupportExample = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Need Help?</h2>
        <p className="text-gray-600 mb-6">
          Connect with our live support team for immediate assistance.
        </p>
        
        <button
          onClick={() => setShowChat(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <FiMessageCircle size={20} />
          <span>Connect with Live Support</span>
        </button>
      </div>

      {showChat && (
        <LiveSupportChat onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default LiveSupportExample;