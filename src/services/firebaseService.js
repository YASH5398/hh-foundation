import { createNotification } from './notificationService';
import { ChatService } from './chatService';

// Chat functions used by ChatModal component

// Chat functions used by ChatModal component

export const sendWelcomeNotification = async (uid, fullName, userId) => {
  if (!uid || !fullName || !userId) return;
  const firstName = fullName.split(' ')[0];
  const message = `👋 Welcome back, ${firstName}! Let’s grow your team and earnings today.`;
  await createNotification({
    uid,
    userId,
    title: 'Welcome Back',
    message,
    type: 'welcome',
    eventKey: `welcome:${uid}`,
    preventDuplicates: true
  });
};

// --- Chat Service ---

export const sendMessage = async ({ chatId, senderUid, receiverUid, message, senderProfileImage }) => {
  return await ChatService.sendDirectMessage({
    chatId,
    senderUid,
    receiverUid,
    message,
    senderProfileImage
  });
};

export const sendMessageToHelpChats = async ({ chatId, senderUid, receiverUid, message }) => {
  return await ChatService.sendHelpChatMessage({ chatId, senderUid, receiverUid, message });
};

export const subscribeToMessages = (chatId, callback) => {
  return ChatService.subscribeToDirectMessages(chatId, callback);
};

export const markMessagesRead = async (chatId, userUid) => {
  return await ChatService.markDirectMessagesAsRead(chatId, userUid);
};