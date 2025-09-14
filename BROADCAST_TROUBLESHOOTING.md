# Broadcast Popup Troubleshooting Guide

## 🚨 Issue: Broadcast popup is not showing on user dashboard

### 🔍 Step-by-Step Debugging

#### 1. **Check Browser Console**
Open browser developer tools (F12) and look for these debug logs:
```
🎯 BroadcastNotificationPopup useEffect triggered
👤 User: {uid: "...", ...}
🔍 Fetching broadcast message for user: [UID]
📢 Broadcast doc exists: true/false
📢 Broadcast data: {...}
🗑️ Dismissal data: {...}
👤 User doc exists: true/false
👤 User data: {...}
🎯 Final eligibility result: true/false
✅ User is eligible for broadcast message
📝 Setting notification with title: ...
📝 Setting notification with message: ...
✅ Popup should now be visible
🎨 BroadcastNotificationPopup render check:
✅ Popup is rendering!
```

#### 2. **Check Firestore Data**

**A. Broadcast Message Exists?**
- Go to Firebase Console > Firestore Database
- Look for collection: `broadcast`
- Check if document `latest` exists
- Document should have fields:
  ```json
  {
    "title": "Hi {firstName} 👋",
    "message": "Welcome to the dashboard!",
    "timestamp": [server timestamp],
    "targetLevels": [],
    "statusFilter": [],
    "manualUserIds": []
  }
  ```

**B. User Dismissal State?**
- Check collection: `popupDismissed`
- Look for document with user's UID
- If `latest: true` exists, user has dismissed the message

**C. User Profile Exists?**
- Check collection: `users`
- Look for document with user's UID
- Ensure user has required fields: `levelStatus`, `isActivated`, `firstName`

#### 3. **Quick Fixes**

**A. Create Test Broadcast Message**
```javascript
// Run in browser console on dashboard page
window.debugBroadcast.createTestBroadcast()
```

**B. Reset Dismissal State**
```javascript
// Run in browser console on dashboard page
window.debugBroadcast.resetDismissal()
```

**C. Manual Firestore Console**
1. Go to Firebase Console > Firestore Database
2. Create document: `broadcast/latest`
3. Add fields:
   - `title`: "Hi {firstName} 👋"
   - `message`: "Test broadcast message"
   - `timestamp`: [server timestamp]
   - `targetLevels`: [] (empty array)
   - `statusFilter`: [] (empty array)
   - `manualUserIds`: [] (empty array)

#### 4. **Common Issues & Solutions**

**Issue: "No broadcast message found"**
- Solution: Create broadcast message in Firestore

**Issue: "User has dismissed this message"**
- Solution: Reset dismissal state or create new broadcast

**Issue: "User profile not found"**
- Solution: Check if user document exists in `users` collection

**Issue: "User is not eligible"**
- Solution: Check filters in broadcast message or create message without filters

**Issue: "User is blocked"**
- Solution: Unblock user in admin panel

**Issue: "Popup not rendering"**
- Solution: Check if component is properly imported and rendered in DashboardHome.jsx

#### 5. **Admin Panel Testing**

1. Go to `/admin/notifications`
2. Create a broadcast message:
   - Title: "Hi {firstName} 👋"
   - Message: "Test message"
   - Leave all filters empty (no selections)
3. Click "Send Broadcast"
4. Go to user dashboard and refresh

#### 6. **Component Verification**

Ensure `BroadcastNotificationPopup` is rendered in `DashboardHome.jsx`:
```jsx
return (
  <div className="w-full p-0 m-0 bg-white">
    <BroadcastNotificationPopup /> {/* This should be here */}
    <div className="w-full">
      {/* rest of dashboard content */}
    </div>
  </div>
);
```

#### 7. **CSS/Display Issues**

If popup exists but is not visible:
- Check z-index (should be z-50)
- Check positioning (fixed top-20)
- Check if parent elements are hiding it
- Check browser console for CSS errors

#### 8. **Firebase Configuration**

Ensure Firebase is properly configured:
- Check `src/config/firebase.js`
- Verify Firestore rules allow read/write
- Check if user is authenticated

### 🎯 **Quick Test Sequence**

1. **Create test broadcast:**
   ```javascript
   window.debugBroadcast.createTestBroadcast()
   ```

2. **Reset dismissal:**
   ```javascript
   window.debugBroadcast.resetDismissal()
   ```

3. **Refresh page and check console logs**

4. **If still not working, run full debug:**
   ```javascript
   window.debugBroadcast.debugBroadcastPopup()
   ```

### 📞 **Still Not Working?**

If the popup still doesn't show after following all steps:

1. Check browser console for JavaScript errors
2. Verify user is logged in and on `/dashboard` route
3. Check if user profile has all required fields
4. Ensure no CSS is hiding the popup
5. Try in incognito/private browser mode
6. Check if ad blockers are interfering

### 🔧 **Manual Override (Emergency)**

If you need to force the popup to show for testing:

```javascript
// Run in browser console
localStorage.setItem('forceBroadcast', 'true');
location.reload();
```

Then add this to the component temporarily:
```javascript
if (localStorage.getItem('forceBroadcast') === 'true') {
  setIsVisible(true);
  setNotification({
    title: 'Test Message',
    message: 'Forced broadcast for testing'
  });
}
``` 