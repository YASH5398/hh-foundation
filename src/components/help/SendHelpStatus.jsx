import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
<<<<<<< HEAD
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import TransactionChat from "../chat/TransactionChat";
import { FiMessageCircle } from 'react-icons/fi';
import { HELP_STATUS, HELP_STATUS_LABELS, normalizeStatus } from '../../config/helpStatus';
=======
import { db } from "../config/firebase";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import TransactionChat from "../chat/TransactionChat";
import { FiMessageCircle } from 'react-icons/fi';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const SendHelpStatus = () => {
  const { user } = useAuth(); // 'user' is the key in your context
  const [sendHelpData, setSendHelpData] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  useEffect(() => {
    const fetchSendHelp = async () => {
      try {
        const q = query(
          collection(db, "sendHelp"),
          where("senderUid", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          const docId = querySnapshot.docs[0].id;
          setSendHelpData(docData);
          setTransactionId(docId);
        }
      } catch (error) {
        console.error("Error fetching Send Help data:", error);
      }
    };

    if (user?.uid) fetchSendHelp();
  }, [user]);

  const openChat = () => {
    setChatOpen(true);
  };

  if (!sendHelpData) return <p>Loading...</p>;

  return (
    <>
      <div className="shadow-lg rounded-2xl p-6 mt-4 max-w-md mx-auto hover:bg-[#eff6ff] transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Receiver Details</h2>

        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {sendHelpData.receiverName || "-"}</p>
          <p><strong>ID:</strong> {sendHelpData.receiverId || "-"}</p>
          <p><strong>Phone:</strong> {sendHelpData.receiverPhone || "-"}</p>
          <p><strong>WhatsApp:</strong> {sendHelpData.receiverWhatsapp || "-"}</p>
          <p><strong>Email:</strong> {sendHelpData.receiverEmail || "-"}</p>
        </div>

        <div className="mt-4">
<<<<<<< HEAD
          <p className="text-gray-700 font-medium">
            Status: {HELP_STATUS_LABELS[normalizeStatus(sendHelpData.status)] || normalizeStatus(sendHelpData.status)}
          </p>
=======
          {sendHelpData.confirmedByReceiver ? (
            <p className="text-green-600 font-medium">✅ Status: DONE (Receiver has confirmed)</p>
          ) : (
            <p className="text-yellow-600 font-medium">⏳ Status: Pending (Waiting for receiver to confirm)</p>
          )}
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        </div>
        {/* Chat Button */}
        {transactionId && (
          <button
            onClick={openChat}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-blue-600 shadow-lg hover:shadow-xl mt-4"
            type="button"
          >
            <FiMessageCircle className="w-4 h-4 flex-shrink-0" />
          </button>
        )}
      </div>
      {/* Chat Modal */}
      {transactionId && (
        <TransactionChat
          transactionType="sendHelp"
          transactionId={transactionId}
          otherUser={{
            name: sendHelpData?.receiverName,
            profileImage: sendHelpData?.receiverProfileImage
          }}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </>
  );
};

export default SendHelpStatus;