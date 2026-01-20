# Manual Setup: Create systemConfig/upiSettings Document

## Quick Setup Instructions

### Option 1: Using Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select project: "hh-foundation"
   - Click on "Firestore Database" in the left sidebar

2. **Create Collection**
   - Click "+ Start Collection"
   - Collection ID: `systemConfig`
   - Click "Next"

3. **Create Document**
   - Document ID: `upiSettings`
   - Click "Save"

4. **Add Fields**
   - Click the "+ Add field" button for each field below:

   | Field Name | Type | Value |
   |------------|------|-------|
   | `upiQrImageUrl` | String | `https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1` |
   | `phonePe` | String | `6299261088` |
   | `gpay` | String | `6299261088` |
   | `paytm` | String | `6299261088` |
   | `upiId` | String | `helpingpin@axl` |

5. **Save Document**
   - Click "Save" to create the document

---

### Option 2: Using Admin Component (Recommended for Developers)

1. **As Admin User**, navigate to: `/admin/system-config-setup`
2. **Click**: "Create systemConfig/upiSettings"
3. **Wait** for confirmation message

---

### Option 3: Browser Console (Advanced)

Run this in your browser console after logging in as admin:

```javascript
import { db } from 'https://your-app-domain/path/to/firebase-config';
import { doc, setDoc } from 'firebase/firestore';

await setDoc(doc(db, 'systemConfig', 'upiSettings'), {
  upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
  phonePe: '6299261088',
  gpay: '6299261088',
  paytm: '6299261088',
  upiId: 'helpingpin@axl'
});
```

---

## Verification

After creating the document:

1. **Check Firestore**
   - Open Firebase Console → Firestore Database
   - Verify collection `systemConfig` with document `upiSettings` exists
   - Verify all 5 fields are present

2. **Test in App**
   - Go to: `/dashboard/epins/payment`
   - The QR code should now display
   - Check browser console for: "UPI QR URL: https://..."

3. **If QR Still Not Showing**
   - Refresh the page (Ctrl+F5 to clear cache)
   - Check browser DevTools → Console for errors
   - Verify Firestore rules allow authenticated users to read `systemConfig`

---

## Firestore Rules Check

Verify your `firestore.rules` includes:

```plaintext
// System configuration (UPI settings, QR images, etc.) - read access for authenticated users
match /systemConfig/{docId} {
  allow read: if isAuthenticated();
  allow write, create, update, delete: if isAdmin();
}
```

If missing, add this rule and redeploy:
```bash
firebase deploy --only firestore:rules
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "System configuration document not found" | Create the `systemConfig/upiSettings` document (steps above) |
| QR Code shows "QR Code not available" | Verify `upiQrImageUrl` field exists and contains the full Firebase Storage URL |
| Permission denied error | Verify Firestore rules allow read access to `systemConfig` for authenticated users |
| Image loads but shows broken | Check the QR URL is valid and image still exists in Firebase Storage |

---

## Field Reference

Each field in `systemConfig/upiSettings`:

- **upiQrImageUrl** (String)
  - The Firebase Storage URL of your QR code image
  - Used by PaymentPage.jsx and EpinRequestForm.jsx
  - Must be a valid, publicly accessible URL

- **phonePe** (String)
  - UPI number for PhonePe payments
  - Format: `9876543210`

- **gpay** (String)
  - UPI number for Google Pay
  - Format: `9876543210`

- **paytm** (String)
  - UPI number for Paytm
  - Format: `9876543210`

- **upiId** (String)
  - UPI ID string
  - Format: `name@bankname`
  - Example: `helpingpin@axl`

---

Done! Your E-PIN QR code should now display correctly. 🎉
