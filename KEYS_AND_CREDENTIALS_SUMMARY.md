# 🔐 HH Foundation - Keys and Credentials Summary

## 📋 Overview
This document provides a comprehensive list of all Firebase, API, secret, and private keys found in the HH Foundation project, along with their exact file locations and current configuration status.

## 🔥 Firebase Configuration

### Frontend Firebase Config
**File:** `src/config/firebase.js`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.appspot.com",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddbdb0beb",
  measurementId: "G-H1J3X51DF0"
};
```

### Firebase Service Account Key
**File:** `serviceAccountKey.json` (root directory)
```json
{
  "type": "service_account",
  "project_id": "hh-foundation",
  "private_key_id": "0a57ba2f19e1a753da038332c696edccab9de13d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDRnlJR7ad+BLbL\n9Cew6xXjHduJq6DRuYDDOEjHWmV/GJS58IKku+HruejcGAL+ne40sgdT/cGA6aU/\nz4Fh5kTl7k2AgsSja7Gj864t7pPbmcz5srgQMkxVNkKExNoygaStX9IfOtW/IYo/\nzqy68YINaHsLsHZRLDJ1FCGcC5lM3yMa7TaQlGYsaEtvZYajsC/N7mEdKAwSuv6p\nv0Q+NKcLOkqWl8VqazJBTRa0PlYv2QdcO+dVglGLdy7ARUYcWYwpZdItna0PoGrL\npyR+0c0Jq6MGlEHFcCqlUZ6IZYlG7O3QeQg5LLiuCnBQ3aNanW+GfK72yLsb78Gc\nbNj1Ia11AgMBAAECggEAA11ZtbytVM8YG4IR0ZMJh34OVaiy0oxulVxXPaFlJQme\nMp5o6bPrncBBsDNypk/k7Z9VwCQoox86EH8w9OAyBwL8W5N9xqAdl4aeZVieyfTp\nimrhvzKgNvM1+AlVDOt9iYTkXSGxZ9DaanewqdHjOHpUoGEWyLxQ1WMVeQY/i+uI\nQrIZ0WqFRGfn6YK71oS4AtrEJ+JtN+TzxdNGeFLNjLMnkJa9pZU+FOSsGvTus5EK\nRcFCOhBkgUDk68bwy/DX3hKn8JlXj4peLwyP5BypFh9yfvl+yUorPQfhNqM6z0zN\nHVmAQb3pFwyRMaHHfaHLFsirosTG5rv7BvYvXnriLwKBgQD7OuHUlb4Jy6/TaApk\nJGptjlQOwruPHigx/NTQH0xxkMOKQJY7Ej7jqoK0jI4/hWAenEty0H5kCoVw3oVj\nWWDROHSH47qKgcyMdzf3oKh8NAiYtxqkeL+uxrA/Yf2KjaqvoakZf0mar8HMQH3k\nA4HWmQsQIQW5eWMA6vteW8w2PwKBgQDVmS8byhsTVVzEiliJ9jzm+jkTfH7p96Pn\niDDEXwU4qdi59eTxqLIaGgIwmb8a3p0NuTTJl/1+xiusZVnB9Z9BQAnr4bTQaqWT\nfurnR+Mi9ZBOW9JucHwZnZpxZcUrS4AFWwfeGL6TwSbmJGFJz0G9UAolqITGwEHK\nYtqVcEn3SwKBgQCci3tO4SPyrKZaABmBfyOGMsr0C6mdq3f2dgoRyX7zwPXnfwld\ns6fWa1hYssCsmipjyJZG693l7pxp0W6ikn3+wMP0LRX+2pSf7mXEeqqiAjZdGrOS\nSt9+Q7ZtOF0pac8y83QQPD2cEuqaoJERdJICK4k2Oq17fkUPvFx31pGwNwKBgQDF\nyA4C4WWoxUYdBy1ssgE6rz/id0jdRF0UqtrdOk8PZNY1eyb/TYF9AdA9SF/YdYFf\nj7r9YCtuE/mkrEQsgU9xj+af8GMJCXc/2CmS9tGvMUrqA8QaVzXSUkkL73xe1o44\nZ04lrSvqjNOEDvO28J6iuVZsAFrR3nwM9vQHo+4ZeQKBgQCXG5oZO/JlLZ2H6dkZ\n3DmR92Dg9qxACdheu2l8hEI1EdXkZDKMmyEB42z8JXOsBHW+zhVu3n8qOcAgxgZQ\nrhtHOFYfy0yPN85V8BnqAey5TfGQH1XBOwzWJk+ZI5RMDZmcnemnA7FLgm2Ry6PT\nU2TM+mbxn2AqrOAgB4RFdf7s1g==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@hh-foundation.iam.gserviceaccount.com",
  "client_id": "113933975021190544389",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hh-foundation.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### Firebase Project Configuration
**File:** `.firebaserc`
```json
{
  "projects": {
    "default": "hh-foundation",
    "production": "contenthumanizer",
    "hh": "hh-foundation"
  }
}
```

## 📱 Push Notification Keys

### FCM VAPID Key
**File:** `src/services/fcmService.js`
```javascript
const VAPID_KEY = 'BKqX9Z8rQs5vJ2mF3nL7wP4tR6yU8iO1pA3sD5fG7hJ9kL2mN4oQ6rT8vW0yZ3bC5dE7fH9jK1mO3qS5uX7zA9';
```
**Status:** ⚠️ This appears to be a placeholder key. Replace with actual VAPID key from Firebase Console.

## 🤖 AI/API Keys

### Google Gemini API Key
**Files:** 
- `src/components/common/FloatingChatbot.jsx` (line 73)
- `src/pages/support/ChatbotSupport.jsx` (line 11)

```javascript
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAII33W1SnpTpH0lL8ilbTuGC46ntaA5JM';
```
**Status:** ✅ Active API key with fallback

## 📧 Email Service Keys

### EmailJS Configuration
**File:** `src/services/registerUser.js` (lines 141-151)
```javascript
// These are referenced as environment variables:
process.env.REACT_APP_EMAILJS_SERVICE_ID
process.env.REACT_APP_EMAILJS_TEMPLATE_ID  
process.env.REACT_APP_EMAILJS_PUBLIC_KEY
```
**Status:** ⚠️ Environment variables not found in project. Keys need to be added to .env file.

## 🔧 Configuration Status

### ✅ Configured and Active
1. **Firebase Frontend Config** - Fully configured in `src/config/firebase.js`
2. **Firebase Service Account** - Valid key in `serviceAccountKey.json`
3. **Gemini AI API** - Hardcoded fallback key available
4. **Firebase Project Settings** - Configured in `.firebaserc`

### ⚠️ Needs Configuration
1. **FCM VAPID Key** - Replace placeholder in `src/services/fcmService.js`
2. **EmailJS Keys** - Add to environment variables

### 📝 Environment Variables Needed
Create a `.env` file in the root directory with:
```env
# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key

# Gemini AI (optional - fallback exists)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

## 🔐 Security Notes

### Public Keys (Safe to expose)
- Firebase Frontend Config (apiKey, authDomain, etc.)
- FCM VAPID Key
- EmailJS Public Key

### Private Keys (Keep Secret)
- Firebase Service Account Private Key
- EmailJS Service ID and Template ID
- Gemini API Key

## 📍 Key File Locations Summary

| Key Type | File Location | Status |
|----------|---------------|--------|
| Firebase Config | `src/config/firebase.js` | ✅ Active |
| Service Account | `serviceAccountKey.json` | ✅ Active |
| Service Account (Backend) | `backend/serviceAccountKey.json` | ⚠️ Placeholder |
| FCM VAPID | `src/services/fcmService.js` | ⚠️ Placeholder |
| Gemini API | `src/components/common/FloatingChatbot.jsx` | ✅ Active |
| Gemini API | `src/pages/support/ChatbotSupport.jsx` | ✅ Active |
| EmailJS | `src/services/registerUser.js` | ⚠️ Env vars needed |
| Project Config | `.firebaserc` | ✅ Active |

## 🚀 Push Notification Setup Status

All Firebase keys have been automatically integrated into the push notification system:

### ✅ Updated Files
1. `src/services/fcmService.js` - Added Firebase project details
2. `backend/index.js` - Updated with correct database URL
3. `backend/notifications.js` - Added project configuration
4. `backend/test-notification.js` - Enhanced with key validation

### 🔄 Next Steps
1. Replace VAPID key in `src/services/fcmService.js` with actual key from Firebase Console
2. Copy `serviceAccountKey.json` to `backend/` directory
3. Add EmailJS environment variables to `.env` file
4. Test push notification system using `npm run test-notification` in backend

---

**Generated:** $(date)
**Project:** HH Foundation MLM Platform
**Purpose:** Push Notification System Setup