# SEND HELP END-TO-END TEST GUIDE
**Date**: January 22, 2026  
**Cloud Function Status**: ✅ DEPLOYED (startHelpAssignment with fixed receiver query)  
**Project**: hh-foundation

---

## PREREQUISITES

### 1. Cloud Function Verification
- ✅ `startHelpAssignment` is deployed
- ✅ Receiver query fixed: Changed from `== false/true` to `!= true/false` to match missing fields
- ✅ No syntax errors in Cloud Functions

### 2. Firebase Project
- **Project ID**: hh-foundation
- **Collections**: users, sendHelp, receiveHelp
- **Region**: us-central1

---

## STEP 1: IDENTIFY TEST USERS IN FIRESTORE

### Access Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **hh-foundation**
3. Go to **Firestore Database** → **users** collection

### Find Eligible Sender
Look for user with:
- ✅ `isActivated` = **true**
- ✅ `isBlocked` ≠ **true** (or missing)
- ✅ `isOnHold` ≠ **true** (or missing)
- ✅ `levelStatus` = **"Star"** (or any level)
- ✅ **NO** active `sendHelp` documents with status in [assigned, payment_requested, payment_done]
- ✅ `userId` field exists

**Example Sender Criteria**:
```
uid: [copy exact UID]
userId: HHF... (required)
levelStatus: Star
isActivated: true
email: [note for login]
```

### Find Eligible Receiver
Look for user with:
- ✅ **SAME** `levelStatus` as sender (e.g., both "Star")
- ✅ **DIFFERENT** `uid` (not sender)
- ✅ `isActivated` = **true**
- ✅ `isBlocked` ≠ **true** (or missing)
- ✅ `isOnHold` ≠ **true** (or missing)
- ✅ `isReceivingHeld` ≠ **true** (or missing)
- ✅ `helpVisibility` ≠ **false** (or missing, true preferred)
- ✅ `upgradeRequired` ≠ **true** (or missing)
- ✅ `sponsorPaymentPending` ≠ **true** (or missing)
- ✅ `activeReceiveCount` < receive limit for their level
  - Star: 3 total
  - Silver: 9 total
  - Gold: 27 total
  - Platinum: 81 total
  - Diamond: 243 total
- ✅ `userId` field exists

**Example Receiver Criteria**:
```
uid: [copy exact UID - DIFFERENT from sender]
userId: HHF... (required)
levelStatus: Star (SAME as sender)
isActivated: true
activeReceiveCount: 0 or 1 or 2 (< 3 for Star)
email: [note for receiver login]
```

### ⚠️ Critical Check
```javascript
// SENDER CHECK (Firestore Console - Query)
db.collection('sendHelp')
  .where('senderUid', '==', 'SENDER_UID_HERE')
  .where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])

// Result: MUST BE EMPTY ✅
```

---

## STEP 2: PREPARE FOR TESTING

### Required Information
- [ ] Sender UID: ___________________
- [ ] Sender UserID: ___________________
- [ ] Sender Email: ___________________
- [ ] Sender Level: ___________________
- [ ] Receiver UID: ___________________
- [ ] Receiver UserID: ___________________
- [ ] Receiver Email: ___________________
- [ ] Receiver Level: ___________________ (MUST MATCH SENDER)
- [ ] Receiver activeReceiveCount: _____/_____ (must be below limit)

### Open Two Browser Windows/Tabs
- **Tab 1**: Sender browser (incognito recommended)
- **Tab 2**: Receiver browser (incognito recommended)
- **Tab 3**: Firebase Console - Firestore (monitor live changes)
- **Tab 4**: Firebase Console - Cloud Functions Logs (monitor startHelpAssignment)

---

## TEST CASE 1: AUTO ASSIGNMENT

### 1.1 Sender: Login & Navigate
1. Open App URL in **Tab 1**
2. Login as **Sender** with their email
3. Verify authenticated (see user profile)
4. Navigate to: **Dashboard** → **Send Help**

### 1.2 Monitor Cloud Function Logs
1. In **Tab 4**, go to: Firebase Console → **Functions** → **startHelpAssignment**
2. Click **Logs** tab
3. Keep this window open to watch logs in real-time

### 1.3 Trigger Send Help
1. In **Tab 1**, on the Send Help page, click **"Send Help"** button
2. Watch the UI state: "Initializing..." → "Matching with receiver..." → "Receiver Assigned"
3. **In parallel**, watch **Cloud Function logs in Tab 4**

### 1.4 Expected Success Logs (in order)
```
[startHelpAssignment] entry
[startHelpAssignment] start { senderUid, payload, startedAtMs }
[startHelpAssignment] sender.data { senderUid, senderId, levelStatus }
[startHelpAssignment] activeSend.count { count: 0 } ✅
[INVESTIGATION] FIRESTORE_QUERY_CONDITIONS { filters: {...}, limit: 25 }
[INVESTIGATION] FIRESTORE_QUERY_RESULT { snapshotSize: X, isEmpty: false }
[startHelpAssignment] receiverCandidates.count { count: X } ✅ X > 0
[DIAGNOSTIC] RECEIVER_ELIGIBLE { userId, uid, levelStatus, activeReceiveCount, receiveLimit }
[startHelpAssignment] final.receiver.selected { receiverUid, receiverId, helpReceived, level }
[startHelpAssignment] docs.created { senderUid, helpId, receiverUid }
[startHelpAssignment] success { helpId, alreadyExists: false, durationMs }
```

### 1.5 Verify Documents Created
**In Firestore Console (Tab 3)**:

#### sendHelp Collection
- Document ID: ✅ Exists
- Fields to verify:
  ```
  id: [helpId]
  status: "assigned" ✅
  senderUid: [your sender UID]
  senderId: [sender UserID]
  receiverUid: [receiver UID]
  receiverId: [receiver UserID]
  amount: 300 ✅
  levelStatus or level: "Star" (sender's level)
  createdAt: [current timestamp]
  assignedAt: [current timestamp]
  ```

#### receiveHelp Collection
- Document ID: ✅ **MUST BE SAME** as sendHelp
- Fields to verify:
  ```
  id: [helpId] ← SAME ID as sendHelp ✅
  status: "assigned" ✅
  senderUid: [your sender UID]
  receiverUid: [receiver UID]
  amount: 300 ✅
  createdAt: [same as sendHelp]
  assignedAt: [same as sendHelp]
  ```

### 1.6 UI Verification
- ✅ Page shows "Receiver Assigned"
- ✅ Receiver name visible
- ✅ Receiver phone/email visible
- ✅ Amount shown: ₹300
- ✅ Status shows "assigned"
- ✅ "Request Payment" button visible for next action

---

## EXPECTED FAILURE SCENARIOS

### Failure: receiverCandidates.count = 0

**Logs will show**:
```
[startHelpAssignment] receiverCandidates.count { count: 0 } ❌
[ROOT_CAUSE] ZERO_USERS_MATCH_FIRESTORE_QUERY
[startHelpAssignment] crash 'No eligible receivers available'
```

**Possible Causes**:
1. **No users have same levelStatus** → Create test user or change level
2. **Receiver is blocked**: `isBlocked = true` → Unblock in Firestore
3. **Receiver on hold**: `isOnHold = true` → Update in Firestore
4. **Receiver receiving held**: `isReceivingHeld = true` → Update in Firestore
5. **helpVisibility = false** → Set to `true` in Firestore
6. **Receiver limit reached**: `activeReceiveCount >= limit` → Check and update
7. **Receiver not activated**: `isActivated = false` → Activate in Firestore

**Quick Fix**:
```javascript
// In Firestore Console, update receiver doc:
{
  isActivated: true,
  isBlocked: false,
  isOnHold: false,
  isReceivingHeld: false,
  helpVisibility: true,
  upgradeRequired: false,
  sponsorPaymentPending: false,
  activeReceiveCount: 0,
  levelStatus: "Star" // SAME as sender
}
```

---

## TEST CASE 2: RECEIVER UI VISIBILITY

### 2.1 Receiver: Login & Navigate
1. Open App URL in **Tab 2**
2. Login as **Receiver** with their email
3. Navigate to: **Dashboard** → **Receive Help** (or check inbox)

### 2.2 Verify Help is Visible
- ✅ Help assignment appears in list
- ✅ Shows sender name
- ✅ Shows amount: ₹300
- ✅ Shows status: "assigned"
- ✅ Shows sender contact info (if available)
- ✅ Action buttons visible

### 2.3 Expected UI State
```
┌─────────────────────────────────┐
│ Pending Help Assignments        │
├─────────────────────────────────┤
│ From: [Sender Name]             │
│ Amount: ₹300                    │
│ Status: Assigned                │
│ Created: [timestamp]            │
│ [Request Payment] [View Chat]   │
└─────────────────────────────────┘
```

---

## TEST CASE 3: CONFIRM FLOW

### 3.1 Receiver: Request Payment
1. In **Tab 2** (Receiver), click **"Request Payment"**
2. Verify receiveHelp status updates to **"payment_requested"**
3. Check **Firestore** for updated timestamp

**Expected receiveHelp Update**:
```
status: "payment_requested" ✅ (was "assigned")
paymentRequestedAt: [current timestamp]
paymentRequestedAtMs: [milliseconds]
```

### 3.2 Sender: Submit Payment Proof
1. In **Tab 1** (Sender), verify status changed to "payment_requested"
2. Click **"Upload Payment Proof"**
3. Select payment method (Bank/UPI)
4. Upload screenshot or enter details
5. Click **"Submit Payment"**

**Expected sendHelp Update**:
```
status: "payment_done" ✅
payment: {
  method: "upi" or "bank",
  utr: "[utr_number]",
  screenshotUrl: "[file_url]"
}
paymentDoneAt: [timestamp]
paymentDoneAtMs: [milliseconds]
```

### 3.3 Receiver: Confirm Payment Received
1. In **Tab 2** (Receiver), verify status shows "payment_done"
2. Click **"Confirm Payment Received"** or **"Confirm"**
3. Verify status updates to **"confirmed"**

**Expected receiveHelp Update**:
```
status: "confirmed" ✅
confirmedByReceiver: true ✅
confirmedAt: [timestamp]
```

### 3.4 Verify Sync Across Collections
Both **sendHelp** and **receiveHelp** should have:
- ✅ Same document ID
- ✅ Same status
- ✅ Same timestamps
- ✅ Both created at same time
- ✅ Both updated together

---

## TEST CASE 4: FALLBACK (Optional - Only if AUTO ASSIGNMENT Fails)

### Scenario
If TEST CASE 1 fails with "No eligible receivers", proceed with:

### 4.1 Manual Document Creation
1. Go to **Firestore Console**
2. In **sendHelp** collection, click **"Add Document"**
3. Document ID: `{uid}_{uid2}_{timestamp}` (must match receiveHelp)
4. Copy all fields from previous successful test (if available)

### 4.2 Create Matching receiveHelp
- Use **SAME document ID** as sendHelp
- Copy all fields (except receiverUid should match receiveHelp receiver)
- Set status: "assigned"

### 4.3 Update Receiver User Doc
```javascript
{
  activeReceiveCount: (previous_value + 1),
  lastReceiveAssignedAt: serverTimestamp()
}
```

### 4.4 Test UI Rendering
- Open Tab 2 (Receiver)
- Refresh page
- Verify help appears in Receive Help UI
- Test "Request Payment" button

---

## MONITORING & LOGS

### Cloud Function Logs Location
- **URL**: https://console.firebase.google.com/project/hh-foundation/functions/logs?functionName=startHelpAssignment
- **Filter**: Check "Only show errors" toggle OFF to see all logs
- **Real-time**: Logs update as function runs

### Key Logs to Monitor
| Log | Status | What It Means |
|-----|--------|---------------|
| `[startHelpAssignment] entry` | ✅ | Function triggered |
| `[startHelpAssignment] activeSend.count { count: 0 }` | ✅ | Sender has no active help |
| `[INVESTIGATION] FIRESTORE_QUERY_RESULT { snapshotSize: X }` | ✅ X > 0 | Receivers found |
| `[startHelpAssignment] receiverCandidates.count { count: X }` | ✅ X > 0 | Query matched users |
| `[DIAGNOSTIC] RECEIVER_ELIGIBLE` | ✅ | Receiver passed all checks |
| `[startHelpAssignment] docs.created` | ✅ | Documents written atomically |
| `[startHelpAssignment] success` | ✅ | COMPLETE SUCCESS |
| `[startHelpAssignment] crash` | ❌ | ERROR - See message |

---

## DEBUGGING CHECKLIST

### If sendHelp/receiveHelp NOT Created

- [ ] Check Cloud Function logs for exact error
- [ ] Verify sender has no active sendHelp (query in Step 1)
- [ ] Verify receiver exists and is not self
- [ ] Check receiver activeReceiveCount < level limit
- [ ] Ensure both users have same levelStatus
- [ ] Verify all boolean fields initialized correctly

### If receiveHelp Doesn't Appear in Receiver UI

- [ ] Refresh receiver's browser
- [ ] Check receiveHelp document exists in Firestore
- [ ] Verify receiverUid matches logged-in user
- [ ] Check Cloud Function created both documents with same ID
- [ ] Verify status is "assigned" (not something else)

### If Status Not Updating

- [ ] Check Firestore for latest document state
- [ ] Verify receiveHelp has all required fields
- [ ] Check browser console for JavaScript errors
- [ ] Monitor Firestore write operations in Firebase Console

---

## SUCCESS CRITERIA

### TEST CASE 1 ✅ PASS
- [ ] Cloud Function logs show success
- [ ] sendHelp document created with correct data
- [ ] receiveHelp document created with SAME ID
- [ ] Both have status "assigned"
- [ ] Sender UI shows "Receiver Assigned"
- [ ] Both have same timestamps

### TEST CASE 2 ✅ PASS
- [ ] Receiver sees help in Receive Help UI
- [ ] All details visible (sender, amount, status)
- [ ] Help not marked as hidden

### TEST CASE 3 ✅ PASS
- [ ] Request Payment updates status to "payment_requested"
- [ ] Payment proof submission updates to "payment_done"
- [ ] Confirm updates to "confirmed"
- [ ] All timestamps update correctly
- [ ] Both collections stay in sync

### OVERALL ✅ PASS
- [ ] Send Help triggered from UI
- [ ] Auto assignment (startHelpAssignment) completed
- [ ] Both sendHelp and receiveHelp created
- [ ] Receiver UI shows help immediately
- [ ] Full payment flow works end-to-end
- [ ] No MLM changes needed
- [ ] No UI changes needed

---

## NOTES

- **Idempotency**: Running the same sender request twice = returns same helpId
- **Race Safety**: Transaction ensures one assignment per attempt
- **Real Data**: Uses actual Firestore data, no mock documents
- **Logs**: Check function logs for detailed audit trail
- **Time**: Full flow typically takes 2-5 seconds

---

## CONTACT

If test fails at any point, capture:
1. [ ] Exact Cloud Function log (copy-paste entire error)
2. [ ] Sender UID: ___________
3. [ ] Receiver UID: ___________
4. [ ] Test case number: ___________
5. [ ] Expected vs actual result

