# Firebase Admin Claims Setup

## Overview
This sets up Firebase Auth custom claims to make a user a real admin based on ID token claims, not Firestore role fields.

## Target User
**UID**: `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1`  
**Claim**: `{ role: "admin" }`

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install firebase-admin
```

### Step 2: Configure Firebase Admin SDK

#### Option A: Service Account Key (Recommended)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Update `set-admin-claims.js` with the path to your service account key

#### Option B: Default Credentials (if running on Google Cloud)
The scripts will use default credentials automatically.

### Step 3: Set Admin Claims
```bash
node set-admin-claims.js
```

### Step 4: Verify Claims
```bash
node verify-admin-claims.js
```

## How It Works

### 1. Custom Claims vs Firestore Role
- ❌ **Old way**: Check `users/{uid}.role` in Firestore
- ✅ **New way**: Check `request.auth.token.role` in ID token

### 2. Firestore Rules Integration
The existing Firestore rules already support this:
```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.role == 'admin';
}
```

### 3. Frontend Verification
After the user logs out and logs back in:
```javascript
const idTokenResult = await auth.currentUser.getIdTokenResult(true);
console.log("Is admin:", idTokenResult.claims.role === "admin");
```

## Important Notes

### ⚠️ User Must Re-authenticate
- Custom claims are included in ID tokens
- User MUST log out and log in again for claims to take effect
- Claims are NOT immediately available in current session

### ✅ Verification Steps
1. Run `set-admin-claims.js` ✅
2. User logs out and logs back in ✅
3. Check `idTokenResult.claims.role === "admin"` ✅
4. Firestore rules recognize admin status ✅

## Troubleshooting

### "User not found" Error
- Check the UID is correct: `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1`
- Verify user exists in Firebase Auth

### "Insufficient permission" Error
- Check Firebase Admin SDK initialization
- Verify service account key has proper permissions
- Ensure project ID is correct

### Claims Not Working on Frontend
- User must log out and log in again
- Use `getIdTokenResult(true)` to force token refresh
- Check browser console for auth errors

## Security Benefits

### 🔒 Token-Based Security
- Claims are cryptographically signed in ID tokens
- Cannot be tampered with by users
- Automatically verified by Firebase

### 🚫 No Database Dependency
- Admin status doesn't rely on Firestore queries
- Works even if Firestore is down
- Faster permission checks

### 🔄 Immediate Revocation
- Remove claims to instantly revoke admin access
- No need to update Firestore documents
- Centralized permission management

## Scripts Reference

### `set-admin-claims.js`
Sets `{ role: "admin" }` claim for the target UID.

### `verify-admin-claims.js`
Verifies claims are properly set and provides debugging info.

### `package-admin.json`
Dependencies for the admin scripts.

## Expected Result
After setup, the user with UID `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1` will have full admin access to:
- Admin dashboard
- E-PIN request management
- User management
- All admin-only Firestore operations

The admin status is now based on secure ID token claims! 🎉