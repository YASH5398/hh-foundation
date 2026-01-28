# GCP Quota Increase - Step by Step Guide

## Problem Summary
The E-PIN validation Cloud Functions cannot be deployed because the GCP project has exhausted the CPU quota for the us-central1 region.

**Error Message During Deployment:**
```
Quota exceeded for total allowable CPU per project per region
```

## Solution: Request Quota Increase

### Step-by-Step Instructions

#### Step 1: Open Google Cloud Console
- Go to: https://console.cloud.google.com
- Select project: **hh-foundation**

#### Step 2: Navigate to Quotas
- In the top search bar, type: **Quotas**
- Click on **Quotas and System Limits**

#### Step 3: Find the CPU Quota
- In the left panel, select **Cloud Functions API**
- In the filters, select **Region: us-central1**
- Look for quota named: **CPU per project per region** (or similar)

#### Step 4: View Current Usage
You should see something like:
```
Name: CPU per project per region
Current usage: 400 (or close to limit)
Limit: 400
Region: us-central1
```

#### Step 5: Edit Quota
- Click the quota row to select it
- Click the **EDIT QUOTAS** button at the top right
- Enter a new quota amount: **800** (or 2x current limit)
- Optionally add reason: "E-PIN validation Cloud Functions deployment"
- Click **NEXT**

#### Step 6: Submit Request
- Review the quota increase request
- Click **CREATE TICKET**
- Google will send an email with approval

#### Step 7: Wait for Approval
- Typically approved within minutes to 1 hour
- Check email for confirmation
- Your GCP Console quota page will update

### What If Approval Takes Time?

**Alternative: Deploy to Different Region**
If the quota increase takes too long, we can:

1. Modify deployment to use europe-west1:
   ```bash
   firebase deploy --only "functions:validateEpin,functions:checkEpinHttp" \
     --region europe-west1
   ```

2. Update Signup.jsx URL:
   ```javascript
   // Line ~218 in Signup.jsx
   const url = 'https://europe-west1-hh-foundation.cloudfunctions.net/validateEpin';
   ```

3. This is temporary - migrate back to us-central1 once quota increases

## Expected Quota Requirements

### Current Situation
- **Used**: ~400 CPUs (or hitting limit)
- **Limit**: 400 CPUs
- **Status**: BLOCKED - no room for new functions

### What We Need
- **Minimum**: 600 CPUs (allows deployment + running functions)
- **Recommended**: 800-1000 CPUs (provides headroom)

### Why So Much?
- `validateEpin` function: 256 MB (shares CPU budget)
- `checkEpinHttp` function: 256 MB (shares CPU budget)
- Other existing functions: consume CPU when running
- Concurrent requests multiply CPU usage

## Verification

### After Quota Increase is Approved:
1. Refresh GCP Console
2. Go back to Quotas page
3. Verify "CPU per project per region" shows new higher limit
4. Then run deployment:
   ```bash
   cd C:\Users\dell\hh
   firebase deploy --only "functions:validateEpin,functions:checkEpinHttp"
   ```

### Expected Deployment Output:
```
✔ functions: Successfully deployed 2 functions:
  - validateEpin (us-central1)
  - checkEpinHttp (us-central1)
```

## Related Documentation
- [Google Cloud Quotas](https://cloud.google.com/docs/quotas)
- [Cloud Functions Quotas](https://cloud.google.com/functions/quotas)
- [Requesting Quota Increases](https://cloud.google.com/docs/quotas/view-manage)

## Timeline

| Step | Time | Status |
|------|------|--------|
| Request quota increase | Now | 🔴 BLOCKED |
| Google reviews request | 5-60 min | ⏳ Pending |
| Quota approved | Same day | ✅ Expected |
| Deploy functions | After approval | 🟡 Ready |
| Test E-PIN validation | After deploy | 🟡 Ready |
| Complete signup flow | After deploy | 🟡 Ready |

## Questions?
If the quota increase isn't appearing:
1. Make sure you're logged in with the correct Google account
2. Verify you have "Project Editor" or "Quota Admin" role
3. Try incognito mode to clear browser cache
4. Check email spam folder for approval notification

## Code Ready for Deployment
✅ **validateEpin** function: Complete with Firestore validation
✅ **checkEpinHttp** function: Complete with Firestore validation  
✅ **Signup.jsx**: Updated with correct POST format
✅ **No other code changes needed**

Just need the quota increase to proceed!
