# Real-Time Notification System Implementation Guide

## Overview

A comprehensive real-time notification system has been implemented to notify users of all major activities in the HelpingHands MLM application. The system automatically creates notifications through Firestore triggers whenever significant events occur.

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────┐
│   Client-Side (Dashboard/UI)                │
│   - NotificationContext.jsx                 │
│   - fcmService.subscribeToNotifications()   │
│   - Real-time Firestore listeners          │
└─────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────┐
│   Firestore Collection                      │
│   - /notifications/{notificationId}         │
│   - Structure: userId, title, message, type │
└─────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────┐
│   Cloud Functions (Backend Triggers)        │
│   - notificationFirestoreTriggers.js         │
│   - onDocumentUpdated triggers              │
│   - onDocumentCreated triggers              │
└─────────────────────────────────────────────┘
```

## 10 Major Events with Notifications

### 1. **Receiver Assigned (Send Help)**
- **Trigger**: `onSendHelpReceiverAssigned`
- **Fired When**: `sendHelp.status` → `assigned` + `receiverId` set
- **Notify**: Receiver gets notified that they're assigned to help a sender
- **Message**: "Help Request from [Sender] - You've been assigned..."
- **Priority**: HIGH

### 2. **Sender Assigned (Receive Help)**
- **Trigger**: `onReceiveHelpSenderAssigned`
- **Fired When**: `receiveHelp.status` → `assigned` + `senderId` set
- **Notify**: Receiver gets notified that a sender is assigned to help them
- **Message**: "Help Sender Assigned: [Sender] is assigned to send you..."
- **Priority**: HIGH

### 3. **Payment Requested**
- **Trigger**: `onSendHelpPaymentRequested`
- **Fired When**: `sendHelp.status` → `payment_requested`
- **Notify**: Receiver gets notified that payment is requested
- **Message**: "Payment Requested - [Sender] has requested payment of..."
- **Priority**: HIGH

### 4. **Payment Done (Sender Marks)**
- **Trigger**: `onSendHelpPaymentDone`
- **Fired When**: `sendHelp.status` → `payment_done`
- **Notify**: Receiver gets notified that sender marked payment as done
- **Message**: "Payment Received - Payment of ₹X marked as sent..."
- **Priority**: HIGH

### 5. **Payment Confirmed (Receiver Confirms)**
- **Trigger**: `onSendHelpPaymentConfirmed`
- **Fired When**: `sendHelp.status` → `confirmed` or `force_confirmed`
- **Notify**: Sender gets notified that receiver confirmed payment
- **Message**: "Payment Confirmed - [Receiver] has confirmed receipt..."
- **Priority**: HIGH

### 6. **New Referral Joined**
- **Trigger**: `onNewReferralJoined`
- **Fired When**: New `users` document created with `referrerId` field
- **Notify**: Referrer gets notified about new team member
- **Message**: "New Team Member! - [Name] has joined your network..."
- **Priority**: NORMAL

### 7. **Level Upgraded**
- **Trigger**: `onUserLevelUpgraded`
- **Fired When**: `user.level` field changes to higher level
- **Notify**: User gets notified about level upgrade
- **Message**: "Congratulations! 🎉 - You've been upgraded from X to Y..."
- **Priority**: HIGH

### 8. **Income Blocked**
- **Trigger**: `onUserIncomeBlocked`
- **Fired When**: `user.isIncomeBlocked` → `true`
- **Notify**: User gets notified that income is blocked
- **Message**: "⛔ Income Blocked - Your income has been temporarily blocked..."
- **Block Reasons Handled**:
  - `upgrade_required`: Upgrade needed
  - `sponsor_payment_pending`: Sponsor payment needed
  - `receiving_held`: System policy hold
  - `admin_hold`: Admin action
- **Priority**: HIGH

### 9. **Income Unblocked**
- **Trigger**: `onUserIncomeUnblocked`
- **Fired When**: `user.isIncomeBlocked` → `false` (was `true` before)
- **Notify**: User gets notified that income is unblocked
- **Message**: "✅ Income Unblocked - Your income has been unblocked..."
- **Priority**: HIGH

### 10. **Admin Action**
- **Trigger**: `onAdminActionCreated`
- **Fired When**: `adminActions` collection document created
- **Notify**: Affected user gets notified about admin action
- **Actions Handled**:
  - `block`: Account blocked
  - `unblock`: Account unblocked
  - `hold`: Receiving held
  - `release`: Hold released
  - `suspend`: Account suspended
  - `reinstate`: Account reinstated
- **Priority**: HIGH

## Files Structure

### New/Modified Files

1. **functions/notificationTriggers.js** (NEW)
   - Centralized module for all 10 notification events
   - Contains: `buildNotificationId()`, `createNotification()`, and 10 event handlers
   - Exports all notification functions for use in Cloud Functions

2. **functions/notificationFirestoreTriggers.js** (NEW)
   - Contains all Firestore trigger definitions
   - Registers 10 `onDocumentUpdated/onDocumentCreated` triggers
   - Each trigger calls appropriate function from `notificationTriggers.js`
   - Handles data fetching and deduplication

3. **functions/index.js** (MODIFIED)
   - Added imports for notification modules (lines 16-26)
   - Re-exported all notification triggers at end of file (lines 1892-1938)
   - Existing `createHelpNotification()` function preserved for backward compatibility

### Existing Files (Unchanged but Used)

- **NotificationContext.jsx**: Real-time listener for notifications collection
- **fcmService.js**: `subscribeToNotifications()` for FCM push notifications
- **realtimeService.js**: General Firestore listener utilities
- **firestore.rules**: May need updates to secure notifications collection

## Notification Structure

Each notification in Firestore `/notifications/{notificationId}` contains:

```javascript
{
  // Basic fields
  uid: "user123",                    // User ID (for easy querying)
  userId: "user123",                 // User ID (duplicate for compatibility)
  title: "Payment Confirmed",        // Notification title
  message: "...",                    // Notification message
  
  // Classification
  type: "activity|system|payment",   // Notification type
  category: "send_help|receive_help|payment|referral|level|income|admin",
  priority: "high|normal",           // Display priority
  
  // References
  relatedId: "sendHelp123",          // ID of related document
  
  // Status
  isRead: false,                     // Read status
  
  // Metadata
  createdAt: Timestamp,              // Creation time
  updatedAt: Timestamp,              // Last update time
  
  // Additional data
  data: {
    action: "receiver_assigned",     // Specific action
    sendHelpId: "...",
    senderId: "...",
    senderName: "...",
    amount: 5000,
    notificationType: "receiver_assigned",
    actionLink: "/help/send/123",    // Where to navigate
    ...
  }
}
```

## Deduplication Strategy

### Problem
Rapid successive operations (e.g., multiple status updates) can create duplicate notifications.

### Solution
Uses `buildNotificationId()` function that generates deterministic IDs:

```javascript
notificationId = `${userId}_${eventType}_${relatedId}_${action}_${timestamp}`
```

### How It Works
1. Same inputs always generate same notification ID
2. Firestore `set()` with `merge:true` is idempotent
3. If same notification triggered multiple times quickly, same ID is used
4. Merge operation replaces/updates existing notification (no duplicate)

### Implementation Details
- Timestamp precision: 1 second (milliseconds → seconds)
- ID sanitization: Remove special characters, limit to 100 chars
- Merge strategy: `set(data, { merge: true })`

## Cloud Functions Flow

### Example: Payment Confirmation Flow

```
1. Client calls receiverResolvePayment() HTTP endpoint
   ↓
2. Function updates sendHelp.status → 'confirmed'
   ↓
3. Firestore onDocumentUpdated trigger fires
   ↓
4. onSendHelpPaymentConfirmed() executes:
   - Fetches sender and receiver data
   - Calls notifyPaymentConfirmed()
   ↓
5. notifyPaymentConfirmed() creates notification:
   - Builds unique notificationId
   - Writes to notifications/{notificationId}
   - Merge:true prevents duplicates
   ↓
6. Client's NotificationContext real-time listener detects change
   ↓
7. Notification appears in UI instantly
```

## Client-Side Integration

### Real-Time Listening (Already Set Up)

1. **NotificationContext.jsx** watches notifications collection:
```javascript
useEffect(() => {
  const unsubscribe = firestore
    .collection('notifications')
    .where('userId', '==', currentUser.uid)
    .onSnapshot((snapshot) => {
      // Update notifications state
    });
  return unsubscribe;
}, [currentUser.uid]);
```

2. **fcmService.js** provides subscription:
```javascript
fcmService.subscribeToNotifications(userId, (notifications) => {
  // Update UI with new notifications
});
```

### No Client-Side Changes Needed
- Existing `NotificationContext` already listens to notifications collection
- Existing `fcmService` already handles real-time updates
- Notifications automatically appear as they're created

## Firestore Rules

The notifications collection should be accessible to users for their own notifications:

```javascript
match /notifications/{notification} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if request.auth.token.role == 'admin' || 
                  request.auth.uid == resource.data.userId;
}
```

## Testing the System

### Manual Test: Payment Flow

1. User A (sender) initiates help request
2. System assigns User B (receiver)
   - ✓ User B sees notification "Help Request from User A"
   
3. User B requests payment
4. User A marks payment as done
   - ✓ User B sees notification "Payment Marked as Done"
   
5. User B confirms payment
   - ✓ User A sees notification "Payment Confirmed"

### Verify No Duplicates
1. Make rapid API calls to trigger same action multiple times
2. Check `/notifications` collection in Firestore
3. Should see only ONE notification (same ID) for all calls

### Check Real-Time Updates
1. Open Dashboard in two browser windows
2. Perform action in one window
3. Notification should appear instantly in second window

## Deployment

### Prerequisites
- All files saved and committed
- Firebase CLI installed
- Firebase project configured

### Deploy Steps

```bash
cd functions
npm install  # Update dependencies if needed
firebase deploy --only functions:onSendHelpReceiverAssigned
firebase deploy --only functions:onReceiveHelpSenderAssigned
firebase deploy --only functions:onSendHelpPaymentRequested
firebase deploy --only functions:onSendHelpPaymentDone
firebase deploy --only functions:onSendHelpPaymentConfirmed
firebase deploy --only functions:onNewReferralJoined
firebase deploy --only functions:onUserLevelUpgraded
firebase deploy --only functions:onUserIncomeBlocked
firebase deploy --only functions:onUserIncomeUnblocked
firebase deploy --only functions:onAdminActionCreated
```

Or deploy all at once:
```bash
firebase deploy --only functions
```

## Monitoring & Debugging

### Cloud Functions Logs
```bash
firebase functions:log
```

### Check Specific Trigger
```bash
firebase functions:log --function=onSendHelpReceiverAssigned
```

### Firestore Notifications Collection
1. Go to Firebase Console
2. Firestore Database
3. Collection: `notifications`
4. Check recent documents to see if notifications are being created

### Common Issues

**No notifications appearing:**
- Check Cloud Functions logs for errors
- Verify Firestore rules allow write to notifications collection
- Confirm trigger conditions are being met

**Duplicate notifications:**
- Check if merge:true is being used
- Verify buildNotificationId logic is deterministic
- Review timestamp precision

**Slow notifications:**
- Check Cloud Functions execution time
- Verify Firestore quota not exceeded
- Check network latency

## Future Enhancements

1. **SMS Notifications**: Add SMS for high-priority events
2. **Email Notifications**: Email summary of notifications
3. **Notification Preferences**: Let users choose which events to notify
4. **Batch Notifications**: Group similar notifications together
5. **Notification Analytics**: Track which notifications users engage with

## API Reference

### notifyReceiverAssigned()
```javascript
notifyReceiverAssigned({
  sendHelpId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  amount: number,
  level: string
})
```

### notifySenderAssigned()
```javascript
notifySenderAssigned({
  receiveHelpId: string,
  receiverId: string,
  receiverName: string,
  senderId: string,
  senderName: string,
  amount: number,
  level: string
})
```

### notifyPaymentRequest()
```javascript
notifyPaymentRequest({
  sendHelpId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  amount: number
})
```

### notifyPaymentDone()
```javascript
notifyPaymentDone({
  sendHelpId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  amount: number
})
```

### notifyPaymentConfirmed()
```javascript
notifyPaymentConfirmed({
  sendHelpId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  amount: number
})
```

### notifyNewReferral()
```javascript
notifyNewReferral({
  userId: string,
  referredUserId: string,
  referredName: string,
  referralCode: string
})
```

### notifyLevelUpgrade()
```javascript
notifyLevelUpgrade({
  userId: string,
  userName: string,
  newLevel: string,
  previousLevel: string,
  benefitAmount: number
})
```

### notifyIncomeBlocked()
```javascript
notifyIncomeBlocked({
  userId: string,
  blockReason: string,  // 'upgrade_required' | 'sponsor_payment_pending' | 'receiving_held' | 'admin_hold'
  requiredAmount: number | null,
  blockType: string
})
```

### notifyIncomeUnblocked()
```javascript
notifyIncomeUnblocked({
  userId: string,
  previousBlockReason: string,
  paidAmount: number
})
```

### notifyAdminAction()
```javascript
notifyAdminAction({
  userId: string,
  adminId: string,
  adminName: string,
  action: string,  // 'block' | 'unblock' | 'hold' | 'release' | 'suspend' | 'reinstate'
  reason: string,
  affectedFields: array
})
```

## Summary

✅ **Complete Real-Time Notification System Implemented**

- 10 major user activities covered
- Automatic Firestore triggers for all events
- Zero duplicate notifications via deduplication
- Real-time client-side updates
- No breaking changes to existing code
- Ready for deployment

**All notification functions are ready to use and can be imported in Cloud Functions whenever an event occurs.**
