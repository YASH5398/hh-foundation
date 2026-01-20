# Firebase Auth Custom Claims Solution

## Target
- **UID:** `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1`
- **Goal:** Set custom claim `{ role: "admin" }` for admin panel access
- **Requirement:** Use Auth token claims ONLY, not Firestore documents

## Problem
Service account credentials are invalid/revoked, preventing direct Admin SDK usage.

## Solutions (In Order of Preference)

### Solution 1: Fix Service Account & Use Script ⭐ RECOMMENDED

1. **Generate New Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/project/hh-foundation/settings/serviceaccounts/adminsdk)
   - Click "Generate new private key"
   - Download the JSON file
   - Replace `functions/serviceAccountKey.json` with the new key

2. **Run the Custom Claims Script:**
   ```bash
   node set-custom-claims.js
   ```

### Solution 2: Deploy HTTP Function & Call It

1. **Fix Firebase CLI Version:**
   - Upgrade Node.js to version 20+
   - Run: `firebase deploy --only functions:simpleBootstrapAdmin`

2. **Call the Function:**
   - Open `browser-bootstrap.html` in browser
   - Click "Bootstrap Admin" button
   - OR use: `node call-http-bootstrap.js`

### Solution 3: Use Firebase Console (Manual)

1. **Go to Firebase Console:**
   - Navigate to Authentication → Users
   - Find user with UID: `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1`
   - Click on the user

2. **Set Custom Claims:**
   - Look for "Custom claims" section
   - Add: `{"role": "admin"}`
   - Save changes

### Solution 4: Use Existing Admin (If Available)

If you have another admin user:

1. **Log in as existing admin**
2. **Call the deployed function:**
   ```javascript
   import { getFunctions, httpsCallable } from 'firebase/functions';
   
   const functions = getFunctions();
   const setAdminRole = httpsCallable(functions, 'setAdminRole');
   
   const result = await setAdminRole({
     uid: 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1'
   });
   ```

## Files Created

### Scripts
- `set-custom-claims.js` - Direct Admin SDK approach
- `call-http-bootstrap.js` - Call HTTP function
- `browser-bootstrap.html` - Browser-based bootstrap

### Functions Added
- `bootstrapFirstAdmin` - Callable function (in functions/index.js)
- `simpleBootstrapAdmin` - HTTP function (in functions/index.js)

## Verification Steps

After setting custom claims:

1. **User must log out completely**
2. **User must log back in**
3. **Verify claims in browser console:**
   ```javascript
   const idTokenResult = await auth.currentUser.getIdTokenResult(true);
   console.log("Admin role:", idTokenResult.claims.role === "admin");
   console.log("All claims:", idTokenResult.claims);
   ```

## Security Notes

- Bootstrap functions use secret: `bootstrap-admin-2024`
- Remove bootstrap functions after first admin is created
- Custom claims are more secure than Firestore document roles
- Claims are cryptographically signed and cannot be tampered with

## Next Steps

1. **Try Solution 1** (fix service account) - most reliable
2. **If that fails, try Solution 3** (Firebase Console) - easiest
3. **Deploy functions when CLI is fixed** for future admin management
4. **Test admin panel access** after setting claims
5. **Remove bootstrap functions** for security

## Important Notes

- Custom claims take effect ONLY after logout/login
- Claims are included in the ID token, not access token
- Use `getIdTokenResult(true)` to force refresh
- Admin panel should check `request.auth.token?.role === 'admin'`