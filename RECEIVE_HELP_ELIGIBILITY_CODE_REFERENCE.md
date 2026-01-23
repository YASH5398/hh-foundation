# RECEIVE HELP ELIGIBILITY - CODE REFERENCE & DATA FLOW

## COMPLETE CODE LOCATIONS

### 1. BACKEND ELIGIBILITY FUNCTIONS

**File**: `backend/functions/index.js`

#### Function: isReceiverEligibleStrict
**Location**: Line 107-113
**Code**:
```javascript
const isReceiverEligibleStrict = (userData) => {
  return (
    userData?.isActivated === true &&
    userData?.isBlocked === false &&
    userData?.isReceivingHeld === false &&
    userData?.upgradeRequired === false &&
    userData?.sponsorPaymentPending === false &&
    (userData?.activeReceiveCount || 0) < getReceiveLimitForLevel(userData?.levelStatus || userData?.level)
  );
};
```
**Input**: `userData` object from Firestore users collection
**Output**: `true` or `false`
**Called by**: 
- `receiverIneligibilityReason()`
- `getReceiveEligibility()` Cloud Function
- `startHelpAssignment()` when selecting receivers
- `requestPayment()` before allowing request

#### Function: receiverIneligibilityReason
**Location**: Line 119-127
**Code**:
```javascript
const receiverIneligibilityReason = (userData) => {
  if (userData?.isActivated !== true) return 'not_activated';
  if (userData?.isBlocked === true) return 'blocked';
  if (userData?.isReceivingHeld === true) return 'receiving_held';
  if (userData?.upgradeRequired === true) return 'upgrade_required';
  if (userData?.sponsorPaymentPending === true) return 'sponsor_payment_pending';
  const limit = getReceiveLimitForLevel(userData?.levelStatus || userData?.level);
  if ((userData?.activeReceiveCount || 0) >= limit) return 'receive_limit_reached';
  return 'not_eligible';
};
```
**Input**: `userData` object
**Output**: Reason code string (first failed check)
**Used by**:
- `getReceiveEligibility()` to return reason
- `startHelpAssignment()` in error messages
- Logging and debugging

#### Function: getReceiveEligibility (Cloud Function)
**Location**: Line 203-245
**Trigger**: HTTP Callable
**Auth required**: Yes (user must be authenticated)
**Returns**: 
```json
{
  "success": true,
  "message": "User is eligible to receive help",
  "data": {
    "isEligible": true,
    "reasonCode": null,
    "blockType": null,
    "flags": {
      "isOnHold": false,
      "isReceivingHeld": false,
      "isBlocked": false,
      "upgradeRequired": false,
      "sponsorPaymentPending": false
    },
    "activeReceiveCount": 2,
    "levelAllowedLimit": 3
  }
}
```

#### Function: startHelpAssignment (Cloud Function)
**Location**: Line 250-640
**Key action point**: Line 400-450 (Receiver candidate evaluation)
**Checks each candidate**:
```javascript
// Line 416-445
if (candidate?.isActivated !== true) { skippedReceivers.push(...); continue; }
if (candidate?.isBlocked === true) { skippedReceivers.push(...); continue; }
if (candidate?.isOnHold === true) { skippedReceivers.push(...); continue; }
if (candidate?.isReceivingHeld === true) { skippedReceivers.push(...); continue; }
if (candidate?.helpVisibility === false) { skippedReceivers.push(...); continue; }
if (candidate?.upgradeRequired === true) { skippedReceivers.push(...); continue; }
if (candidate?.sponsorPaymentPending === true) { skippedReceivers.push(...); continue; }

// Line 448-456: Check active receive count limit
const currentLevel = candidate?.levelStatus || candidate?.level || 'Star';
const receiveLimit = getReceiveLimitForLevel(currentLevel);
const currentReceiveCount = candidate?.activeReceiveCount || 0;
if (currentReceiveCount >= receiveLimit) { skippedReceivers.push(...); continue; }
```
**Increments activeReceiveCount**: Line 612
```javascript
tx.update(chosenReceiverRef, {
  activeReceiveCount: admin.firestore.FieldValue.increment(1),
  lastReceiveAssignedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

#### Function: requestPayment (Cloud Function)
**Location**: Line 732-785
**Re-validates receiver**: Line 748-750
```javascript
const receiverUserSnap = await tx.get(db.collection('users').doc(uid));
if (!receiverUserSnap.exists) throw new HttpsError('not-found', 'Receiver user not found');
const receiverUser = receiverUserSnap.data();
if (!isReceiverEligibleStrict(receiverUser)) 
  throw new HttpsError('failed-precondition', 
    `Receiver not eligible: ${receiverIneligibilityReason(receiverUser)}`);
```

#### Function: releaseReceiverSlotIfNeeded
**Location**: Line 178-200
**Decrements activeReceiveCount**: Line 192
```javascript
const userRef = db.collection('users').doc(receiverUid);
const userSnap = await tx.get(userRef);
if (userSnap.exists) {
  const current = userSnap.data()?.activeReceiveCount || 0;
  const next = Math.max(0, current - 1);
  tx.update(userRef, { activeReceiveCount: next });
}
```
**Called from**:
- confirmPaymentReceived (line 965)
- confirmPaymentSubmitted (line 1048)
- timeoutHelp (line 1087)
- cancelHelp (line 1185)
- forceConfirmHelp (line 1495)

#### Constants: LEVEL_RECEIVE_LIMITS
**Location**: Line 48-53
```javascript
const LEVEL_RECEIVE_LIMITS = Object.freeze({
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243
});
```

#### Function: getReceiveLimitForLevel
**Location**: Line 104-106
```javascript
const getReceiveLimitForLevel = (levelName) => {
  const normalized = normalizeLevelName(levelName);
  return LEVEL_RECEIVE_LIMITS[normalized] || LEVEL_RECEIVE_LIMITS.Star;
};
```

---

### 2. FRONTEND ELIGIBILITY FUNCTIONS

**File**: `src/utils/eligibilityUtils.js`

#### Function: checkReceiveHelpEligibility
**Location**: Line 15-100
**Code**:
```javascript
export const checkReceiveHelpEligibility = (userDoc) => {
  if (!userDoc) return { eligible: false, reason: 'RECEIVE_HELP_BLOCKED: User document not found' };
  if (userDoc.isActivated !== true) return { eligible: false, reason: '...' };
  if (userDoc.isBlocked === true) return { eligible: false, reason: '...' };
  if (userDoc.isOnHold === true) return { eligible: false, reason: '...' };
  if (userDoc.isReceivingHeld === true) return { eligible: false, reason: '...' };
  if (userDoc.kycDetails?.paymentBlocked === true) return { eligible: false, reason: '...' };
  if (userDoc.helpVisibility === false) return { eligible: false, reason: '...' };
  if (!userDoc.levelStatus) return { eligible: false, reason: '...' };
  return { eligible: true, reason: null };
};
```
**Input**: User document object
**Output**: `{ eligible: boolean, reason: string }`
**Used by**:
- UI components to gate receive help button
- Does NOT check: upgradeRequired, sponsorPaymentPending, activeReceiveCount
- Never trusts this alone for backend operations

#### Function: getEligibilityMessage
**Location**: Line 102-125
**Purpose**: Convert reason code to user-friendly message
**Usage**: Show toast/error messages

---

### 3. MLM CORE (Shared Between Frontend & Backend)

**File**: `src/shared/mlmCore.js` (also in `backend/functions/shared/mlmCore.js`)

#### Object: LEVEL_CONFIG
**Location**: Line 6-46
**Content**:
```javascript
export const LEVEL_CONFIG = {
  Star: {
    totalHelps: 3,
    amount: 300,
    blockPoints: [3],  // Block at 3 helps
    upgradeAmount: 600,
    sponsorPayment: null,
    next: "Silver",
    helpLimit: 3
  },
  Silver: {
    totalHelps: 9,
    amount: 600,
    blockPoints: [4, 7],  // Block at 4 and 7
    upgradeAmount: 1800,
    sponsorPayment: 1200,
    next: "Gold",
    helpLimit: 9
  },
  // ... Gold, Platinum, Diamond
};
```

#### Function: isIncomeBlocked
**Location**: Line 49-55
```javascript
export const isIncomeBlocked = (user) => {
  if (!user || !user.level || !LEVEL_CONFIG[user.level]) return false;
  const config = LEVEL_CONFIG[user.level];
  const helpReceived = user.helpReceived || 0;
  return config.blockPoints.includes(helpReceived);
};
```
**Purpose**: Check if user hit income block point
**Used by**: Sender eligibility (not receiver)

---

### 4. HELP STATUS CONSTANTS

**File**: `src/config/helpStatus.js`

#### Constants
**Location**: Line 6-14
```javascript
export const HELP_STATUS = {
  ASSIGNED: 'assigned',
  PAYMENT_REQUESTED: 'payment_requested',
  PAYMENT_DONE: 'payment_done',
  CONFIRMED: 'confirmed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  FORCE_CONFIRMED: 'force_confirmed'
};
```

**Active Statuses**: assigned, payment_requested, payment_done
**Terminal Statuses**: confirmed, timeout, cancelled, force_confirmed, disputed

---

## DATA FLOW DIAGRAM

```
1. USER VISITS RECEIVE HELP PAGE
   ↓
   frontend calls Cloud Function: getReceiveEligibility()
   ↓
   backend:
     userData = fetch from Firestore users/{uid}
     eligible = isReceiverEligibleStrict(userData)
     reasonCode = receiverIneligibilityReason(userData)
   ↓
   returns: { isEligible, reasonCode, flags, activeReceiveCount, levelAllowedLimit }
   ↓
   frontend: checkReceiveHelpEligibility(localUserData) [incomplete check]
   ↓
   UI shows: "Eligible" or "Reason: ${reasonCode}"

2. USER TRIES TO REQUEST PAYMENT
   ↓
   frontend calls Cloud Function: requestPayment(helpId)
   ↓
   backend transaction:
     receiverUserData = fetch from Firestore
     if !isReceiverEligibleStrict(receiverUserData):
       throw HttpsError("Receiver not eligible: ${reason}")
     else:
       update help status to PAYMENT_REQUESTED
   ↓
   if error: frontend shows reason
   if success: help moves to PAYMENT_REQUESTED

3. HELP COMPLETES
   ↓
   backend:
     call releaseReceiverSlotIfNeeded()
     activeReceiveCount -= 1
     mark help as terminal status (CONFIRMED, TIMEOUT, etc)
   ↓
   receiver can now receive another help (if other checks pass)

4. USER HITS BLOCK POINT (e.g., Star user receives 3rd help)
   ↓
   backend (external update process):
     helpReceived = 3 matches blockPoint [3]
     upgradeRequired = true
   ↓
   next eligibility check:
     isReceiverEligibleStrict() returns FALSE
     reasonCode = 'upgrade_required'
   ↓
   user must pay ₹600 upgrade to unblock

5. USER PAYS UPGRADE
   ↓
   backend (payment service):
     verify payment received
     upgradeRequired = false
     levelStatus = 'Silver'  [if upgrading level]
   ↓
   next eligibility check:
     isReceiverEligibleStrict() returns TRUE
     user can receive again
```

---

## FIRESTORE SCHEMA

```
users/{uid}
  ├─ isActivated: boolean
  ├─ isBlocked: boolean
  ├─ isOnHold: boolean
  ├─ isReceivingHeld: boolean
  ├─ upgradeRequired: boolean
  ├─ sponsorPaymentPending: boolean
  ├─ activeReceiveCount: number (0 if missing)
  ├─ helpReceived: number (0 if missing)
  ├─ levelStatus: string ('Star', 'Silver', etc)
  ├─ helpVisibility: boolean (true if missing)
  └─ kycDetails: {
      └─ paymentBlocked: boolean (false if missing)
  }

sendHelp/{helpId}
  ├─ status: 'assigned' | 'payment_requested' | 'payment_done' | ...
  ├─ senderUid: string
  ├─ receiverUid: string
  ├─ amount: number
  ├─ createdAt: timestamp
  └─ ...

receiveHelp/{helpId}
  ├─ status: 'assigned' | 'payment_requested' | 'payment_done' | ...
  ├─ senderUid: string
  ├─ receiverUid: string
  ├─ amount: number
  ├─ slotReleased: boolean
  ├─ createdAt: timestamp
  └─ ...
```

---

## CALL STACK FOR TYPICAL OPERATION

```
User clicks "Check Eligibility"
  ↓
frontend: getReceiveEligibility() [Cloud Function callable]
  ↓
backend: exports.getReceiveEligibility = httpsOnCall(async (request) => {
  userData = db.collection('users').doc(uid).get()
  eligible = isReceiverEligibleStrict(userData)
  reasonCode = receiverIneligibilityReason(userData)
  return { isEligible: eligible, reasonCode, flags, activeReceiveCount, levelAllowedLimit }
})
  ↓
frontend: receives response
  ↓
frontend: checkReceiveHelpEligibility(userProfile) [local check]
  ↓
UI: render "Eligible" or show error message
```

```
User clicks "Request Payment"
  ↓
frontend: requestPayment(helpId) [Cloud Function callable]
  ↓
backend: exports.requestPayment = httpsOnCall(async (request) => {
  await db.runTransaction(async (tx) => {
    receiveRef = db.collection('receiveHelp').doc(helpId)
    r = tx.get(receiveRef)
    if r.status !== HELP_STATUSES.ASSIGNED: return  // invalid transition
    
    receiverUserSnap = tx.get(db.collection('users').doc(request.auth.uid))
    receiverUser = receiverUserSnap.data()
    if !isReceiverEligibleStrict(receiverUser):
      throw HttpsError('failed-precondition', 'Receiver not eligible...')
    
    tx.update(receiveRef, {
      status: HELP_STATUSES.PAYMENT_REQUESTED,
      paymentRequestedAt: timestamp,
      paymentRequestedAtMs: Date.now(),
      nextTimeoutAtMs: Date.now() + 24h
    })
  })
  notify sender
  return { success: true }
})
  ↓
if error: frontend shows error reason
if success: help transitions to PAYMENT_REQUESTED
```

---

## CRITICAL EXECUTION POINTS

| Point | Check | Pass/Fail Outcome |
|-------|-------|------------------|
| getReceiveEligibility() called | isReceiverEligibleStrict() | Returns isEligible flag |
| startHelpAssignment() finds receiver | All 7 checks in loop | Selects eligible receiver |
| requestPayment() called | isReceiverEligibleStrict() again | Allows or blocks request |
| confirmPaymentReceived() | isReceiverEligibleStrict() | Allows or blocks confirm |
| Help completes | releaseReceiverSlotIfNeeded() | Decrements activeReceiveCount |
| User receives Nth help | Check against blockPoints | Sets income block flags |

---

## IMPORTANT DIFFERENCES

### Frontend vs Backend

| Aspect | Frontend | Backend |
|--------|----------|---------|
| Location | `src/utils/eligibilityUtils.js` | `backend/functions/index.js` |
| Checks `upgradeRequired` | NO | YES |
| Checks `sponsorPaymentPending` | NO | YES |
| Checks `activeReceiveCount` | NO | YES |
| Checks `kycDetails.paymentBlocked` | YES | NO |
| Authority | UI gating only | SOURCE OF TRUTH |
| When called | UI load, component render | Every action |
| Can be bypassed | Possible (client manipulation) | NO (secure backend) |

### helpReceived vs activeReceiveCount

| Field | Meaning | When Incremented | When Decremented | Used For |
|-------|---------|------------------|-----------------|----------|
| `helpReceived` | Lifetime helps received | CONFIRMED help completes | Never | Income block point detection |
| `activeReceiveCount` | Current active helps | Help moves to ASSIGNED | Help terminal/completed | Slot limit checking |

---

## EXAMPLE SCENARIOS WITH CODE PATHS

### Scenario: Star user with 3 helps hits upgrade block
```
User data:
  helpReceived: 3        ← Hit block point
  activeReceiveCount: 0  ← No active helps
  upgradeRequired: true  ← Set by system
  levelStatus: 'Star'

isReceiverEligibleStrict():
  return (true &&                    // isActivated
          true &&                    // !isBlocked
          true &&                    // !isReceivingHeld
          false &&  ← FAILS HERE     // upgradeRequired === false
          true &&
          0 < 3)
  → returns FALSE

reasonCode = 'upgrade_required'

User cannot receive another help until upgrade is paid
```

### Scenario: Silver user requests payment while blocked
```
Time 1 - eligible check:
  isBlocked: false
  activeReceiveCount: 1 < 9
  → isEligible: true ✓

Time 2 - 1 hour later - request payment:
  Firestore data now:
    isBlocked: true  ← deadline passed
    
Backend re-checks:
  isReceiverEligibleStrict() with current data
  → returns FALSE (isBlocked === true)
  
Response: HttpsError('failed-precondition', 'Receiver not eligible: blocked')
```

### Scenario: Gold user has 25 concurrent active helps
```
User data:
  activeReceiveCount: 25
  levelStatus: 'Gold'
  
getReceiveLimitForLevel('Gold') → 27

isReceiverEligibleStrict():
  25 < 27 → TRUE ✓
  
User can still receive 2 more helps (slots available)
```

---

## SUMMARY

- **Backend truth**: `isReceiverEligibleStrict()` at line 107 of backend/functions/index.js
- **Frontend gate**: `checkReceiveHelpEligibility()` at line 15 of src/utils/eligibilityUtils.js
- **Re-validation**: Every action calls backend checks
- **Income blocking**: Sets `upgradeRequired` or `sponsorPaymentPending` flags
- **Slot management**: `activeReceiveCount` with atomic increments/decrements
- **Level-specific**: Limits vary (Star 3, Silver 9, Gold 27, Platinum 81, Diamond 243)
