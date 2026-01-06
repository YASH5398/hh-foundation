# Requirements Document

## Introduction

This document defines the MLM (Multi-Level Marketing) Send Help / Receive Help income system. The system manages user progression through 5 levels (Star → Silver → Gold → Platinum → Diamond), with each level having specific payment requirements, income caps, upgrade conditions, and sponsor payment obligations.

## Glossary

- **Send_Help**: Payment made by a user to activate their account or upgrade to a higher level
- **Receive_Help**: Payment received by a user from other users in the system
- **Sponsor**: The user who referred the current user into the system (upline)
- **Upgrade_Payment**: Payment required to unlock the next level
- **Sponsor_Payment**: Mandatory payment to sponsor/upline before receiving final payments at a level
- **Income_Block**: System-enforced pause on receiving payments until conditions are met
- **Level**: User's current tier in the MLM structure (Star, Silver, Gold, Platinum, Diamond)
- **Receiver_Assignment**: System-controlled allocation of who receives payments (not user-selected)

## Requirements

### Requirement 1: User Entry and Activation

**User Story:** As a new user, I want to activate my account by sending help, so that I can start receiving payments from other users.

#### Acceptance Criteria

1. WHEN a new user joins the system, THE System SHALL require a Send Help payment of ₹300 to activate the account
2. WHEN the ₹300 Send Help payment is confirmed, THE System SHALL set the user's level to Star
3. WHEN a user has not completed the ₹300 Send Help payment, THE System SHALL prevent the user from receiving any payments
4. THE System SHALL assign a receiver for the ₹300 payment automatically (not user-selected)

---

### Requirement 2: Star Level Income Rules

**User Story:** As a Star level user, I want to receive payments from 3 users, so that I can earn ₹900 and have the option to upgrade.

#### Acceptance Criteria

1. WHILE a user is at Star level, THE System SHALL allow receiving ₹300 from up to 3 users (maximum ₹900 total)
2. WHEN a Star level user receives payment from 3 users, THE System SHALL block further income at Star level
3. WHILE at Star level, THE System SHALL NOT require any sponsor/upline payment
4. WHEN a Star level user has received ₹900, THE System SHALL offer the option to upgrade to Silver by paying ₹600
5. IF a Star level user chooses not to upgrade, THEN THE System SHALL allow the user to keep the ₹900 and end their progression
6. THE System SHALL assign receivers automatically for all Star level payments

---

### Requirement 3: Silver Level Income Rules

**User Story:** As a Silver level user, I want to receive payments from 9 users with staged unlocks, so that I can earn ₹5,400 and progress to Gold.

#### Acceptance Criteria

1. WHEN a user pays ₹600 upgrade fee, THE System SHALL set the user's level to Silver
2. WHILE at Silver level, THE System SHALL allow receiving ₹600 from up to 9 users (maximum ₹5,400 total)
3. WHEN a Silver level user receives payment from 4 users (₹2,400), THE System SHALL block further income
4. WHEN income is blocked after 4 payments, THE System SHALL require upgrade payment to unlock Gold eligibility
5. WHEN the upgrade payment is completed, THE System SHALL resume Silver payments (users 5-7)
6. WHEN a Silver level user receives payment from 7 users total, THE System SHALL block income again
7. WHEN income is blocked after 7 payments, THE System SHALL require sponsor/upline payment of ₹1,200
8. WHEN the ₹1,200 sponsor payment is confirmed, THE System SHALL release the final 2 Silver payments (users 8-9)

---

### Requirement 4: Gold Level Income Rules

**User Story:** As a Gold level user, I want to receive payments from 27 users with staged unlocks, so that I can earn ₹54,000 and progress to Platinum.

#### Acceptance Criteria

1. WHEN a user completes Silver level requirements, THE System SHALL unlock Gold level eligibility
2. WHILE at Gold level, THE System SHALL allow receiving ₹2,000 from up to 27 users (maximum ₹54,000 total)
3. WHEN a Gold level user receives payment from 11 users (₹22,000), THE System SHALL block further income
4. WHEN income is blocked after 11 payments, THE System SHALL require upgrade payment of ₹20,000 to unlock Platinum
5. WHEN the ₹20,000 upgrade payment is completed, THE System SHALL resume Gold payments (users 12-25)
6. WHEN a Gold level user receives payment from 25 users total, THE System SHALL block income again
7. WHEN income is blocked after 25 payments, THE System SHALL require sponsor/upline payment of ₹4,000
8. WHEN the ₹4,000 sponsor payment is confirmed, THE System SHALL release the final 2 Gold payments (users 26-27)

---

### Requirement 5: Platinum Level Income Rules

**User Story:** As a Platinum level user, I want to receive payments from 81 users with staged unlocks, so that I can earn ₹16,20,000 and progress to Diamond.

#### Acceptance Criteria

1. WHEN a user completes Gold level requirements, THE System SHALL unlock Platinum level eligibility
2. WHILE at Platinum level, THE System SHALL allow receiving ₹20,000 from up to 81 users (maximum ₹16,20,000 total)
3. WHEN a Platinum level user receives payment from 11 users, THE System SHALL block further income
4. WHEN income is blocked after 11 payments, THE System SHALL require upgrade payment to unlock Diamond
5. WHEN the upgrade payment is completed, THE System SHALL resume Platinum payments up to user 79
6. WHEN a Platinum level user receives payment from 79 users total, THE System SHALL block income again
7. WHEN income is blocked after 79 payments, THE System SHALL require sponsor/upline payment of ₹40,000
8. WHEN the ₹40,000 sponsor payment is confirmed, THE System SHALL release the final 2 Platinum payments (users 80-81)

---

### Requirement 6: Diamond Level Income Rules

**User Story:** As a Diamond level user, I want to receive payments from 243 users, so that I can earn the maximum income in the system.

#### Acceptance Criteria

1. WHEN a user completes Platinum level requirements, THE System SHALL unlock Diamond level eligibility
2. WHILE at Diamond level, THE System SHALL allow receiving ₹2,00,000 from up to 243 users
3. WHEN a Diamond level user receives payment from 241 users, THE System SHALL block income
4. WHEN income is blocked after 241 payments, THE System SHALL require sponsor/upline payment of ₹6,00,000
5. WHEN the ₹6,00,000 sponsor payment is confirmed, THE System SHALL release the final 2 Diamond payments (users 242-243)
6. WHEN a user completes Diamond level, THE System SHALL mark the user as having reached maximum level (no further progression)

---

### Requirement 7: Income Blocking and Release Mechanism

**User Story:** As a system administrator, I want the system to automatically block and release income based on payment conditions, so that the MLM structure is enforced correctly.

#### Acceptance Criteria

1. WHEN any required upgrade payment is pending, THE System SHALL block all incoming payments for that user
2. WHEN any required sponsor payment is pending, THE System SHALL block all incoming payments for that user
3. WHEN a blocked payment condition is resolved (payment completed), THE System SHALL automatically resume incoming payments
4. THE System SHALL queue blocked payments and release them in order once conditions are met
5. IF multiple payments arrive while income is blocked, THEN THE System SHALL hold all payments until the block is released

---

### Requirement 8: Receiver Assignment Rules

**User Story:** As a user making a payment, I want the system to automatically assign my payment to an eligible receiver, so that the process is fair and automated.

#### Acceptance Criteria

1. THE System SHALL automatically assign receivers for all Send Help payments
2. THE System SHALL NOT allow users to manually select who receives their payment
3. WHEN assigning a receiver, THE System SHALL only select users who are eligible to receive at their current level
4. WHEN assigning a receiver, THE System SHALL NOT select users whose income is currently blocked
5. THE System SHALL maintain a queue or algorithm for fair receiver assignment

---

### Requirement 9: Sponsor/Upline Payment Tracking

**User Story:** As a user, I want the system to track my sponsor payments, so that my income blocks are released correctly.

#### Acceptance Criteria

1. THE System SHALL track which sponsor/upline payment is required at each level
2. WHEN a sponsor payment is due, THE System SHALL identify the correct sponsor/upline to receive the payment
3. WHEN a sponsor payment is completed, THE System SHALL record the payment and update the user's status
4. IF a user's original sponsor is inactive or unavailable, THEN THE System SHALL escalate to the next available upline

---

## Summary Table: Level Configuration

| Level    | Receive Amount | Total Users | Total Income  | Block After | Upgrade Cost | Sponsor Payment | Final Block Before |
|----------|---------------|-------------|---------------|-------------|--------------|-----------------|-------------------|
| Star     | ₹300          | 3           | ₹900          | 3           | ₹600         | None            | N/A               |
| Silver   | ₹600          | 9           | ₹5,400        | 4, 7        | (to Gold)    | ₹1,200          | 2 remaining       |
| Gold     | ₹2,000        | 27          | ₹54,000       | 11, 25      | ₹20,000      | ₹4,000          | 2 remaining       |
| Platinum | ₹20,000       | 81          | ₹16,20,000    | 11, 79      | (to Diamond) | ₹40,000         | 2 remaining       |
| Diamond  | ₹2,00,000     | 243         | ₹4,86,00,000  | 241         | N/A          | ₹6,00,000       | 2 remaining       |
