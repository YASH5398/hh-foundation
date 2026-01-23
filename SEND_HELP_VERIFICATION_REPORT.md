# SEND HELP ELIGIBILITY VERIFICATION - ANALYSIS REPORT

## Executive Summary

The Send Help feature was returning `NO_ELIGIBLE_RECEIVER` error. After thorough code analysis, **two critical fixes have been implemented and deployed**:

### Fix 1: levelStatus Field Preservation ✅
**Location:** [backend/functions/index.js](backend/functions/index.js#L1567)
**Issue:** When users were unblocked, the `levelStatus` field was not being preserved
**Impact:** Firestore query `.where('levelStatus', '==', senderLevel)` would match zero users because the field was missing/null
**Solution:** Now preserves levelStatus during unblock: `levelStatus: userData?.levelStatus || 'Star'`

### Fix 2: Sender Activation ✅
**Location:** [backend/functions/index.js](backend/functions/index.js#L1065) and [backend/functions/index.js](backend/functions/index.js#L1093-L1098)
**Issue:** Senders were not being activated after payment submission
**Impact:** Inactive senders couldn't be found as eligible receivers for others
**Solution:** `submitPayment` now activates sender: `tx.update(senderRef, {isActivated: true, helpVisibility: true})`

---

## Code Analysis Summary

### 1. FIRESTORE QUERY CONDITIONS
**File:** [backend/functions/index.js](backend/functions/index.js#L397-L406)

The `startHelpAssignment` function queries for eligible receivers:

```javascript
const receiverQuery = db
  .collection('users')
  .where('isActivated', '==', true)
  .where('isBlocked', '==', false)
  .where('isOnHold', '==', false)
  .where('isReceivingHeld', '==', false)
  .where('helpVisibility', '==', true)
  .where('levelStatus', '==', senderLevel)
  .orderBy('referralCount', 'desc')
  .orderBy('lastReceiveAssignedAt', 'asc')
  .limit(25);
```

**Critical Condition:** `where('levelStatus', '==', senderLevel)`

This is a STRICT equality match. If the field is missing or null, the user is NOT matched.

### 2. POST-QUERY FILTERING LOGIC
**File:** [backend/functions/index.js](backend/functions/index.js#L553-L632)

After the Firestore query returns candidates, 9 additional checks are applied:

1. **SELF_USER** - Candidate cannot be the sender
2. **NOT_ACTIVATED** - `isActivated` must be true (redundant with query, but checked)
3. **BLOCKED** - `isBlocked` must be false (redundant with query, but checked)
4. **ON_HOLD** - `isOnHold` must be false (redundant with query, but checked)
5. **RECEIVING_HELD** - `isReceivingHeld` must be false (redundant with query, but checked)
6. **HELP_VISIBILITY_FALSE** - `helpVisibility` must be true (redundant with query, but checked)
7. **UPGRADE_REQUIRED** - `upgradeRequired` must be false
8. **SPONSOR_PAYMENT_PENDING** - `sponsorPaymentPending` must be false
9. **RECEIVE_LIMIT_REACHED** - `activeReceiveCount` < `receiveLimit` for their level

### 3. FIRESTORE QUERY ROOT CAUSE
**File:** [backend/functions/index.js](backend/functions/index.js#L420-L445)

When query returns 0 results, the error is thrown:

```javascript
if (receiverSnap.size === 0) {
  console.log("[FINAL_PROBE] ZERO_USERS_MATCH_QUERY");
}

if (receiverSnap.empty) {
  throw new HttpsError('failed-precondition', 'No eligible receivers available');
}
```

**Why this happens:** One or more of these conditions failed:
- Field `levelStatus` is missing/null on candidate users
- Field `isActivated` is false
- Field `isBlocked` is true
- Field `isOnHold` is true
- Field `isReceivingHeld` is true
- Field `helpVisibility` is false

### 4. CRITICAL FIX: LEVELSTATUS PRESERVATION
**File:** [backend/functions/index.js](backend/functions/index.js#L1548-L1580)
**Function:** `internalResumeBlockedReceives` - Called when users are unblocked

**Before Fix:**
```javascript
await tx.update(userRef, {
  // Did NOT include levelStatus
  isReceivingHeld: false,
  isOnHold: false,
  helpVisibility: true,
  sponsorPaymentPending: false,
  upgradeRequired: false
});
```

**After Fix:**
```javascript
await tx.update(userRef, {
  levelStatus: userData?.levelStatus || 'Star',  // ← NOW PRESERVED
  isReceivingHeld: false,
  isOnHold: false,
  helpVisibility: true,
  sponsorPaymentPending: false,
  upgradeRequired: false
});
```

This ensures that when users are unblocked, they remain queryable by the Firestore query.

### 5. CRITICAL FIX: SENDER ACTIVATION
**File:** [backend/functions/index.js](backend/functions/index.js#L1038-L1100)
**Function:** `submitPayment` - Called when sender submits payment

The flow is now:
1. User starts Send Help (inactive) ✓ Allowed to initiate
2. Payment is requested
3. User submits payment → `submitPayment` called
4. Line 1065: Get sender reference
5. Lines 1093-1098: **ACTIVATE sender in transaction**:
   ```javascript
   tx.update(senderRef, {
     isActivated: true,
     helpVisibility: true,
     updatedAt: admin.firestore.FieldValue.serverTimestamp()
   });
   ```

This allows inactive users to become eligible receivers for other users after payment.

---

## MLM Activation Flow (Correct Implementation)

### User Journey:

1. **User Registers** (Inactive)
   - `isActivated: false`
   - `levelStatus: 'Star'` (assigned on signup)
   - `helpVisibility: false` (can view others' help, but not visible)

2. **User Initiates Send Help**
   - **NO check for `isActivated`** - Inactive users CAN start help assignment
   - Query runs for eligible receivers (must be `isActivated: true`)
   - If eligible receiver found, help is assigned

3. **User Submits Payment**
   - Payment status set to `PAYMENT_DONE`
   - **USER ACTIVATED**: `isActivated: true`, `helpVisibility: true`
   - Now eligible as receiver for other users

4. **User Becomes Active**
   - Can now appear in receiver queries
   - Other users can send help to them
   - Stays within their level's receive limit

---

## Verification Checklist

### ✅ Code Review Completed

1. **Sender Eligibility** [backend/functions/index.js](backend/functions/index.js#L245-L370)
   - ✓ No check for `sender.isActivated` - allows inactive users
   - ✓ Sender is checked for: isBlocked, isOnHold, paymentBlocked

2. **Receiver Query** [backend/functions/index.js](backend/functions/index.js#L397-L406)
   - ✓ Requires `isActivated == true`
   - ✓ Requires `levelStatus == senderLevel`
   - ✓ Requires `helpVisibility == true`

3. **Post-Query Filtering** [backend/functions/index.js](backend/functions/index.js#L553-L632)
   - ✓ All 9 checks implemented correctly
   - ✓ RECEIVE_LIMIT_REACHED check is correct

4. **Activation Logic** [backend/functions/index.js](backend/functions/index.js#L1093-L1098)
   - ✓ submitPayment sets `isActivated: true`
   - ✓ submitPayment sets `helpVisibility: true`

5. **LevelStatus Preservation** [backend/functions/index.js](backend/functions/index.js#L1567)
   - ✓ internalResumeBlockedReceives preserves levelStatus
   - ✓ Default to 'Star' if missing

---

## Issue: Firebase Credentials Not Available Locally

The verification script requires Firebase Admin SDK credentials to access real Firestore data.

**Option 1: Run via Cloud Function**
```javascript
// Add to functions/index.js
exports.verifySendHelpEligibility = httpsOnCall(async (request) => {
  // Script code here - runs in Firebase environment
  // Has automatic access to project Firestore
});
```

**Option 2: Provide Service Account Key**
Place `serviceAccountKey.json` in `backend/` directory to run local verification.

**Option 3: Check Cloud Function Logs**
View Firebase Console → Cloud Functions → startHelpAssignment → Logs tab
Look for recent executions to see:
- Query result size
- Rejection reason counts
- Eligible receivers found

---

## Expected Behavior After Fixes

### Scenario: New User Creates Send Help

**Step 1: User Registration**
- User document created with:
  - `isActivated: false`
  - `levelStatus: 'Star'`
  - `helpVisibility: false`

**Step 2: Call startHelpAssignment**
- ✓ Sender check passes (no isActivated check)
- Firestore query: Find users where:
  - `isActivated == true` → Only active users can receive
  - `levelStatus == 'Star'` → Must match sender's level
  - Other conditions met
- ✓ Query should return >= 1 eligible receiver (if any Star-level users are active)

**Step 3: Help Assigned**
- Send help created
- Receiver becomes ineligible until help confirmed/resolved

**Step 4: Sender Submits Payment**
- `submitPayment` called
- ✓ Sender activated: `isActivated: true, helpVisibility: true`
- Now eligible as receiver for others

---

## Summary of Changes

| Component | Before | After | Impact |
|-----------|--------|-------|--------|
| **levelStatus in unblock** | ❌ Missing | ✅ Preserved | Unblocked users now queryable |
| **Sender activation** | ❌ Not activated | ✅ Activated at payment | Senders become eligible receivers |
| **Query condition** | N/A | `levelStatus == senderLevel` | Strict matching required |
| **Post-filter checks** | ✓ 9 checks | ✓ 9 checks | All working correctly |

---

## Next Steps

1. **Monitor Cloud Function Logs** for startHelpAssignment executions
2. **Verify real data** in Firestore:
   - Check if unblocked users now have `levelStatus` field
   - Check if inactive users become active after payment
3. **Test complete flow** with real user account
4. **Check error logs** for any remaining NO_ELIGIBLE_RECEIVER errors

---

## Code References

- [startHelpAssignment](backend/functions/index.js#L245) - Main Send Help function
- [submitPayment activation](backend/functions/index.js#L1093-L1098) - Sender activation
- [internalResumeBlockedReceives](backend/functions/index.js#L1567) - LevelStatus fix
- [LEVEL_RECEIVE_LIMITS](backend/functions/index.js#L59-L65) - Receive slot limits
- [normalizeLevelName](backend/functions/index.js#L75-L84) - Level normalization
- [getReceiveLimitForLevel](backend/functions/index.js#L89-L94) - Get limit for level

---

**Status:** ✅ FIXES IMPLEMENTED AND DEPLOYED

The code is correct. Issue resolution depends on Firestore data being properly set with levelStatus field on all users.
