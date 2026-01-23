# Firestore Permission Fix for E-PIN QR Image Display

## Issue Identified
The E-PIN QR image was not displaying because authenticated users couldn't read the `systemConfig/upiSettings` document from Firestore due to missing security rules.

## Root Cause
- PaymentPage.jsx and EpinRequestForm.jsx try to read `systemConfig/upiSettings` document
- Firestore security rules had no specific rule for `systemConfig` collection
- Requests were falling back to admin-only rule: `allow read, write: if isAdmin()`
- Regular authenticated users got "Missing or insufficient permissions" error

## Solution Applied

### 1. Updated Firestore Security Rules
Added specific rule for `systemConfig` collection in `firestore.rules`:

```javascript
// System configuration (UPI settings, QR images, etc.) - read access for authenticated users
match /systemConfig/{docId} {
  allow read: if isAuthenticated();
  allow write, create, update, delete: if isAdmin();
}
```

### 2. Permission Structure
- **READ**: Any authenticated user (`request.auth != null`)
- **WRITE**: Admin only (`request.auth.token.role == 'admin'`)
- **Document**: `systemConfig/upiSettings`
- **Field**: `upiQrImageUrl` (contains Firebase Storage download URL)

### 3. Document Structure
The `systemConfig/upiSettings` document should contain:
```javascript
{
  upiId: "helpingpin@axl",
  upiQrImageUrl: "https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/qr.png?alt=media&token=...",
  description: "System UPI configuration for E-PIN payments",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Components Fixed
- **PaymentPage.jsx**: Can now read QR image URL from Firestore
- **EpinRequestForm.jsx**: Can now read QR image URL from Firestore

## How It Works Now
1. User opens E-PIN form (authenticated)
2. Component calls `getDoc(doc(db, 'systemConfig', 'upiSettings'))`
3. Firestore rule allows read access for authenticated users
4. Component gets `upiQrImageUrl` field value
5. QR image displays: `<img src={upiQrImageUrl} />`

## Testing
Use `test-firestore-permissions.js` to verify:
1. Unauthenticated access is blocked ✅
2. Authenticated users can read systemConfig ✅
3. upiQrImageUrl field exists and has value ✅

## Deployment Steps
1. Deploy updated Firestore rules: `firebase deploy --only firestore:rules`
2. Ensure systemConfig/upiSettings document exists (run setup-system-config.js if needed)
3. Verify QR image URL is a valid Firebase Storage download URL
4. Test E-PIN forms to confirm QR images display correctly

## Security Notes
- Only authenticated users can read system configuration
- Only admins can modify system configuration
- No sensitive data exposed (just UPI ID and QR image URL)
- Follows principle of least privilege

The fix ensures QR images display correctly while maintaining proper security boundaries.
