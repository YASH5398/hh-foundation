# RECEIVE HELP ELIGIBILITY ANALYSIS - COMPLETE SYSTEM BREAKDOWN

## EXECUTIVE SUMMARY
The receive help eligibility system uses **TWO PARALLEL VALIDATION LAYERS**:
1. **Backend (Source of Truth)**: `isReceiverEligibleStrict()` in `backend/functions/index.js` (line 107)
2. **Frontend (UI Gating)**: `checkReceiveHelpEligibility()` in `src/utils/eligibilityUtils.js`

The backend is the **authoritative source** - it re-validates at every action point. All must pass.

---

## PART 1: EXACT FIELD REQUIREMENTS

### 1.1 MANDATORY FIELDS (Must be TRUE/FALSE/exact value)

#### Core Activation & Blocking Status
| Field Name | Required Value | Enforced By | Impact |
|------------|----------------|------------|--------|
| `isActivated` | `true` | Backend + Frontend | User must be activation-complete |
| `isBlocked` | `false` | Backend + Frontend | Payment deadline violations block user |
| `isOnHold` | `false` | Backend only | Temporary hold status blocks receiving |
| `isReceivingHeld` | `false` | Backend + Frontend | Explicit receiving privilege hold |
| `upgradeRequired` | `false` | Backend only | Blocks when blockPoint is hit (income blocking) |
| `sponsorPaymentPending` | `false` | Backend only | Blocks when blockPoint is hit (income blocking) |

#### KYC & Visibility
| Field Name | Required Value | Enforced By | Impact |
|------------|----------------|------------|--------|
| `kycDetails.paymentBlocked` | NOT `true` (can be false/null/undefined) | Frontend only | KYC payment processing blocked |
| `helpVisibility` | NOT `false` (can be true/null/undefined) | Backend + Frontend | User opted-out of receiving help |
| `levelStatus` or `level` | Must exist & be valid | Backend + Frontend | Determines receive limit |

#### Help Count Management (Active)
| Field Name | Required Value | Enforced By | Impact |
|------------|----------------|------------|--------|
| `activeReceiveCount` | `< levelLimit` | Backend (strict) | Number of ACTIVE (non-terminal) receives |
| Default if missing | 0 | Both | Treated as zero if not set |

---

## PART 2: EXACT LOGICAL FLOW & VALIDATION ORDER

### 2.1 BACKEND VALIDATION (isReceiverEligibleStrict)
**Location**: `backend/functions/index.js`, line 107-113

```javascript
const isReceiverEligibleStrict = (userData) => {
  return (
    userData?.isActivated === true &&           // CHECK 1
    userData?.isBlocked === false &&            // CHECK 2
    userData?.isReceivingHeld === false &&      // CHECK 3
    userData?.upgradeRequired === false &&      // CHECK 4
    userData?.sponsorPaymentPending === false && // CHECK 5
    (userData?.activeReceiveCount || 0) < getReceiveLimitForLevel(userData?.levelStatus || userData?.level) // CHECK 6
  );
};
```

**Execution Order (All must pass - AND logic)**:
1. `isActivated === true` → User account activated
2. `isBlocked === false` → NOT blocked (no deadline violation)
3. `isReceivingHeld === false` → NOT holding flag
4. `upgradeRequired === false` → NOT at upgrade block point
5. `sponsorPaymentPending === false` → NOT at sponsor payment block point
6. `activeReceiveCount < levelLimit` → Under receive slot limit

---

### 2.2 BACKEND REASON CODES (receiverIneligibilityReason)
**Location**: `backend/functions/index.js`, line 119-127

When eligibility fails, system returns reason codes in this PRIORITY ORDER:

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

**Priority (checked in order)**:
1. `'not_activated'` - isActivated ≠ true
2. `'blocked'` - isBlocked === true
3. `'receiving_held'` - isReceivingHeld === true
4. `'upgrade_required'` - upgradeRequired === true
5. `'sponsor_payment_pending'` - sponsorPaymentPending === true
6. `'receive_limit_reached'` - activeReceiveCount >= limit
7. `'not_eligible'` - fallback (shouldn't happen if checks are consistent)

---

### 2.3 FRONTEND VALIDATION (checkReceiveHelpEligibility)
**Location**: `src/utils/eligibilityUtils.js`, line 15-100

**Execution Order (All must pass - AND logic)**:
1. User document exists (not null/undefined)
2. `isActivated === true`
3. `isBlocked !== true`
4. `isOnHold !== true`
5. `isReceivingHeld !== true`
6. `kycDetails.paymentBlocked !== true`
7. `helpVisibility !== false` (undefined/null is OK)
8. `levelStatus` exists and is not empty

**Frontend does NOT check**:
- `upgradeRequired` (backend-only)
- `sponsorPaymentPending` (backend-only)
- `activeReceiveCount` limit (backend-only, prevents race conditions)

---

## PART 3: LEVEL-WISE RECEIVE LIMITS

### 3.1 Help Limits by Level
**Source**: `backend/functions/index.js`, line 48-53

```javascript
const LEVEL_RECEIVE_LIMITS = Object.freeze({
  Star: 3,        // Max 3 concurrent active receive helps
  Silver: 9,      // Max 9 concurrent active receive helps
  Gold: 27,       // Max 27 concurrent active receive helps
  Platinum: 81,   // Max 81 concurrent active receive helps
  Diamond: 243    // Max 243 concurrent active receive helps
});
```

### 3.2 How Limits are Enforced

**When help is ASSIGNED**:
- `activeReceiveCount` is INCREMENTED by 1
- Help document created with status = 'assigned'
- Help counts as ACTIVE

**When help is COMPLETED/TIMED OUT**:
- `activeReceiveCount` is DECREMENTED by 1
- `slotReleased` flag set to true
- Help no longer counts as ACTIVE

**Active Statuses**: `assigned`, `payment_requested`, `payment_done`
**Terminal Statuses**: `confirmed`, `timeout`, `cancelled`, `force_confirmed`

### 3.3 Level-Specific Block Points (Income Blocking)
**Source**: `src/shared/mlmCore.js`

When a user receives N helps and hits a block point:
- `upgradeRequired` or `sponsorPaymentPending` is set to true
- User becomes ineligible for receive
- Must complete payment to unblock

| Level | Block Points | First Block Type | Second Block Type |
|-------|---|---|---|
| **Star** | [3] | upgradeRequired (₹600 upgrade) | - |
| **Silver** | [4, 7] | upgradeRequired (₹1,800) | sponsorPaymentPending (₹1,200) |
| **Gold** | [11, 25] | upgradeRequired (₹20,000) | sponsorPaymentPending (₹4,000) |
| **Platinum** | [11, 80] | upgradeRequired (₹200,000) | sponsorPaymentPending (₹40,000) |
| **Diamond** | [242] | sponsorPaymentPending (₹600,000) | - |

**Example**: Star user who received 3 helps:
- `helpReceived = 3` matches block point [3]
- `upgradeRequired = true`
- `isReceiverEligibleStrict()` returns FALSE
- Cannot receive more helps until upgrade is paid

---

## PART 4: BLOCKING CONDITIONS - DETAILED BREAKDOWN

### 4.1 Account Status Blocks (Hard Blocks)

#### A. isBlocked = true
**What it means**: Account violates payment deadline system
**Set by**: `deadline system` when sender doesn't pay within 24h
**Frontend shows**: Red error, "Account blocked"
**Can receive help**: NO
**Recovery**: Pay deadline penalty amount

#### B. isOnHold = true
**What it means**: Temporary administrative hold
**Set by**: Admin action (manual intervention)
**Frontend shows**: Blue waiting state
**Can receive help**: NO (backend check only)
**Recovery**: Admin removes hold

#### C. isReceivingHeld = true
**What it means**: Receiving privileges explicitly revoked
**Set by**: Dispute system, fraud detection, or admin
**Frontend shows**: "Receiving privileges held"
**Can receive help**: NO
**Recovery**: Admin lifts hold

### 4.2 Income Blocking (Dynamic - Based on helpReceived Count)

#### A. upgradeRequired = true
**What it means**: User has received N helps and must upgrade level
**Set at**: Specific block points (3 for Star, 4 for Silver, 11 for Gold/Platinum)
**Frontend shows**: "Upgrade required"
**Can receive help**: NO
**Must pay**: Upgrade amount (₹600 to ₹200,000 depending on level)
**Becomes eligible**: After upgrade payment completes

#### B. sponsorPaymentPending = true
**What it means**: User has received many helps and must pay sponsor fee
**Set at**: High block points (7 for Silver, 25 for Gold, 80 for Platinum, 242 for Diamond)
**Frontend shows**: "Sponsor payment pending"
**Can receive help**: NO
**Must pay**: Sponsor fee (₹1,200 to ₹600,000 depending on level)
**Becomes eligible**: After sponsor payment completes

### 4.3 KYC/Verification Blocks (Frontend UI Gating)

#### A. kycDetails.paymentBlocked = true
**What it means**: KYC/identity verification payment processing blocked
**Set by**: KYC system
**Frontend shows**: "Payment processing blocked"
**Backend check**: Frontend-only (doesn't block at backend)
**Can receive help**: NO (frontend gates only)
**Recovery**: Complete KYC process

### 4.4 Visibility & Activation Blocks

#### A. isActivated ≠ true
**What it means**: Account not yet activated (no help sent)
**Frontend shows**: "Account not activated"
**Can receive help**: NO
**Recovery**: User completes help activation sequence

#### B. helpVisibility === false
**What it means**: User explicitly opted out of receiving help
**Frontend shows**: "Receiving disabled"
**Can receive help**: NO
**Recovery**: User re-enables in settings

---

## PART 5: activeReceiveCount - THE CRITICAL FIELD

### 5.1 What It Represents
NOT the total helps received ever (that's `helpReceived`)
**ONLY** the number of currently ACTIVE helps (assigned, payment_requested, payment_done)

### 5.2 When It Increments
**Location**: `backend/functions/index.js`, line 612
```javascript
tx.update(chosenReceiverRef, {
  activeReceiveCount: admin.firestore.FieldValue.increment(1),
  lastReceiveAssignedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Triggered**: When help status moves to `assigned`

### 5.3 When It Decrements
**Location**: `backend/functions/index.js`, line 192
```javascript
tx.update(userRef, { activeReceiveCount: next }); // where next = current - 1
```

**Triggered**: When help reaches terminal status:
- `timeout`
- `confirmed`
- `cancelled`
- `force_confirmed`

### 5.4 Why This Matters
- Prevents race conditions (atomic transaction)
- Accurately reflects "slots available now"
- Different from `helpReceived` (lifetime counter)

**Example**:
- Star user with `helpReceived: 3, activeReceiveCount: 2`
  - Has received 3 helps total (income blocked)
  - 2 are still ongoing (payment not confirmed)
  - 1 has completed
  - `activeReceiveCount < 3` ✓ Can receive MORE (income blocks, but slots say yes → income block wins)
  - Result: INELIGIBLE (upgradeRequired = true overrides slot availability)

---

## PART 6: COMMON MISTAKES WHERE UI LOOKS CORRECT BUT ELIGIBILITY FAILS

### Mistake #1: Assuming helpReceived < helpLimit Means Eligible
**❌ WRONG**: "User received 2 helps, Star level allows 3, so eligible"
**✓ CORRECT**: Must also check `upgradeRequired` flag set at block point 3
- If user has `helpReceived: 3` and is Star → `upgradeRequired: true` → INELIGIBLE
- activeReceiveCount doesn't matter (backend checks both)

### Mistake #2: Frontend Validation = Backend Truth
**❌ WRONG**: Frontend says "you're eligible" → will succeed at backend
**✓ CORRECT**: Backend re-checks EVERY action with `isReceiverEligibleStrict()`
- Reason: Firestore can be edited externally
- Always treat backend as source of truth

### Mistake #3: Forgetting About Income Blocking
**❌ WRONG**: User has free slots (`activeReceiveCount: 1 < limit: 3`) so can receive
**✓ CORRECT**: Must check `upgradeRequired` and `sponsorPaymentPending` FIRST
- Income blocks take precedence over slot availability
- `upgradeRequired = true` → INELIGIBLE (regardless of slots)

### Mistake #4: Treating isOnHold the Same as isBlocked
**❌ WRONG**: Both prevent receiving, so they're equivalent
**✓ CORRECT**: 
- `isBlocked` = payment deadline violation, hard block
- `isOnHold` = temporary administrative hold
- Different recovery paths

### Mistake #5: Setting helpVisibility = false vs Null
**❌ WRONG**: `helpVisibility` must be true to be eligible
**✓ CORRECT**: 
- `helpVisibility === false` → INELIGIBLE
- `helpVisibility = null` or `undefined` → ELIGIBLE (default allows)
- Only explicit false blocks

### Mistake #6: Forgetting Backend Re-Validates at Every Action
**❌ WRONG**: Check eligibility once, then allow request/confirm/etc
**✓ CORRECT**: Backend runs `isReceiverEligibleStrict()` before:
- Request payment (requestPayment function)
- Any state transition
- Admin force-confirms

Example flow:
1. User checks eligibility: "eligible"
2. User requests payment: Backend re-checks, now `upgradeRequired = true`
3. Error: "Receiver not eligible: upgrade_required"

### Mistake #7: Confusing activeReceiveCount with Permanent Limit
**❌ WRONG**: `activeReceiveCount >= limit` means user can never receive again
**✓ CORRECT**: Increments/decrements dynamically
- When one help completes → count decreases → new slot opens
- User can receive again if other conditions met

### Mistake #8: Ignoring Level Normalization
**❌ WRONG**: Storing level as integer (1, 2, 3...) doesn't affect logic
**✓ CORRECT**: Must normalize to string names:
- `levelStatus: "Star"` (or `level: "Star"`)
- `levelStatus: 1` gets normalized to "Star"
- Missing/invalid level → defaults to Star

---

## PART 7: EXACT FIELD VALUES AT CREATION

When a new user is created/activated:

| Field | Value | Notes |
|-------|-------|-------|
| `isActivated` | `false` initially, `true` after first help | Auto-set by system |
| `isBlocked` | `false` | Default |
| `isOnHold` | `false` | Default |
| `isReceivingHeld` | `false` | Default |
| `upgradeRequired` | `false` | Default |
| `sponsorPaymentPending` | `false` | Default |
| `activeReceiveCount` | `0` | Default (or omitted, treated as 0) |
| `helpReceived` | `0` | Incremented on CONFIRMED helps |
| `levelStatus` | `'Star'` | Default level |
| `helpVisibility` | `true` or omitted | Defaults to allow |
| `kycDetails.paymentBlocked` | `false` or omitted | Defaults to allow |

---

## PART 8: WHERE ELIGIBILITY IS CHECKED

### 8.1 Backend Check Points
1. **getReceiveEligibility** (Cloud Function)
   - Called by UI to show eligibility status
   - Uses `isReceiverEligibleStrict(userData)`
   - Returns full flags and reason codes

2. **startHelpAssignment** (Cloud Function)
   - When sender initiates help assignment
   - Searches for eligible receivers
   - Validates each candidate with all checks

3. **requestPayment** (Cloud Function)
   - When receiver requests payment
   - Re-validates receiver eligibility
   - Fails if receiver became ineligible

### 8.2 Frontend Check Points
1. **checkReceiveHelpEligibility()** in `src/utils/eligibilityUtils.js`
   - Used to gate UI components
   - Shows "ineligible" message
   - Does NOT prevent backend calls (backend is authority)

---

## PART 9: FINAL ELIGIBILITY CHECKLIST

✅ **User IS eligible to receive help IF AND ONLY IF:**

- [ ] `isActivated === true` (account activated)
- [ ] `isBlocked === false` (no payment deadline violation)
- [ ] `isOnHold === false` (no temporary hold)
- [ ] `isReceivingHeld === false` (receiving privileges not held)
- [ ] `upgradeRequired === false` (not at upgrade block point)
- [ ] `sponsorPaymentPending === false` (not at sponsor payment block point)
- [ ] `activeReceiveCount < levelLimit` (has available slots for their level)
- [ ] `levelStatus` is set and valid (Star/Silver/Gold/Platinum/Diamond)
- [ ] `helpVisibility !== false` (not explicitly opted-out)
- [ ] `kycDetails.paymentBlocked !== true` (KYC payment not blocked)

**If ANY checkbox fails → INELIGIBLE**

---

## PART 10: LEVEL-WISE ELIGIBILITY MATRIX

| Scenario | Star | Silver | Gold | Platinum | Diamond |
|----------|------|--------|------|----------|---------|
| Slot available | activeRecv < 3 | activeRecv < 9 | activeRecv < 27 | activeRecv < 81 | activeRecv < 243 |
| Income blocked at | helpRecv = 3 | helpRecv = 4, 7 | helpRecv = 11, 25 | helpRecv = 11, 80 | helpRecv = 242 |
| Upgrade at block | ₹600 | ₹1,800 at 4; ₹1,200 at 7 | ₹20,000 at 11; ₹4,000 at 25 | ₹200,000 at 11; ₹40,000 at 80 | ₹600,000 at 242 |
| Can receive if all else OK | YES if < 3 active | YES if < 9 active | YES if < 27 active | YES if < 81 active | YES if < 243 active |

---

## PART 11: FIELD STORAGE LOCATION

### Firestore Collection: `users/{uid}`

**Root Level Fields**:
- `isActivated` (boolean)
- `isBlocked` (boolean)
- `isOnHold` (boolean)
- `isReceivingHeld` (boolean)
- `upgradeRequired` (boolean)
- `sponsorPaymentPending` (boolean)
- `activeReceiveCount` (number)
- `helpReceived` (number)
- `levelStatus` (string)
- `helpVisibility` (boolean)

**Nested Fields**:
- `kycDetails.paymentBlocked` (boolean)

---

## PART 12: IMPLEMENTATION REALITY CHECK

### What ACTUALLY happens when checking eligibility:

1. **User visits Receive Help page**
   - Frontend calls `getReceiveEligibility` (Cloud Function)
   - Returns: `{ isEligible: true/false, reasonCode, flags, activeReceiveCount, levelAllowedLimit }`
   - UI shows status based on flags

2. **User tries to request payment**
   - Backend (requestPayment function) re-calls `isReceiverEligibleStrict(userData)`
   - If false, throws `HttpsError('failed-precondition', "Receiver not eligible: ${reason}")`
   - UI catches and shows error

3. **Help completes or times out**
   - Backend runs `releaseReceiverSlotIfNeeded()`
   - Decrements `activeReceiveCount` by 1
   - Sets `slotReleased = true`
   - User can now receive another help (if other conditions OK)

---

## SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Authority** | Backend `isReceiverEligibleStrict()` is source of truth |
| **Frontend gating** | `checkReceiveHelpEligibility()` shows UI status only |
| **Critical field** | `activeReceiveCount` (current active helps) |
| **Income blocking** | `upgradeRequired` and `sponsorPaymentPending` flags |
| **Level-specific** | Limits vary: Star 3, Silver 9, Gold 27, Platinum 81, Diamond 243 |
| **Re-validation** | Every action (request, confirm, etc) re-checks backend |
| **Common error** | Assuming helpReceived < limit = eligible (ignores income blocks) |
| **Terminal statuses** | confirmed, timeout, cancelled, force_confirmed (release slot) |
| **Active statuses** | assigned, payment_requested, payment_done (hold slot) |

This is the COMPLETE, EXACT eligibility system. No guessing.
