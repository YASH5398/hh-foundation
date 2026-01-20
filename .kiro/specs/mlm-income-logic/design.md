# Design Document: MLM Income Logic System

## Overview

This design document describes the architecture and implementation approach for the MLM Send Help / Receive Help income system. The system manages user progression through 5 levels with payment requirements, income caps, staged blocking mechanisms, and sponsor payment obligations.

The core principle is a **staged block → pay → release** flow that ensures users meet their obligations before receiving full income at each level.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MLM Income System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Payment    │───▶│   Income     │───▶│   Level      │      │
│  │   Processor  │    │   Manager    │    │   Manager    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Receiver   │    │   Block      │    │   Sponsor    │      │
│  │   Assigner   │    │   Controller │    │   Tracker    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Firestore Database                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │  Users  │  │ SendHelp│  │ReceiveH │  │ Payments│    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Level Configuration Store

Centralized configuration for all level rules:

```javascript
const LEVEL_CONFIG = {
  star: {
    order: 1,
    receiveAmount: 300,
    totalUsers: 3,
    totalIncome: 900,
    blockPoints: [3],           // Block after 3 payments
    upgradeRequired: false,     // Optional upgrade
    upgradeCost: 600,           // Cost to upgrade to Silver
    sponsorPayment: 0,          // No sponsor payment at Star
    nextLevel: 'silver'
  },
  silver: {
    order: 2,
    receiveAmount: 600,
    totalUsers: 9,
    totalIncome: 5400,
    blockPoints: [4, 7],        // Block after 4 and 7 payments
    upgradeRequired: true,      // Must upgrade after first block
    upgradeCost: null,          // Upgrade unlocks Gold eligibility
    sponsorPayment: 1200,       // Pay sponsor before last 2
    nextLevel: 'gold'
  },
  gold: {
    order: 3,
    receiveAmount: 2000,
    totalUsers: 27,
    totalIncome: 54000,
    blockPoints: [11, 25],      // Block after 11 and 25 payments
    upgradeRequired: true,
    upgradeCost: 20000,         // Cost to upgrade to Platinum
    sponsorPayment: 4000,       // Pay sponsor before last 2
    nextLevel: 'platinum'
  },
  platinum: {
    order: 4,
    receiveAmount: 20000,
    totalUsers: 81,
    totalIncome: 1620000,
    blockPoints: [11, 79],      // Block after 11 and 79 payments
    upgradeRequired: true,
    upgradeCost: null,          // Upgrade unlocks Diamond eligibility
    sponsorPayment: 40000,      // Pay sponsor before last 2
    nextLevel: 'diamond'
  },
  diamond: {
    order: 5,
    receiveAmount: 200000,
    totalUsers: 243,
    totalIncome: 48600000,
    blockPoints: [241],         // Block after 241 payments
    upgradeRequired: false,     // No next level
    upgradeCost: null,
    sponsorPayment: 600000,     // Pay sponsor before last 2
    nextLevel: null             // Final level
  }
};
```

### 2. User State Model

```javascript
// User document structure in Firestore
{
  id: string,
  level: 'star' | 'silver' | 'gold' | 'platinum' | 'diamond',
  isActive: boolean,
  
  // Payment tracking per level
  levelProgress: {
    star: {
      paymentsReceived: number,      // Count of payments received
      totalAmountReceived: number,   // Total ₹ received
      isComplete: boolean,           // Level completed
      upgradeCompleted: boolean      // Upgraded to next level
    },
    silver: { ... },
    gold: { ... },
    platinum: { ... },
    diamond: { ... }
  },
  
  // Block status
  incomeBlocked: boolean,
  blockReason: 'upgrade_required' | 'sponsor_payment_required' | null,
  blockLevel: string | null,
  
  // Sponsor tracking
  sponsorId: string,
  sponsorPayments: {
    silver: { paid: boolean, amount: number, paidAt: timestamp },
    gold: { paid: boolean, amount: number, paidAt: timestamp },
    platinum: { paid: boolean, amount: number, paidAt: timestamp },
    diamond: { paid: boolean, amount: number, paidAt: timestamp }
  },
  
  // Queue for blocked payments
  pendingPayments: [
    { fromUserId: string, amount: number, queuedAt: timestamp }
  ]
}
```

### 3. Income Manager Component

Handles all income-related logic:

```
Interface: IncomeManager
├── canReceivePayment(userId): boolean
├── processIncomingPayment(receiverId, senderId, amount): Result
├── checkBlockConditions(userId): BlockStatus
├── releaseBlockedPayments(userId): void
└── getIncomeStatus(userId): IncomeStatus
```

**Logic Flow for processIncomingPayment:**

```
1. Validate receiver is active
2. Check if receiver's income is blocked
   - If blocked → queue payment, return "queued"
3. Get receiver's current level config
4. Increment payment count for current level
5. Check if new count hits a block point
   - If hits first block → set blockReason = 'upgrade_required'
   - If hits final block → set blockReason = 'sponsor_payment_required'
6. Update receiver's totals
7. Return success
```

### 4. Block Controller Component

Manages the block → pay → release cycle:

```
Interface: BlockController
├── applyBlock(userId, reason): void
├── checkBlockRelease(userId): boolean
├── processUpgradePayment(userId, amount): Result
├── processSponsorPayment(userId, amount): Result
└── getBlockStatus(userId): BlockStatus
```

**Block Release Logic:**

```
1. Check block reason
2. If 'upgrade_required':
   - Verify upgrade payment received
   - Clear block
   - Update level eligibility
   - Release queued payments
3. If 'sponsor_payment_required':
   - Verify sponsor payment received
   - Clear block
   - Release queued payments (final 2)
```

### 5. Receiver Assigner Component

Automatically assigns receivers for Send Help payments:

```
Interface: ReceiverAssigner
├── findEligibleReceiver(level, amount): UserId | null
├── assignReceiver(senderId, amount): Assignment
└── getAssignmentQueue(): Queue
```

**Assignment Algorithm:**

```
1. Query users at appropriate level
2. Filter: isActive = true AND incomeBlocked = false
3. Filter: paymentsReceived < totalUsers for level
4. Sort by: paymentsReceived ASC (prioritize users with fewer payments)
5. Return first eligible user
6. If no eligible user → return null (payment cannot proceed)
```

### 6. Sponsor Tracker Component

Tracks and validates sponsor payments:

```
Interface: SponsorTracker
├── getSponsorForPayment(userId, level): SponsorInfo
├── recordSponsorPayment(userId, level, amount): Result
├── validateSponsorPayment(userId, level): boolean
└── getUplineChain(userId): UserId[]
```

**Sponsor Resolution Logic:**

```
1. Get user's direct sponsor
2. If sponsor is active → return sponsor
3. If sponsor is inactive:
   - Traverse upline chain
   - Return first active sponsor
4. If no active sponsor in chain → escalate to admin
```

## Data Models

### SendHelp Collection

```javascript
{
  id: string,
  senderId: string,
  receiverId: string,
  amount: number,
  level: string,
  type: 'activation' | 'upgrade' | 'sponsor',
  status: 'pending' | 'confirmed' | 'queued' | 'released',
  createdAt: timestamp,
  confirmedAt: timestamp | null,
  queuedAt: timestamp | null,
  releasedAt: timestamp | null
}
```

### ReceiveHelp Collection

```javascript
{
  id: string,
  receiverId: string,
  senderId: string,
  amount: number,
  level: string,
  paymentNumber: number,        // Which payment this is (1-3 for Star, 1-9 for Silver, etc.)
  status: 'received' | 'queued' | 'released',
  receivedAt: timestamp,
  queuedAt: timestamp | null,
  releasedAt: timestamp | null
}
```

### BlockHistory Collection (Audit Trail)

```javascript
{
  id: string,
  userId: string,
  level: string,
  blockReason: string,
  blockedAt: timestamp,
  releasedAt: timestamp | null,
  releaseReason: string | null,
  queuedPaymentCount: number
}
```

## State Machine: User Level Progression

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────┐  Pay ₹300  ┌──────┐  3 payments  ┌──────────────┐   │
│ NEW  │──────────▶│ STAR │─────────────▶│ STAR_COMPLETE │   │
└──────┘           └──────┘              └──────────────┘   │
                                                │            │
                                    Pay ₹600    │            │
                                    (optional)  ▼            │
                                         ┌──────────┐        │
                                         │  SILVER  │        │
                                         └──────────┘        │
                                              │              │
                    ┌─────────────────────────┼──────────────┘
                    │                         │
                    │    4 payments           ▼
                    │    ┌────────────────────────────────┐
                    │    │ SILVER_BLOCKED_UPGRADE         │
                    │    └────────────────────────────────┘
                    │                         │
                    │         Upgrade         ▼
                    │    ┌────────────────────────────────┐
                    │    │ SILVER_RESUMED (5-7 payments)  │
                    │    └────────────────────────────────┘
                    │                         │
                    │    7 payments           ▼
                    │    ┌────────────────────────────────┐
                    │    │ SILVER_BLOCKED_SPONSOR         │
                    │    └────────────────────────────────┘
                    │                         │
                    │    Pay ₹1,200           ▼
                    │    ┌────────────────────────────────┐
                    │    │ SILVER_COMPLETE (8-9 payments) │
                    │    └────────────────────────────────┘
                    │                         │
                    │                         ▼
                    │                    ┌──────────┐
                    │                    │   GOLD   │
                    │                    └──────────┘
                    │                         │
                    │    (Similar pattern continues...)
                    │                         │
                    │                         ▼
                    │                   ┌───────────┐
                    └──────────────────▶│  DIAMOND  │
                                        │ (FINAL)   │
                                        └───────────┘
```

## Error Handling

### Payment Errors

| Error Condition | System Response |
|----------------|-----------------|
| Receiver not found | Return error, do not process payment |
| Receiver income blocked | Queue payment, notify sender of delay |
| Invalid payment amount | Reject payment, return validation error |
| Sender not active | Reject payment, prompt activation |
| No eligible receiver | Hold payment, notify admin |

### Block Release Errors

| Error Condition | System Response |
|----------------|-----------------|
| Upgrade payment insufficient | Reject, show required amount |
| Sponsor payment to wrong user | Reject, show correct sponsor |
| Sponsor inactive | Find next upline, or escalate to admin |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties have been consolidated to eliminate redundancy while ensuring comprehensive coverage:

### Property 1: Level Payment Cap Enforcement

*For any* user at any level, the total number of payments received at that level SHALL NOT exceed the configured maximum for that level (Star: 3, Silver: 9, Gold: 27, Platinum: 81, Diamond: 243).

**Validates: Requirements 2.1, 3.2, 4.2, 5.2, 6.2**

---

### Property 2: Block Point Triggering

*For any* user at any level, when the payment count reaches a configured block point, the system SHALL set incomeBlocked to true with the appropriate blockReason.

**Validates: Requirements 2.2, 3.3, 3.6, 4.3, 4.6, 5.3, 5.6, 6.3**

---

### Property 3: Block Release on Payment Completion

*For any* user whose income is blocked, completing the required payment (upgrade or sponsor) SHALL result in incomeBlocked being set to false and all queued payments being released.

**Validates: Requirements 3.5, 3.8, 4.5, 4.8, 5.5, 5.8, 6.5, 7.3**

---

### Property 4: Level Transition Correctness

*For any* user, paying the required upgrade fee SHALL transition them to the next level, and completing all level requirements SHALL unlock eligibility for the subsequent level.

**Validates: Requirements 1.2, 3.1, 4.1, 5.1, 6.1, 6.6**

---

### Property 5: Inactive User Payment Prevention

*For any* user who has not completed the ₹300 activation payment, the system SHALL NOT allow them to receive any payments.

**Validates: Requirements 1.3**

---

### Property 6: Automatic Receiver Assignment

*For any* Send Help payment, the system SHALL automatically assign a receiver who is: (a) active, (b) at the appropriate level, (c) not income-blocked, and (d) has not reached their payment cap.

**Validates: Requirements 1.4, 2.6, 8.1, 8.3, 8.4**

---

### Property 7: Manual Receiver Selection Prevention

*For any* Send Help payment attempt, if a user tries to specify a receiver manually, the system SHALL reject the request and use automatic assignment instead.

**Validates: Requirements 8.2**

---

### Property 8: Payment Queue FIFO Ordering

*For any* user with blocked income, incoming payments SHALL be queued and released in the same order they were received (first-in-first-out).

**Validates: Requirements 7.4, 7.5**

---

### Property 9: Sponsor Payment Tracking

*For any* level requiring sponsor payment, the system SHALL correctly identify the sponsor (or next active upline) and record the payment upon completion.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

---

### Property 10: Star Level No Sponsor Requirement

*For any* user at Star level, the system SHALL NOT require any sponsor/upline payment regardless of payment count.

**Validates: Requirements 2.3**

---

### Property 11: Blocked User Exclusion from Assignment

*For any* receiver assignment operation, users whose income is currently blocked SHALL NOT be selected as receivers.

**Validates: Requirements 7.1, 7.2, 8.4**

---

### Property 12: Upgrade Optional at Star Level

*For any* Star level user who has received 3 payments, if they choose not to upgrade, the system SHALL allow them to keep their ₹900 without forcing progression.

**Validates: Requirements 2.5**

---

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** will verify:
- Specific payment amounts at each level
- Edge cases (exactly at block points, exactly at caps)
- Error conditions (invalid payments, inactive users)
- Integration between components

**Property-Based Tests** will verify:
- Universal properties hold across all levels and scenarios
- Randomized user states and payment sequences
- Invariants are maintained through all state transitions

### Property-Based Testing Configuration

- **Framework**: fast-check (JavaScript property-based testing library)
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: mlm-income-logic, Property {number}: {property_text}`

### Test Categories

#### 1. Level Configuration Tests
- Verify all level configs are correctly defined
- Verify block points are within valid ranges
- Verify payment amounts match expected values

#### 2. State Transition Tests
- Test activation flow (new → Star)
- Test upgrade flows (Star → Silver → Gold → Platinum → Diamond)
- Test block → release cycles at each level

#### 3. Payment Processing Tests
- Test payment receipt within caps
- Test payment blocking at block points
- Test payment queuing when blocked
- Test payment release after block cleared

#### 4. Receiver Assignment Tests
- Test automatic assignment algorithm
- Test exclusion of blocked users
- Test exclusion of capped users
- Test fairness of assignment

#### 5. Sponsor Payment Tests
- Test correct sponsor identification
- Test upline chain traversal for inactive sponsors
- Test sponsor payment recording

### Edge Cases to Test

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Payment at exact block point | Block triggers, payment counts |
| Payment when already blocked | Payment queued |
| Multiple payments while blocked | All queued in order |
| Sponsor inactive | Next upline receives payment |
| All uplines inactive | Escalate to admin |
| User at Diamond completes | No further progression |
| Upgrade payment insufficient | Rejected, block remains |
