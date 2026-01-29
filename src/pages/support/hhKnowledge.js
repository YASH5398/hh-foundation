// Centralized HH Foundation chatbot knowledge base for intent-based answers
export const HH_KNOWLEDGE = {
  epin: {
    transfer: 'For E-PIN transfer issues, provide the E-PIN code you are trying to transfer. The system will check its status and validity.',
    invalid: 'If your E-PIN shows as invalid or already used, double-check the code. If it still fails, contact support with the code and screenshot.',
    notWorking: 'If your E-PIN is not activating your account or level, ensure you are eligible for upgrade. If the problem persists, contact support with details.'
  },
  sendHelp: {
    paidNotApproved: 'If you have sent payment but the receiver has not approved it, please wait 24 hours. If still not approved, contact support with transaction proof.',
    paymentRejected: 'If your payment proof was rejected, check the rejection reason. Correct any issues and resubmit.',
    paymentNotSending: 'If you are unable to send payment, check your assignments and eligibility. Contact support if you need help.',
    paidBefore24h: 'Early payments may result in account blocking. Wait for the assigned receiver to request payment before sending.'
  },
  receiveHelp: {
    paymentShowingNotReceived: 'If sender marked payment as done but you have not received it, contact support immediately with transaction details. Do not confirm until you verify receipt.',
    receivingOnHold: 'If your receiving is on hold, check for account restrictions or blocks. Contact support for resolution.',
    incomeBlocked: 'If your income is blocked, you may need to complete a level upgrade or sponsor payment. Check your dashboard.'
  },
  account: {
    passwordReset: 'Use the "Forgot Password" link on login. If unsuccessful, contact support with your registered email.',
    paymentMethod: 'To update payment methods, go to your dashboard profile section. If you cannot update, contact support with your preferred payment details.'
  },
  referral: {
    referralNotShowing: 'If a user joined via your link but referral is not showing, contact support with user details. Referral commission will be credited if valid.',
    referralCountMismatch: 'If referral numbers do not match, contact support with specific examples.'
  },
  payments: {
    nextIncome: 'Check your dashboard for your current level and next income amount. Level upgrade may be available for continued income.',
    levelUpgrade: 'If level upgrade is available, the dashboard will show the amount and steps. Complete the upgrade to continue receiving income.',
    sponsorPayment: 'If sponsor payment is pending, pay the required amount as shown in your dashboard.'
  },
  foundation: {
    info: 'Helping Hands Foundation is a peer-to-peer help platform. Use the dashboard for all support, E-PIN, and payment issues.'
  }
};
