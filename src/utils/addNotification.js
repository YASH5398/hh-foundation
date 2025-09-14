// utils/addNotification.js
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const addNotification = async (fields) => {
  try {
    const {
      uid,
      userId,
      title,
      message,
      type,
      isRead = false,
      sentBy,
      category,
      priority,
      attachments,
      platform,
      userEmail,
      userPhone
    } = fields;
    const docData = {
      uid,
      userId,
      title,
      message,
      type,
      isRead,
      timestamp: serverTimestamp(),
    };
    if (sentBy) docData.sentBy = sentBy;
    if (category) docData.category = category;
    if (priority) docData.priority = priority;
    if (attachments) docData.attachments = attachments;
    if (platform) docData.platform = platform;
    if (userEmail) docData.userEmail = userEmail;
    if (userPhone) docData.userPhone = userPhone;
    await addDoc(collection(db, 'notifications'), docData);
  } catch (error) {
    console.error('Error adding notification:', error);
  }
}; 