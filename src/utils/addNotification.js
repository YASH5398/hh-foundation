// utils/addNotification.js
<<<<<<< HEAD
import { createNotification } from '../services/notificationService';
import { createAdminNotification } from '../services/adminNotificationActions';
import { auth } from '../config/firebase';
=======
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

export const addNotification = async (fields) => {
  try {
    const {
      uid,
      userId,
      title,
      message,
      type,
<<<<<<< HEAD
=======
      isRead = false,
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      sentBy,
      category,
      priority,
      attachments,
      platform,
      userEmail,
<<<<<<< HEAD
      userPhone,
      relatedHelpId,
      eventKey,
      isRead = false
    } = fields || {};

    const targetUid = uid;
    const currentUid = auth.currentUser?.uid;
    const key = eventKey || relatedHelpId || `${type || 'system'}:${title || ''}`;

    if (currentUid && targetUid && targetUid !== currentUid) {
      await createAdminNotification({
        targetUid,
        title,
        message,
        type: type || 'admin',
        category,
        priority,
        actionLink: fields?.actionLink,
        relatedAction: fields?.relatedAction,
        relatedHelpId: relatedHelpId || null,
        eventKey: key
      });
    } else {
      await createNotification({
        uid: targetUid,
        userId: userId || targetUid,
        title,
        message,
        type: type || 'system',
        category,
        priority,
        sentBy,
        attachments,
        platform,
        userEmail,
        userPhone,
        relatedHelpId: relatedHelpId || null,
        eventKey: key,
        preventDuplicates: true
      });
    }
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};
=======
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
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
