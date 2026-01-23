# Quick Reference: startHelpAssignment Fix

**Deployed**: ✅ January 23, 2026  
**Function**: `startHelpAssignment` (Cloud Function)  
**File**: `functions/index.js` (lines 397-706)

---

## What Was Fixed

**Problem**: Intermittent "NO_ELIGIBLE_RECEIVER" errors when eligible receivers existed.

**Root Causes**:
1. ❌ Type mismatches (string booleans `"true"` instead of `true`)
2. ❌ No fallback strategy when query returned 0
3. ❌ No re-validation in transaction (race condition risk)
4. ❌ No type normalization in JS post-processing

**Solution**: Type normalization + Fallback query + Re-validation + Better logging

---

## Key Changes

### 1. Type Normalization
```javascript
// Convert string "true"/"false" to boolean true/false
const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return !!value;
};

// Convert string "123" to number 123
const normalizeNumber = (value, defaultVal = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(value)) return Number(value);
  return defaultVal;
};
```

### 2. Fallback Strategy
```javascript
// If main query returns 0, try relaxed query
if (!chosenReceiverRef && !chosenReceiver) {
  const fallbackQuery = db
    .collection('users')
    .where('isActivated', '==', true)
    .where('isBlocked', '==', false)
    .limit(500);
  // ... apply same normalization filters
}
```

### 3. Transaction Re-validation
```javascript
// Before assignment, re-fetch receiver and verify still eligible
const freshReceiverSnap = await tx.get(chosenReceiverRef);
if (normalizeBoolean(freshReceiver?.isBlocked) === true) {
  throw new HttpsError('failed-precondition', 'Receiver became ineligible');
}
chosenReceiver = freshReceiver;
```

---

## Testing

### Quick Test
```bash
# 1. Create test receiver with correct types
firestore set users/test-receiver \
  --merge --data '{
    "helpVisibility": true,
    "isActivated": true,
    "isBlocked": false,
    "isReceivingHeld": false,
    "referralCount": 10
  }'

# 2. Call function
curl -X POST https://us-central1-hh-foundation.cloudfunctions.net/startHelpAssignment \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "senderUid": "test-sender",
    "senderId": "TEST_SENDER",
    "idempotencyKey": "test-key-1"
  }'

# 3. Check logs
firebase functions:log --region us-central1 | grep startHelpAssignment
```

### Verify Logs Show
- ✓ `receiver.query.result { usersFetched: X }`
- ✓ `receiver.filtering { afterNormalization: Y }`
- ✓ `receiver.selected { selectedUid: ... }`
- ✓ No `fallback.trigger` (unless users have type issues)

---

## Deployment Status

```
✅ functions[startHelpAssignment(us-central1)] Successful update operation
```

---

## Important Notes

### What Changed
- ✓ Type normalization in JS post-processing
- ✓ Fallback query logic
- ✓ Re-validation before assignment
- ✓ Enhanced logging

### What Did NOT Change
- ✓ MLM business flow (unchanged)
- ✓ Response shape (unchanged)
- ✓ Firestore schema (no schema changes)
- ✓ Security rules (no rule changes)
- ✓ API endpoints (unchanged)

### Backward Compatible
- ✓ Works with boolean `true`/`false`
- ✓ Works with string `"true"`/`"false"`
- ✓ Works with numeric types and string numbers
- ✓ No breaking changes to clients

---

## Monitoring

### Expected Logs
```
[startHelpAssignment] receiver.query.spec
[startHelpAssignment] receiver.query.result { usersFetched: 5, isEmpty: false }
[startHelpAssignment] receiver.filtering { afterQuery: 5, afterNormalization: 5 }
[startHelpAssignment] receiver.selected { selectedUid: ... }
[startHelpAssignment] revalidate.receiver { receiverUid: ..., step: 'before_assignment' }
[startHelpAssignment] final.receiver.selected { ... }
[startHelpAssignment] docs.created { ... }
[startHelpAssignment] success { ... }
```

### Alert on
- `[startHelpAssignment] fallback.trigger` - Normal if users have type issues, monitor frequency
- `[startHelpAssignment] Receiver became ineligible` - Race condition, low frequency expected
- `[startHelpAssignment] no_eligible_receiver` - Check if users need help eligibility enabled

---

## Migration (Optional)

To fix existing string booleans in Firestore:

```javascript
const users = await db.collection('users').limit(1000).get();
const batch = db.batch();

users.forEach(doc => {
  const u = doc.data();
  const fixes = {};
  
  ['helpVisibility', 'isActivated', 'isBlocked', 'isReceivingHeld'].forEach(field => {
    if (typeof u[field] === 'string') {
      fixes[field] = u[field].toLowerCase() === 'true';
    }
  });
  
  if (Object.keys(fixes).length > 0) {
    batch.update(doc.ref, fixes);
  }
});

await batch.commit();
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `INVESTIGATION_FIX_REPORT_STARTHELPASSIGNMENT.md` | Full investigation findings & root causes |
| `CODE_DIFF_STARTHELPASSIGNMENT_FIX.md` | Detailed code diff & changes |
| `QUICK_REFERENCE.txt` | This file - quick reference |

---

## Contact / Support

If issues persist:
1. Check logs in Firebase Console: Cloud Functions → `startHelpAssignment`
2. Look for `[startHelpAssignment]` log entries with timestamps
3. Verify at least one user exists with:
   - `helpVisibility: true` (boolean, not string)
   - `isActivated: true` (boolean, not string)
   - `isBlocked: false` (boolean, not string)
   - `isReceivingHeld: false` (boolean, not string)

---

**Last Updated**: January 23, 2026  
**Status**: ✅ PRODUCTION DEPLOYED
