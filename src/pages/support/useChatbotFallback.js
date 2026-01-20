// Ensures fallback AI response is always added if chatbot reply is empty or missing
import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useChatbotFallback(messages, isLoading, isTyping, db, chatRoomId) {
  useEffect(() => {
    if (!isLoading && !isTyping && messages.length > 0 && chatRoomId) {
      const last = messages[messages.length - 1];
      if (
        last.senderUid === 'CHATBOT' &&
        (!last.text || last.text.trim() === '') &&
        !messages.some((msg, idx) => idx !== messages.length - 1 && msg.senderUid === 'CHATBOT' && msg.text === 'I am unable to process your request right now. Please try again later or contact support.')
      ) {
        addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), {
          senderUid: 'CHATBOT',
          senderType: 'agent',
          senderName: 'AI Assistant',
          text: 'I am unable to process your request right now. Please try again later or contact support.',
          timestamp: serverTimestamp(),
        });
      }
    }
    // eslint-disable-next-line
  }, [messages, isLoading, isTyping, db, chatRoomId]);
}
