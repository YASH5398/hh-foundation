# Quick Reference: 8 Required Logging Fields

**The 8 fields that must be logged for EVERY receiver in startHelpAssignment:**

```javascript
userId              // User's ID in database
levelStatus         // MLM level (Star, Gold, etc.)
isActivated         // Account activation status
isBlocked           // User blocked status
isOnHold            // User on hold status
isReceivingHeld     // Receiving privileges held status
helpVisibility      // Help visibility toggle
helpReceived        // Number of helps received (includes 0 for first-time)
```

## Where These Fields are Logged

### 1. All Receivers Before Filtering
**Log**: `[startHelpAssignment] all.receivers.before.filtering`
```javascript
console.log('[startHelpAssignment] all.receivers.before.filtering', {
  totalCount: receiverSnap.size,
  receivers: receiverSnap.docs.map(docSnap => {
    const candidate = docSnap.data() || {};
    return {
      userId: candidate?.userId || null,           // ✓
      uid: docSnap.id,
      levelStatus: candidate?.levelStatus || ...,  // ✓
      isActivated: candidate?.isActivated === true, // ✓
      isBlocked: candidate?.isBlocked === true,     // ✓
      isOnHold: candidate?.isOnHold === true,       // ✓
      isReceivingHeld: candidate?.isReceivingHeld === true, // ✓
      helpVisibility: candidate?.helpVisibility === true,   // ✓
      helpReceived: candidate?.helpReceived || 0,  // ✓
      // ... additional fields
    };
  })
});
```

### 2. Evaluating Candidate
**Log**: `[startHelpAssignment] evaluating.candidate`
```javascript
console.log('[startHelpAssignment] evaluating.candidate', {
  uid: candidateUid,
  userId: candidate?.userId || null,              // ✓
  levelStatus: candidate?.levelStatus || ...,     // ✓
  isActivated: candidate?.isActivated,            // ✓
  isBlocked: candidate?.isBlocked,                // ✓
  isOnHold: candidate?.isOnHold,                  // ✓
  isReceivingHeld: candidate?.isReceivingHeld,    // ✓
  helpVisibility: candidate?.helpVisibility,      // ✓
  helpReceived: candidate?.helpReceived || 0,     // ✓
  // ... additional fields
});
```

### 3. Receiver Selected
**Log**: `[startHelpAssignment] receiver.selected`
```javascript
console.log('[startHelpAssignment] receiver.selected', {
  uid: candidateUid,
  userId: candidate?.userId || null,              // ✓
  helpReceived: candidate?.helpReceived || 0,     // ✓
  level: currentLevel,
  activeReceiveCount: currentReceiveCount,
  receiveLimit: receiveLimit,
  reason: 'ELIGIBLE: All checks passed',
  levelStatus: candidate?.levelStatus || ...,     // ✓
  isActivated: candidate?.isActivated,            // ✓
  isBlocked: candidate?.isBlocked,                // ✓
  isOnHold: candidate?.isOnHold,                  // ✓
  isReceivingHeld: candidate?.isReceivingHeld,    // ✓
  helpVisibility: candidate?.helpVisibility       // ✓
});
```

## Exclusion Reasons Added

Each receiver is excluded with explicit reason:

| Exclusion Reason | Condition | Field |
|---|---|---|
| `EXCLUDED: Same user as sender` | `candidateUid === senderUid` | uid |
| `EXCLUDED: Not activated` | `isActivated !== true` | isActivated |
| `EXCLUDED: User is blocked` | `isBlocked === true` | isBlocked |
| `EXCLUDED: User is on hold` | `isOnHold === true` | isOnHold |
| `EXCLUDED: Receiving privileges held` | `isReceivingHeld === true` | isReceivingHeld |
| `EXCLUDED: Help visibility disabled` | `helpVisibility === false` | helpVisibility |
| `EXCLUDED: Upgrade required` | `upgradeRequired === true` | upgradeRequired |
| `EXCLUDED: Sponsor payment pending` | `sponsorPaymentPending === true` | sponsorPaymentPending |
| `EXCLUDED: Receive limit reached` | `activeReceiveCount >= limit` | activeReceiveCount |

## Logging Pattern

Every log entry follows this pattern:

```javascript
console.log('[startHelpAssignment] <operation>', {
  uid: candidateUid,
  userId: candidate?.userId || null,
  <reason or status>,
  <relevant fields>
});
```

## Critical Points

✅ All 8 fields logged BEFORE filtering in `all.receivers.before.filtering`  
✅ All 8 fields logged for each candidate in `evaluating.candidate`  
✅ All 8 fields logged when candidate selected in `receiver.selected`  
✅ Explicit exclusion reason logged for each excluded receiver  
✅ NO_ELIGIBLE_RECEIVER returned AFTER logging all rejections  
✅ First-time receivers (helpReceived = 0) properly logged and allowed
