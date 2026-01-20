# Manual Firestore Setup for Broadcast System

## 🔧 **Step-by-Step Manual Setup**

### **Step 1: Access Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hh-foundation`
3. Click on "Firestore Database" in the left sidebar

### **Step 2: Create Broadcast Document**
1. Click on "Start collection" (if no collections exist) or click the "+" next to existing collections
2. **Collection ID**: `broadcast`
3. Click "Next"

### **Step 3: Create Document**
1. **Document ID**: `latest`
2. Click "Next"

### **Step 4: Add Fields**
Add these fields one by one:

| Field Name | Type | Value |
|------------|------|-------|
| `title` | string | `Hi {firstName} 👋` |
| `message` | string | `Welcome to the Helping Hands Foundation dashboard! This is a test broadcast message.` |
| `timestamp` | timestamp | Click "timestamp" and select current time |
| `targetLevels` | array | Leave empty (no items) |
| `statusFilter` | array | Leave empty (no items) |
| `manualUserIds` | array | Leave empty (no items) |
| `createdAt` | timestamp | Click "timestamp" and select current time |
| `isActive` | boolean | `true` |

### **Step 5: Save Document**
1. Click "Save"
2. You should see the document created in the `broadcast` collection

### **Step 6: Verify Document**
The document should look like this:
```json
{
  "title": "Hi {firstName} 👋",
  "message": "Welcome to the Helping Hands Foundation dashboard! This is a test broadcast message.",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "targetLevels": [],
  "statusFilter": [],
  "manualUserIds": [],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "isActive": true
}
```

## 🧪 **Testing the Setup**

### **Option 1: Browser Console Script**
1. Go to your dashboard page (`/dashboard`)
2. Open browser console (F12)
3. Copy and paste the content of `setup-broadcast-document.js`
4. Press Enter to run the script

### **Option 2: Admin Panel**
1. Go to `/admin/notifications`
2. Open browser console (F12)
3. Copy and paste the content of `admin-create-broadcast.js`
4. Press Enter to run the script

### **Option 3: Manual Testing**
1. After creating the document in Firebase Console
2. Go to your dashboard page
3. Refresh the page
4. Look for the broadcast popup

## 🔍 **Troubleshooting**

### **If popup doesn't appear:**
1. **Check browser console** for debug logs
2. **Verify document exists** in Firebase Console
3. **Check user profile** exists in `users` collection
4. **Clear dismissal state** if user previously dismissed

### **To clear dismissal state:**
1. In Firebase Console, go to `popupDismissed` collection
2. Find document with user's UID
3. Delete the document or set `latest: false`

### **To check user eligibility:**
1. In Firebase Console, go to `users` collection
2. Find document with user's UID
3. Verify these fields exist:
   - `levelStatus` (any value)
   - `isActivated` (true/false)
   - `isBlocked` (should be false)
   - `firstName` or `fullName`

## 📋 **Required Firestore Structure**

### **Collection: `broadcast`**
- **Document ID**: `latest`
- **Fields**:
  - `title` (string)
  - `message` (string)
  - `timestamp` (timestamp)
  - `targetLevels` (array)
  - `statusFilter` (array)
  - `manualUserIds` (array)
  - `createdAt` (timestamp)
  - `isActive` (boolean)

### **Collection: `popupDismissed`**
- **Document ID**: `{user_uid}`
- **Fields**:
  - `latest` (boolean)

### **Collection: `users`**
- **Document ID**: `{user_uid}`
- **Required Fields**:
  - `levelStatus` (string)
  - `isActivated` (boolean)
  - `isBlocked` (boolean)
  - `firstName` (string) or `fullName` (string)

## ✅ **Success Indicators**

When the system is working correctly, you should see:
1. ✅ Broadcast document exists in Firestore
2. ✅ User profile exists with required fields
3. ✅ No dismissal state (or `latest: false`)
4. ✅ Popup appears on dashboard page
5. ✅ Console logs show eligibility checks passing 