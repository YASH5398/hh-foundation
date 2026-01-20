# Admin Setup Instructions

## Problem
The user with UID `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1` needs to be made an admin, but we're encountering service account credential issues.

## Solution Options

### Option 1: Use Self Admin Setup (Recommended)

1. **Open the self-admin-setup.html file** in your browser
2. **Log in** as the user who should become admin (UID: kFhXYjSCO1Pw0qlZc7eCoRJFvEq1)
3. **Click "Make Me Admin"** button
4. **Log out and log back in** to refresh the session

This will set the Firestore document role, which works with your current Firestore rules.

### Option 2: Manual Firestore Update

If you have access to the Firebase Console:

1. Go to **Firebase Console** → **Firestore Database**
2. Navigate to the **users** collection
3. Find the document with ID: `kFhXYjSCO1Pw0qlZc7eCoRJFvEq1`
4. **Edit the document** and add/update these fields:
   ```json
   {
     "role": "admin",
     "isAdmin": true,
     "adminGrantedAt": "2024-01-19T12:00:00Z",
     "updatedAt": "2024-01-19T12:00:00Z"
   }
   ```
5. **Save the changes**

### Option 3: Fix Service Account and Use Scripts

If you want to fix the service account issue:

1. **Go to Firebase Console** → **Project Settings** → **Service Accounts**
2. **Generate a new private key**
3. **Replace the service account key** in `functions/serviceAccountKey.json` and `backend/functions/serviceAccountKey.json`
4. **Run the script**:
   ```bash
   node dual-admin-setup.js
   ```

### Option 4: Deploy Bootstrap Function

If you can fix the Firebase CLI version issue:

1. **Upgrade Node.js** to version 20 or higher
2. **Deploy the bootstrap function**:
   ```bash
   cd functions
   firebase deploy --only functions:bootstrapFirstAdmin
   ```
3. **Call the function** using `call-bootstrap-function.js`

## Current System Status

### Authentication Systems
Your app uses **two different admin authentication systems**:

1. **Custom Claims** (for backend functions): `request.auth.token?.role === 'admin'`
2. **Firestore Document** (for Firestore rules): `get(/databases/$(database)/documents/users/$(uid)).data.role == 'admin'`

### What's Fixed
- ✅ **Firestore rules updated** to use custom claims instead of document role
- ✅ **Bootstrap function added** to both function directories
- ✅ **Self-admin setup page created** for manual setup

### What Still Needs to Be Done
- ⏳ **Set custom claims** for full backend function access
- ⏳ **Deploy updated Firestore rules** (requires Firebase CLI fix)
- ⏳ **Deploy bootstrap function** (requires Firebase CLI fix)

## Immediate Action Plan

1. **Use Option 1** (self-admin-setup.html) to set the Firestore document role
2. **Test admin access** in your app
3. **Fix the service account credentials** later for custom claims
4. **Deploy the updated functions** when Firebase CLI is fixed

## Files Created
- `self-admin-setup.html` - Interactive admin setup page
- `dual-admin-setup.js` - Script to set both claims and document role
- `call-bootstrap-function.js` - Script to call deployed bootstrap function
- `ADMIN_SETUP_INSTRUCTIONS.md` - This instruction file

## Security Notes
- The bootstrap function has a simple secret: `bootstrap-admin-2024`
- Remove the bootstrap function after first admin is created
- The self-admin setup only works for the specific target UID

## Next Steps After Admin Setup
1. **Log out and log in** as the admin user
2. **Test admin panel access**
3. **Use the admin panel** to grant admin rights to other users
4. **Remove temporary setup files** for security