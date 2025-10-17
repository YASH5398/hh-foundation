import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../config/firebase"; // Corrected path
import { useAuth } from "../../context/AuthContext"; // Corrected path
import TransactionChat from "../chat/TransactionChat";

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
          {sendHelpData.confirmedByReceiver ? (
            <p className="text-green-600 font-medium">✅ Status: DONE (Receiver has confirmed)</p>
          ) : (
            <p className="text-yellow-600 font-medium">⏳ Status: Pending (Waiting for receiver to confirm)</p>
          )}
        </div>
        {/* TEMPORARILY DISABLED - Chat Button Below Status */}
        {/* {transactionId && (
          <button
            onClick={openChat}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm mt-2 w-full"
            type="button"
          >
            💬 Chat with Receiver
          </button>
        )} */}
      </div>
      {/* TEMPORARILY DISABLED - Transaction Chat */}
      {/* <TransactionChat
        transactionType="sendHelp"
        transactionId={transactionId}
        otherUser={{
          name: sendHelpData?.receiverName,
          profileImage: sendHelpData?.receiverProfileImage
        }}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        chatId={chatInfo?.chatId}
        currentUser={user}
        otherUser={chatInfo?.otherUser}
      /> */}
    </>
  );
};

export default SendHelpStatus;