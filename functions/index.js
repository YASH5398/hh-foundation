const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest: httpsOnRequest, onCall: httpsOnCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Import MLM core logic - SINGLE SOURCE OF TRUTH
const {
  LEVEL_CONFIG,
  LEVEL_ORDER,
  isIncomeBlocked,
  getCurrentBlockPoint,
  getRequiredPaymentForUnblock,
  getTotalHelpsByLevel,
  getAmountByLevel,
  getNextLevel,
  getBlockPointsByLevel,
  getUpgradeAmount,
  getSponsorPaymentAmount,
  getLevelIndex,
  isMaxLevel,
  validateLevelUpgrade,
  validateSponsorPayment,
  validateUpgradePayment
} = require('./shared/mlmCore');

// Helper functions for level management
const unblockUserIncome = async (userId, level) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    isReceivingHeld: false,
    isOnHold: false,
    lastUnblockTime: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[unblockUserIncome] Unblocked income for user ${userId} at level ${level}`);
};

const upgradeUserLevel = async (userId, newLevel) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    level: newLevel,
    helpReceived: 0, // Reset help counter for new level
    isReceivingHeld: false,
    isOnHold: false,
    levelStatus: 'active',
    lastUpgradeTime: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[upgradeUserLevel] Upgraded user ${userId} to level ${newLevel}`);
};

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

exports.onReceiveHelpConfirmed = onDocumentUpdated('receiveHelp/{docId}', async (change, context) => {
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
        const userData = userDoc.data();
        let helpReceived = userData.helpReceived || 0;
        helpReceived += 1; // Idempotent increment - only happens once per confirmation
        console.log(`[onReceiveHelpConfirmed] Incrementing helpReceived to: ${helpReceived}`);

        const updateData = { helpReceived };

        // Use MLM core logic to check if income should be blocked
        if (isIncomeBlocked({ ...userData, helpReceived })) {
          updateData.isReceivingHeld = true;
          updateData.isOnHold = true;
          console.log(`[onReceiveHelpConfirmed] helpReceived reached ${helpReceived} for level ${userData.level}. Income BLOCKED.`);
        }

        // Check if level is completed (hard stop)
        if (helpReceived >= getTotalHelpsByLevel(userData.level)) {
          updateData.levelStatus = 'completed';
          console.log(`[onReceiveHelpConfirmed] Level ${userData.level} completed with ${helpReceived} helps.`);
        }

        transaction.update(userRef, updateData);
      });
      console.log(`[onReceiveHelpConfirmed] Transaction complete for receiverId: ${receiverId}`);
    } else {
      console.log('[onReceiveHelpConfirmed] No confirmation change detected.');
    }
    return null;
   });

// Cloud Function: Payment delay reminder notifications
exports.onReceiveHelpPaymentDelay = onDocumentUpdated('receiveHelp/{receiveHelpId}', async (change, context) => {
    const receiveHelpId = context.params.receiveHelpId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    try {
      // Check if receiver was found but payment is still pending
      if (!beforeData.receiverId && afterData.receiverId && !afterData.paymentConfirmed) {
        const { senderId, receiverId, amount } = afterData;
        
        if (!senderId || !receiverId) {
          console.log('Missing senderId or receiverId for payment delay reminder');
          return null;
        }
        
        // Schedule recurring payment reminders every 3 hours
        const schedulePaymentReminder = async (reminderCount = 1) => {
          if (reminderCount > 24) { // Stop after 24 reminders (3 days)
            console.log(`Payment reminder limit reached for receiveHelp: ${receiveHelpId}`);
            return;
          }
          
          // Check if payment is still pending
          const currentDoc = await db.collection('receiveHelp').doc(receiveHelpId).get();
          if (!currentDoc.exists || currentDoc.data().paymentConfirmed) {
            console.log(`Payment completed or document deleted for receiveHelp: ${receiveHelpId}`);
            return;
          }
          
          const currentData = currentDoc.data();
          
          // Get receiver info for personalized message
          const receiverDoc = await db.collection('users').doc(receiverId).get();
          const receiverName = receiverDoc.exists ? receiverDoc.data().fullName || receiverDoc.data().name || 'Receiver' : 'Receiver';
          
          const paymentReminderNotification = createActivityNotificationData({
            title: '⏰ Payment Reminder',
            message: `Reminder: Please complete your payment of ₹${amount} to ${receiverName}. They are waiting for your help.`,
            uid: senderId,
            userId: senderId,
            priority: 'high',
            actionLink: '/dashboard/send-help',
            category: 'reminder',
            relatedAction: 'payment_reminder',
            senderName: 'HH Foundation'
          });
          
          await createNotification(senderId, paymentReminderNotification);
          await sendPushNotification(senderId, paymentReminderNotification);
          
          console.log(`Payment reminder ${reminderCount} sent for receiveHelp: ${receiveHelpId}`);
          
          // Schedule next reminder in 3 hours (10800000 ms)
          setTimeout(() => {
            schedulePaymentReminder(reminderCount + 1);
          }, 3 * 60 * 60 * 1000);
        };
        
        // Start the first reminder after 3 hours
        setTimeout(() => {
          schedulePaymentReminder(1);
        }, 3 * 60 * 60 * 1000);
        
        console.log(`Payment delay reminder scheduled for receiveHelp: ${receiveHelpId}`);
      }
      
    } catch (error) {
      console.error('Error in onReceiveHelpPaymentDelay notification:', error);
    }
    
    return null;
  });

// Cloud Function: Leaderboard ranking notifications
exports.onLeaderboardUpdate = onDocumentUpdated('leaderboard/{leaderboardId}', async (change, context) => {
    const leaderboardId = context.params.leaderboardId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    try {
      // Check for upcoming payments leaderboard changes
      if (leaderboardId === 'upcomingPayments' && afterData.rankings) {
        const rankings = afterData.rankings;
        const previousRankings = beforeData.rankings || [];
        
        // Check for users entering top 50, 20, 10, or 5
        const checkRanks = [50, 20, 10, 5];
        
        for (const targetRank of checkRanks) {
          if (rankings.length >= targetRank) {
            const currentTopUsers = rankings.slice(0, targetRank).map(r => r.userId);
            const previousTopUsers = previousRankings.slice(0, targetRank).map(r => r.userId);
            
            // Find new users in this rank tier
            const newTopUsers = currentTopUsers.filter(userId => !previousTopUsers.includes(userId));
            
            for (const userId of newTopUsers) {
              const userRanking = rankings.find(r => r.userId === userId);
              if (userRanking) {
                const rankingNotification = createActivityNotificationData({
                  title: `🏆 Top ${targetRank} Upcoming Payments!`,
                  message: `Congratulations! You've reached rank #${userRanking.rank} in the upcoming payments leaderboard. Keep it up!`,
                  uid: userId,
                  userId: userId,
                  priority: 'high',
                  actionLink: '/dashboard/leaderboard',
                  category: 'achievement',
                  relatedAction: 'leaderboard_rank',
                  senderName: 'HH Foundation'
                });
                
                await createNotification(userId, rankingNotification);
                await sendPushNotification(userId, rankingNotification);
                
                console.log(`Upcoming payments leaderboard notification sent for user: ${userId}, rank: ${userRanking.rank}`);
              }
            }
          }
        }
      }
      
      // Check for main leaderboard top 10 changes
      if (leaderboardId === 'main' && afterData.rankings) {
        const rankings = afterData.rankings;
        const previousRankings = beforeData.rankings || [];
        
        if (rankings.length >= 10) {
          const currentTop10 = rankings.slice(0, 10).map(r => r.userId);
          const previousTop10 = previousRankings.slice(0, 10).map(r => r.userId);
          
          // Find new users in top 10
          const newTop10Users = currentTop10.filter(userId => !previousTop10.includes(userId));
          
          for (const userId of newTop10Users) {
            const userRanking = rankings.find(r => r.userId === userId);
            if (userRanking) {
              const top10Notification = createActivityNotificationData({
                title: '🌟 Top 10 Main Leaderboard!',
                message: `Amazing! You've reached rank #${userRanking.rank} in the main leaderboard. You're among the top performers!`,
                uid: userId,
                userId: userId,
                priority: 'high',
                actionLink: '/dashboard/leaderboard',
                category: 'achievement',
                relatedAction: 'top_10_main',
                senderName: 'HH Foundation'
              });
              
              await createNotification(userId, top10Notification);
              await sendPushNotification(userId, top10Notification);
              
              console.log(`Main leaderboard top 10 notification sent for user: ${userId}, rank: ${userRanking.rank}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error in onLeaderboardUpdate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Testimonial approval notification (Earn Free E-PIN)
exports.onTestimonialUpdate = onDocumentUpdated('testimonials/{testimonialId}', async (change, context) => {
    const testimonialId = context.params.testimonialId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    try {
      // Check if testimonial was approved
      if (beforeData.status !== 'approved' && afterData.status === 'approved') {
        const { userId, videoTitle } = afterData;
        
        if (!userId) {
          console.log('No userId found for testimonial approval notification');
          return null;
        }
        
        // Award 5 E-PINs to user (this would typically be handled by another function)
        // For now, just send notification
        const testimonialApprovedNotification = createActivityNotificationData({
          title: '🎉 Testimonial Approved - 5 E-PINs Earned!',
          message: `Congratulations! Your testimonial video "${videoTitle || 'Your testimonial'}" has been approved. You've earned 5 free E-PINs!`,
          uid: userId,
          userId: userId,
          priority: 'high',
          actionLink: '/dashboard/testimonials',
          category: 'reward',
          relatedAction: 'testimonial_approved',
          senderName: 'HH Foundation'
        });
        
        await createNotification(userId, testimonialApprovedNotification);
        await sendPushNotification(userId, testimonialApprovedNotification);
        
        console.log(`Testimonial approval notification sent for user: ${userId}`);
      }
      
      // Check if testimonial was rejected
      if (beforeData.status !== 'rejected' && afterData.status === 'rejected') {
        const { userId, videoTitle, rejectionReason } = afterData;
        
        if (!userId) {
          console.log('No userId found for testimonial rejection notification');
          return null;
        }
        
        const testimonialRejectedNotification = createActivityNotificationData({
          title: '❌ Testimonial Not Approved',
          message: `Your testimonial video "${videoTitle || 'Your testimonial'}" was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please review our guidelines and try again.'}`,
          uid: userId,
          userId: userId,
          priority: 'medium',
          actionLink: '/dashboard/testimonials',
          category: 'update',
          relatedAction: 'testimonial_rejected',
          senderName: 'HH Foundation'
        });
        
        await createNotification(userId, testimonialRejectedNotification);
        await sendPushNotification(userId, testimonialRejectedNotification);
        
        console.log(`Testimonial rejection notification sent for user: ${userId}`);
      }
      
    } catch (error) {
      console.error('Error in onTestimonialUpdate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Support ticket creation notification
exports.onSupportTicketCreate = onDocumentCreated('supportTickets/{ticketId}', async (snap, context) => {
    const ticketId = context.params.ticketId;
    const ticketData = snap.data();
    
    try {
      const { userId, subject, priority } = ticketData;
      
      if (!userId) {
        console.log('No userId found for support ticket notification');
        return null;
      }
      
      // Send confirmation to user
      const userNotification = createActivityNotificationData({
        title: '🎫 Support Ticket Created',
        message: `Your support ticket "${subject}" has been created successfully. Our team will respond soon.`,
        uid: userId,
        userId: userId,
        priority: 'medium',
        actionLink: '/dashboard/support/tickets',
        category: 'support',
        relatedAction: 'ticket_created',
        senderName: 'Support System'
      });
      
      await createNotification(userId, userNotification);
      await sendPushNotification(userId, userNotification);
      
      console.log(`Support ticket creation notification sent for ticket: ${ticketId}`);
      
    } catch (error) {
      console.error('Error in onSupportTicketCreate notification:', error);
    }
    
    return null;
  });

// Cloud Function: Support ticket agent assignment notification
exports.onSupportTicketUpdate = onDocumentUpdated('supportTickets/{ticketId}', async (change, context) => {
    const ticketId = context.params.ticketId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    try {
      // Check if agent was assigned
      if (!beforeData.agentId && afterData.agentId) {
        const { userId, agentId, subject } = afterData;
        
        if (!userId) {
          console.log('No userId found for agent assignment notification');
          return null;
        }
        
        // Get agent info
        const agentDoc = await db.collection('users').doc(agentId).get();
        const agentName = agentDoc.exists ? agentDoc.data().fullName || agentDoc.data().name || 'Support Agent' : 'Support Agent';
        
        const agentAssignmentNotification = createActivityNotificationData({
          title: '👨‍💼 Agent Assigned to Your Ticket',
          message: `${agentName} has been assigned to your support ticket "${subject}". They will connect with you soon.`,
          uid: userId,
          userId: userId,
          priority: 'high',
          actionLink: '/dashboard/support/tickets',
          category: 'support',
          relatedAction: 'agent_assigned',
          senderName: 'Support System'
        });
        
        await createNotification(userId, agentAssignmentNotification);
        await sendPushNotification(userId, agentAssignmentNotification);
        
        console.log(`Agent assignment notification sent for ticket: ${ticketId}`);
      }
      
      // Check if status changed to 'in_progress' (agent connected)
      if (beforeData.status !== 'in_progress' && afterData.status === 'in_progress') {
        const { userId, agentId } = afterData;
        
        if (!userId) {
          console.log('No userId found for agent connection notification');
          return null;
        }
        
        // Get agent info
        const agentDoc = await db.collection('users').doc(agentId).get();
        const agentName = agentDoc.exists ? agentDoc.data().fullName || agentDoc.data().name || 'Support Agent' : 'Support Agent';
        
        const agentConnectedNotification = createActivityNotificationData({
          title: '🟢 Agent Available Now',
          message: `${agentName} is now available and ready to help you with your support ticket.`,
          uid: userId,
          userId: userId,
          priority: 'high',
          actionLink: '/dashboard/support/live-agent',
          category: 'support',
          relatedAction: 'agent_available',
          senderName: 'Support System'
        });
        
        await createNotification(userId, agentConnectedNotification);
        await sendPushNotification(userId, agentConnectedNotification);
        
        console.log(`Agent connection notification sent for ticket: ${ticketId}`);
      }
      
    } catch (error) {
      console.error('Error in onSupportTicketUpdate notification:', error);
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
    // Get user's FCM token from fcmTokens collection (new structure)
    let fcmToken = null;
    
    // First try the new fcmTokens collection
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    if (tokenDoc.exists && tokenDoc.data().token) {
      fcmToken = tokenDoc.data().token;
    } else {
      // Fallback to users collection for backward compatibility
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().fcmToken) {
        fcmToken = userDoc.data().fcmToken;
      }
    }

    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, error: 'No FCM token found' };
    }
    
    const message = {
      token: fcmToken,
      notification: {
        title: notificationData.title,
        body: notificationData.message,
        icon: notificationData.iconUrl || '/logo192.png'
      },
      data: {
        notificationId: notificationData.uid || '',
        actionLink: notificationData.actionLink || '/dashboard',
        type: notificationData.type || 'activity',
        priority: notificationData.priority || 'medium',
        userId: userId,
        category: notificationData.category || 'general',
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'hh_foundation_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true
        },
        fcmOptions: {
          link: notificationData.actionLink || '/dashboard'
        }
      }
    };
    
    const response = await messaging.send(message);
    console.log(`Push notification sent to user ${userId}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/registration-token-not-registered') {
      try {
        // Remove invalid token from both collections
        await db.collection('fcmTokens').doc(userId).delete();
        await db.collection('users').doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
        console.log(`Removed invalid token for user: ${userId}`);
      } catch (deleteError) {
        console.error('Error removing invalid token:', deleteError);
      }
    }
    
    return { success: false, error: error.message };
  }
};

// HTTP Cloud Function: Send notification
// HTTP Cloud Function for backward compatibility
/*
exports.sendNotification = httpsOnRequest(async (req, res) => {
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
exports.sendNotificationCallable = httpsOnCall(async (data, context) => {
  try {
    const { token, title, body, data: notificationData } = data || {};
    
    if (!token && !data.userId) {
      throw new HttpsError('invalid-argument', 'Missing token or userId');
    }
    
    if (!title || !body) {
      throw new HttpsError('invalid-argument', 'Missing title or body');
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
    throw new HttpsError('internal', 'Failed to send notification', { error: error.message });
  }
});
*/

// Cloud Function: New user joined notification
exports.onUserCreate = onDocumentCreated('users/{userId}', async (snap, context) => {
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
      
      // Send referral notification to sponsor if user joined via referral
      if (userData.sponsorId && userData.sponsorId !== userId) {
        try {
          // Get sponsor's user document
          const sponsorQuery = await db.collection('users')
            .where('userId', '==', userData.sponsorId)
            .limit(1)
            .get();
          
          if (!sponsorQuery.empty) {
            const sponsorDoc = sponsorQuery.docs[0];
            const sponsorData = sponsorDoc.data();
            const sponsorUid = sponsorDoc.id;
            
            const referralNotification = createActivityNotificationData({
              title: '🎯 New Referral Joined!',
              message: `${userData.fullName || userData.name || 'Someone'} joined using your referral link. You've earned referral rewards!`,
              uid: sponsorUid,
              userId: sponsorUid,
              priority: 'high',
              actionLink: '/dashboard/direct-referral',
              category: 'referral',
              relatedAction: 'new_referral',
              relatedUserId: userId,
              senderName: 'Referral System'
            });
            
            await createNotification(sponsorUid, referralNotification);
            await sendPushNotification(sponsorUid, referralNotification);
            
            console.log(`Referral notification sent to sponsor: ${userData.sponsorId}`);
          }
        } catch (referralError) {
          console.error('Error sending referral notification:', referralError);
        }
      }
      
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
exports.onSendHelpCreate = onDocumentCreated('sendHelp/{helpId}', async (snap, context) => {
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
exports.onReceiveHelpCreate = onDocumentCreated('receiveHelp/{helpId}', async (snap, context) => {
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
exports.onPaymentConfirm = onDocumentUpdated('epinTransfers/{transferId}', async (change, context) => {
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



// Cloud Function: Level payment confirmation (upgrade or sponsor payment)
exports.onLevelPaymentConfirmed = onDocumentUpdated('levelPayments/{paymentId}', async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only process if status changed to confirmed
    if (before.status !== 'confirmed' && after.status === 'confirmed') {
      const { userId, paymentType, amount } = after;

      if (!userId || !paymentType) {
        console.log('[onLevelPaymentConfirmed] Missing userId or paymentType');
        return null;
      }

      console.log(`[onLevelPaymentConfirmed] Processing ${paymentType} payment of ₹${amount} for user: ${userId}`);

      const userRef = db.collection('users').doc(userId);

      try {
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error(`User ${userId} not found`);
          }

          const userData = userDoc.data();
          const updateData = {};

          if (paymentType === 'upgrade') {
            // UPGRADE PAYMENT: Upgrade level and reset counters
            const nextLevel = getNextLevel(userData.level);
            if (!nextLevel) {
              throw new Error(`No next level available for ${userData.level}`);
            }

            // Validate upgrade payment
            const upgradeValidation = validateUpgradePayment(userData);
            if (!upgradeValidation.valid) {
              throw new Error(`Invalid upgrade payment: ${upgradeValidation.reason}`);
            }

            if (upgradeValidation.amount !== amount) {
              throw new Error(`Upgrade amount mismatch: expected ₹${upgradeValidation.amount}, got ₹${amount}`);
            }

            updateData.level = nextLevel;
            updateData.helpReceived = 0; // Reset counter for new level
            updateData.isReceivingHeld = false;
            updateData.isOnHold = false;
            updateData.levelStatus = 'active';
            updateData.lastUpgradeTime = admin.firestore.FieldValue.serverTimestamp();

            console.log(`[onLevelPaymentConfirmed] Upgraded user ${userId} from ${userData.level} to ${nextLevel}`);

          } else if (paymentType === 'sponsor') {
            // SPONSOR PAYMENT: Only unblock income, NEVER upgrade
            const sponsorValidation = validateSponsorPayment(userData, after.sponsorId);
            if (!sponsorValidation.valid) {
              throw new Error(`Invalid sponsor payment: ${sponsorValidation.reason}`);
            }

            if (sponsorValidation.amount !== amount) {
              throw new Error(`Sponsor amount mismatch: expected ₹${sponsorValidation.amount}, got ₹${amount}`);
            }

            // Only unblock - no level change
            updateData.isReceivingHeld = false;
            updateData.isOnHold = false;
            updateData.lastUnblockTime = admin.firestore.FieldValue.serverTimestamp();

            console.log(`[onLevelPaymentConfirmed] Unblocked income for user ${userId} after sponsor payment`);

          } else {
            throw new Error(`Unknown payment type: ${paymentType}`);
          }

          transaction.update(userRef, updateData);

          // Send appropriate notification
          const notificationTitle = paymentType === 'upgrade'
            ? `🎉 Level Upgraded to ${updateData.level || userData.level}!`
            : '✅ Income Unblocked!';

          const notificationMessage = paymentType === 'upgrade'
            ? `Congratulations! Your level has been upgraded. You can now continue receiving help.`
            : `Your income has been unblocked. You can now continue receiving help.`;

          try {
            const paymentNotification = createActivityNotificationData({
              title: notificationTitle,
              message: notificationMessage,
              uid: userId,
              userId: userId,
              priority: 'high',
              actionLink: '/dashboard',
              category: 'level',
              relatedAction: paymentType === 'upgrade' ? 'level_upgrade' : 'income_unblock',
              senderName: 'Level System'
            });

            await createNotification(userId, paymentNotification);
            await sendPushNotification(userId, paymentNotification);
          } catch (notificationError) {
            console.error('Error sending level payment notification:', notificationError);
          }
        });

        console.log(`[onLevelPaymentConfirmed] Successfully processed ${paymentType} payment for user: ${userId}`);

      } catch (error) {
        console.error(`[onLevelPaymentConfirmed] Error processing ${paymentType} payment:`, error);

        // Send error notification
        try {
          const errorNotification = createActivityNotificationData({
            title: '❌ Payment Processing Error',
            message: `There was an error processing your ${paymentType} payment. Please contact support.`,
            uid: userId,
            userId: userId,
            priority: 'high',
            actionLink: '/dashboard/support',
            category: 'error',
            relatedAction: 'payment_error',
            senderName: 'System'
          });

          await createNotification(userId, errorNotification);
          await sendPushNotification(userId, errorNotification);
        } catch (notificationError) {
          console.error('Error sending error notification:', notificationError);
        }

        throw error; // Re-throw to fail the function
      }
    }

    return null;
  });

// Cloud Function: E-PIN request status notifications
exports.onEpinRequestUpdate = onDocumentUpdated('epinRequests/{requestId}', async (change, context) => {
    const requestId = context.params.requestId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
        const { requestedBy, status, quantityRequested, totalEpins } = afterData;
        
        if (!requestedBy) {
          console.log('No requestedBy UID found for E-PIN request notification');
          return null;
        }
        
        let title, message, actionLink;
        
        switch (status) {
          case 'approved':
            title = '✅ E-PIN Request Approved!';
            message = `Your request for ${quantityRequested} E-PINs has been approved. You will receive ${totalEpins} E-PINs total.`;
            actionLink = '/dashboard/epins/history';
            break;
          case 'rejected':
            title = '❌ E-PIN Request Rejected';
            message = `Your request for ${quantityRequested} E-PINs has been rejected. Please contact support for more information.`;
            actionLink = '/dashboard/support';
            break;
          case 'cancelled':
            title = '🚫 E-PIN Request Cancelled';
            message = `Your request for ${quantityRequested} E-PINs has been cancelled.`;
            actionLink = '/dashboard/epins/request';
            break;
          default:
            return null; // Don't send notification for other status changes
        }
        
        const epinNotification = createActivityNotificationData({
          title,
          message,
          uid: requestedBy,
          userId: requestedBy,
          priority: 'high',
          actionLink,
          category: 'epin',
          relatedAction: `epin_${status}`,
          senderName: 'E-PIN System'
        });
        
        await createNotification(requestedBy, epinNotification);
        await sendPushNotification(requestedBy, epinNotification);
        
        console.log(`E-PIN ${status} notification sent for request: ${requestId}`);
        
      } catch (error) {
        console.error('Error in onEpinRequestUpdate notification:', error);
      }
    }
    
    return null;
  });