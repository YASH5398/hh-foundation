import React, { useRef, useState, useEffect } from 'react';
import { FaList, FaPlusCircle, FaExchangeAlt, FaHistory, FaUserCircle } from 'react-icons/fa';
import EpinDashboard from "../epin/EpinDashboard";

import RequestEpin from "../epin/RequestEpin";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const customStyles = `
.fade-in {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
    transform: translateY(30px);
}
@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.glass-effect {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}
.tap-scale {
    transition: transform 0.1s ease;
}
.tap-scale:active {
    transform: scale(0.95);
}
.hover-glow:hover {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
}
.profile-initial {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.input-focus:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}
.upload-area {
    border: 2px dashed rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
}
.upload-area:hover {
    border-color: rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.05);
}
.upload-area.dragover {
    border-color: #22c55e;
    background-color: rgba(34, 197, 94, 0.1);
}
`;

const tabs = [
  { name: "Available", icon: <FaList />, component: EpinDashboard },
  { name: "Request", icon: <FaPlusCircle />, component: RequestEpin },
  { name: "Transfer", icon: <FaExchangeAlt />, component: () => <div>Transfer functionality moved to Available E-PINs</div> },
];

const mockUser = {
  uid: 'USER123456',
  fullName: 'John Doe',
  avatar: '', // Add avatar URL if available
};

const SendHelp = () => {
  console.log('SendHelp loaded');
  const { user } = useAuth();
  const [receiver, setReceiver] = useState(null);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [amount, setAmount] = useState('300');
  const [selectedFile, setSelectedFile] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const fileInputRef = useRef();
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tabs[activeTab].component;

  // For demo, replace with actual user context
  const currentUser = mockUser;

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!utrNumber || !selectedFile) {
      setStatus({ type: 'error', message: 'Please fill in all required fields and upload payment proof.' });
      return;
    }
    
    setStatus({ type: 'info', message: 'Processing your payment...' });
    
    // Simulate API call
    setTimeout(() => {
      setStatus({ type: 'success', message: 'Payment submitted successfully! Your account will be activated once the receiver confirms the payment.' });
      setUtrNumber('');
      setSelectedFile(null);
      setPreviewUrl('');
      setScreenshot(null);
    }, 2000);
  };

  // Reset drag state
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);

  // Fetch receiver data
  useEffect(() => {
    if (user?.uid) {
      // Mock receiver data - replace with actual Firestore query
      setReceiver({
        userId: 'RCV123456',
        fullName: 'Receiver Name',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        profileImage: null
      });
    }
  }, [user]);

  const q = query(collection(db, 'receiveHelp'), where('status', '==', 'pending'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
            Send Help
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Send help to activate your account and start receiving payments from the community.
          </p>
        </div>

        {/* Status Banner */}
        {!user?.isActivated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm sm:text-base font-medium text-yellow-800">
                  Account Not Activated
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your account needs to be activated by sending ₹300 to the assigned receiver. Once payment is confirmed, your account will be activated automatically.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receiver Card */}
        {receiver && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Receiver Details</h2>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex-shrink-0">
                {receiver.profileImage ? (
                  <img
                    src={receiver.profileImage}
                    alt={receiver.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                    {receiver.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{receiver.fullName}</h3>
                <p className="text-sm sm:text-base text-gray-600">ID: {receiver.userId}</p>
                <p className="text-sm sm:text-base text-gray-600">📞 {receiver.phone}</p>
                {receiver.whatsapp && (
                  <p className="text-sm sm:text-base text-gray-600">📱 {receiver.whatsapp}</p>
                )}
              </div>
            </div>
            {/* Universal Chat Button Below Receiver Details */}
            {user?.uid && receiver?.uid && (
              <button
                onClick={() => {
                  // Navigate to the main send-help page where chat functionality is available
                  window.location.href = '/dashboard/send-help';
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm mt-4 w-full"
                type="button"
              >
                💬 Chat with {receiver.fullName || 'Receiver'}
              </button>
            )}
          </div>
        )}

        {/* Send Help Form */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Send Help Form</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Amount Field */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Amount to Send
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg sm:text-xl">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg sm:text-xl font-semibold"
                  placeholder="300"
                  min="300"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Minimum amount: ₹300</p>
            </div>

            {/* Payment Proof Upload */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Payment Proof (Screenshot/Photo)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm sm:text-base text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-600">{selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* UTR Number */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                UTR Number (Transaction Reference)
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Enter UTR number from your payment app"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Enter the transaction reference number from your payment app</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-colors duration-200 text-base sm:text-lg"
              >
                Send Help ₹300
              </button>
            </div>
          </form>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg ${
            status.type === 'success' ? 'bg-green-50 border border-green-200' :
            status.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {status.type === 'success' ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status.type === 'error' ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm sm:text-base font-medium ${
                  status.type === 'success' ? 'text-green-800' :
                  status.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendHelp;
