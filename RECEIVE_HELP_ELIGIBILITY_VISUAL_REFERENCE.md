# RECEIVE HELP ELIGIBILITY - VISUAL REFERENCE CARD

## THE SIX CRITERIA (ALL MUST BE TRUE)

```
┌─────────────────────────────────────────────────────────┐
│     RECEIVE HELP ELIGIBILITY CRITERIA                   │
│     (Backend: isReceiverEligibleStrict)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. isActivated      ✓  Must be TRUE                    │
│     └─ Account completed activation                     │
│                                                          │
│  2. isBlocked        ✓  Must be FALSE                   │
│     └─ No payment deadline violations                   │
│                                                          │
│  3. isReceivingHeld  ✓  Must be FALSE                   │
│     └─ Receiving privileges not held                    │
│                                                          │
│  4. upgradeRequired  ✓  Must be FALSE                   │
│     └─ Not at upgrade income block point                │
│                                                          │
│  5. sponsorPaymentPending  ✓  Must be FALSE             │
│     └─ Not at sponsor payment income block point        │
│                                                          │
│  6. activeReceiveCount < levelLimit  ✓                  │
│     └─ Has available concurrent help slots              │
│                                                          │
│  IF ANY FAILS → USER IS INELIGIBLE                      │
└─────────────────────────────────────────────────────────┘
```

---

## BLOCKING CONDITIONS AT A GLANCE

```
┌──────────────────────────┬──────────────┬────────────────┐
│ Condition                │ Value        │ Recovery Path  │
├──────────────────────────┼──────────────┼────────────────┤
│ isActivated ≠ true       │ false/null   │ Complete init  │
│ isBlocked = true         │ true         │ Payment sys    │
│ isOnHold = true          │ true         │ Admin lift     │
│ isReceivingHeld = true   │ true         │ Admin lift     │
│ upgradeRequired = true   │ true         │ Pay upgrade    │
│ sponsorPaymentPending    │ true         │ Pay sponsor    │
│ activeReceiveCount >=    │ >= limit     │ Wait for done  │
│ levelLimit               │              │                │
└──────────────────────────┴──────────────┴────────────────┘
```

---

## LEVEL LIMITS & INCOME BLOCKS

```
STAR (Level 1)
├─ Concurrent helps allowed: 3
├─ Income block at: 3 helps received
└─ Unblock cost: ₹600 (upgradeRequired → Silver)

SILVER (Level 2)
├─ Concurrent helps allowed: 9
├─ Income blocks at: 4 helps (upgrade), 7 helps (sponsor)
├─ Block 1 cost: ₹1,800 (upgrade to Gold)
└─ Block 2 cost: ₹1,200 (sponsor payment)

GOLD (Level 3)
├─ Concurrent helps allowed: 27
├─ Income blocks at: 11 helps (upgrade), 25 helps (sponsor)
├─ Block 1 cost: ₹20,000 (upgrade to Platinum)
└─ Block 2 cost: ₹4,000 (sponsor payment)

PLATINUM (Level 4)
├─ Concurrent helps allowed: 81
├─ Income blocks at: 11 helps (upgrade), 80 helps (sponsor)
├─ Block 1 cost: ₹200,000 (upgrade to Diamond)
└─ Block 2 cost: ₹40,000 (sponsor payment)

DIAMOND (Level 5)
├─ Concurrent helps allowed: 243
├─ Income block at: 242 helps (sponsor)
└─ Block 1 cost: ₹600,000 (sponsor payment)
```

---

## HELP STATUS FLOW

```
┌──────────┐
│ ASSIGNED │  ← Help slot taken (activeReceiveCount++)
└────┬─────┘
     │ receiver requests payment
     ↓
┌────────────────┐
│ PAYMENT_REQUESTED │  ← Waiting for sender to pay
└────┬────────────┘
     │ sender submits payment
     ↓
┌──────────────┐
│ PAYMENT_DONE │  ← Receiver confirms payment received
└────┬─────────┘
     │ receiver confirms
     ↓
┌───────────┐
│ CONFIRMED │  ← Complete (activeReceiveCount--)
└───────────┘

OR AT ANY POINT:
    │ timeout/cancel
    ↓
┌───────────┐
│ TIMEOUT   │  ← Help expired (activeReceiveCount--)
│ CANCELLED │
└───────────┘
```

---

## FIELD STORAGE LOCATIONS

```
Firestore Collection: users/{uid}

ROOT LEVEL FIELDS:
├─ isActivated (boolean)
├─ isBlocked (boolean)
├─ isOnHold (boolean)
├─ isReceivingHeld (boolean)
├─ upgradeRequired (boolean)
├─ sponsorPaymentPending (boolean)
├─ activeReceiveCount (number)
├─ helpReceived (number)
├─ levelStatus (string)
├─ helpVisibility (boolean)
└─ kycDetails (object)
   └─ paymentBlocked (boolean)
```

---

## ELIGIBILITY CHECK FLOW

```
User wants to receive help
       ↓
Call getReceiveEligibility()
   Cloud Function
       ↓
Backend fetches user data
       ↓
Run isReceiverEligibleStrict()
       ├─ Check 6 criteria
       └─ Return true/false
       ↓
Return reason code if failed
       ↓
Frontend shows UI
├─ "Eligible" (if true)
└─ Error message (if false)
```

---

## BEFORE ANY ACTION: RE-CHECK!

```
User clicks "Request Payment"
       ↓
Call getReceiveEligibility()
   AGAIN! (Data may have changed)
       ↓
Check fresh isEligible flag
       ├─ If false:
       │  └─ Show error, don't proceed
       └─ If true:
          └─ Proceed with action
```

---

## WHAT BLOCKS A USER - DECISION TREE

```
User says "Can't receive"
       ↓
Call getReceiveEligibility()
       ↓
Check reasonCode:
       ├─ 'not_activated' → Account not activated
       │
       ├─ 'blocked' → Payment deadline violated
       │
       ├─ 'receiving_held' → Admin placed hold
       │
       ├─ 'upgrade_required' → Hit upgrade block point
       │
       ├─ 'sponsor_payment_pending' → Hit sponsor block point
       │
       └─ 'receive_limit_reached' → All slots filled
```

---

## COMMON MISTAKES (DON'T DO THIS!)

```
❌ WRONG                    ✅ CORRECT
├─ Check once, trust       ├─ Check before each
│  forever                 │  critical action
│
├─ Use frontend check      ├─ Always use backend
│  alone                   │  for decisions
│
├─ Only check slots        ├─ Check all 6
│  (activeReceiveCount)    │  criteria
│
├─ confuse helpReceived    ├─ Know difference:
│  with activeReceiveCount │  - helpReceived: lifetime
│                          │  - activeReceiveCount: current
│
├─ helpVisibility null =   ├─ Only false blocks
│  blocked                 │  (null/true OK)
│
└─ Frontend validation is  └─ Backend is
  sufficient               source of truth
```

---

## DAILY REFERENCE

```
Is user eligible to receive help?

Run this check:

1. isActivated?           → Check user doc
2. isBlocked?             → Check user doc
3. isReceivingHeld?       → Check user doc
4. upgradeRequired?       → Check user doc
5. sponsorPaymentPending? → Check user doc
6. activeReceiveCount < limit?
   → Count user's active helps vs level limit

If ALL are correct → ELIGIBLE
If ANY are wrong → INELIGIBLE

Quick shortcut: Call getReceiveEligibility() Cloud Function
→ Returns all flags + reasonCode
```

---

## CRITICAL CODE LOCATIONS

```
Backend Eligibility (Source of Truth):
├─ backend/functions/index.js:107
│  └─ isReceiverEligibleStrict(userData)
│
├─ backend/functions/index.js:119
│  └─ receiverIneligibilityReason(userData)
│
├─ backend/functions/index.js:203
│  └─ getReceiveEligibility (Cloud Function API)
│
├─ backend/functions/index.js:400-450
│  └─ startHelpAssignment (receiver selection)
│
├─ backend/functions/index.js:748
│  └─ requestPayment (re-validation)
│
├─ backend/functions/index.js:612
│  └─ activeReceiveCount++ (increment)
│
└─ backend/functions/index.js:192
   └─ activeReceiveCount-- (decrement)

Frontend UI Gating (Incomplete):
└─ src/utils/eligibilityUtils.js:15
   └─ checkReceiveHelpEligibility(userDoc)
```

---

## SLOT MANAGEMENT

```
BEFORE Help Assigned:
  activeReceiveCount: 1
  Slots available: 3 - 1 = 2

WHEN Help Assigned:
  activeReceiveCount: 1 + 1 = 2
  Slots available: 3 - 2 = 1

WHEN Help Completes:
  activeReceiveCount: 2 - 1 = 1
  Slots available: 3 - 1 = 2

Note: activeReceiveCount is ATOMIC
      (wrapped in transaction to prevent race)
```

---

## INCOME BLOCKING TIMELINE

```
Star User Journey:
├─ Receives 1st help
│  ├─ activeReceiveCount: 1
│  ├─ helpReceived: 1
│  └─ isEligible: YES
│
├─ Receives 2nd help
│  ├─ activeReceiveCount: 2
│  ├─ helpReceived: 2
│  └─ isEligible: YES
│
├─ Receives 3rd help
│  ├─ activeReceiveCount: 3
│  ├─ helpReceived: 3 ← HIT BLOCK POINT!
│  ├─ upgradeRequired: true ← SET BY SYSTEM
│  └─ isEligible: NO
│
└─ Pays ₹600 upgrade
   ├─ upgradeRequired: false ← CLEARED
   ├─ levelStatus: Silver ← UPDATED
   └─ isEligible: YES (can receive more)
```

---

## AUTHORIZATION LAYER

```
Who decides eligibility?

BACKEND (AUTHORITATIVE):
├─ isReceiverEligibleStrict() ← CANNOT BE BYPASSED
├─ Checks at every action
├─ Source of truth
└─ Server-side enforcement

FRONTEND (UI GATING):
├─ checkReceiveHelpEligibility() ← CAN BE BYPASSED
├─ Shows UI status
├─ Incomplete (missing checks)
└─ User convenience only

RULE: Never trust frontend alone
      Always verify backend first
```

---

## VERIFICATION CHECKLIST

```
✓ Is user eligible?

Required Conditions:
  □ isActivated = true
  □ isBlocked = false
  □ isOnHold = false
  □ isReceivingHeld = false
  □ upgradeRequired = false
  □ sponsorPaymentPending = false
  □ activeReceiveCount < levelLimit
  □ levelStatus is valid string

Defaults/Optional:
  □ helpVisibility ≠ false (defaults true)
  □ kycDetails.paymentBlocked ≠ true (defaults false)

IF ALL CHECKED → USER IS ELIGIBLE
IF ANY FAILS → USER IS INELIGIBLE
```

---

## ONE-MINUTE SUMMARY

**Receive Help Eligibility = 6 Checks (ALL must pass)**

1. ✓ Activated
2. ✓ Not blocked
3. ✓ Receiving not held
4. ✓ No upgrade required
5. ✓ No sponsor payment pending
6. ✓ Have available slots

**Authority**: Backend isReceiverEligibleStrict()
**Re-check**: Before every action
**Common mistake**: Forgetting income blocks override slot availability
**Quick API**: Call getReceiveEligibility() Cloud Function

**Bottom line**: If all 6 are TRUE → ELIGIBLE | If any FALSE → INELIGIBLE
