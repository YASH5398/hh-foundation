import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    limit,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { bulkMarkNotificationsRead } from './notificationActions';

/**
 * AGENT NOTIFICATION TYPES
 */
export const AGENT_NOTIF_TYPES = {
    CHAT_REQUEST: 'chat_request',
    TICKET: 'ticket',
    SPAM: 'spam',
    SYSTEM: 'system'
};

/**
 * AGENT NOTIFICATION PRIORITIES
 */
export const AGENT_NOTIF_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

/**
 * Create a new agent notification
 */
export async function createAgentNotification({ type, title, message, userId, userName, priority = AGENT_NOTIF_PRIORITIES.MEDIUM }) {
    try {
        const notificationData = {
            type,
            title,
            message,
            userId: userId || 'system',
            userName: userName || 'System',
            createdAt: serverTimestamp(),
            isRead: false,
            priority
        };

        const docRef = await addDoc(collection(db, 'agentNotifications'), notificationData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating agent notification:', error);
        return { success: false, error };
    }
}

/**
 * Listen to agent notifications in real-time
 * @param {Function} callback - Called with notifications array on success
 * @param {Function} onError - Optional callback for errors (receives error object)
 * @returns {Function} Unsubscribe function
 */
export function listenToAgentNotifications(callback, onError) {
    let hasLoggedError = false;

    const notifQuery = query(
        collection(db, 'agentNotifications'),
        orderBy('createdAt', 'desc'),
        limit(100)
    );

    const unsubscribe = onSnapshot(
        notifQuery,
        (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            callback(notifications);
        },
        (error) => {
            // Log only once to prevent console spam
            if (!hasLoggedError) {
                console.error('[AgentNotifications] Listener error:', error.code || error.message);
                hasLoggedError = true;
            }

            // Stop the listener on permission error (no infinite retry)
            if (error.code === 'permission-denied') {
                unsubscribe();
            }

            // Notify caller of error
            if (typeof onError === 'function') {
                onError(error);
            } else {
                // Fallback: return empty array if no error handler
                callback([]);
            }
        }
    );

    return unsubscribe;
}

/**
 * Mark a notification as read
 */
export async function markAgentNotificationAsRead(notificationId) {
    try {
        const notifRef = doc(db, 'agentNotifications', notificationId);
        await updateDoc(notifRef, {
            isRead: true,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error marking agent notification as read:', error);
        return { success: false, error };
    }
}

/**
 * Mark all agent notifications as read
 */
export async function markAllAgentNotificationsRead() {
    try {
        const unreadQuery = query(
            collection(db, 'agentNotifications'),
            where('isRead', '==', false),
            limit(500)
        );

        const snapshot = await getDocs(unreadQuery);
        if (snapshot.empty) return { success: true };

        const ids = snapshot.docs.map(docSnap => docSnap.id);
        const result = await bulkMarkNotificationsRead(ids, 'agentNotifications');

        if (!result.success) {
            throw new Error('API failed to mark notifications as read');
        }

        return { success: true, updated: result.updated };
    } catch (error) {
        console.error('Error [markAllAgentNotificationsRead]:', error);
        return { success: false, error };
    }
}
