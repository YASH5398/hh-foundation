# RECEIVE HELP ELIGIBILITY - TROUBLESHOOTING GUIDE

## SYMPTOM → ROOT CAUSE DIAGNOSIS

### SYMPTOM 1: "User says they can't receive help"

**Step 1**: Call getReceiveEligibility Cloud Function
```
Returns:
{
  "isEligible": false,
  "reasonCode": "???"  ← KEY: Check this
  "flags": {
    "isBlocked": ?,
    "isReceivingHeld": ?,
    "upgradeRequired": ?,
    "sponsorPaymentPending": ?
  },
  "activeReceiveCount": ?,
  "levelAllowedLimit": ?
}
```

**Step 2**: Match reasonCode to action
| reasonCode | Root Cause | Solution |
|---|---|---|
| `'not_activated'` | Account not activated | User must complete activation |
| `'blocked'` | Payment deadline violated | Payment system: issue deadline penalty |
| `'receiving_held'` | Admin action or dispute | Admin must lift flag |
| `'upgrade_required'` | Hit upgrade block point | User must pay upgrade amount |
| `'sponsor_payment_pending'` | Hit sponsor payment block point | User must pay sponsor fee |
| `'receive_limit_reached'` | All concurrent slots filled | User must wait for existing helps to complete |

---

### SYMPTOM 2: "Frontend says eligible, but backend action fails"

**Root Cause**: Frontend check is incomplete. Backend re-validates.

**Why**: 
- Frontend doesn't check `upgradeRequired`, `sponsorPaymentPending`, `activeReceiveCount`
- Data changed between UI load and action attempt
- Backend is always authoritative

**Solution**:
1. Before critical action, call getReceiveEligibility again
2. Check isEligible from backend response
3. Show user the reasonCode if not eligible
4. Don't proceed if reasonCode indicates block

---

### SYMPTOM 3: "User has free slots but says can't receive"

**Example**:
```
activeReceiveCount: 1
levelAllowedLimit: 9
Math says: 1 < 9 ✓ Slots available
User says: Can't receive ✗
```

**Root Cause**: Income block is taking precedence

Check flags:
- `upgradeRequired: true` → Must pay upgrade
- `sponsorPaymentPending: true` → Must pay sponsor fee

**Solution**: User must complete income block payment

---

### SYMPTOM 4: "User receives help, then can't receive another"

**What happened**:
```
Time 1: Star user receives 1st help
  helpReceived: 1
  activeReceiveCount: 1 (incremented)
  isEligible: true ✓
  
Time 2: 1st help completes
  activeReceiveCount: 0 (decremented)
  But helpReceived still: 1
  isEligible: still true ✓
  
Time 3: Receives 2nd help
  helpReceived: 2
  activeReceiveCount: 1
  isEligible: true ✓
  
Time 4: Receives 3rd help
  helpReceived: 3  ← HIT BLOCK POINT!
  upgradeRequired: true  ← SET BY SYSTEM
  isEligible: false ✗
```

**Root Cause**: Hit income block point (3 helps for Star)

**Solution**: User must pay ₹600 upgrade payment to unblock

---

### SYMPTOM 5: "Receiver was eligible 1 hour ago, now action fails"

**Timing issue**: Data changed between checks

**Common scenarios**:
1. **Payment deadline passed**
   - `isBlocked` changed from false → true
   - Reason: Sender didn't pay within 24h timeout

2. **Admin action**
   - `isOnHold` or `isReceivingHeld` set to true
   - Reason: Admin manually placed hold

3. **Income block hit**
   - `upgradeRequired` or `sponsorPaymentPending` set to true
   - Reason: Another help they received completed, hitting block point

**Solution**: Always check fresh eligibility before critical action

---

### SYMPTOM 6: "activeReceiveCount shows wrong number"

**Possible causes**:

1. **Help not released properly**
   - Help status is terminal but `slotReleased` flag not set
   - `activeReceiveCount` wasn't decremented
   - Check help document: is `slotReleased: true`?
   - If not, manually run `releaseReceiverSlotIfNeeded` (admin)

2. **Duplicate helps**
   - Same receiver has multiple active helps from same sender
   - `activeReceiveCount` incremented multiple times
   - Check for duplicate sendHelp/receiveHelp documents

3. **Race condition**
   - Two concurrent helps assigned at same time
   - Both incremented count simultaneously
   - Check transaction logs for conflicts

**Debug Steps**:
```
1. Count active helps manually:
   SELECT * FROM receiveHelp 
   WHERE receiverUid = '{uid}' 
   AND status IN ['assigned', 'payment_requested', 'payment_done']
   
2. Compare with user.activeReceiveCount
   
3. If mismatch, check which helps have slotReleased = false
   
4. For unreleased terminal helps, manually call releaseReceiverSlotIfNeeded
```

---

### SYMPTOM 7: "User at level Star but limit shows as different"

**Root Cause**: levelStatus not set correctly or using legacy 'level' field

Check user document:
```
User has:
  level: 1  ← OLD FORMAT

System expects:
  levelStatus: 'Star'  ← NEW FORMAT
```

**Fix**:
1. Set `levelStatus` to proper string value
2. Keep `level` for backward compatibility
3. System normalizes automatically, but best practice is explicit

**Normalization function** (backend):
```javascript
const normalizeLevelName = (levelValue) => {
  if (!levelValue) return 'Star';
  if (typeof levelValue === 'string') return levelValue;
  if (typeof levelValue === 'number') {
    const map = { 1: 'Star', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Diamond' };
    return map[levelValue] || 'Star';
  }
  return 'Star';
};
```

---

### SYMPTOM 8: "Help shows confirmed but activeReceiveCount not decremented"

**Root Cause**: `releaseReceiverSlotIfNeeded()` not called or failed

**When it should be called**:
- Help confirmed (line 965 of backend/functions/index.js)
- Help timeout (line 1087)
- Help cancelled (line 1185)
- Help forced confirmed (line 1495)

**Possible issues**:
1. Function call failed silently
2. Transaction was rolled back
3. `slotReleased` flag already set (idempotency)
4. Help document doesn't exist

**Check**:
```
Help document should have:
  slotReleased: true
  slotReleasedAt: <timestamp>
  
User document should have:
  activeReceiveCount: <original - 1>
  
If missing, logs will show error in backend
```

---

## DIAGNOSTIC QUERIES

### Query 1: Check User Eligibility Status
```firestore
SELECT 
  uid, 
  isActivated,
  isBlocked,
  isOnHold,
  isReceivingHeld,
  upgradeRequired,
  sponsorPaymentPending,
  activeReceiveCount,
  helpReceived,
  levelStatus,
  helpVisibility,
  kycDetails.paymentBlocked
FROM users
WHERE uid = '{target_uid}'
```

### Query 2: Check User's Active Helps
```firestore
SELECT 
  id,
  status,
  senderUid,
  amount,
  slotReleased,
  createdAt
FROM receiveHelp
WHERE receiverUid = '{uid}'
AND status IN ('assigned', 'payment_requested', 'payment_done')
ORDER BY createdAt DESC
```

### Query 3: Find All Users Blocked
```firestore
SELECT uid, blockReason, blockedAt
FROM users
WHERE isBlocked = true
ORDER BY blockedAt DESC
LIMIT 100
```

### Query 4: Find Users With Income Blocks
```firestore
SELECT 
  uid,
  helpReceived,
  levelStatus,
  upgradeRequired,
  sponsorPaymentPending
FROM users
WHERE upgradeRequired = true 
OR sponsorPaymentPending = true
ORDER BY helpReceived DESC
```

### Query 5: Find Inconsistent activeReceiveCount
```firestore
-- Manually:
1. For each user, count their active helps:
   SELECT COUNT(*) as actual_count
   FROM receiveHelp
   WHERE receiverUid = '{uid}'
   AND status IN ('assigned', 'payment_requested', 'payment_done')

2. Compare with user.activeReceiveCount
3. If mismatch, help debug
```

---

## COMMON MISTAKES TO AVOID

### ❌ WRONG: Check frontend eligibility once, assume same later
```javascript
// Time 1: Check eligibility
const { isEligible } = await checkReceiveHelpEligibility(user);

// ... 30 minutes later ...

// Time 2: User action - DON'T do this!
if (isEligible) {  // ← OLD DATA!
  await requestPayment(helpId);
}
```

✅ **CORRECT**: Check again before action
```javascript
// Before action, get fresh eligibility
const fresh = await getReceiveEligibility();
if (!fresh.data.isEligible) {
  return showError(fresh.data.reasonCode);
}
await requestPayment(helpId);
```

---

### ❌ WRONG: Only checking activeReceiveCount for eligibility
```javascript
// ❌ INCOMPLETE
if (user.activeReceiveCount < limit) {
  return true; // ← Missing 6 other checks!
}
```

✅ **CORRECT**: Always use full eligibility check
```javascript
// ✅ COMPLETE
const { isEligible } = isReceiverEligibleStrict(user);
```

---

### ❌ WRONG: Trusting frontend validation for backend decision
```javascript
// ❌ BAD: Frontend gated, so backend allows
export function allowRequestPayment(uid) {
  const user = localStorage.getItem(`user_${uid}`);
  if (user.isActivated) {
    // ← What if data changed or was manipulated?
    return true;
  }
}
```

✅ **CORRECT**: Backend always re-checks
```javascript
// ✅ GOOD: Backend validates independently
exports.requestPayment = httpsOnCall(async (request) => {
  const userData = await db.collection('users').doc(uid).get();
  if (!isReceiverEligibleStrict(userData.data())) {
    throw new HttpsError('failed-precondition', 'Not eligible');
  }
  // ... proceed
});
```

---

### ❌ WRONG: Assuming helpVisibility undefined = cannot receive
```javascript
// ❌ WRONG: Blocks if not explicitly true
if (!user.helpVisibility) {
  return 'Cannot receive - help visibility disabled';
}
```

✅ **CORRECT**: Only block if explicitly false
```javascript
// ✅ CORRECT: Only false blocks
if (user.helpVisibility === false) {
  return 'Cannot receive - help visibility disabled';
}
// undefined/null/true = can receive
```

---

### ❌ WRONG: Using helpReceived for slot management
```javascript
// ❌ WRONG: Mix-up between lifetime and active
const slotsUsed = user.helpReceived;  // WRONG FIELD!
const slotsAvailable = limit - slotsUsed;
```

✅ **CORRECT**: Use activeReceiveCount for slots
```javascript
// ✅ CORRECT: activeReceiveCount is for slots
const slotsUsed = user.activeReceiveCount;  // CORRECT!
const slotsAvailable = limit - slotsUsed;
```

---

### ❌ WRONG: Not checking income block despite free slots
```javascript
// ❌ WRONG: Only checks slots, ignores income blocks
if (user.activeReceiveCount < getReceiveLimitForLevel(user.level)) {
  // ← What about upgradeRequired?
  return true;
}
```

✅ **CORRECT**: Check all 6 criteria
```javascript
// ✅ CORRECT: Checks all 6 mandatory criteria
return (
  user.isActivated === true &&
  user.isBlocked === false &&
  user.isReceivingHeld === false &&
  user.upgradeRequired === false &&     // ← Income block 1
  user.sponsorPaymentPending === false &&  // ← Income block 2
  user.activeReceiveCount < getReceiveLimitForLevel(user.level)  // ← Slot check
);
```

---

## DEBUGGING CHECKLIST

When troubleshooting receive help eligibility:

- [ ] Call `getReceiveEligibility()` Cloud Function
- [ ] Check `reasonCode` value (indicates first failed check)
- [ ] Verify each flag in the response matches user document
- [ ] Query user document directly in Firestore
- [ ] Check `helpReceived` vs block points for the level
- [ ] Verify `activeReceiveCount` by counting active helps
- [ ] Confirm `levelStatus` is a valid string ("Star", "Silver", etc)
- [ ] Look for `slotReleased` flag on help documents
- [ ] Check backend logs for transaction failures
- [ ] Verify `isActivated: true` (base requirement)
- [ ] Confirm no manual holds or admin actions (`isOnHold`, `isReceivingHeld`)
- [ ] Check payment deadline status (`isBlocked`)
- [ ] Review income block points for user's level
- [ ] Test with fresh data (don't cache eligibility)

---

## QUICK FIX PROCEDURES

### Fix 1: User Stuck with activeReceiveCount Mismatch
```javascript
// Count actual active helps
const activeHelps = await db.collection('receiveHelp')
  .where('receiverUid', '==', uid)
  .where('status', 'in', ['assigned', 'payment_requested', 'payment_done'])
  .get();

const actualCount = activeHelps.docs.length;

// Update user document
await db.collection('users').doc(uid).update({
  activeReceiveCount: actualCount
});
```

### Fix 2: Release Slot Manually
```javascript
// For unreleased terminal helps
const help = await db.collection('receiveHelp').doc(helpId).get();
const user = await db.collection('users').doc(help.data().receiverUid).get();
const current = user.data().activeReceiveCount || 0;

await db.runTransaction(async (tx) => {
  tx.update(db.collection('users').doc(user.id), {
    activeReceiveCount: Math.max(0, current - 1)
  });
  tx.update(db.collection('receiveHelp').doc(helpId), {
    slotReleased: true,
    slotReleasedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

### Fix 3: Unblock Upgrade-Required User
```javascript
// After upgrade payment confirmed
await db.collection('users').doc(uid).update({
  upgradeRequired: false,
  levelStatus: 'Silver',  // or appropriate next level
  // ... other upgrade-related fields
});
```

---

## WHEN TO ESCALATE

- activeReceiveCount consistently mismatches despite fixes
- User blocked but didn't violate payment deadline
- Multiple users simultaneously report ineligibility
- Backend logs show transaction failures in releaseReceiverSlotIfNeeded
- Specific user can never become eligible despite meeting all criteria
- Firestore data inconsistency between sendHelp and receiveHelp documents

In these cases: Check backend transaction logs and run diagnostic queries above.
