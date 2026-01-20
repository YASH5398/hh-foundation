# Deploy Firestore Rules Fix

## Quick Deployment

Run this command to deploy the updated Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Verification Steps

### 1. Check Rule Deployment
After deployment, verify in Firebase Console:
- Go to Firestore Database → Rules
- Confirm the `systemConfig` rule is present:
```javascript
match /systemConfig/{docId} {
  allow read: if isAuthenticated();
  allow write, create, update, delete: if isAdmin();
}
```

### 2. Test QR Image Display
1. Open your app and navigate to E-PIN request page
2. Ensure you're logged in as a regular user (not admin)
3. Check that the QR code displays correctly
4. Check browser console for any permission errors

### 3. Create System Configuration (if needed)
If the QR image still doesn't show, create the system configuration:

```bash
node setup-system-config.js
```

Then update the `upiQrImageUrl` field in Firestore with your actual Firebase Storage URL.

### 4. Test Permissions (optional)
Run the permission test script:

```bash
node test-firestore-permissions.js
```

## Expected Results

✅ **Before Fix**: "Missing or insufficient permissions" error
✅ **After Fix**: QR image displays correctly for authenticated users

## Troubleshooting

### QR Image Still Not Showing
1. Check browser console for errors
2. Verify user is authenticated
3. Confirm `systemConfig/upiSettings` document exists
4. Ensure `upiQrImageUrl` field has a valid Firebase Storage URL

### Permission Denied Error
1. Verify Firestore rules deployed successfully
2. Check user authentication status
3. Confirm rule syntax is correct in Firebase Console

### Document Not Found
1. Run `setup-system-config.js` to create the document
2. Upload QR image to Firebase Storage
3. Update `upiQrImageUrl` field with the download URL

## Security Verification

The fix maintains security by:
- ✅ Only authenticated users can read system config
- ✅ Only admins can modify system config  
- ✅ No sensitive data exposed
- ✅ Follows principle of least privilege

Deploy with confidence! 🚀