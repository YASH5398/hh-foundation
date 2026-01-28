const {
  getEpinData,
  getSendHelpData,
  getReceiveHelpData,
  getSupportTickets
} = require('./firestoreReader');

const getFirstName = (userData) => {
  if (!userData) return '';
  const fullName = userData.fullName || userData.name || userData.displayName || '';
  if (fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length > 0 && parts[0].length > 1) {
      return parts[0];
    }
  }
  return '';
};



const generateReply = async (intent, userData, uid) => {
  const firstName = getFirstName(userData);
  console.log('ReplyEngine: Intent:', intent, 'UID:', uid);
  
  try {
    switch (intent) {
      case 'greeting': {
        if (!userData) {
          return 'Hello!\nHow can I help you today?';
        }
        
        const fullName = userData.fullName || '';
        const firstName = fullName.split(' ')[0] || 'User';
        
        return `${firstName}, hello!\nHow can I help you today?`;
      }

      case 'activation': {
        if (!userData) {
          const replyText = 'Your account information is incomplete. Please contact support.';
          return formatReply(replyText, firstName);
        }
        
        const fullName = userData.fullName || '';
        const firstName = fullName.split(' ')[0] || 'User';
        
        if (userData.isActivated === true) {
          const replyText = `${firstName}, your account is already active.`;
          return formatReply(replyText, firstName);
        } else {
          const replyText = `${firstName}, your account is not active yet. Please complete your first Send Help payment to activate your ID.`;
          return formatReply(replyText, firstName);
        }
      }

      case 'userId': {
        const fullName = userData?.fullName || 'User';
        const firstName = fullName.split(' ')[0];
        const userId = userData?.userId;

        if (userId) {
          const replyText = `${firstName}, here is your User ID:\n${userId}`;
          return formatReply(replyText, firstName);
        }

        const replyText = `${firstName}, your User ID is not available.\nPlease contact support.`;
        return formatReply(replyText, firstName);
      }

      case 'epin': {
        const epinData = await getEpinData(uid);
        
        if (!epinData || epinData.length === 0) {
          const replyText = 'You currently do not have any unused E-PINs. To get E-PINs, complete the activation process or purchase them from the dashboard.';
          return formatReply(replyText, firstName);
        }
        
        const unused = epinData.filter(e => e.status === 'unused' || e.status === 'available').length;
        const used = epinData.filter(e => e.status === 'used').length;
        const expired = epinData.filter(e => e.status === 'expired').length;
        const total = epinData.length;
        
        let issueExplanation = '';
        if (used > 0 && unused === 0) {
          issueExplanation = ' All your E-PINs have been used. Please get new E-PINs to continue.';
        } else if (expired > 0 && unused === 0) {
          issueExplanation = ' All your E-PINs have expired. Please get new E-PINs.';
        } else if (total > 0 && unused === 0) {
          issueExplanation = ' All your E-PINs are either used or expired. Please get new E-PINs.';
        }
        
        const replyText = `Your E-PIN count: Total=${total}, Available=${unused}, Used=${used}, Expired=${expired}.${issueExplanation}`;
        return formatReply(replyText, firstName);
      }

      case 'sendHelp': {
        if (!userData) {
          const replyText = 'Unable to access your account information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        if (!userData.isActivated) {
          const replyText = 'You must activate your account first before you can send help. Visit Dashboard → Activate to get started.';
          return formatReply(replyText, firstName);
        }
        
        if (userData.isBlocked) {
          const replyText = 'Your Send Help ability is currently blocked due to an incomplete payment or pending verification. Please complete your sponsor payment to unlock Send Help.';
          return formatReply(replyText, firstName);
        }
        
        if (!userData.helpVisibility) {
          const replyText = 'Send Help is currently disabled in your account. Please visit Dashboard → Settings and enable Help Visibility.';
          return formatReply(replyText, firstName);
        }
        
        const sendHelpRecords = await getSendHelpData(uid);
        const pending = sendHelpRecords.filter(r => r.status === 'pending' || r.status === 'assigned').length;
        const active = sendHelpRecords.filter(r => 
          r.status === 'assigned' || r.status === 'payment_requested' || r.status === 'payment_done'
        ).length;
        
        if (active > 0) {
          const replyText = `You have ${active} active Send Help request(s). You cannot send another until the current one is completed. Check Dashboard → Send Help for details.`;
          return formatReply(replyText, firstName);
        }
        
        if (pending > 0) {
          const replyText = `You have ${pending} pending Send Help request(s). Once approved, you will be able to send more. Check Dashboard → Send Help for details.`;
          return formatReply(replyText, firstName);
        }
        
        const replyText = 'You are eligible to send help. Go to Dashboard → Send Help and select a recipient. The amount depends on your current level.';
        return formatReply(replyText, firstName);
      }

      case 'receiveHelp': {
        if (!userData) {
          const replyText = 'Unable to access your account information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const receiveHelpRecords = await getReceiveHelpData(uid);
        const pending = receiveHelpRecords.filter(r => r.status === 'pending' || r.status === 'assigned' || r.status === 'payment_requested').length;
        const completed = receiveHelpRecords.filter(r => r.status === 'completed' || r.status === 'confirmed').length;
        
        if (userData.isReceivingHeld) {
          let reason = 'an administrative hold';
          if (userData.upgradeRequired === true) {
            reason = 'a required level upgrade';
          } else if (userData.sponsorPaymentPending === true) {
            reason = 'a pending sponsor payment';
          } else if (userData.isOnHold === true) {
            reason = 'your account being on hold';
          }
          
          const replyText = `You have ${pending} pending and ${completed} completed receive requests. Receiving is currently held due to ${reason}. Complete the required action to resume receiving payments.`;
          return formatReply(replyText, firstName);
        }
        
        const level = userData.levelStatus || userData.level || 'Star';
        const maxReceives = {
          'Star': 3,
          'Silver': 9,
          'Gold': 27,
          'Platinum': 81,
          'Diamond': 243
        }[level] || 3;
        
        const activeCount = userData.activeReceiveCount || 0;
        const remainingSlots = Math.max(0, maxReceives - activeCount);
        
        if (receiveHelpRecords.length === 0) {
          const replyText = `You have no active receive help requests. You can receive up to ${maxReceives} payments at ${level} level. Ensure your profile is complete and help visibility is enabled.`;
          return formatReply(replyText, firstName);
        }
        
        const replyText = `You have ${pending} pending and ${completed} completed receive requests. You can receive ${remainingSlots} more payments at your current ${level} level. Monitor Dashboard → Receive Help for updates.`;
        return formatReply(replyText, firstName);
      }

      case 'upcomingPayment': {
        if (!userData) {
          const replyText = 'Unable to access your account information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const level = userData.levelStatus || userData.level || 'Star';
        
        const levelRules = {
          'Star': { 
            nextAmount: 600, 
            nextLevel: 'Silver', 
            description: 'Upgrade fee to reach Silver level'
          },
          'Silver': { 
            nextAmount: 1200, 
            nextLevel: 'Gold', 
            description: 'Sponsor payment for Silver completion'
          },
          'Gold': { 
            nextAmount: 20000, 
            nextLevel: 'Platinum', 
            description: 'Upgrade fee to reach Platinum level'
          },
          'Platinum': { 
            nextAmount: 40000, 
            nextLevel: 'Diamond', 
            description: 'Sponsor payment for Platinum completion'
          },
          'Diamond': { 
            nextAmount: 600000, 
            nextLevel: 'Diamond Plus', 
            description: 'Sponsor payment for Diamond completion'
          }
        };
        
        const rule = levelRules[level];
        if (rule) {
          const replyText = `Your next payment: Rs. ${rule.nextAmount} (${rule.description}). This payment is required to progress to ${rule.nextLevel} level. Visit Dashboard → Payments for details.`;
          return formatReply(replyText, firstName);
        }
        
        const replyText = 'You have completed all required payments for your current level. No upcoming payments at this time.';
        return formatReply(replyText, firstName);
      }

      case 'referrals': {
        if (!userData) {
          const replyText = 'Unable to access your referral information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const referredUsers = userData.referredUsers || [];
        const referralCount = userData.referralCount || 0;
        const activeReferrals = referredUsers.filter(r => r.isActive || r.activated).length;
        const inactiveReferrals = referredUsers.length - activeReferrals;
        
        const replyText = `Total referrals: ${referredUsers.length} (Active: ${activeReferrals}, Inactive: ${inactiveReferrals}). Your referral count is ${referralCount}. Visit Dashboard → Referrals for detailed information.`;
        return formatReply(replyText, firstName);
      }

      case 'leaderboard': {
        if (!userData) {
          const replyText = 'Unable to access your leaderboard information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const referralCount = userData.referralCount || 0;
        const level = userData.levelStatus || userData.level || 'Star';
        
        let visibilityIssue = '';
        if (!userData.isActivated) {
          visibilityIssue = ' You need to activate your account to appear on the leaderboard.';
        } else if (referralCount === 0) {
          visibilityIssue = ' You need referrals to improve your rank.';
        }
        
        if (referralCount === 0) {
          const replyText = `You have 0 referrals.${visibilityIssue} Invite others to HH Foundation to increase your rank and earn commissions. Visit Dashboard → Referrals to track.`;
          return formatReply(replyText, firstName);
        }
        
        const replyText = `You have ${referralCount} referrals at ${level} level.${visibilityIssue} Your ranking improves with more referrals and higher levels. Visit Dashboard → Leaderboard to see your position.`;
        return formatReply(replyText, firstName);
      }

      case 'profile': {
        if (!userData) {
          const replyText = 'Unable to access your profile information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const missing = [];
        
        if (!userData.bankAccount && !userData.bankDetails) missing.push('Bank Account');
        if (!userData.kycVerified && !userData.kycStatus) missing.push('KYC Verification');
        if (!userData.paymentMethod) missing.push('Payment Method');
        if (!userData.phone && !userData.phoneNumber) missing.push('Phone Number');
        
        if (missing.length > 0) {
          const replyText = `Missing information: ${missing.join(', ')}. Visit Dashboard → Profile to complete these details. They are required to receive payments.`;
          return formatReply(replyText, firstName);
        }
        
        const replyText = 'Your profile is complete. All required information is verified and ready for transactions.';
        return formatReply(replyText, firstName);
      }

      case 'support': {
        const tickets = await getSupportTickets(uid);
        const open = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
        const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress' || t.status === 'processing').length;
        
        if (tickets.length === 0) {
          const replyText = 'You have no support tickets. Create a new ticket in Dashboard → Support if you need assistance.';
          return formatReply(replyText, firstName);
        }
        
        const replyText = `You have ${open} open, ${inProgress} in-progress, and ${resolved} resolved support tickets. Check Dashboard → Support for detailed status updates and responses.`;
        return formatReply(replyText, firstName);
      }

      case 'tasks': {
        if (!userData) {
          const replyText = 'Unable to access your task information. Please try again or contact support.';
          return formatReply(replyText, firstName);
        }
        
        const completedTasks = userData.completedTasks || userData.tasksCompleted || [];
        const taskRewards = userData.taskRewards || userData.rewardsEarned || 0;
        const dailyTasks = userData.dailyTasks || userData.availableTasks || [];
        
        if (completedTasks.length === 0) {
          const replyText = 'You have not completed any tasks. Visit Dashboard → Tasks to see available tasks and earn free E-PINs.';
          return formatReply(replyText, firstName);
        }
        
        const pendingTasks = dailyTasks.length - completedTasks.length;
        
        const replyText = `Tasks completed: ${completedTasks.length}. E-PINs earned: ${taskRewards}. ${pendingTasks > 0 ? `You have ${pendingTasks} tasks available. ` : ''}Complete more tasks in Dashboard → Tasks to earn additional rewards.`;
        return formatReply(replyText, firstName);
      }

      case 'fallback':
      default: {
        const replyText = 'This issue requires manual verification. Please contact our Live Agent support team via Dashboard → Support for personalized assistance. You can also create a support ticket for detailed help.';
        return formatReply(replyText, firstName);
      }
    }
  } catch (error) {
    console.error('ReplyEngine: Error generating reply:', error.message);
    const replyText = 'I apologize, but I encountered an error processing your request. Please try again or contact support for assistance.';
    return formatReply(replyText, firstName);
  }
};

function formatReply(text, firstName) {
  if (!text) return '';

  let clean = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (firstName && !clean.startsWith(firstName)) {
    clean = `${firstName}, ${clean}`;
  }

  return clean;
}

module.exports = { generateReply };
