# RECEIVE HELP ELIGIBILITY - QUICK REFERENCE CARD

## ONE-PAGE ELIGIBILITY CHECK

### Step-by-Step Eligibility Verification

```
User wants to RECEIVE help?

1. isActivated === true?              → NO = NOT_ELIGIBLE
2. isBlocked === false?               → NO = BLOCKED
3. isOnHold === false?                → NO = ON_HOLD (backend only)
4. isReceivingHeld === false?         → NO = RECEIVING_HELD
5. upgradeRequired === false?         → NO = UPGRADE_REQUIRED (backend only)
6. sponsorPaymentPending === false?   → NO = SPONSOR_PAYMENT_PENDING (backend only)
7. activeReceiveCount < levelLimit?   → NO = RECEIVE_LIMIT_REACHED (backend only)

ALL 7 MUST BE TRUE → ELIGIBLE
ANY ONE FALSE → INELIGIBLE
```

---

## CRITICAL FACTS

### Backend is Authority
- `isReceiverEligibleStrict()` in `backend/functions/index.js` line 107
- Called at EVERY action (request payment, confirm, etc)
- Frontend validation is UI gating only

### Frontend is Incomplete
- `checkReceiveHelpEligibility()` in `src/utils/eligibilityUtils.js`
- Doesn't check: `upgradeRequired`, `sponsorPaymentPending`, `activeReceiveCount`
- Never trust frontend alone

### Two Critical Numbers Are Different
- `helpReceived`: Lifetime helps received (sets income blocks at block points)
- `activeReceiveCount`: Currently active helps (slot management)

---

## INCOME BLOCKING IS LEVEL-SPECIFIC

When user receives N helps and hits block point → `upgradeRequired` or `sponsorPaymentPending` = true

| Level | 1st Block | 2nd Block |
|-------|-----------|-----------|
| **Star** | 3 helps → upgrade (₹600) | - |
| **Silver** | 4 helps → upgrade (₹1,800) | 7 helps → sponsor (₹1,200) |
| **Gold** | 11 helps → upgrade (₹20,000) | 25 helps → sponsor (₹4,000) |
| **Platinum** | 11 helps → upgrade (₹200,000) | 80 helps → sponsor (₹40,000) |
| **Diamond** | 242 helps → sponsor (₹600,000) | - |

**Example**: Star user with `helpReceived: 3`
- Has hit block point → `upgradeRequired: true`
- INELIGIBLE even if `activeReceiveCount: 0`
- Must pay ₹600 upgrade

---

## SLOT AVAILABILITY BY LEVEL

| Level | Max Concurrent Active | Current Active | Can Receive? |
|-------|----------------------|-----------------|--------------|
| Star | 3 | 2 | YES (if no blocks) |
| Silver | 9 | 8 | YES (if no blocks) |
| Gold | 27 | 26 | YES (if no blocks) |
| Platinum | 81 | 80 | YES (if no blocks) |
| Diamond | 243 | 242 | YES (if no blocks) |

"Blocks" = income blocks or status blocks

---

## BLOCKING FLAGS EXPLAINED

| Flag | Value | Means | Recovery |
|------|-------|-------|----------|
| `isBlocked` | true | Deadline violated | Pay penalty |
| `isOnHold` | true | Admin hold | Admin removes |
| `isReceivingHeld` | true | Privileges held | Admin lifts |
| `upgradeRequired` | true | Hit upgrade block point | Pay upgrade |
| `sponsorPaymentPending` | true | Hit sponsor block point | Pay sponsor fee |

---

## HELP STATUS FLOW & SLOT MANAGEMENT

```
ASSIGNED
    ↓ (receiver requests payment)
PAYMENT_REQUESTED
    ↓ (sender pays)
PAYMENT_DONE
    ↓ (receiver confirms)
CONFIRMED ← SLOT RELEASED (activeReceiveCount --)

OR at any point:
    → TIMEOUT ← SLOT RELEASED
    → CANCELLED ← SLOT RELEASED
    → DISPUTED → FORCE_CONFIRMED ← SLOT RELEASED
```

**Active statuses** (hold slot): assigned, payment_requested, payment_done
**Terminal statuses** (release slot): confirmed, timeout, cancelled, force_confirmed

---

## WHY ELIGIBILITY FAILS (Common Scenarios)

### Scenario 1: "I have slots available but can't receive"
- `activeReceiveCount: 1 < limit: 3` ✓
- `upgradeRequired: true` ✗ → INELIGIBLE
- **Fix**: Pay upgrade amount

### Scenario 2: "Eligibility API says eligible but action fails"
- Frontend checked 1 hour ago
- Now `isBlocked: true` (deadline passed)
- Backend re-checks, INELIGIBLE
- **Fix**: Check current eligibility before action

### Scenario 3: "User says they can't receive"
1. Check `isActivated` (must be true)
2. Check `isBlocked` (must be false)
3. Check `isReceivingHeld` (must be false)
4. Check `upgradeRequired` (must be false)
5. Check `sponsorPaymentPending` (must be false)
6. Check `activeReceiveCount < levelLimit`
7. Check `helpVisibility !== false`

If any fails → that's the reason

---

## EXACT FIELD PATHS

**Root fields** (direct on user doc):
- `isActivated` (boolean)
- `isBlocked` (boolean)
- `isOnHold` (boolean)
- `isReceivingHeld` (boolean)
- `upgradeRequired` (boolean)
- `sponsorPaymentPending` (boolean)
- `activeReceiveCount` (number, defaults to 0)
- `helpReceived` (number, only for income blocking)
- `levelStatus` (string: "Star"/"Silver"/"Gold"/"Platinum"/"Diamond")
- `helpVisibility` (boolean, defaults to true)

**Nested field**:
- `kycDetails.paymentBlocked` (boolean, frontend UI gating only)

---

## FUNCTIONS INVOLVED

| Function | Location | Purpose | Authority |
|----------|----------|---------|-----------|
| `isReceiverEligibleStrict()` | backend/functions/index.js:107 | Check all 6 criteria | ✓ BACKEND TRUTH |
| `receiverIneligibilityReason()` | backend/functions/index.js:119 | Return reason code | ✓ BACKEND |
| `getReceiveEligibility()` | Cloud Function | API endpoint | ✓ BACKEND |
| `checkReceiveHelpEligibility()` | src/utils/eligibilityUtils.js:15 | Frontend UI gating | ✗ Frontend only |
| `requestPayment()` | Cloud Function | Re-validates receiver | ✓ BACKEND |

---

## DEBUGGING CHECKLIST

When user can't receive:

```
1. Call getReceiveEligibility Cloud Function
   → Get full flags and reasonCode

2. Check reasonCode values:
   - 'not_activated' → isActivated ≠ true
   - 'blocked' → isBlocked === true
   - 'receiving_held' → isReceivingHeld === true
   - 'upgrade_required' → upgradeRequired === true
   - 'sponsor_payment_pending' → sponsorPaymentPending === true
   - 'receive_limit_reached' → activeReceiveCount >= limit

3. Verify corresponding flag in user doc

4. Determine action:
   - income block? → require payment
   - on hold? → admin action
   - no slots? → wait for current help to complete
```

---

## CORRECT IMPLEMENTATION PATTERN

```javascript
// ✅ CORRECT: Always use backend
const checkEligibility = async (uid) => {
  const fn = httpsCallable(functions, 'getReceiveEligibility');
  const { data } = await fn({});
  return data.data; // { isEligible, reasonCode, flags, ... }
};

// ✅ CORRECT: Frontend uses result to gate UI
const showReceiveButton = (eligibilityData) => {
  return eligibilityData.isEligible;
};

// ❌ WRONG: Trust frontend check alone
const badCheck = (user) => {
  return !user.isBlocked; // Missing other checks!
};

// ❌ WRONG: Check once, assume same later
const checkOnce = async () => {
  const eligible = await checkEligibility(uid);
  // ... 30 minutes later ...
  await requestPayment(helpId); // May fail! Re-check needed
};
```

---

## REMEMBER

1. **Backend is source of truth** - Always trust backend checks
2. **Frontend gates UI** - Prevents invalid UX
3. **Re-validation happens** - Every action re-checks backend
4. **Income blocking is dynamic** - Depends on helpReceived hitting block points
5. **activeReceiveCount is crucial** - Prevents race conditions in slot allocation
6. **Level matters** - Different limits and block points per level
7. **All 6 checks must pass** - Any single failure = ineligible

**When in doubt: Call getReceiveEligibility and check reasonCode**
