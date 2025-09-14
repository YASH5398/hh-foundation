const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

exports.onReceiveHelpConfirmed = functions.firestore
  .document('receiveHelp/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.confirmedByReceiver === false && after.confirmedByReceiver === true) {
      const receiverId = after.receiverId;
      console.log(`[onReceiveHelpConfirmed] Confirmation detected for receiverId: ${receiverId}`);
      const usersQuery = db.collection('users').where('userId', '==', receiverId);
      const usersSnap = await usersQuery.get();
      if (usersSnap.empty) {
        console.log(`[onReceiveHelpConfirmed] No user found for receiverId: ${receiverId}`);
        return null;
      }
      const userRef = usersSnap.docs[0].ref;
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let helpReceived = userDoc.get('helpReceived') || 0;
        helpReceived += 1;
        console.log(`[onReceiveHelpConfirmed] Incrementing helpReceived to: ${helpReceived}`);
        const updateData = { helpReceived };
        if (helpReceived === 3) {
          updateData.isReceivingHeld = true;
          updateData.isOnHold = true;
          updateData.levelStatus = 'completed';
          console.log(`[onReceiveHelpConfirmed] helpReceived reached 3. Setting isReceivingHeld, isOnHold, levelStatus.`);
        }
        transaction.update(userRef, updateData);
      });
      console.log(`[onReceiveHelpConfirmed] Transaction complete for receiverId: ${receiverId}`);
    } else {
      console.log('[onReceiveHelpConfirmed] No confirmation change detected.');
    }
    return null;
  });

// Helper function to create notification
const createNotification = async (userId, notificationData) => {
  try {
    const notificationId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.collection('notifications').doc(notificationId).set({
      ...notificationData,
      uid: userId,
      userId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      isDeleted: false
    });
    
    console.log(`Notification created for user ${userId}:`, notificationData.title);
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to send FCM push notification
const sendPushNotification = async (userId, notificationData) => {
  try {
    // Get user's FCM token from fcmTokens collection
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    if (!tokenDoc.exists) {
      console.log(`No FCM token found for user ${userId}`);
      return;
    }
    
    const tokenData = tokenDoc.data();
    const deviceToken = tokenData.token;
    
    if (!deviceToken) {
      console.log(`No device token found for user ${userId}`);
      return;
    }
    
    const message = {
      token: deviceToken,
      notification: {
        title: notificationData.title,
        body: notificationData.message,
        icon: notificationData.iconUrl || '/logo192.png'
      },
      data: {
        actionLink: notificationData.actionLink || '/dashboard',
        type: notificationData.type || 'activity',
        priority: notificationData.priority || 'medium'
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };
    
    await messaging.send(message);
    console.log(`Push notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw error - notification creation should still succeed
  }
};

// HTTP Cloud Function: Send notification
// HTTP Cloud Function for backward compatibility
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const { userId, title, body, data, sound, priority } = req.body;
    
    if (!userId || !title || !body) {
      res.status(400).send('Missing required fields: userId, title, body');
      return;
    }
    
    // Create notification in Firestore
    const notificationData = {
      title,
      message: body,
      type: data?.type || 'activity',
      priority: priority || 'medium',
      actionLink: data?.actionLink || '/dashboard',
      iconUrl: '/logo192.png',
      levelStatus: 'Star',
      relatedHelpId: data?.helpId || null,
      senderName: 'System',
      sentBy: 'system'
    };
    
    await createNotification(userId, notificationData);
    await sendPushNotification(userId, notificationData);
    
    res.status(200).json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error in sendNotification function:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Callable Cloud Function (secure, recommended)
exports.sendNotificationCallable = functions.https.onCall(async (data, context) => {
  try {
    const { token, title, body, data: notificationData } = data || {};
    
    if (!token && !data.userId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing token or userId');
    }
    
    if (!title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing title or body');
    }

    // If token is provided, send directly to that token
    if (token) {
      const message = {
        token,
        notification: { title, body },
        data: notificationData || {},
        android: {
          notification: {
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };
      
      const response = await admin.messaging().send(message);
      console.log('FCM message sent successfully:', response);
      return { success: true, response };
    }
    
    // If userId is provided, use existing notification system
    if (data.userId) {
      const notificationPayload = {
        title,
        message: body,
        type: notificationData?.type || 'activity',
        priority: notificationData?.priority || 'medium',
        actionLink: notificationData?.actionLink || '/dashboard',
        iconUrl: '/logo192.png',
        levelStatus: 'Star',
        relatedHelpId: notificationData?.helpId || null,
        senderName: 'System',
        sentBy: 'system'
      };
      
      await createNotification(data.userId, notificationPayload);
      await sendPushNotification(data.userId, notificationPayload);
      
      return { success: true, message: 'Notification sent successfully' };
    }
    
  } catch (error) {
    console.error('sendNotificationCallable error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification', { error: error.message });
  }
});

// Cloud Function: New user joined notification
exports.onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();
    
    try {
      // Send welcome notification to the new user
      const welcomeNotification = {
        title: 'Welcome to Helping Hands Foundation!',
        message: 'Thank you for joining our community. Start helping others and making a difference today!',
        type: 'system',
        priority: 'high',
        actionLink: '/dashboard',
        iconUrl: 'https://example.com/welcome-icon.png',
        levelStatus: 'Star',
        relatedHelpId: null,
        senderName: 'Helping Hands Foundation',
        sentBy: 'system'
      };
      
      await createNotification(userId, welcomeNotification);
      await sendPushNotification(userId, welcomeNotification);
      
      // Notify all admins about new user
      const adminsSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      const adminNotification = {
        title: 'New User Joined',
        message: `${userData.name || 'A new user'} has joined Helping Hands Foundation.`,
        type: 'activity',
        priority: 'medium',
        actionLink: '/admin/users',
        iconUrl: 'https://example.com/user-icon.png',
        levelStatus: 'Star',
        relatedHelpId: null,
        senderName: 'System',
        sentBy: 'system'
      };
      
      const adminPromises = adminsSnapshot.docs.map(adminDoc => {
        return Promise.all([
          createNotification(adminDoc.id, adminNotification),
          sendPushNotification(adminDoc.id, adminNotification)
        ]);
      });
      
      await Promise.all(adminPromises);
      console.log(`New user notifications sent for user: ${userId}`);
      
    } catch (error) {
      console.error('Error in onUserCreate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Send Help notification
exports.onSendHelpCreate = functions.firestore
  .document('sendHelp/{helpId}')
  .onCreate(async (snap, context) => {
    const helpId = context.params.helpId;
    const helpData = snap.data();
    
    try {
      if (!helpData.receiverUid) {
        console.log('No receiver UID found for send help notification');
        return null;
      }
      
      // Get sender info
      const senderDoc = await db.collection('users').doc(helpData.senderUid).get();
      const senderName = senderDoc.exists ? senderDoc.data().name || 'Someone' : 'Someone';
      
      // Notify receiver
      const receiverNotification = {
        title: 'New Help Request Received!',
        message: `${senderName} has sent you a help request. Check your dashboard to respond.`,
        type: 'activity',
        priority: 'high',
        actionLink: '/dashboard',
        iconUrl: 'https://example.com/help-icon.png',
        levelStatus: 'Star',
        relatedHelpId: helpId,
        senderName: senderName,
        sentBy: helpData.senderUid
      };
      
      await createNotification(helpData.receiverUid, receiverNotification);
      await sendPushNotification(helpData.receiverUid, receiverNotification);
      
      console.log(`Send help notification sent for help: ${helpId}`);
      
    } catch (error) {
      console.error('Error in onSendHelpCreate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Receive Help notification
exports.onReceiveHelpCreate = functions.firestore
  .document('receiveHelp/{helpId}')
  .onCreate(async (snap, context) => {
    const helpId = context.params.helpId;
    const helpData = snap.data();
    
    try {
      if (!helpData.senderUid) {
        console.log('No sender UID found for receive help notification');
        return null;
      }
      
      // Get receiver info
      const receiverDoc = await db.collection('users').doc(helpData.receiverUid).get();
      const receiverName = receiverDoc.exists ? receiverDoc.data().name || 'Someone' : 'Someone';
      
      // Notify sender
      const senderNotification = {
        title: 'Help Request Confirmed!',
        message: `${receiverName} has confirmed your help request. Great job helping others!`,
        type: 'activity',
        priority: 'high',
        actionLink: '/dashboard',
        iconUrl: 'https://example.com/confirm-icon.png',
        levelStatus: 'Star',
        relatedHelpId: helpId,
        senderName: receiverName,
        sentBy: helpData.receiverUid
      };
      
      await createNotification(helpData.senderUid, senderNotification);
      await sendPushNotification(helpData.senderUid, senderNotification);
      
      console.log(`Receive help notification sent for help: ${helpId}`);
      
    } catch (error) {
      console.error('Error in onReceiveHelpCreate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Payment confirmation notification
exports.onPaymentConfirm = functions.firestore
  .document('epinTransfers/{transferId}')
  .onUpdate(async (change, context) => {
    const transferId = context.params.transferId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Check if payment status changed to confirmed
    if (beforeData.status !== 'confirmed' && afterData.status === 'confirmed') {
      try {
        const { senderUid, receiverUid, amount, relatedHelpId } = afterData;
        
        if (!senderUid || !receiverUid) {
          console.log('Missing sender or receiver UID for payment notification');
          return null;
        }
        
        // Get user info
        const [senderDoc, receiverDoc] = await Promise.all([
          db.collection('users').doc(senderUid).get(),
          db.collection('users').doc(receiverUid).get()
        ]);
        
        const senderName = senderDoc.exists ? senderDoc.data().name || 'Someone' : 'Someone';
        const receiverName = receiverDoc.exists ? receiverDoc.data().name || 'Someone' : 'Someone';
        
        // Notify sender
        const senderNotification = {
          title: 'Payment Confirmed!',
          message: `Your payment of ₹${amount} to ${receiverName} has been confirmed successfully.`,
          type: 'activity',
          priority: 'high',
          actionLink: '/dashboard',
          iconUrl: 'https://example.com/payment-icon.png',
          levelStatus: 'Star',
          relatedHelpId: relatedHelpId || null,
          senderName: 'Payment System',
          sentBy: 'system'
        };
        
        // Notify receiver
        const receiverNotification = {
          title: 'Payment Received!',
          message: `You have received ₹${amount} from ${senderName}. Payment confirmed successfully.`,
          type: 'activity',
          priority: 'high',
          actionLink: '/dashboard',
          iconUrl: 'https://example.com/payment-icon.png',
          levelStatus: 'Star',
          relatedHelpId: relatedHelpId || null,
          senderName: 'Payment System',
          sentBy: 'system'
        };
        
        // Send notifications to both users
        await Promise.all([
          createNotification(senderUid, senderNotification),
          sendPushNotification(senderUid, senderNotification),
          createNotification(receiverUid, receiverNotification),
          sendPushNotification(receiverUid, receiverNotification)
        ]);
        
        console.log(`Payment confirmation notifications sent for transfer: ${transferId}`);
        
      } catch (error) {
        console.error('Error in onPaymentConfirm notification:', error);
      }
    }
    
    return null;
  });

exports.onReceiveHelpConfirmedByUid = functions.firestore
  .document('receiveHelp/{docId}')
  .onUpdate(async (change, context) => {
    if (!change.before.data().confirmedByReceiver && change.after.data().confirmedByReceiver) {
      const receiverUid = change.after.data().receiverUid;
      if (!receiverUid) {
        console.log('[onReceiveHelpConfirmedByUid] No receiverUid found in receiveHelp doc.');
        return null;
      }
      const userRef = db.collection('users').doc(receiverUid);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          console.log(`[onReceiveHelpConfirmedByUid] User doc not found for uid: ${receiverUid}`);
          return;
        }
        let helpReceived = userDoc.get('helpReceived') || 0;
        helpReceived += 1;
        console.log(`[onReceiveHelpConfirmedByUid] Incrementing helpReceived for uid ${receiverUid} to: ${helpReceived}`);
        const updateData = { helpReceived };
        if (helpReceived === 3) {
          updateData.isReceivingHeld = true;
          updateData.isOnHold = true;
          updateData.levelStatus = 'completed';
          console.log(`[onReceiveHelpConfirmedByUid] helpReceived reached 3 for uid ${receiverUid}. Setting isReceivingHeld, isOnHold, levelStatus.`);
        }
        transaction.update(userRef, updateData);
      });
      console.log(`[onReceiveHelpConfirmedByUid] Transaction complete for receiverUid: ${receiverUid}`);
    } else {
      console.log('[onReceiveHelpConfirmedByUid] No confirmation change detected.');
    }
    return null;
  });

exports.autoHoldUserOnThreeConfirmed = functions.firestore
  .document('receiveHelp/{docId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();
    // Only run if status just became 'confirmed' and confirmedByReceiver is true
    if (
      after.status === 'confirmed' &&
      after.confirmedByReceiver === true &&
      (before.status !== 'confirmed' || before.confirmedByReceiver !== true)
    ) {
      const receiverId = after.receiverId;
      const receiverUid = after.receiverUid;
      if (!receiverId || !receiverUid) return null;
      // Query all confirmed receiveHelp docs for this user
      const confirmedSnap = await admin.firestore()
        .collection('receiveHelp')
        .where('receiverId', '==', receiverId)
        .where('status', '==', 'confirmed')
        .where('confirmedByReceiver', '==', true)
        .get();
      if (confirmedSnap.size === 3) {
        const userRef = admin.firestore().collection('users').doc(receiverUid);
        const userSnap = await userRef.get();
        const userData = userSnap.exists ? userSnap.data() : null;
        // Only update if not already on hold and helpReceived < 3
        if (userData && (!userData.isReceivingHeld || !userData.isOnHold || (userData.helpReceived || 0) < 3)) {
          await userRef.update({
            helpReceived: 3,
            isReceivingHeld: true,
            isOnHold: true,
          });
          console.log(`[autoHoldUserOnThreeConfirmed] User ${receiverUid} set to hold after 3 confirmed helps.`);
        } else {
          console.log(`[autoHoldUserOnThreeConfirmed] User ${receiverUid} already on hold or has 3 helps.`);
        }
      }
    }
    return null;
  });