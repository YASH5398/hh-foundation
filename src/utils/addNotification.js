// utils/addNotification.js
import { createNotification } from '../services/notificationService';
import { createAdminNotification } from '../services/adminNotificationActions';
import { auth } from '../config/firebase';

export const addNotification = async (fields) => {
  try {
    const {
      uid,
      userId,
      title,
      message,
      type,
      sentBy,
      category,
      priority,
      attachments,
      platform,
      userEmail,
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
