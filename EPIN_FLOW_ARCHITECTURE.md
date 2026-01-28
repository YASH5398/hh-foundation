# E-PIN Validation - Flow Diagram & Architecture

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SIGNUP FLOW (Step 1/4)                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │  src/components/auth/Signup.jsx
│  React UI    │
└──────┬───────┘
       │
       │ User enters E-PIN and clicks "Continue"
       ↓
┌────────────────────────────────────────────────────────┐
│ 1. Validate input                                      │
│    - Check E-PIN not empty                            │
│    - Trim whitespace: epin.trim()                     │
└────────────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 2. Send HTTP POST                                     │
│    URL: https://us-central1-hh-foundation...          │
│           /validateEpin                               │
│    Method: POST                                       │
│    Headers: Content-Type: application/json            │
│    Body: { "epin": "ABC123XYZ" }                      │
└────────────────────────────────────────────────────────┘
       │
       │ Network request to Cloud Function
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│              CLOUD FUNCTION HANDLER                     │
│  functions/index.js - exports.validateEpin             │
└─────────────────────────────────────────────────────────┘
       │
       ├─ Browser sends OPTIONS preflight
       │  ↓
       │  ✅ Returns: 200 OK with CORS headers
       │  CORS headers enable the actual POST
       │
       ├─ Browser sends actual POST
       │  ↓
       │  ┌────────────────────────────────────────────┐
       │  │ 1. Extract & validate epin from request   │
       │  │    - Check epin exists                    │
       │  │    - Check epin is string                 │
       │  │    - Check epin not empty                 │
       │  └────────────────────────────────────────────┘
       │         │
       │         ├─ ❌ Invalid → Return 400 error
       │         │
       │         ↓ ✅ Valid
       │
       │  ┌────────────────────────────────────────────┐
       │  │ 2. Query Firestore                         │
       │  │                                            │
       │  │    db.collection('epins')                  │
       │  │      .where('epin', '==', value)          │
       │  │      .where('status', '==', 'unused')     │
       │  │      .limit(1)                            │
       │  │      .get()                               │
       │  └────────────────────────────────────────────┘
       │         │
       │         ├─ ❌ Not found → Return 400
       │         │   Message: "Invalid or already used E-PIN"
       │         │
       │         ├─ ❌ Database error → Return 500
       │         │   Message: error details
       │         │
       │         ↓ ✅ Found
       │
       │  ┌────────────────────────────────────────────┐
       │  │ 3. Return Success                          │
       │  │                                            │
       │  │    {                                       │
       │  │      "success": true,                      │
       │  │      "epinId": "doc-id-from-firestore",   │
       │  │      "message": "E-PIN validated..."      │
       │  │    }                                       │
       │  │                                            │
       │  │    Status: 200 OK                          │
       │  └────────────────────────────────────────────┘
       │
       ↓ Network response
┌─────────────────────────────────────────────────────────┐
│              FRONTEND - Response Handler                │
└─────────────────────────────────────────────────────────┘
       │
       ├─ ❌ Network error
       │  → Show: "E-PIN validation failed"
       │  → Stay on Step 1/4
       │
       ├─ ❌ Response not JSON
       │  → Show: "Invalid server response"
       │  → Stay on Step 1/4
       │
       ├─ ❌ Response OK=false or !result.success
       │  → Show: result.message || "Invalid E-PIN"
       │  → Stay on Step 1/4
       │
       ├─ ❌ No epinId in response
       │  → Show: "E-PIN validation failed"
       │  → Stay on Step 1/4
       │
       ↓ ✅ Success response with epinId
┌─────────────────────────────────────────────────────────┐
│ Save epinId and proceed to Step 2/4                     │
│ - epinDocId = result.epinId                             │
│ - Create Firebase Auth user                             │
│ - Continue signup flow                                  │
└─────────────────────────────────────────────────────────┘
```

## Data Structure

### Frontend Request
```javascript
// What Signup.jsx sends to validateEpin function
{
  "epin": "ABC123XYZ"
}
```

### Cloud Function Request Handler
```javascript
// What the function receives
req.body = {
  epin: "ABC123XYZ"
}

req.method = "POST"
req.headers = {
  "content-type": "application/json",
  "origin": "https://hh-foundation.web.app",
  ...
}
```

### Firestore Query (in Cloud Function)
```javascript
// Looking for document like:
{
  epin: "ABC123XYZ",
  status: "unused",
  createdAt: timestamp,
  requestedBy: "admin",
  quantity: 1
}

// Document ID: "abc123def456ghi789"
```

### Success Response
```javascript
// What validateEpin function returns
res.status(200).json({
  success: true,
  epinId: "abc123def456ghi789",
  message: "E-PIN validated successfully"
})
```

### Error Responses

#### Invalid Format (400)
```javascript
res.status(400).json({
  success: false,
  message: "Invalid E-PIN format"
})
```

#### Not Found (400)
```javascript
res.status(400).json({
  success: false,
  message: "Invalid or already used E-PIN"
})
```

#### Server Error (500)
```javascript
res.status(500).json({
  success: false,
  error: "Error message from exception"
})
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   BROWSER / FRONTEND                    │
│              src/components/auth/Signup.jsx             │
│                                                         │
│  Input: E-PIN "ABC123XYZ"                              │
│  ↓                                                      │
│  POST https://.../validateEpin                          │
│  Body: { epin: "ABC123XYZ" }                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ CORS enabled
                     │
┌────────────────────▼────────────────────────────────────┐
│                 GOOGLE CLOUD PLATFORM                   │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │    Cloud Functions - us-central1                │    │
│  │                                                │    │
│  │  exports.validateEpin = httpsOnRequest()       │    │
│  │  exports.checkEpinHttp = httpsOnRequest()      │    │
│  │                                                │    │
│  │  Both functions:                               │    │
│  │  - Validate E-PIN input                        │    │
│  │  - Query Firestore epins collection            │    │
│  │  - Return success/error response               │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│                       │ Query                           │
│                       ↓                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │         Firestore Database                     │    │
│  │                                                │    │
│  │  Collection: epins                             │    │
│  │  {                                             │    │
│  │    epin: "ABC123XYZ",                         │    │
│  │    status: "unused",                           │    │
│  │    createdAt: timestamp                        │    │
│  │  }                                             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Response
                     │
┌────────────────────▼────────────────────────────────────┐
│              FRONTEND - Handle Response                 │
│                                                         │
│  ✅ Success:                                           │
│     - Save epinId                                      │
│     - Proceed to Step 2/4                              │
│                                                         │
│  ❌ Error:                                             │
│     - Show error message                               │
│     - Stay on Step 1/4                                 │
│     - Allow retry                                      │
└─────────────────────────────────────────────────────────┘
```

## Request/Response Timeline

```
Time    Event
────────────────────────────────────────────────────────────
T+0ms   User clicks "Continue" button on frontend
T+10ms  Signup.jsx validates input (non-empty, trimmed)
T+20ms  Browser initiates OPTIONS preflight request
T+100ms Cloud Function receives OPTIONS request
T+110ms Returns 200 with CORS headers (preflight response)
T+120ms Browser sends actual POST request
T+200ms Cloud Function receives POST request
T+210ms Extracts epin from request body
T+220ms Validates epin format (non-empty string)
T+230ms Queries Firestore for matching document
T+300ms Firestore returns document or empty result
T+320ms Function returns response (200 success or 400/500 error)
T+400ms Browser receives response
T+410ms JavaScript parses JSON response
T+420ms Frontend handles success/error
T+450ms UI updates (proceed or show error)
────────────────────────────────────────────────────────────
Total:  ~450ms from user click to result
```

## Deployment & Testing Timeline

```
Phase 1: GCP Quota Increase
┌─────────────────────────────────────────────────┐
│ Time: Now                                       │
│ Action: Go to GCP Console, request quota bump   │
│ Duration: ~1 hour for approval                  │
└─────────────────────────────────────────────────┘
         ↓
Phase 2: Function Deployment  
┌─────────────────────────────────────────────────┐
│ Time: After quota approved                      │
│ Action: firebase deploy --only functions        │
│ Duration: ~3 minutes                            │
│                                                 │
│ Expected:                                       │
│ ✔ functions: Successfully deployed 2 functions │
│   - validateEpin                                │
│   - checkEpinHttp                               │
└─────────────────────────────────────────────────┘
         ↓
Phase 3: Manual Testing
┌─────────────────────────────────────────────────┐
│ Time: After deployment                          │
│ Action: Test with curl commands                 │
│ Duration: ~5 minutes                            │
│                                                 │
│ curl -X POST .../validateEpin \                 │
│   -H "Content-Type: application/json" \         │
│   -d '{"epin":"TEST_EPIN"}'                     │
└─────────────────────────────────────────────────┘
         ↓
Phase 4: Frontend Testing
┌─────────────────────────────────────────────────┐
│ Time: After manual testing                      │
│ Action: Full signup flow test                   │
│ Duration: ~10 minutes                           │
│                                                 │
│ 1. Go to signup page                            │
│ 2. Enter valid E-PIN                            │
│ 3. Verify proceeds to step 2                    │
│ 4. Verify console shows success message         │
└─────────────────────────────────────────────────┘
```

## Error Handling Map

```
Input Error
├─ Empty epin
├─ Null epin
├─ Non-string epin
└─ → Response: 400 "Invalid E-PIN format"

Validation Error
├─ E-PIN not in Firestore
├─ E-PIN has status != "unused"
├─ E-PIN already used
└─ → Response: 400 "Invalid or already used E-PIN"

Database Error
├─ Firestore connection fails
├─ Query syntax error
├─ Permission denied
└─ → Response: 500 "Error message"

Network Error (Frontend)
├─ Function URL not reachable
├─ CORS blocked
├─ Timeout
└─ → Show: "E-PIN validation failed"

Parsing Error (Frontend)
├─ Response not JSON
├─ Response missing success field
├─ Response missing epinId
└─ → Show: "Invalid server response"
```
