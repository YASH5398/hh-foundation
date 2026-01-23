# Service Account References That Need Updates

## 🔴 CRITICAL FILES TO UPDATE

The following files still reference the removed service account files and need to be updated:

### **1. make-admin.js** (Line 10)
```javascript
// ❌ OLD
const serviceAccount = require('./backend/functions/serviceAccountKey.json');

// ✅ NEW - Use environment variable
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;

if (!serviceAccount) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}
```

### **2. verify-admin.js** (Line 7)
```javascript
// ❌ OLD
const serviceAccount = require('./serviceAccount.json');

// ✅ NEW - Use environment variable or Firebase CLI
// Option 1: Environment variable
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;

// Option 2: Use Firebase CLI (recommended)
// Just remove the service account import and let Firebase CLI handle auth
```

### **3. set-admin.js** (Line 7)
```javascript
// ❌ OLD
const serviceAccount = require('./serviceAccount.json');

// ✅ NEW - Use environment variable
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;
```

### **4. set-admin-claims.js** (Line 8)
```javascript
// ❌ OLD
const serviceAccount = require('./backend/functions/serviceAccountKey.json');

// ✅ NEW - Use environment variable
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;
```

### **5. backend/index.js** (Line 27)
```javascript
// ❌ OLD
const serviceAccount = require('./serviceAccountKey.json');

// ✅ NEW - Use environment variable or default credentials
// Option 1: Environment variable
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hh-foundation-default-rtdb.firebaseio.com'
  });
} else {
  // Use default credentials (works in Cloud Functions)
  admin.initializeApp();
}
```

### **6. src/functions/firestoreTriggers.js** (Line 6)
```javascript
// ❌ OLD
const serviceAccount = require('../config/serviceAccountKey.json');

// ✅ NEW - Use environment variable or default
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'hh-foundation'
    });
  } else {
    // Use default credentials
    admin.initializeApp({ projectId: 'hh-foundation' });
  }
}
```

## 🔧 RECOMMENDED APPROACH

### **Option 1: Environment Variables (Recommended)**
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/new-service-account-key.json"

# Or add to .env file (but don't commit .env)
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/new-service-account-key.json" >> .env
```

### **Option 2: Firebase CLI Authentication (Easiest)**
```bash
# Login with Firebase CLI
firebase login

# Most scripts can then use default credentials
# Remove service account imports entirely
```

### **Option 3: Application Default Credentials**
```bash
# Set up application default credentials
gcloud auth application-default login
```

## 📋 UPDATE CHECKLIST

- [ ] Update `make-admin.js` to use environment variables
- [ ] Update `verify-admin.js` to use environment variables  
- [ ] Update `set-admin.js` to use environment variables
- [ ] Update `set-admin-claims.js` to use environment variables
- [ ] Update `backend/index.js` to use environment variables
- [ ] Update `src/functions/firestoreTriggers.js` to use environment variables
- [ ] Test all admin scripts with new authentication
- [ ] Update documentation files to reflect new setup
- [ ] Remove any remaining hardcoded service account references

## 🔒 SECURITY NOTES

- **NEVER** commit the new service account key to git
- Store the key file outside the project directory
- Use environment variables or Firebase CLI authentication
- Regularly rotate service account keys
- Use least-privilege principle for service accounts

**Next Step**: Update these files before running any admin scripts or backend services.