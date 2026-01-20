/**
 * SUPPORT SERVICE - Handle support tickets for blocked users
 */

import {
  db,
  storage,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Create a new support ticket
 */
export async function createSupportTicket(user, ticketData) {
  if (!user?.uid || !ticketData) {
    throw new Error('Invalid user or ticket data');
  }

  try {
    // Generate ticket ID
    const ticketId = `TICKET_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const ticketDoc = {
      ticketId,
      userUid: user.uid,
      userId: user.userId || user.uid,
      userName: user.fullName || user.displayName || user.email,
      userEmail: user.email,
      reason: ticketData.reason || 'Account blocked - deadline expired',
      blockReason: ticketData.blockReason || user.blockReason || null,
      description: ticketData.description || '',
      relatedHelpId: ticketData.relatedHelpId || null,
      priority: ticketData.priority || 'high',
      category: ticketData.category || 'block_resolution',
      status: 'open',
      attachments: ticketData.attachments || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Admin fields
      assignedTo: null,
      resolvedAt: null,
      resolution: null,
      adminNotes: []
    };

    // Create ticket document
    await setDoc(doc(db, 'supportTickets', ticketId), ticketDoc);

    return {
      success: true,
      ticketId,
      ticket: ticketDoc
    };

  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

/**
 * Upload attachment for support ticket
 */
export async function uploadTicketAttachment(file, ticketId) {
  if (!file || !ticketId) {
    throw new Error('File and ticket ID are required');
  }

  try {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `support-attachments/${ticketId}/${fileName}`);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking if needed
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            resolve({
              url: downloadURL,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: serverTimestamp()
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });

  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
}

/**
 * Get user's support tickets
 */
export async function getUserSupportTickets(userUid) {
  if (!userUid) return [];

  try {
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userUid', '==', userUid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(ticketsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error getting user support tickets:', error);
    throw error;
  }
}

/**
 * Get single support ticket
 */
export async function getSupportTicket(ticketId) {
  if (!ticketId) {
    throw new Error('Ticket ID is required');
  }

  try {
    const ticketDoc = await getDoc(doc(db, 'supportTickets', ticketId));

    if (!ticketDoc.exists) {
      throw new Error('Support ticket not found');
    }

    return {
      id: ticketDoc.id,
      ...ticketDoc.data()
    };

  } catch (error) {
    console.error('Error getting support ticket:', error);
    throw error;
  }
}

/**
 * Listen to support tickets in real-time (for users)
 */
export function listenToUserSupportTickets(userUid, callback) {
  if (!userUid) {
    callback([]);
    return () => {};
  }

  const ticketsQuery = query(
    collection(db, 'supportTickets'),
    where('userUid', '==', userUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(ticketsQuery, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tickets);
  }, (error) => {
    console.error('Error listening to support tickets:', error);
    callback([]);
  });
}

/**
 * Listen to all support tickets (for admin)
 */
export function listenToAllSupportTickets(callback) {
  const ticketsQuery = query(
    collection(db, 'supportTickets'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(ticketsQuery, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tickets);
  }, (error) => {
    console.error('Error listening to all support tickets:', error);
    callback([]);
  });
}

/**
 * Update support ticket (admin only)
 */
export async function updateSupportTicket(ticketId, updates) {
  if (!ticketId || !updates) {
    throw new Error('Ticket ID and updates are required');
  }

  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Add resolved timestamp if status changed to resolved
    if (updates.status === 'resolved') {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'supportTickets', ticketId), updateData);

    return { success: true };

  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
}

/**
 * Add admin note to support ticket
 */
export async function addAdminNote(ticketId, note, adminUid) {
  if (!ticketId || !note || !adminUid) {
    throw new Error('Ticket ID, note, and admin UID are required');
  }

  try {
    const noteData = {
      note,
      adminUid,
      createdAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'supportTickets', ticketId), {
      adminNotes: arrayUnion(noteData),
      updatedAt: serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error adding admin note:', error);
    throw error;
  }
}

/**
 * Assign support ticket to admin
 */
export async function assignSupportTicket(ticketId, adminUid, adminName) {
  if (!ticketId || !adminUid) {
    throw new Error('Ticket ID and admin UID are required');
  }

  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      assignedTo: adminUid,
      assignedToName: adminName,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error assigning support ticket:', error);
    throw error;
  }
}
