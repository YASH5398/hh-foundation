# Chatbot AI - Deployment Commands (Copy-Paste Ready)

## 🚀 One-Command Deployment

### Step 1: Set OpenAI API Key
```bash
firebase functions:config:set openai.key="sk_REPLACE_WITH_YOUR_ACTUAL_KEY_HERE"
```

**⚠️ IMPORTANT**: Replace `sk_REPLACE_WITH_YOUR_ACTUAL_KEY_HERE` with your real OpenAI key from https://platform.openai.com/account/api-keys

### Step 2: Deploy Function (Pick ONE)

**Option A: Deploy ONLY chatbot function (recommended)**
```bash
firebase deploy --only "functions:chatbotReply"
```

**Option B: Deploy ALL functions**
```bash
firebase deploy --only functions
```

**Expected Output:**
```
✔ functions[chatbotReply] Successful deployment
✔ functions: Finished deploying 1 function
```

### Step 3: Verify Deployment
```bash
firebase functions:list | grep chatbotReply
```

**Expected Output:**
```
chatbotReply    v2    https    us-central1    256    nodejs20
```

---

## 🧪 Testing Commands

### Quick Test (Single Request)
```bash
curl -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I upgrade to Silver level?"}'
```

**Expected Response:**
```json
{
  "reply": "[AI-generated response about level upgrades]"
}
```

### CORS Preflight Test
```bash
curl -i -X OPTIONS "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Origin: http://localhost:3000"
```

**Expected Response Headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Full Automated Test Suite

**Windows (PowerShell):**
```bash
cd C:\Users\dell\hh
powershell -ExecutionPolicy Bypass -File ".\test-chatbot-api.ps1"
```

**Linux/Mac (Bash):**
```bash
cd /path/to/hh
bash test-chatbot-api.sh
```

### View Function Logs
```bash
firebase functions:log --only chatbotReply --limit 50
```

### Watch Logs in Real-Time
```bash
firebase functions:log --only chatbotReply
# Press Ctrl+C to stop
```

---

## 🔧 Configuration Adjustment Commands

### Check Current OpenAI Config
```bash
firebase functions:config:get openai
```

### Change OpenAI Key
```bash
firebase functions:config:set openai.key="sk_new_key_here"
firebase deploy --only "functions:chatbotReply"
```

### Remove OpenAI Key (Disable)
```bash
firebase functions:config:unset openai.key
firebase deploy --only "functions:chatbotReply"
```

### Adjust Rate Limiting (in code)
Edit `functions/index.js` line ~2125:
```javascript
// Current: 10 requests per minute
const rateLimit = checkRateLimit(identifier, 10, 60000);

// Change to: 20 requests per minute
const rateLimit = checkRateLimit(identifier, 20, 60000);

// Then deploy:
firebase deploy --only "functions:chatbotReply"
```

---

## 🛑 Troubleshooting Commands

### Check if Function Exists
```bash
firebase functions:list | grep chatbotReply
```

### View Error Logs Only
```bash
firebase functions:log --only chatbotReply | grep -i error
```

### Check Cloud Function Resource Usage
```bash
gcloud functions describe chatbotReply --region=us-central1
```

### Force Redeploy (Clear Cache)
```bash
firebase deploy --only "functions:chatbotReply" --force
```

### Rollback to Previous Version
```bash
git checkout HEAD~1 functions/index.js
firebase deploy --only "functions:chatbotReply"
```

---

## 📊 OpenAI API Testing

### Test OpenAI Connection (if key set)
```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

### Check OpenAI API Key Validity
```bash
firebase functions:config:get | grep openai.key
```

**If it shows `sk_***`, key is set**

---

## 🧠 Manual Curl Tests (Copy-Paste Friendly)

### Test 1: E-PIN Question (Fallback Test)
```bash
curl -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is an E-PIN?"}'
```

### Test 2: Level Upgrade Question (AI Test)
```bash
curl -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Content-Type: application/json" \
  -d '{"message":"I have received 3 helps. How do I upgrade my level?"}'
```

### Test 3: Payment Question (AI Test)
```bash
curl -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the payment requirements for upgrading?"}'
```

### Test 4: Empty Message (Validation Test - Should Return 400)
```bash
curl -i -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
  -H "Content-Type: application/json" \
  -d '{"message":""}'
```

### Test 5: Rate Limit (Rapid Fire Test)
```bash
for i in {1..15}; do
  echo "Request $i:"
  curl -s -X POST "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' | grep -o '"error"[^}]*}'
done
# Watch for 429 status after 10 requests
```

---

## 🌐 Browser Testing

### Hard Refresh
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Navigate to Chatbot
```
http://localhost:3000/dashboard/support/chatbot
(or production URL)
```

### Open Developer Console
```
F12 (Windows/Linux)
Cmd + Option + I (Mac)
```

### Check Console Logs
Look for messages like:
```
[chatbotReply] request { messageLength: 42, ... }
[chatbotReply] response status 200
[chatbotReply] success { hasReply: true, replyLength: 187 }
```

---

## 📝 Important Notes

### ⚠️ DO NOT
- ❌ Commit API key to Git
- ❌ Put key in code comments
- ❌ Share key in Slack/email
- ❌ Use key in browser console (server-side only)

### ✅ DO
- ✅ Store key in Firebase Functions config only
- ✅ Keep key private and rotate regularly
- ✅ Monitor usage on OpenAI dashboard
- ✅ Set spending limits on OpenAI

### 💰 Cost Monitoring
```
https://platform.openai.com/account/billing/usage
```

Set monthly limit:
```
https://platform.openai.com/account/billing/limits
```

---

## 🎯 Success Criteria

After deployment, you should see:

✅ **Function Deploys Successfully**
```
✔ functions[chatbotReply] Successful deployment
```

✅ **curl Test Returns 200**
```json
{ "reply": "[response text]" }
```

✅ **Browser Shows AI Response**
```
User: "How do I upgrade?"
Chatbot: "To upgrade to Silver level, you need..."
```

✅ **Logs Show Requests**
```
firebase functions:log shows chatbotReply entries
```

---

## 🚨 If Deployment Fails

### Error: "Quota exceeded"
```bash
# Wait 5 minutes or request quota increase
gcloud compute project-info describe --project=hh-foundation
```

### Error: "Cannot find openai.key"
```bash
# Set the key first
firebase functions:config:set openai.key="sk_xxx"
```

### Error: "Invalid OpenAI key"
```bash
# Verify key format (should start with 'sk_')
# Regenerate at https://platform.openai.com/account/api-keys
firebase functions:config:set openai.key="sk_new_key"
firebase deploy --only "functions:chatbotReply"
```

### Error: "CORS blocked"
```bash
# This shouldn't happen - CORS is enabled in code
# But if it does, check browser console and verify function deployed
firebase functions:list | grep chatbotReply
```

---

## 🎓 Learning Resources

### OpenAI API
```
https://platform.openai.com/docs/guides/gpt/chat-completions-api
```

### Firebase Cloud Functions
```
https://firebase.google.com/docs/functions/get-started/create-deploy-gcp-backend
```

### Debugging Cloud Functions
```
https://firebase.google.com/docs/functions/tips-debugging
```

---

## 📞 Support

**Google Cloud Functions Logs:**
```
https://console.cloud.google.com/functions/details/us-central1/chatbotReply?project=hh-foundation
```

**OpenAI API Issues:**
```
https://status.openai.com
```

**Firebase Status:**
```
https://status.firebase.google.com
```

---

**Ready to deploy? Start with:**
```bash
firebase functions:config:set openai.key="sk_YOUR_KEY"
firebase deploy --only "functions:chatbotReply"
.\test-chatbot-api.ps1
```

**Questions? Check:**
1. `CHATBOT_AI_SETUP_GUIDE.md` - Detailed setup guide
2. `CHATBOT_IMPLEMENTATION_SUMMARY.md` - Architecture & features
3. `firebase functions:log --only chatbotReply` - Live logs
