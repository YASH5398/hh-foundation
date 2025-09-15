const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Helper functions for creating standardized notification data
const createNotificationData = (params) => {
  const {
    title,
    message,
    type = 'activity',
    priority = 'medium',
    uid,
    userId,
    senderName = 'System',
    sentBy = 'system',
    actionLink,
    iconUrl,
    category,
    relatedAction,
    relatedHelpId,
    relatedUserId,
    levelStatus,
    dismissible = true,
    ...otherFields
  } = params;

  // Validate required fields
  if (!title || !message || !uid || !userId) {
    throw new Error('Title, message, uid, and userId are required');
  }

  // Base notification object with required fields
  const notification = {
    title,
    message,
    type,
    priority,
    uid,
    userId,
    senderName,
    sentBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false,
    isDeleted: false,
    seenInUI: false,
    readAt: null,
    dismissible
  };

  // Add optional fields only if they have values
  if (actionLink) notification.actionLink = actionLink;
  if (iconUrl) notification.iconUrl = iconUrl;
  if (category) notification.category = category;
  if (relatedAction) notification.relatedAction = relatedAction;
  if (relatedHelpId) notification.relatedHelpId = relatedHelpId;
  if (relatedUserId) notification.relatedUserId = relatedUserId;
  if (levelStatus) notification.levelStatus = levelStatus;

  // Add any other valid fields
  Object.keys(otherFields).forEach(key => {
    if (otherFields[key] !== undefined && otherFields[key] !== null) {
      notification[key] = otherFields[key];
    }
  });

  return notification;
};

const createActivityNotificationData = (params) => {
  return createNotificationData({
    ...params,
    type: 'activity',
    sentBy: 'system',
    senderName: params.senderName || 'System'
  });
};

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
    
    await db.collection('notifications').doc(notificationId).set(notificationData);
    
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
    const notificationData = createActivityNotificationData({
      title,
      message: body,
      uid: userId,
      userId: userId,
      priority: priority || 'medium',
      actionLink: data?.actionLink || '/dashboard',
      category: data?.category || 'system',
      relatedAction: data?.relatedAction,
      relatedHelpId: data?.helpId || null,
      senderName: 'System'
    });
    
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
      const notificationPayload = createActivityNotificationData({
        title,
        message: body,
        uid: data.userId,
        userId: data.userId,
        priority: notificationData?.priority || 'medium',
        actionLink: notificationData?.actionLink || '/dashboard',
        category: notificationData?.category || 'system',
        relatedAction: notificationData?.relatedAction,
        relatedHelpId: notificationData?.helpId || null,
        senderName: 'System'
      });
      
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
      const welcomeNotification = createActivityNotificationData({
        title: '🎉 Welcome to Helping Hands Foundation!',
        message: 'Thank you for joining our community. Start helping others and making a difference today!',
        uid: userId,
        userId: userId,
        priority: 'high',
        actionLink: '/dashboard',
        category: 'welcome',
        relatedAction: 'user_registration',
        senderName: 'Helping Hands Foundation'
      });
      
      await createNotification(userId, welcomeNotification);
      await sendPushNotification(userId, welcomeNotification);
      
      // Notify all admins about new user
      const adminsSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      const adminNotification = createActivityNotificationData({
        title: '👥 New User Joined',
        message: `${userData.name || 'A new user'} has joined Helping Hands Foundation.`,
        priority: 'medium',
        actionLink: '/admin/users',
        category: 'admin',
        relatedAction: 'user_registration',
        relatedUserId: userId
      });
      
      const adminPromises = adminsSnapshot.docs.map(adminDoc => {
        const adminNotificationWithUid = {
          ...adminNotification,
          uid: adminDoc.id,
          userId: adminDoc.id
        };
        return Promise.all([
          createNotification(adminDoc.id, adminNotificationWithUid),
          sendPushNotification(adminDoc.id, adminNotificationWithUid)
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
      const receiverNotification = createActivityNotificationData({
        title: '💰 New Help Assignment',
        message: `You have been assigned to receive help from ${senderName}. Check your dashboard for details.`,
        uid: helpData.receiverUid,
        userId: helpData.receiverUid,
        priority: 'high',
        actionLink: '/dashboard',
        category: 'help',
        relatedAction: 'receive_help',
        relatedHelpId: helpId,
        senderName: senderName
      });
      
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
      const senderNotification = createActivityNotificationData({
        title: '✅ Help Request Confirmed!',
        message: `${receiverName} has confirmed your help request. Great job helping others!`,
        uid: helpData.senderUid,
        userId: helpData.senderUid,
        priority: 'high',
        actionLink: '/dashboard',
        category: 'help',
        relatedAction: 'help_confirmed',
        relatedHelpId: helpId,
        senderName: receiverName
      });
      
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
        const senderNotification = createActivityNotificationData({
          title: '💳 Payment Confirmed!',
          message: `Your payment of ₹${amount} to ${receiverName} has been confirmed successfully.`,
          uid: senderUid,
          userId: senderUid,
          priority: 'high',
          actionLink: '/dashboard',
          category: 'payment',
          relatedAction: 'payment_confirmed',
          relatedHelpId: relatedHelpId || null,
          senderName: 'Payment System'
        });
        
        // Notify receiver
        const receiverNotification = createActivityNotificationData({
          title: '💰 Payment Received!',
          message: `You have received ₹${amount} from ${senderName}. Payment confirmed successfully.`,
          uid: receiverUid,
          userId: receiverUid,
          priority: 'high',
          actionLink: '/dashboard',
          category: 'payment',
          relatedAction: 'payment_received',
          relatedHelpId: relatedHelpId || null,
          senderName: 'Payment System'
        });
        
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