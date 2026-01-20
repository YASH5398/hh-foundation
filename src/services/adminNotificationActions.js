import { functions, auth } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { requireFreshIdToken } from './authReady';

const callCreateUserNotification = httpsCallable(functions, 'createUserNotification');

export async function createAdminNotification({ targetUid, title, message, type = 'admin', category, priority, actionLink, relatedAction, relatedHelpId, eventKey }) {
  await requireFreshIdToken();
  if (!auth.currentUser?.uid) throw new Error('Auth not ready');

  const res = await callCreateUserNotification({
    targetUid,
    title,
    message,
    type,
    category,
    priority,
    actionLink,
    relatedAction,
    relatedHelpId,
    eventKey: eventKey || relatedHelpId || relatedAction || `${type}:${title}`,
    preventDuplicates: true
  });

  return { success: !!res.data?.ok, id: res.data?.id, duplicate: !!res.data?.duplicate };
}
