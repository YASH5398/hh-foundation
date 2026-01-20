import { functions, auth } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { requireFreshIdToken } from './authReady';

const callSetNotificationRead = httpsCallable(functions, 'setNotificationRead');
const callBulkMarkNotificationsRead = httpsCallable(functions, 'bulkMarkNotificationsRead');
const callDeleteUserNotification = httpsCallable(functions, 'deleteUserNotification');

export async function setNotificationRead(notificationId, isRead = true) {
  await requireFreshIdToken();
  if (!auth.currentUser?.uid) throw new Error('Auth not ready');
  const res = await callSetNotificationRead({ notificationId, isRead });
  return { success: !!res.data?.ok };
}

export async function bulkMarkNotificationsRead(notificationIds) {
  await requireFreshIdToken();
  if (!auth.currentUser?.uid) throw new Error('Auth not ready');
  const res = await callBulkMarkNotificationsRead({ notificationIds });
  return { success: !!res.data?.ok, updated: res.data?.updated || 0 };
}

export async function deleteNotification(notificationId) {
  await requireFreshIdToken();
  if (!auth.currentUser?.uid) throw new Error('Auth not ready');
  const res = await callDeleteUserNotification({ notificationId });
  return { success: !!res.data?.ok };
}
