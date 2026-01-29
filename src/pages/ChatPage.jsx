import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc } from '../config/firebase';
import ChatWindow from '../components/chat/ChatWindow';
import { toast } from 'react-hot-toast';

const ChatPage = () => {
  const { helpId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('💬 ChatPage rendered with helpId:', helpId);
  console.log('💬 Current user:', currentUser?.uid);

  useEffect(() => {
    const fetchHelpData = async () => {
      if (!helpId || !currentUser?.uid) {
        console.log('💬 Missing helpId or currentUser, returning');
        setLoading(false);
        return;
      }

      try {
        console.log('💬 Fetching help data for helpId:', helpId);
        
        // Try to get from receiveHelp collection first
        const receiveHelpDoc = await getDoc(doc(db, 'receiveHelp', helpId));
        
        if (receiveHelpDoc.exists()) {
          const data = receiveHelpDoc.data();
          console.log('💬 Found receiveHelp data:', data);
          setHelpData({
            ...data,
            id: helpId,
            collection: 'receiveHelp'
          });
        } else {
          // Try sendHelp collection
          const sendHelpDoc = await getDoc(doc(db, 'sendHelp', helpId));
          
          if (sendHelpDoc.exists()) {
            const data = sendHelpDoc.data();
            console.log('💬 Found sendHelp data:', data);
            setHelpData({
              ...data,
              id: helpId,
              collection: 'sendHelp'
            });
          } else {
            console.error('💬 Help document not found in either collection');
            setError('Chat not found');
          }
        }
      } catch (err) {
        console.error('💬 Error fetching help data:', err);
        setError('Failed to load chat');
        toast.error('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchHelpData();
  }, [helpId, currentUser?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error || !helpData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat Not Available</h2>
            <p className="text-gray-600 mb-6">{error || 'This chat could not be found.'}</p>
            <button
              onClick={() => navigate('/dashboard/receive-help')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Back to Receive Help
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine sender and receiver based on current user and help data
  const isReceiver = currentUser?.uid === helpData.receiverUid;
  const isReceiveHelpCollection = helpData.collection === 'receiveHelp';
  
  let receiverId, senderId, receiverName, senderName;
  
  if (isReceiveHelpCollection) {
    // In receiveHelp collection, current user is the receiver
    receiverId = helpData.receiverUid || currentUser?.uid;
    senderId = helpData.senderUid;
    receiverName = helpData.receiverName || currentUser?.displayName;
    senderName = helpData.senderName;
  } else {
    // In sendHelp collection, current user is the sender
    senderId = helpData.senderUid || currentUser?.uid;
    receiverId = helpData.receiverUid;
    senderName = helpData.senderName || currentUser?.displayName;
    receiverName = helpData.receiverName;
  }

  console.log('💬 Chat participants:', {
    receiverId,
    senderId,
    receiverName,
    senderName,
    isReceiver,
    isReceiveHelpCollection
  });

  console.log('💬 ChatWindow props:', {
    isOpen: true,
    receiverId,
    senderId,
    receiverName,
    senderName,
    receiverPhone: helpData.senderPhone || helpData.receiverPhone,
    receiverWhatsapp: helpData.senderWhatsapp || helpData.receiverWhatsapp
  });

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/receive-help')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  Chat with {isReceiver ? senderName : receiverName}
                </h1>
                <p className="text-sm text-gray-500">Help ID: {helpId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window - Takes remaining vertical space */}
      <div className="flex-grow p-0 bg-white">
        <div className="h-full bg-white overflow-hidden flex flex-col">
          {/* DEBUG: Show chat is loading */}
          <div className="p-4 border-b bg-gray-50 flex-shrink-0">
            <p className="text-sm text-gray-600">
              💬 Chat Loading - Help ID: {helpId} | Sender: {senderName} | Receiver: {receiverName}
            </p>
          </div>
          
          <div className="flex-grow overflow-hidden">
            <ChatWindow
              isOpen={true}
              onClose={() => navigate('/dashboard/receive-help')}
              receiverId={receiverId}
              senderId={senderId}
              receiverName={receiverName}
              senderName={senderName}
              receiverAvatar={null}
              receiverPhone={helpData.senderPhone || helpData.receiverPhone}
              receiverWhatsapp={helpData.senderWhatsapp || helpData.receiverWhatsapp}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;