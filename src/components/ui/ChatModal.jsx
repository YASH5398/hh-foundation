import React, { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { subscribeToMessages, sendMessage, markMessagesRead } from '../../services/firebaseService';

const defaultAvatar = '/default-avatar.png';

const formatTime = (ts) => ts?.toDate?.() ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export default function ChatModal({ isOpen, onClose, chatId, currentUser, chatUser, collectionType = 'chats' }) {
  console.log("✅ chatUser inside ChatModal:", chatUser);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Utility to get sorted chatId
  const getChatId = (id1, id2) => [id1, id2].sort().join("_");

  // Real-time message listener for both users
  useEffect(() => {
    if (!isOpen || !currentUser?.userId || !chatUser?.userId) return;
    const sortedChatId = getChatId(currentUser.userId, chatUser.userId);
    if (!sortedChatId || typeof sortedChatId !== 'string' || !sortedChatId.trim()) {
      console.error('❌ chatId is undefined or invalid:', sortedChatId);
      return;
    }
    let unsub;
    if (collectionType === 'helpChats') {
      const messagesRef = collection(db, 'helpChats', sortedChatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      unsub = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else {
      unsub = subscribeToMessages(sortedChatId, (msgs) => {
        setMessages(msgs);
        if (currentUser?.uid) markMessagesRead(sortedChatId, currentUser.uid);
      });
    }
    return () => unsub && unsub();
  }, [isOpen, currentUser?.userId, chatUser?.userId, currentUser?.uid, collectionType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message handler
  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("🧪 currentUser:", currentUser);
    console.log("🧪 chatUser:", chatUser);
    if (
      !chatUser || !chatUser.uid || !chatUser.userId ||
      !currentUser || !currentUser.uid || !currentUser.userId
    ) {
      console.error("❌ Required user fields missing", { chatUser, currentUser });
      return;
    }
    // Safety check for message and required user fields
    if (!message.trim() || !chatUser?.userId || !currentUser?.userId) {
      console.error("❌ Missing required data", { message, chatUser, currentUser });
      return;
    }
    // Defensive checks for required data
    if (!currentUser || !currentUser.userId || !currentUser.uid) {
      console.error("❌ currentUser, userId, or uid is undefined", currentUser);
      return;
    }
    if (!chatUser || !chatUser.userId || !chatUser.uid) {
      console.error("❌ chatUser, userId, or uid is undefined", chatUser);
      return;
    }
    // Reminder: When opening ChatModal, always pass complete user data for chatUser and currentUser
    const sortedChatId = getChatId(currentUser.userId, chatUser.userId);
    console.log("🧪 chatId:", sortedChatId);
    if (!sortedChatId || typeof sortedChatId !== 'string' || !sortedChatId.trim()) {
      console.error('❌ chatId is undefined or invalid:', sortedChatId);
      return;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      console.warn("⚠️ Empty message. Not sending.");
      return;
    }
    try {
      setSending(true);
      if (collectionType === 'helpChats') {
        const messagesRef = collection(db, `helpChats/${sortedChatId}/messages`);
        const newMessage = trimmedMessage;
        console.log("✅ Final message data before sending:", {
          senderUid: currentUser?.uid,
          receiverUid: chatUser?.uid,
          message: newMessage,
          timestamp: serverTimestamp(),
        });
        await addDoc(messagesRef, {
          senderUid: currentUser.uid,
          receiverUid: chatUser.uid,
          message: newMessage,
          timestamp: serverTimestamp()
        });
        setMessage("");
        setSending(false);
        console.log("✅ Message sent");
      } else {
        await sendMessage({
          chatId: sortedChatId,
          senderUid: currentUser.uid,
          receiverUid: chatUser.uid,
          message: trimmedMessage,
          type: 'text',
          senderProfileImage: currentUser.profileImage || currentUser.photoURL || '',
        });
        setMessage("");
        setSending(false);
      }
    } catch (error) {
      setSending(false);
      console.error("❌ Error sending message:", error);
    }
  };

  if (!isOpen || !chatUser?.uid || !currentUser?.uid) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col sm:max-w-xl sm:mx-auto sm:my-8 sm:rounded-2xl sm:shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold truncate">Chat with {chatUser?.name || chatUser?.fullName || chatUser?.userId || 'User'}</h2>
        <button onClick={onClose} className="text-2xl leading-none ml-2">✕</button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && <div className="text-gray-400 text-center mt-10">No messages yet.</div>}
        {messages.map((msg, idx) => {
          console.log("Rendering message:", msg);
          const isSender = msg.senderUid === currentUser.uid;
          // Avatar logic
          const getInitial = (name, fallback) => (name && name[0]) ? name[0].toUpperCase() : (fallback && fallback[0]) ? fallback[0].toUpperCase() : 'U';
          const senderName = isSender ? currentUser.fullName || currentUser.userId : chatUser.fullName || chatUser.userId;
          const senderProfileImage = isSender ? (currentUser.profileImage || '') : (chatUser.profileImage || '');
          return (
            <div key={msg.id || idx} className={`flex items-end mb-3 gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {!isSender && (
                senderProfileImage ? (
                  <img
                    src={senderProfileImage}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 object-cover"
                    alt="avatar"
                    onError={e => { e.target.src = defaultAvatar; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base border border-gray-300">
                    {getInitial(senderName)}
                  </div>
                )
              )}
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${isSender ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                style={{ wordBreak: 'break-word' }}
              >
                {/* Always show message if present, else fallback to text, title, or screenshot */}
                {msg.message ? (
                  <span>{msg.message}</span>
                ) : msg.text ? (
                  <span>{msg.text}</span>
                ) : msg.title ? (
                  <span className="italic text-gray-500">{msg.title}</span>
                ) : msg.screenshotUrl ? (
                  <img src={msg.screenshotUrl} alt="screenshot" className="max-h-32 rounded" />
                ) : null}
                <div className="text-[10px] mt-1 text-right text-gray-400">{formatTime(msg.timestamp)}</div>
              </div>
              {isSender && (
                senderProfileImage ? (
                  <img
                    src={senderProfileImage}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 object-cover"
                    alt="avatar"
                    onError={e => { e.target.src = defaultAvatar; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base border border-gray-300">
                    {getInitial(senderName)}
                  </div>
                )
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="p-3 border-t bg-white sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none text-black"
            disabled={sending}
            maxLength={500}
          />
          {chatUser?.userId && currentUser?.userId ? (
          <button
              onClick={handleSend}
            className="bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold disabled:opacity-60"
            disabled={sending || !message.trim()}
          >
            Send
          </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}