const admin = require('firebase-admin');
const cron = require('node-cron');

// Initialize if not already done
if (!admin.apps.length) {
  // Service account key automatically fetched from ./serviceAccountKey.json
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hh-foundation-default-rtdb.firebaseio.com'
  });
  
  // Firebase Project Configuration:
  // Project ID: hh-foundation
  // Service Account: firebase-adminsdk-fbsvc@hh-foundation.iam.gserviceaccount.com
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send notification to a single user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @param {string} actionLink - Link to open when clicked
 */
async function sendNotificationToUser(userId, title, body, data = {}, actionLink = '/dashboard') {
  try {
    // Get user's FCM token
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists || !tokenDoc.data().token) {
      console.log(`No FCM token found for user: ${userId}`);
      return { success: false, error: 'No FCM token found' };
    }

    const deviceToken = tokenDoc.data().token;

    // Prepare notification message
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: body,
        icon: '/logo192.png'
      },
      data: {
        actionLink: actionLink,
        userId: userId,
        timestamp: new Date().toISOString(),
        ...data
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
          link: actionLink
        }
      }
    };

    // Send the notification
    const response = await messaging.send(message);
    console.log(`Notification sent successfully to ${userId}:`, response);
    
    return { success: true, messageId: response };

  } catch (error) {
    console.error(`Error sending notification to ${userId}:`, error);
    
    // Handle invalid token
    if (error.code === 'messaging/registration-token-not-registered') {
      try {
        await db.collection('fcmTokens').doc(userId).delete();
        console.log(`Removed invalid token for user: ${userId}`);
      } catch (deleteError) {
        console.error('Error removing invalid token:', deleteError);
      }
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * MLM Event Notification Functions
 */

// 1. Sender or receiver found
async function notifySenderReceiverFound(userId, type, matchedUserId) {
  const title = type === 'sender' ? '🎉 Sender Found!' : '🎉 Receiver Found!';
  const body = `Great news! A ${type} has been matched for you. Check your dashboard for details.`;
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'match_found',
    matchType: type,
    matchedUserId: matchedUserId
  }, '/dashboard/matches');
}

// 2. New user joined via referral link
async function notifyReferralJoined(referrerId, newUserId, newUserName) {
  const title = '👥 New Referral Joined!';
  const body = `${newUserName} has joined through your referral link. Welcome them to the team!`;
  
  return await sendNotificationToUser(referrerId, title, body, {
    type: 'referral_joined',
    newUserId: newUserId,
    newUserName: newUserName
  }, '/dashboard/referrals');
}

// 3. Upcoming payment notifications
async function notifyUpcomingPayment(userId, position, totalUsers) {
  const title = `💰 Payment Alert - Top ${position}!`;
  const body = `You're in the top ${position} out of ${totalUsers} users! Payment opportunity is approaching.`;
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'upcoming_payment',
    position: position,
    totalUsers: totalUsers
  }, '/dashboard/payments');
}

// 4. Leaderboard notification
async function notifyLeaderboardEntry(userId, position) {
  const title = '🏆 Leaderboard Achievement!';
  const body = `Congratulations! You've entered the top ${position} on the leaderboard!`;
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'leaderboard_entry',
    position: position
  }, '/dashboard/leaderboard');
}

// 5. E-PIN request notifications
async function notifyEPinRequest(userId, status, requestId) {
  let title, body;
  
  switch (status) {
    case 'approved':
      title = '✅ E-PIN Request Approved!';
      body = 'Your E-PIN request has been approved. You can now access your E-PIN.';
      break;
    case 'rejected':
      title = '❌ E-PIN Request Rejected';
      body = 'Your E-PIN request has been rejected. Please contact support for more information.';
      break;
    case 'canceled':
      title = '🚫 E-PIN Request Canceled';
      body = 'Your E-PIN request has been canceled.';
      break;
    default:
      title = '📋 E-PIN Request Update';
      body = `Your E-PIN request status has been updated to: ${status}`;
  }
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'epin_request',
    status: status,
    requestId: requestId
  }, '/dashboard/epin');
}

// 6. Support ticket notifications
async function notifySupportTicket(userId, type, ticketId, agentName = null) {
  let title, body;
  
  switch (type) {
    case 'raised':
      title = '🎫 Support Ticket Created';
      body = 'Your support ticket has been created. Our team will respond soon.';
      break;
    case 'agent_connection_attempt':
      title = '👨‍💼 Agent Connecting';
      body = 'A support agent is attempting to connect with you.';
      break;
    case 'agent_available':
      title = '✅ Agent Available';
      body = agentName ? `Agent ${agentName} is now available to help you.` : 'A support agent is now available to help you.';
      break;
    default:
      title = '🎫 Support Ticket Update';
      body = 'Your support ticket has been updated.';
  }
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'support_ticket',
    ticketType: type,
    ticketId: ticketId,
    agentName: agentName
  }, '/dashboard/support');
}

// 7. Earn Free E-PIN notifications
async function notifyFreeEPinEarned(userId, reason, amount = 5) {
  let title, body;
  
  if (reason === 'testimonial_approved') {
    title = '🎥 Testimonial Approved!';
    body = `Your testimonial video has been approved! You've earned ${amount} free E-PINs.`;
  } else {
    title = '🎁 Free E-PIN Earned!';
    body = `Congratulations! You've earned ${amount} free E-PINs.`;
  }
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'free_epin_earned',
    reason: reason,
    amount: amount
  }, '/dashboard/epin');
}

// 8. Level complete notification
async function notifyLevelComplete(userId, level, paymentsReceived) {
  const title = '🎯 Level Complete!';
  const body = `Congratulations! You've completed level ${level} with ${paymentsReceived} payments received.`;
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'level_complete',
    level: level,
    paymentsReceived: paymentsReceived
  }, '/dashboard/levels');
}

// 9. Delayed payment reminder (scheduled)
async function notifyDelayedPayment(userId, senderUserId, hoursDelayed) {
  const title = '⏰ Payment Reminder';
  const body = `Your receiver is waiting! Payment has been delayed for ${hoursDelayed} hours. Please complete your payment soon.`;
  
  return await sendNotificationToUser(userId, title, body, {
    type: 'delayed_payment_reminder',
    senderUserId: senderUserId,
    hoursDelayed: hoursDelayed
  }, '/dashboard/payments');
}

/**
 * Scheduled Notification Functions
 */

// Schedule delayed payment reminders every 3 hours
function scheduleDelayedPaymentReminders() {
  // Run every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('Running delayed payment reminder check...');
    
    try {
      // Get all pending payments that are delayed
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      
      const delayedPayments = await db.collection('payments')
        .where('status', '==', 'pending')
        .where('createdAt', '<=', threeHoursAgo)
        .get();
      
      const reminderPromises = [];
      
      delayedPayments.forEach(doc => {
        const payment = doc.data();
        const hoursDelayed = Math.floor((now - payment.createdAt.toDate()) / (1000 * 60 * 60));
        
        // Only send reminder every 3 hours (3, 6, 9, 12, etc.)
        if (hoursDelayed % 3 === 0) {
          reminderPromises.push(
            notifyDelayedPayment(payment.senderId, payment.receiverId, hoursDelayed)
          );
        }
      });
      
      await Promise.all(reminderPromises);
      console.log(`Sent ${reminderPromises.length} delayed payment reminders`);
      
    } catch (error) {
      console.error('Error in delayed payment reminder job:', error);
    }
  });
}

// Schedule leaderboard updates (daily at 9 AM)
function scheduleLeaderboardUpdates() {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily leaderboard update...');
    
    try {
      // Get top 10 users
      const topUsers = await db.collection('users')
        .orderBy('points', 'desc')
        .limit(10)
        .get();
      
      const notificationPromises = [];
      
      topUsers.forEach((doc, index) => {
        const user = doc.data();
        const position = index + 1;
        
        // Only notify if they're in top 10 and it's a new achievement
        if (position <= 10 && (!user.lastLeaderboardPosition || user.lastLeaderboardPosition > 10)) {
          notificationPromises.push(
            notifyLeaderboardEntry(doc.id, position)
          );
          
          // Update their last leaderboard position
          db.collection('users').doc(doc.id).update({
            lastLeaderboardPosition: position
          });
        }
      });
      
      await Promise.all(notificationPromises);
      console.log(`Sent ${notificationPromises.length} leaderboard notifications`);
      
    } catch (error) {
      console.error('Error in leaderboard update job:', error);
    }
  });
}

// Initialize scheduled jobs
function initializeScheduledJobs() {
  console.log('🕐 Initializing scheduled notification jobs...');
  scheduleDelayedPaymentReminders();
  scheduleLeaderboardUpdates();
  console.log('✅ Scheduled jobs initialized');
}

// Export all functions
module.exports = {
  sendNotificationToUser,
  notifySenderReceiverFound,
  notifyReferralJoined,
  notifyUpcomingPayment,
  notifyLeaderboardEntry,
  notifyEPinRequest,
  notifySupportTicket,
  notifyFreeEPinEarned,
  notifyLevelComplete,
  notifyDelayedPayment,
  initializeScheduledJobs
};

// Auto-initialize if this file is run directly
if (require.main === module) {
  initializeScheduledJobs();
}