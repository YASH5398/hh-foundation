# Send Help 4-Step Flow - Quick Reference Guide

## Component Files

### 1. ReceiverDetailsPage.jsx
**Location**: `src/components/help/SendHelpFlow/ReceiverDetailsPage.jsx`

**Props**:
```javascript
{
  receiver: Object,      // Receiver profile data
  amount: Number,        // Amount to send (default: 300)
  onProceed: Function,   // Called when "Proceed" clicked
  onBack: Function,      // Called when "Back" clicked
  isProceding: Boolean   // Loading state
}
```

**Displays**:
- Receiver profile image
- Full name & user ID
- Phone, email, WhatsApp
- Amount (₹300)
- Next steps info

---

### 2. PaymentDetailsPage.jsx
**Location**: `src/components/help/SendHelpFlow/PaymentDetailsPage.jsx`

**Props**:
```javascript
{
  receiver: Object,      // Receiver profile with payment methods
  amount: Number,        // Amount to send (default: 300)
  onConfirm: Function,   // Called when "I Have Paid" clicked
  onBack: Function,      // Called when "Back" clicked
  isConfirming: Boolean  // Loading state
}
```

**Displays**:
- UPI methods: UPI ID, Google Pay, PhonePe (with copy buttons)
- Bank details: Account, Bank name, IFSC (with copy buttons)
- Instructions for payment

---

### 3. SubmitProofPage.jsx
**Location**: `src/components/help/SendHelpFlow/SubmitProofPage.jsx`

**Props**:
```javascript
{
  receiver: Object,      // Receiver profile
  amount: Number,        // Amount to send (default: 300)
  onSubmit: Function,    // Called with { utr, screenshot, screenshotPreview }
  onBack: Function,      // Called when "Back" clicked
  isSubmitting: Boolean  // Loading state
}
```

**Submits**:
```javascript
{
  utr: String,           // Transaction ID
  screenshot: File,      // Image file object
  screenshotPreview: String // Base64 preview
}
```

**On Submit**:
- Uploads screenshot to Firebase Storage
- Creates sendHelp & receiveHelp documents
- Sets status = "Pending"
- Moves to Step 4

---

### 4. WaitingForConfirmationPage.jsx
**Location**: `src/components/help/SendHelpFlow/WaitingForConfirmationPage.jsx`

**Props**:
```javascript
{
  transactionId: String,   // Help document ID to listen to
  receiver: Object,        // Receiver profile
  helpData: Object,        // Created help document data
  onConfirmed: Function,   // Called when status changes to "Confirmed"
  setShowChat: Function    // To toggle chat modal
}
```

**Real-Time Listener**:
- Listens to `sendHelp/{transactionId}`
- Detects `status === "Confirmed"` or `status === "ForceConfirmed"`
- Calls `onConfirmed()` with updated data
- Shows success state

---

### 5. SendHelpFlowContainer.jsx
**Location**: `src/components/help/SendHelpFlow/SendHelpFlowContainer.jsx`

**Props**:
```javascript
{
  receiver: Object,           // Receiver profile
  helpId: String,            // Optional existing help ID
  sender: Object,            // Sender profile object
  onFlowComplete: Function,  // Called on successful completion
  onFlowCancel: Function     // Called when cancelled
}
```

**Sender Object**:
```javascript
{
  uid: String,
  userId: String,
  fullName: String,
  email: String,
  phone: String,
  whatsapp: String,
  profileImage: String,
  level: Number
}
```

**Orchestrates**:
- Step navigation
- Screenshot upload
- Firestore writes
- Real-time listening
- Chat functionality

---

## Integration with SendHelpRefactored

### Usage

When user clicks "Pay Now" button in SendHelpRefactored:

```javascript
const handlePayNowClick = () => {
  setShowSendHelpFlow(true);
  setUIState(UI_STATES.SEND_HELP_FLOW);
};
```

This shows the SendHelpFlowContainer with receiver data:

```javascript
{showSendHelpFlow && uiState === UI_STATES.SEND_HELP_FLOW && (
  <SendHelpFlowContainer
    receiver={receiver}
    helpId={transactionId}
    sender={{...currentUser details}}
    onFlowComplete={handleSendHelpFlowComplete}
    onFlowCancel={handleSendHelpFlowCancel}
  />
)}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ SendHelpRefactored                                          │
│ - Shows receiver assigned state                            │
│ - "Pay Now" button clicked                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ showSendHelpFlow = true
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SendHelpFlowContainer (Main Orchestrator)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┬────────────────┐
              ▼             ▼             ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Step 1     │ │   Step 2     │ │   Step 3     │ │   Step 4     │
    │ Receiver     │ │ Payment      │ │ Submit       │ │ Waiting      │
    │ Details      │ │ Details      │ │ Proof        │ │ Confirmation │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
         │                │                │                │
         │ Proceed        │ I Have Paid     │ Submit         │ Real-time
         │ (UI only)      │ (UI only)       │ Screenshot     │ Listener
         │                │                │ + UTR          │ watches
         └────────────────┴────────────────┴────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────┐
                        │ Firestore Writes (Step 3)    │
                        │ - sendHelp document          │
                        │ - receiveHelp document       │
                        │ - Screenshot to Storage      │
                        │ status = "Pending"           │
                        │ confirmedByReceiver = false  │
                        └──────────────────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────┐
                        │ Real-Time Listener           │
                        │ (Step 4)                     │
                        │ Waiting for status change    │
                        │ to "Confirmed"               │
                        └──────────────────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────┐
                        │ Success State + Reload       │
                        │ onFlowComplete() called      │
                        └──────────────────────────────┘
```

---

## Firestore Write Details

### When: Step 3 Submit

### What Gets Written:

**sendHelp Document**:
- Path: `sendHelp/{docId}`
- Status: "Pending"
- All receiver & sender details
- Payment details with screenshot URL & UTR
- Timestamp

**receiveHelp Document**:
- Path: `receiveHelp/{docId}`
- Same as sendHelp
- Status: "Pending"
- confirmedByReceiver: false

### Screenshot Upload:
- Path: `payment-proofs/{currentUser.uid}/{filename}`
- Stored in Firebase Storage
- URL stored in `paymentDetails.screenshotUrl`

---

## Real-Time Listener Details

### Starts: When Step 4 displays

### Listens To: `sendHelp/{transactionId}`

### Detects:
- `status === "Confirmed"` → Success!
- `status === "ForceConfirmed"` → Success!
- Any other status → Keep waiting

### On Confirmation:
- Calls `onConfirmed(helpData)`
- Shows success animation
- Displays completion message
- Provides next steps

### Cleanup:
- Unsubscribes on component unmount
- Unsubscribes when confirmed

---

## Error Handling

### Step 3 Errors:
- File validation errors (size, type)
- Screenshot upload failures
- Firestore write failures
- UTR validation errors

All errors show toast notifications and allow retry.

### Step 4 Errors:
- Listener setup errors logged to console
- Will still show waiting state
- User can refresh manually if needed

---

## Key Implementation Details

### No Modals/Popups
- Each step is full-page
- Smooth CSS transitions
- Framer Motion animations
- No z-index conflicts

### Performance Optimized
- Lazy image loading
- Debounced file uploads
- Efficient Firestore queries
- Real-time subscriptions only when needed

### Mobile Responsive
- Touch-friendly buttons
- Proper scrolling
- Readable text sizes
- Optimized for all screen sizes

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliant

---

## Testing Commands

### Check for errors:
```bash
npm run lint
npm run build
```

### Manual testing steps:
1. Login to app
2. Complete receiver assignment
3. Click "Pay Now" button
4. Verify Step 1 displays correctly
5. Click "Proceed to Payment"
6. Verify Step 2 displays and copy buttons work
7. Click "I Have Paid"
8. Verify Step 3 displays
9. Upload a test image and enter UTR
10. Click "Submit Proof"
11. Verify Step 4 with real-time listener
12. Check Firestore documents created correctly

---

## Troubleshooting

### Flow doesn't appear:
- Check `showSendHelpFlow` and `uiState === SEND_HELP_FLOW`
- Verify receiver data is loaded
- Check browser console for errors

### Documents not created:
- Check Firestore rules allow writes
- Verify user is authenticated
- Check Storage permissions for screenshots
- Review browser console for error details

### Real-time listener not working:
- Check document ID is correct
- Verify Firestore rules allow reads
- Check network connectivity
- Review browser console for errors

### Images not uploading:
- Check file size < 5MB
- Verify file type is image
- Check Storage bucket permissions
- Review browser console for errors

---

## Completion

✅ All 4 steps fully implemented
✅ Full-page components with animations
✅ Firestore writes at Step 3 only
✅ Real-time listening for confirmation
✅ Integrated with SendHelpRefactored
✅ No errors in build
✅ Mobile responsive
✅ Error handling in place
