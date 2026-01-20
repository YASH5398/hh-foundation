# HH Foundation Push Notifications Setup Guide

This guide will help you set up the complete push notification system for your MLM React + Firebase project.

## 🚀 Quick Start

### 1. Firebase Console Setup

#### A. Enable Firebase Cloud Messaging
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **Cloud Messaging**
4. Generate a **Web Push Certificate** (VAPID key)
5. Copy the **Key pair** value

#### B. Download Service Account Key
1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Rename it to `serviceAccountKey.json`
5. Place it in the `backend/` directory

### 2. Frontend Configuration

#### A. Update VAPID Key
Replace the VAPID key in `src/services/fcmService.js`:
```javascript
const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_FROM_FIREBASE_CONSOLE';
```

#### B. Update Firebase Config
Ensure your `src/config/firebase.js` has the correct project configuration:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Backend Setup

#### A. Install Dependencies
```bash
cd backend
npm install
```

#### B. Update Service Account
Replace the placeholder `backend/serviceAccountKey.json` with your actual Firebase service account key.

#### C. Update Database URL
In `backend/index.js` and `backend/notifications.js`, update the database URL:
```javascript
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com'
});
```

#### D. Start Backend Server
```bash
npm start
# or for development
npm run dev
```

### 4. Cloud Functions Setup

#### A. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### B. Login and Initialize
```bash
firebase login
firebase init functions
```

#### C. Deploy Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### 5. Frontend Dependencies

Ensure these packages are installed in your React app:
```bash
npm install react-hot-toast framer-motion
```

## 📱 Features Implemented

### ✅ Frontend Features
- **Permission Popup**: Automatic popup for notification permissions
- **Token Management**: FCM token generation and storage
- **Real-time Notifications**: In-app toast notifications
- **Background Notifications**: Service worker for background notifications
- **User Filtering**: System/admin users excluded from popups

### ✅ Backend Features
- **Express Server**: RESTful API for sending notifications
- **Firebase Admin SDK**: Server-side FCM integration
- **Token Storage**: Dedicated `fcmTokens` collection
- **Bulk Notifications**: Send to multiple users
- **Error Handling**: Invalid token cleanup

### ✅ Cloud Functions
- **Real-time Triggers**: Firestore document change listeners
- **Scheduled Jobs**: Cron jobs for delayed notifications
- **Event Handlers**: All MLM events covered
- **Auto-cleanup**: Invalid token removal

### ✅ MLM Events Covered
1. **Sender/Receiver Found**: Match notifications
2. **Referral Joined**: New user via referral link
3. **Payment Alerts**: Top 50, 20, 10, 5 notifications
4. **Leaderboard**: Top 10 achievements
5. **E-PIN Requests**: Approved, rejected, canceled
6. **Support Tickets**: Created, agent assigned, resolved
7. **Free E-PIN**: Testimonial approved, rewards
8. **Level Complete**: 3 payments received milestone
9. **Payment Delays**: Every 3 hours reminder

## 🔧 Configuration Files

### Frontend Files Created/Modified
- `src/components/notifications/NotificationPermissionPopup.jsx` - Permission popup component
- `src/services/fcmService.js` - Enhanced FCM service
- `src/index.js` - Added popup to app root
- `public/firebase-messaging-sw.js` - Service worker (existing)

### Backend Files Created
- `backend/index.js` - Express server with FCM endpoints
- `backend/notifications.js` - MLM-specific notification functions
- `backend/package.json` - Backend dependencies
- `backend/serviceAccountKey.json` - Firebase service account (placeholder)

### Cloud Functions Enhanced
- `functions/index.js` - Enhanced with FCM token management

## 🗄️ Database Structure

### Collections Created/Used

#### `fcmTokens` Collection
```javascript
{
  userId: "user123",
  token: "fcm_token_string",
  updatedAt: timestamp,
  createdAt: timestamp
}
```

#### `users` Collection (Enhanced)
```javascript
{
  // existing fields...
  fcmToken: "fcm_token_string", // for backward compatibility
  fcmTokenUpdatedAt: timestamp,
  lastLeaderboardPosition: number
}
```

## 🚦 Testing the System

### 1. Test Permission Popup
1. Open your React app
2. Login as a non-admin user
3. Permission popup should appear
4. Grant permission
5. Check Firestore for token in `fcmTokens` collection

### 2. Test Backend API
```bash
# Send test notification
curl -X POST http://localhost:3001/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Test Notification",
    "body": "This is a test message",
    "actionLink": "/dashboard"
  }'
```

### 3. Test Cloud Functions
1. Create a test document in Firestore
2. Update document status
3. Check if notification is sent
4. Verify in browser/device

## 🔍 Troubleshooting

### Common Issues

#### 1. Permission Denied
- Check if VAPID key is correct
- Verify Firebase project configuration
- Ensure HTTPS (required for FCM)

#### 2. Token Not Saved
- Check Firestore security rules
- Verify user authentication
- Check browser console for errors

#### 3. Notifications Not Received
- Verify FCM token exists in database
- Check service worker registration
- Test with browser developer tools

#### 4. Backend Errors
- Verify service account key is valid
- Check Firebase project permissions
- Ensure correct database URL

### Debug Commands

```bash
# Check backend logs
npm run dev

# Check Cloud Functions logs
firebase functions:log

# Test FCM token
node -e "console.log(require('./backend/serviceAccountKey.json').project_id)"
```

## 🔒 Security Considerations

### Frontend Security
- VAPID key is public (safe to include in client)
- FCM tokens are user-specific
- Permission requests are user-initiated

### Backend Security
- Service account key must be kept private
- API endpoints should have authentication
- Validate user permissions before sending notifications

### Firestore Rules
Add these rules to secure FCM tokens:
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // FCM Tokens - users can only access their own
    match /fcmTokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📈 Monitoring & Analytics

### Firebase Console Monitoring
1. Go to **Cloud Messaging** in Firebase Console
2. View delivery reports
3. Monitor success/failure rates
4. Track user engagement

### Custom Logging
The system includes comprehensive logging:
- Token registration/removal
- Notification send attempts
- Error handling and cleanup
- Scheduled job execution

## 🚀 Production Deployment

### 1. Environment Variables
Create `.env` files for different environments:

```bash
# backend/.env.production
PORT=3001
NODE_ENV=production
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 2. Deploy Backend
```bash
# Using PM2 for production
npm install -g pm2
pm2 start backend/index.js --name "hh-foundation-notifications"
```

### 3. Deploy Cloud Functions
```bash
firebase deploy --only functions --project your-project-id
```

### 4. Deploy Frontend
```bash
npm run build
# Deploy to your hosting platform
```

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review Firebase Console logs
3. Test with browser developer tools
4. Verify all configuration files

---

**🎉 Congratulations!** Your complete push notification system is now ready for your MLM React + Firebase project. All events are covered, and the system will work for both existing and new users automatically.